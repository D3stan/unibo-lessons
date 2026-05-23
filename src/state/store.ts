import { getAutoAcademicYear } from '../services/academicYear';
import { coursesData } from '../config/coursesData';

export interface AppState {
  course: string | null;
  type: string | null;
  anno: number;
  curriculum: string | null;
  currentDate: Date;
  language: 'en' | 'it';
  theme: 'light' | 'dark';
  academicYearOverride: number | null; // null = auto-calculated
}

type Listener = () => void;

class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    const savedCourse = localStorage.getItem('selectedCourse');
    const savedAnno = localStorage.getItem('selectedAnno');
    const savedCurriculum = localStorage.getItem('selectedCurriculum');
    const savedLanguage = localStorage.getItem('selectedLanguage') as 'en' | 'it' | null;
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedYearOverride = localStorage.getItem('selectedAcademicYearOverride');

    // Default to system preference for dark mode
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = systemPrefersDark ? 'dark' : 'light';

    const courseType = savedCourse && coursesData[savedCourse] ? coursesData[savedCourse].type || null : null;

    this.state = {
      course: savedCourse || null,
      type: courseType,
      anno: savedAnno ? parseInt(savedAnno, 10) : 1,
      curriculum: savedCurriculum && savedCurriculum !== 'null' ? savedCurriculum : null,
      currentDate: new Date(),
      language: savedLanguage || 'en',
      theme: savedTheme || defaultTheme,
      academicYearOverride: savedYearOverride ? parseInt(savedYearOverride, 10) : null
    };

    // Apply initial theme
    this.applyTheme(this.state.theme);
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public getEffectiveAcademicYear(): number {
    if (this.state.academicYearOverride !== null) {
      return this.state.academicYearOverride;
    }
    return getAutoAcademicYear(this.state.currentDate);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public setCourse(courseId: string | null) {
    if (courseId && coursesData[courseId]) {
      const type = coursesData[courseId].type || null;
      this.state.course = courseId;
      this.state.type = type;
      localStorage.setItem('selectedCourse', courseId);
      if (type) {
        localStorage.setItem('selectedCourseType', type);
      } else {
        localStorage.removeItem('selectedCourseType');
      }
    } else {
      this.state.course = null;
      this.state.type = null;
      localStorage.removeItem('selectedCourse');
      localStorage.removeItem('selectedCourseType');
    }
    // Reset curriculum on course change to avoid loading mismatched curricula
    this.setCurriculum(null);
    this.notify();
  }

  public setAnno(year: number) {
    this.state.anno = year;
    localStorage.setItem('selectedAnno', String(year));
    this.notify();
  }

  public setCurriculum(curriculumValue: string | null) {
    this.state.curriculum = curriculumValue;
    if (curriculumValue) {
      localStorage.setItem('selectedCurriculum', curriculumValue);
    } else {
      localStorage.removeItem('selectedCurriculum');
    }
    this.notify();
  }

  public setCurrentDate(date: Date) {
    this.state.currentDate = date;
    this.notify();
  }

  public setLanguage(lang: 'en' | 'it') {
    this.state.language = lang;
    localStorage.setItem('selectedLanguage', lang);
    this.notify();
  }

  public toggleLanguage() {
    const nextLang = this.state.language === 'en' ? 'it' : 'en';
    this.setLanguage(nextLang);
  }

  public setTheme(theme: 'light' | 'dark') {
    this.state.theme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
    this.notify();
  }

  public toggleTheme() {
    const nextTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  public setAcademicYearOverride(year: number | null) {
    this.state.academicYearOverride = year;
    if (year !== null) {
      localStorage.setItem('selectedAcademicYearOverride', String(year));
    } else {
      localStorage.removeItem('selectedAcademicYearOverride');
    }
    this.notify();
  }

  public clearLocalStorage() {
    localStorage.removeItem('selectedCourse');
    localStorage.removeItem('selectedCourseType');
    localStorage.removeItem('selectedAnno');
    localStorage.removeItem('selectedCurriculum');
    localStorage.removeItem('selectedLanguage');
    localStorage.removeItem('theme');
    localStorage.removeItem('selectedAcademicYearOverride');
    
    // Reload state to defaults
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.state = {
      course: null,
      type: null,
      anno: 1,
      curriculum: null,
      currentDate: new Date(),
      language: 'en',
      theme: systemPrefersDark ? 'dark' : 'light',
      academicYearOverride: null
    };
    this.applyTheme(this.state.theme);
    this.notify();
  }

  private applyTheme(theme: 'light' | 'dark') {
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#090d16');
    } else {
      document.body.classList.remove('dark-mode');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f8fafc');
    }
  }
}

export const appStore = new Store();
export default appStore;
