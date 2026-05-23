import { useState } from 'preact/hooks';
import { Lesson } from '../services/api';
import { Translations } from '../i18n';
import { ClockIcon, UserIcon, MapPinIcon, TeamsIcon, ExternalLinkIcon } from '../assets/icons';
import { cercaDocente, trovaInsegnamento } from '../services/scraper';

interface LessonCardProps {
  lesson: Lesson;
  strings: Translations;
  effectiveAcademicYear: number;
}

export const LessonCard = ({ lesson, strings, effectiveAcademicYear }: LessonCardProps) => {
  const [loadingType, setLoadingType] = useState<'teaching' | 'teacher' | null>(null);

  const title = lesson.title || strings.title_unavailable;
  const time = lesson.time || strings.time_unavailable;
  const teacher = lesson.docente || strings.teacher_unavailable;
  const aula = lesson.aule[0]?.des_edificio || strings.classroom_unavailable;
  const teachingCode = lesson.cod_modulo;
  const teamsUrl = lesson.teams;

  const handleTitleClick = () => {
    if (!teachingCode) return;
    setLoadingType('teaching');
    
    // Extract base module code (e.g. 12345_1 -> 12345)
    const baseCode = teachingCode.split('_')[0];
    
    trovaInsegnamento(baseCode, teacher, effectiveAcademicYear)
      .then((link) => {
        window.location.href = link;
      })
      .catch((error) => {
        console.error(error);
        alert(strings.no_teaching_found);
      })
      .finally(() => setLoadingType(null));
  };

  const handleTeacherClick = () => {
    if (!teacher || teacher === strings.teacher_unavailable) return;
    setLoadingType('teacher');

    cercaDocente(teacher)
      .then((link) => {
        window.location.href = link;
      })
      .catch((error) => {
        console.error(error);
        const errorMsg = error instanceof Error && error.message === 'no_website'
          ? strings.no_website
          : strings.teacher_not_found;
        alert(errorMsg);
      })
      .finally(() => setLoadingType(null));
  };

  const handleTeamsClick = () => {
    if (teamsUrl) {
      window.open(teamsUrl, '_blank');
    }
  };

  const hasTeams = !!teamsUrl;

  return (
    <div className={`lesson-card ${hasTeams ? 'has-teams' : ''}`}>
      <div className="lesson-header">
        <h2 className="lesson-title" onClick={handleTitleClick}>
          <span>{loadingType === 'teaching' ? `${strings.loading_text} ` : ''}{title}</span>
          <ExternalLinkIcon size={12} className="lesson-title-icon" />
        </h2>
      </div>

      <div className="lesson-grid">
        {/* Time */}
        <div className="lesson-meta-item">
          <span className="lesson-meta-label">{strings.time_label.toUpperCase().replace(':', '')}</span>
          <span className="lesson-meta-value">
            <ClockIcon size={13} className="lesson-meta-icon" />
            {time}
          </span>
        </div>

        {/* Classroom */}
        <div className="lesson-meta-item">
          <span className="lesson-meta-label">{strings.classroom_label.toUpperCase().replace(':', '')}</span>
          <span className="lesson-meta-value lesson-classroom">
            <MapPinIcon size={13} className="lesson-meta-icon" />
            {aula}
          </span>
        </div>

        {/* Teacher */}
        <div className="lesson-meta-item full-width">
          <span className="lesson-meta-label">{strings.teacher_label.toUpperCase().replace(':', '')}</span>
          <div className="lesson-meta-value">
            <UserIcon size={13} className="lesson-meta-icon" />
            <span className="lesson-teacher" onClick={handleTeacherClick}>
              {loadingType === 'teacher' ? strings.loading_text : teacher}
              {teacher !== strings.teacher_unavailable && <ExternalLinkIcon size={10} className="teacher-link-icon" />}
            </span>
          </div>
        </div>
      </div>

      {/* Teams action badge */}
      {hasTeams && (
        <button className="teams-action-button" onClick={handleTeamsClick}>
          <TeamsIcon size={14} />
          <span>{strings.virtual_classroom}</span>
        </button>
      )}
    </div>
  );
};

export default LessonCard;
