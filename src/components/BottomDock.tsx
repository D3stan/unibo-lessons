import { useRef } from 'preact/hooks';
import { ChevronLeftIcon, ChevronRightIcon, SettingsIcon, HelpIcon } from '../assets/icons';
import { Translations } from '../i18n';

interface BottomDockProps {
  currentDate: Date;
  strings: Translations;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onDateChange: (date: Date) => void;
}

export const BottomDock = ({
  currentDate,
  strings,
  onPrevDay,
  onNextDay,
  onOpenSettings,
  onOpenGuide,
  onDateChange
}: BottomDockProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.value) {
      const selected = new Date(target.value);
      if (!isNaN(selected.getTime())) {
        onDateChange(selected);
      }
    }
  };

  const handleCenterClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const monthShort = strings.months[currentDate.getMonth()].slice(0, 3);
  const dayNumber = currentDate.getDate();

  return (
    <div className="bottom-dock-wrapper">
      <div className="bottom-dock">
        {/* Previous Day */}
        <button
          className="bottom-dock-button"
          onClick={onPrevDay}
          title={strings.previous_button}
          aria-label="Previous day"
        >
          <ChevronLeftIcon size={22} />
        </button>

        {/* Guide */}
        <button
          className="bottom-dock-button"
          onClick={onOpenGuide}
          title={strings.guide_button}
          aria-label="Open guide"
        >
          <HelpIcon size={22} />
        </button>

        {/* Center Calendar Circle Hub */}
        <div
          className="bottom-dock-center-badge"
          onClick={handleCenterClick}
          title={strings.help_date}
        >
          <input
            ref={inputRef}
            type="date"
            className="date-picker-input-hidden"
            value={formatDateString(currentDate)}
            onChange={handleInputChange}
            title="Select Date"
            style={{ borderRadius: '50%' }}
          />
          <span className="badge-month">{monthShort}</span>
          <span className="badge-day">{dayNumber}</span>
        </div>

        {/* Settings */}
        <button
          className="bottom-dock-button"
          onClick={onOpenSettings}
          title={strings.settings_button}
          aria-label="Open settings"
        >
          <SettingsIcon size={22} />
        </button>

        {/* Next Day */}
        <button
          className="bottom-dock-button"
          onClick={onNextDay}
          title={strings.next_button}
          aria-label="Next day"
        >
          <ChevronRightIcon size={22} />
        </button>
      </div>
    </div>
  );
};

export default BottomDock;
