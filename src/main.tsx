import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import appStore, { AppState } from './state/store';
import { i18n } from './i18n';
import { fetchLessons, fetchCurricula, Curriculum, Lesson } from './services/api';
import { getAutoAcademicYear, getAcademicYearOptions } from './services/academicYear';
import { coursesData } from './config/coursesData';
import { DateHeader } from './components/DateHeader';
import { LessonCard } from './components/LessonCard';
import { BottomDock } from './components/BottomDock';
import { DrawerModal } from './components/DrawerModal';
import { SkeletonLoader } from './components/SkeletonLoader';
import { GlobeIcon, SunIcon, MoonIcon, RefreshIcon, UserIcon, TeamsIcon } from './assets/icons';
import './styles/main.css';

const App = () => {
  // Sync state with appStore pub/sub
  const [storeState, setStoreState] = useState<AppState>(appStore.getState());
  
  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
    return unsubscribe;
  }, []);

  const strings = i18n[storeState.language];
  const effectiveYear = appStore.getEffectiveAcademicYear();

  // Modal and App state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [curriculaList, setCurriculaList] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local settings draft (to avoid updating on every keystroke, commit on OK)
  const [draftCourse, setDraftCourse] = useState<string>('');
  const [draftAnno, setDraftAnno] = useState<number>(1);
  const [draftCurriculum, setDraftCurriculum] = useState<string | null>(null);
  const [draftYearOverride, setDraftYearOverride] = useState<number | null>(null);

  // Initialize draft values when Settings modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setDraftCourse(storeState.course || '');
      setDraftAnno(storeState.anno);
      setDraftCurriculum(storeState.curriculum);
      setDraftYearOverride(storeState.academicYearOverride);
    }
  }, [isSettingsOpen, storeState]);

  // Fetch curricula list for draft course when draft course changes
  useEffect(() => {
    if (draftCourse) {
      const courseInfo = coursesData[draftCourse];
      if (courseInfo && courseInfo.type) {
        fetchCurricula(courseInfo.type, draftCourse).then((data) => {
          setCurriculaList(data);
          // If draft curriculum isn't in fetched curricula, clear it
          if (draftCurriculum && !data.some((c) => c.value === draftCurriculum)) {
            setDraftCurriculum(null);
          }
        });
        return;
      }
    }
    setCurriculaList([]);
    setDraftCurriculum(null);
  }, [draftCourse]);

  // Main timetable fetching logic
  useEffect(() => {
    if (!storeState.course || !storeState.type) {
      setLessons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const formatDateString = (d: Date): string => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const dateStr = formatDateString(storeState.currentDate);

    fetchLessons(
      storeState.type,
      storeState.course,
      storeState.anno,
      dateStr,
      dateStr,
      storeState.curriculum
    )
      .then((data) => {
        setLessons(data);
      })
      .catch((err) => {
        console.error(err);
        setError(strings.error_loading);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    storeState.course,
    storeState.anno,
    storeState.curriculum,
    storeState.currentDate,
    storeState.academicYearOverride
  ]);

  // Handle Day Offsets
  const handleDayOffset = (offset: number) => {
    const nextDate = new Date(storeState.currentDate);
    nextDate.setDate(nextDate.getDate() + offset);
    appStore.setCurrentDate(nextDate);
  };

  const handleDateChange = (date: Date) => {
    appStore.setCurrentDate(date);
  };

  const handleSaveSettings = () => {
    // Commit draft inputs to core appStore
    appStore.setCourse(draftCourse || null);
    appStore.setAnno(draftAnno);
    appStore.setCurriculum(draftCurriculum);
    appStore.setAcademicYearOverride(draftYearOverride);
    setIsSettingsOpen(false);
  };

  const handleReset = () => {
    if (confirm(strings.help_reset)) {
      appStore.clearLocalStorage();
      setIsSettingsOpen(false);
    }
  };

  const handleCourseSelectChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    setDraftCourse(target.value);
    setDraftAnno(1); // Default to year 1 on course change
  };

  // Determine years configuration for selected draft course
  const selectedDraftCourseInfo = draftCourse ? coursesData[draftCourse] : null;
  const isSingleCycle =
    selectedDraftCourseInfo?.type === 'singlecycle' ||
    selectedDraftCourseInfo?.type === 'magistralecu';
  const maxYear = isSingleCycle ? 5 : 3;

  const yearTexts = [
    strings.first_year,
    strings.second_year,
    strings.third_year,
    'Quarto',
    'Quinto'
  ];

  // Dynamic rolling academic years
  const autoYear = getAutoAcademicYear(storeState.currentDate);
  const rollingYears = getAcademicYearOptions(autoYear);

  return (
    <div className="app-container">
      {/* Floating Language Badge */}
      <button
        className="language-badge"
        onClick={() => appStore.toggleLanguage()}
        title={strings.language_label}
        aria-label="Switch Language"
      >
        {storeState.language === 'en' ? 'IT' : 'EN'}
      </button>

      {/* Date Header Card Banner */}
      <DateHeader
        date={storeState.currentDate}
        strings={strings}
        onDateChange={handleDateChange}
      />

      {/* Primary timetable canvas */}
      <div className="lessons-list">
        {loading && <SkeletonLoader />}

        {!loading && error && (
          <div className="status-wrapper error">
            <div className="status-icon-glow">!</div>
            <h4 className="status-title">{strings.error_loading}</h4>
            <p className="status-text">{error}</p>
          </div>
        )}

        {!loading && !error && !storeState.course && (
          <div className="status-wrapper">
            <div className="status-icon-glow">
              <RefreshIcon size={24} />
            </div>
            <h4 className="status-title">{strings.configure_course}</h4>
            <p className="status-text">{strings.help_title}</p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setIsSettingsOpen(true)}>
              {strings.settings_button}
            </button>
          </div>
        )}

        {!loading && !error && storeState.course && lessons && lessons.length === 0 && (
          <div className="status-wrapper warn">
            <div className="status-icon-glow">∅</div>
            <h4 className="status-title">{strings.no_lessons}</h4>
            <p className="status-text">{strings.help_date}</p>
          </div>
        )}

        {!loading && !error && storeState.course && lessons && lessons.length > 0 && (
          lessons.map((lesson, idx) => (
            <LessonCard
              key={`${lesson.cod_modulo || idx}-${idx}`}
              lesson={lesson}
              strings={strings}
              effectiveAcademicYear={effectiveYear}
            />
          ))
        )}
      </div>

      {/* Footer Branding */}
      <div className="app-footer">
        <p>
          {strings.footer_made_with}{' '}
          <span className="footer-link" onClick={() => window.open('https://github.com/D3stan', '_blank')}>
            D3stan
          </span>{' '}
          &{' '}
          <span className="footer-link" onClick={() => window.open('https://github.com/MattechIT', '_blank')}>
            Tod
          </span>
        </p>
        <p style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.7 }}>
          {strings.footer_magic_from} <strong>ChatGPT</strong> & <strong>Antigravity</strong>
        </p>
      </div>

      {/* Glassmorphic Navigation Dock */}
      <BottomDock
        currentDate={storeState.currentDate}
        strings={strings}
        onPrevDay={() => handleDayOffset(-1)}
        onNextDay={() => handleDayOffset(1)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onDateChange={handleDateChange}
      />

      {/* Settings Modal Sheet Drawer */}
      <DrawerModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={strings.params_title}
      >
        <div className="drawer-content">
          {/* Course Selector */}
          <div className="form-group">
            <label className="form-label" htmlFor="course-select">{strings.course_label}</label>
            <select
              id="course-select"
              className="form-select"
              value={draftCourse}
              onChange={handleCourseSelectChange}
            >
              <option value="" disabled selected>
                {strings.select_course}
              </option>
              {Object.entries(coursesData).map(([key, data]) => {
                if (data.department) {
                  return (
                    <option key={key} value="" disabled style={{ fontWeight: 'bold', fontStyle: 'italic', background: 'var(--border-color)' }}>
                      {data.department}
                    </option>
                  );
                }
                return (
                  <option key={key} value={key}>
                    {data.course_name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Curriculum Selector (Dynamic based on course fetching) */}
          {curriculaList.length > 1 && (
            <div className="form-group">
              <label className="form-label" htmlFor="curriculum-select">{strings.select_curriculum}</label>
              <select
                id="curriculum-select"
                className="form-select"
                value={draftCurriculum || ''}
                onChange={(e) => setDraftCurriculum((e.target as HTMLSelectElement).value || null)}
              >
                <option value="">{strings.select_curriculum}</option>
                {curriculaList.map((curriculum) => (
                  <option key={curriculum.value} value={curriculum.value}>
                    {curriculum.label.charAt(0).toUpperCase() + curriculum.label.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Selector */}
          {draftCourse && (
            <div className="form-group">
              <label className="form-label" htmlFor="year-select">{strings.year_label}</label>
              <select
                id="year-select"
                className="form-select"
                value={draftAnno}
                onChange={(e) => setDraftAnno(parseInt((e.target as HTMLSelectElement).value, 10))}
              >
                {Array.from({ length: maxYear }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {yearTexts[i]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Academic Year Selector (Rolling 3 years selector) */}
          <div className="form-group">
            <label className="form-label" htmlFor="academic-year-select">{strings.academic_year_label}</label>
            <select
              id="academic-year-select"
              className="form-select"
              value={draftYearOverride === null ? 'auto' : String(draftYearOverride)}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setDraftYearOverride(val === 'auto' ? null : parseInt(val, 10));
              }}
            >
              <option value="auto">
                {strings.academic_year_calculated} ({autoYear})
              </option>
              {rollingYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Theme & Actions Dock */}
          <div className="form-group">
            <label className="form-label">{strings.theme_button}</label>
            <button
              className="btn-primary"
              style={{ background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none' }}
              onClick={() => appStore.toggleTheme()}
            >
              {storeState.theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
              <span>{storeState.theme === 'light' ? strings.dark_theme : strings.light_theme}</span>
            </button>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-container">
            <button className="btn-primary" onClick={handleSaveSettings}>
              {strings.ok_button}
            </button>
            <button className="btn-danger" onClick={handleReset}>
              {strings.reset_button}
            </button>
          </div>
        </div>
      </DrawerModal>

      {/* Guide Manual Modal Sheet Drawer */}
      <DrawerModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title={strings.guide_button}
      >
        <div className="guide-content-scroller">
          {/* Step 1 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">1</div>
            <p className="guide-step-text">{strings.help_title}</p>
          </div>

          {/* Step 2 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">2</div>
            <p className="guide-step-text">{strings.help_theme}</p>
          </div>

          {/* Step 3 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">3</div>
            <p className="guide-step-text">{strings.help_date}</p>
          </div>

          {/* Step 4 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">
              <GlobeIcon size={18} />
            </div>
            <p className="guide-step-text">{strings.help_course}</p>
          </div>

          {/* Step 5 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">
              <UserIcon size={18} />
            </div>
            <p className="guide-step-text">{strings.help_teacher}</p>
          </div>

          {/* Step 6 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">
              <TeamsIcon size={18} />
            </div>
            <p className="guide-step-text">{strings.help_teams}</p>
          </div>

          {/* Step 7 */}
          <div className="guide-step-card">
            <div className="guide-step-icon-box">!</div>
            <p className="guide-step-text">{strings.help_reset}</p>
          </div>
        </div>
        <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setIsGuideOpen(false)}>
          {strings.ok_button}
        </button>
      </DrawerModal>
    </div>
  );
};

// Mount the Preact application
const rootNode = document.getElementById('app');
if (rootNode) {
  render(<App />, rootNode);
}
