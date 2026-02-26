from controller.ur_controller import URController
from controller.io_config import AnalogInputRobotIO
import time
import matplotlib
matplotlib.use("TkAgg")
import matplotlib.pyplot as plt
from collections import deque
import pandas as pd
import pyads
import csv



DOCKER_IP = "127.0.0.1"
ROBOT_IP = "192.168.137.55"

def main():

    plc = pyads.Connection('192.168.137.51.1.1', 851)
    plc.open()



    ur_controller = URController(
        name="UR10",
        ip_address=ROBOT_IP,
        frequency=1000
    )

    ur_controller.connect()
    print(f"Connected to Robot at {ROBOT_IP}")

    robot_speed = 0.02
    robot_acceleration = 0.02
    direction = [0.0, 0.0, -1.0, 0.0, 0.0, 0.0]  # negative Z-Richtung
    xd = [0.0, 0.0, -robot_speed, 0.0, 0.0, 0.0]

    Value = 0.0  # Startwert Ansaugspannung anpassen
    Schritte = 0.00 #um welchen Wert wird die Ansaugspannung verringert
    Iterationen = 20 #wie häufig soll um Schritte verringert werden
    i = 0
    Verhärtung = 0 #1 für an




    ur_controller.move_robot_until_contact(xd, direction, robot_acceleration)

    ur_controller.move_robot_relative_from_current_position([0, 0, -0.005, 0, 0, 0], robot_speed,  robot_acceleration, False)
    time.sleep(1)



    ur_controller.set_robot_digital_output(1, True)
    ur_controller.set_robot_digital_output(3, True)
    ur_controller.set_robot_analog_output(output=0, value=Value)

    if Verhärtung == 1:
        ur_controller.set_robot_digital_output(4, True)



    time.sleep(1)

    #Roboter wegfahren von Objekt

    ur_controller.move_robot_relative_from_current_position([0, 0, 0.025, 0, 0, 0], robot_speed,  robot_acceleration, False)
    time.sleep(5)

    val1 = plc.read_by_name("GVL.P_in[1]")
    val2 = plc.read_by_name("GVL.P_in[2]")
    val3 = plc.read_by_name("GVL.P_in[3]")
    val4 = plc.read_by_name("GVL.P_in[4]")

    if val4 == 0:
        if val4 != val1:
            differenz1 = val4-val1
        else:
            differenz1 = 0   
        if val4 != val2:
            differenz2 = val4-val2
        else:
            differenz2 = 0    

        if val4 != val3:
            differenz3 = val4-val3
        else:
            differenz3 = 0    
         

    with open("Leckage.csv", mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Iteration", "Spannung", "Pumpe", "Hand", "GVL.P_in[3]", "GVL.P_in[4]"])

        for i in range(Iterationen):
            ur_controller.set_robot_analog_output(output=0, value=Value)

            val1 = plc.read_by_name("GVL.P_in[1]") + differenz1
            val2 = plc.read_by_name("GVL.P_in[2]") + differenz2
            val3 = plc.read_by_name("GVL.P_in[3]") + differenz3
            val4 = plc.read_by_name("GVL.P_in[4]")
            print(f"Iter {i}: Spannung={Value:.2f}, Pumpe={val1}, Hand={val2}, P3={val3}, P4={val4}")

            writer.writerow([i, Value, val1, val2, val3, val4])

            Value -= Schritte
        time.sleep(2)

    plc.close()

    #Roboter ausschalten
    if Verhärtung == 1:
        ur_controller.set_robot_digital_output(4, False)


    ur_controller.set_robot_analog_output(output=0, value=0)
    ur_controller.set_robot_digital_output(1, False)
    ur_controller.set_robot_digital_output(3, False)
    ur_controller.set_robot_digital_output(2, True)
    ur_controller.set_robot_digital_output(0, True)
    ur_controller.set_robot_digital_output(2, False)
    ur_controller.set_robot_digital_output(0, False)

  


if __name__ == "__main__":
    main()


# === Hauptlogik für Leckageanalyse und Drehung ===
def analyze_and_correct_leak(val1, val2, val3, val4, ur_controller, robot_speed=0.02):
    """
    Berechnet die Leckagemitte, ermittelt die Rotationsachse senkrecht zur Leckrichtung
    und führt eine Korrekturdrehung und -bewegung aus.
    """
    # Lokale Sensorpositionen
    SENSOR_LOCAL = {
        "Sensor_1": np.array([0.0,  0.0225, 0.0]),   # +Y
        "Sensor_2": np.array([0.0225,  0.0, 0.0]),   # +X
        "Sensor_3": np.array([0.0, -0.0225, 0.0]),   # -Y
        "Sensor_4": np.array([-0.0225,  0.0, 0.0])   # -X
    }

    # Leckagemitte schätzen
    pressures = np.array([val1, val2, val3, val4])
    weights = np.max(pressures) - pressures + 1e-6
    positions = np.array(list(SENSOR_LOCAL.values()))
    leck_pos = np.average(positions, axis=0, weights=weights)
    leck_pos_corrected = np.array([-leck_pos[0], -leck_pos[1], leck_pos[2]])

    print(f"💨 Geschätzte Leckagemitte: X={leck_pos_corrected[0]:.4f}, Y={leck_pos_corrected[1]:.4f}")

    # Leckagevektor in XY
    leak_vec = np.array([leck_pos_corrected[0], leck_pos_corrected[1], 0.0])
    if np.linalg.norm(leak_vec) < 1e-6:
        print("⚠️ Keine signifikante Leckage erkannt – keine Drehung notwendig.")
        return

    leak_vec /= np.linalg.norm(leak_vec)

    # Drehachse senkrecht zur Leckrichtung (Kreuzprodukt mit Z)
    axis = np.cross(leak_vec, np.array([0, 0, 1.0]))
    axis /= np.linalg.norm(axis)

    rotation_angle = 0.78  # 45°
    correction_distance = 0.06  # 6 cm

    print(f"🧮 Berechnete Drehachse: {axis}")
    print(f"📐 Drehwinkel: {np.degrees(rotation_angle):.1f}°")

    # Rodrigues-Rotationsvektor (rx, ry, rz)
    rotvec = axis * rotation_angle
    relative_move = [0, 0, 0, rotvec[0], rotvec[1], rotvec[2]]

    # Drehung ausführen
    print(f"🔁 Drehung entlang berechneter Achse ...")
    ur_controller.move_robot_relative_from_current_position(
        relative_move,
        robot_speed=[robot_speed] * 4,
        asynchronous=False
    )
    time.sleep(5)

    # Korrekturbewegung in Leckrichtung
    correction_move = leak_vec * correction_distance
    print(f"↔️  Korrigiere um {correction_distance*100:.0f} mm entlang Leckrichtung...")
    ur_controller.move_robot_relative_from_current_position(
        [correction_move[0], correction_move[1], 0, 0, 0, 0],
        robot_speed=[robot_speed] * 4,
        asynchronous=False
    )
    time.sleep(5)
