import StorageManager from './StorageManager.js';
import en from '../../lang/en.js';
import it from '../../lang/it.js';

export default class LanguageManager {
    constructor() {
        this.languages = { en, it };
        this.currentLanguage = StorageManager.getItem('selectedLanguage') || 'en';
        this.strings = this.languages[this.currentLanguage];
    }

    loadLanguage(lang) {
        this.currentLanguage = lang;
        this.strings = this.languages[lang] || this.languages['en'];

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.strings[key]) el.textContent = this.strings[key];
        });

        // Update page title
        if (this.strings["page_title"] && document.title) {
            document.title = this.strings["page_title"];
        }

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update button text
        const toggleBtn = document.getElementById('language-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = lang.toUpperCase();
        }

        return this.strings;
    }

    toggleLanguage() {
        const newLang = this.currentLanguage === 'en' ? 'it' : 'en';
        StorageManager.setItem('selectedLanguage', newLang);
        return this.loadLanguage(newLang);
    }

    getStrings() {
        return this.strings;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}
