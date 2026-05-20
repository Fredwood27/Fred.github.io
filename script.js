// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        // If targeting a collapsed sub-section, expand it before scrolling
        if (target.classList.contains('sub-section')) {
            const toggle = target.querySelector('.sub-toggle');
            const content = target.querySelector('.sub-content');
            if (content && (content.style.display === 'none' || content.style.display === '')) {
                content.style.display = 'block';
                if (toggle) toggle.textContent = toggle.textContent.replace('▶', '▼');
            }
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

const navLabelMap = {
    about: { de: 'Über mich', en: 'About' },
    education: { de: 'Ausbildung', en: 'Education' },
    experience: { de: 'Erfahrung', en: 'Experience' },
    projects: { de: 'Projekte', en: 'Projects' },
    contact: { de: 'Kontakt', en: 'Contact' }
};

langToggleBtn.addEventListener('click', () => {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'de' ? 'en' : 'de';

    document.documentElement.lang = newLang;
    langToggleBtn.textContent = newLang === 'de' ? 'EN' : 'DE';

    translatableElements.forEach(el => {
         if (el.dataset[newLang] && el.children.length === 0) {
            if (el.classList.contains('sub-toggle')) {
                const isExpanded = el.textContent.includes('▼');
                el.textContent = (isExpanded ? '▼ ' : '▶ ') + el.dataset[newLang].replace('▶ ', '').replace('▼ ', '');
            } else {
                el.textContent = el.dataset[newLang];
            }
         }
    });

    // Nav links: rebuild with the numeric prefix span preserved
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const key = href.replace('#', '');
        const label = navLabelMap[key] && navLabelMap[key][newLang];
        const numEl = link.querySelector('.nav-num');
        if (label && numEl) {
            link.innerHTML = '';
            link.appendChild(numEl);
            link.appendChild(document.createTextNode(' ' + label));
        } else if (link.dataset[newLang]) {
            link.textContent = link.dataset[newLang];
        }
    });

    document.querySelectorAll('h2, h3, h4, .btn, .role, .click-hint, .timeline-details li').forEach(el => {
        if (!el.dataset[newLang]) return;

        // Buttons with an arrow icon: keep the arrow span, swap the text
        const arrow = el.querySelector('.btn-arrow');
        if (arrow) {
            el.innerHTML = '';
            el.appendChild(arrow);
            el.appendChild(document.createTextNode(' ' + el.dataset[newLang]));
            return;
        }

        if (el.children.length === 0) {
            el.textContent = el.dataset[newLang];
        }
    });

    if (thesisOverview) {
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
            content.style.display = 'block';
            toggle.textContent = toggle.textContent.replace('▶', '▼');
        } else {
            content.style.display = 'none';
            toggle.textContent = toggle.textContent.replace('▼', '▶');
        }
    });
});

// =========================================
// Scroll-triggered Section Reveal Transitions
// =========================================
const revealEls = document.querySelectorAll('.reveal, .section-divider');

function revealNow(el) {
    el.classList.add('is-visible');
}

if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                revealNow(entry.target);
                io.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -5% 0px'
    });

    revealEls.forEach(el => io.observe(el));

    // On load, immediately reveal anything already in the viewport
    // (covers cases where observer is slow to fire on first paint)
    window.addEventListener('load', () => {
        revealEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                revealNow(el);
            }
        });
    });

    // Hard safety net: after 2s, force-reveal everything
    // so the page can never be stuck invisible.
    setTimeout(() => {
        revealEls.forEach(revealNow);
    }, 2000);
} else {
    revealEls.forEach(revealNow);
}

// =========================================
// Hamburger menu
// =========================================
const mobileMenu = document.getElementById('mobile-menu');
const navLinksContainer = document.querySelector('.nav-links');
const menuIcon = mobileMenu.querySelector('i');

mobileMenu.addEventListener('click', () => {
    navLinksContainer.classList.toggle('active');

    if (navLinksContainer.classList.contains('active')) {
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-times');
    } else {
        menuIcon.classList.remove('fa-times');
        menuIcon.classList.add('fa-bars');
    }
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinksContainer.classList.remove('active');
        menuIcon.classList.remove('fa-times');
        menuIcon.classList.add('fa-bars');
    });
});

// =========================================
// Impressum Modal
// =========================================
const imprintModal = document.getElementById('imprint-modal');
const imprintOpen = document.getElementById('imprint-open');

function openImprint() {
    imprintModal.classList.add('is-open');
    imprintModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
}

function closeImprint() {
    imprintModal.classList.remove('is-open');
    imprintModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

if (imprintOpen && imprintModal) {
    imprintOpen.addEventListener('click', openImprint);
    imprintModal.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', closeImprint);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imprintModal.classList.contains('is-open')) {
            closeImprint();
        }
    });
}
