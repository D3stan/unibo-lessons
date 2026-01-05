import StorageManager from './StorageManager.js';

export default class ThemeManager {
    constructor(languageManager) {
        this.languageManager = languageManager;
        this.init();
    }

    init() {
        const savedTheme = StorageManager.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        this.updateToggleButton();
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            StorageManager.setItem('theme', 'dark');
        } else {
            StorageManager.setItem('theme', 'light');
        }
        this.updateToggleButton();
    }

    updateToggleButton() {
        const themeToggleButton = document.getElementById('theme-toggle');
        const strings = this.languageManager.getStrings();

        if (themeToggleButton) {
            if (document.body.classList.contains('dark-mode')) {
                themeToggleButton.textContent = strings.light_theme;
            } else {
                themeToggleButton.textContent = strings.dark_theme;
            }
        }
    }
}
