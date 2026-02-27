// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Language Toggle
const langToggleBtn = document.getElementById('lang-toggle');
const translatableElements = document.querySelectorAll('[data-de]');
const thesisOverview = document.getElementById('thesis-overview');
const titleElement = document.querySelector('title');

const specialTranslations = {
    thesisOverview: {
        de: '<strong>Zusammenfassung:</strong> Diese Arbeit befasst sich mit der Entwicklung eines lokalen Druckmesssystems und der Konstruktion funktionaler Hardwarekomponenten mittels CAD und 3D-Druck sowie der Programmierung eines Python-Algorithmus, der Leckagen in Echtzeit lokalisiert und durch autonome Ausgleichsbewegungen korrigiert.',
        en: '<strong>Overview:</strong> This thesis focuses on the development of a local pressure measurement system, the CAD design and 3D printing of functional components, and the implementation of a Python algorithm that enables real-time leakage localization and autonomous compensatory movements.'
    }
};

langToggleBtn.addEventListener('click', () => {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'de' ? 'en' : 'de';

    // Set new language
    document.documentElement.lang = newLang;
    langToggleBtn.textContent = newLang === 'de' ? 'EN' : 'DE';

    // Update general elements
    translatableElements.forEach(el => {
         if (el.dataset[newLang] && el.children.length === 0) {
            // Keep arrow for sub-toggles if it exists
            if (el.classList.contains('sub-toggle')) {
                const isExpanded = el.textContent.includes('▼');
                el.textContent = (isExpanded ? '▼ ' : '▶ ') + el.dataset[newLang].replace('▶ ', '').replace('▼ ', '');
            } else {
                el.textContent = el.dataset[newLang];
            }
         }
    });

    document.querySelectorAll('.nav-links a, h2, .btn, .role, .click-hint, .timeline-details li').forEach(el => {
        if(el.dataset[newLang]) {
            el.textContent = el.dataset[newLang];
        }
    });

    // Update special elements
    if(thesisOverview) {
        thesisOverview.innerHTML = specialTranslations.thesisOverview[newLang];
    }
    titleElement.textContent = titleElement.dataset[newLang];
});

// Experience Timeline Toggle
document.querySelectorAll('.timeline-toggle').forEach(item => {
    item.addEventListener('click', () => {
        const details = item.nextElementSibling;
        if (details && details.classList.contains('timeline-details')) {
            if (details.style.display === 'block') {
                details.style.display = 'none';
            } else {
                details.style.display = 'block';
            }
        }
    });
});

// Project Sub-sections Toggle (CAD, CFD, Code)
document.querySelectorAll('.sub-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const content = toggle.nextElementSibling;
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block'; // Inhalt anzeigen
            toggle.textContent = toggle.textContent.replace('▶', '▼'); // Pfeil nach unten
        } else {
            content.style.display = 'none'; // Inhalt verstecken
            toggle.textContent = toggle.textContent.replace('▼', '▶'); // Pfeil nach rechts
        }
    });
});

// =========================================
// Hamburger-Menü Logik
// =========================================
const mobileMenu = document.getElementById('mobile-menu');
const navLinksContainer = document.querySelector('.nav-links');
const menuIcon = mobileMenu.querySelector('i');

// Öffnen/Schließen beim Klick auf das Icon
mobileMenu.addEventListener('click', () => {
    navLinksContainer.classList.toggle('active');
    
    // Icon ändern (von ☰ zu ✖)
    if (navLinksContainer.classList.contains('active')) {
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-times');
    } else {
        menuIcon.classList.remove('fa-times');
        menuIcon.classList.add('fa-bars');
    }
});

// Menü automatisch schließen, wenn ein Link angeklickt wird
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinksContainer.classList.remove('active');
        menuIcon.classList.remove('fa-times');
        menuIcon.classList.add('fa-bars');
    });
});