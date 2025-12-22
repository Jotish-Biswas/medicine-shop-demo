let currentLang = 'en';
let translations = {};

async function loadLanguage(lang) {
    try {
        const response = await fetch(`lang/${lang}.json`);
        translations = await response.json();
        currentLang = lang;
        updateText();
        updateActiveLangButton();
    } catch (error) {
        console.error('Error loading language:', error);
    }
}

function updateText() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                element.placeholder = translations[key];
            } else {
                element.textContent = translations[key];
            }
        }
    });
}

function updateActiveLangButton() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLanguage('en');

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            loadLanguage(btn.dataset.lang);
        });
    });
});
