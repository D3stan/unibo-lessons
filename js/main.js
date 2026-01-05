import LanguageManager from './modules/LanguageManager.js';
import ThemeManager from './modules/ThemeManager.js';
import CourseManager from './modules/CourseManager.js';
import ScheduleManager from './modules/ScheduleManager.js';
import UIManager from './modules/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const languageManager = new LanguageManager();
    const themeManager = new ThemeManager(languageManager);
    const courseManager = new CourseManager();
    const scheduleManager = new ScheduleManager(courseManager, languageManager);
    const uiManager = new UIManager(courseManager, scheduleManager, languageManager, themeManager);

    // Initial load
    languageManager.loadLanguage(languageManager.getCurrentLanguage());
    uiManager.init();
});
