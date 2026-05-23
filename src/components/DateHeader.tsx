import { useRef } from 'preact/hooks';
import { CalendarIcon } from '../assets/icons';
import { Translations } from '../i18n';

interface DateHeaderProps {
  date: Date;
  strings: Translations;
  onDateChange: (newDate: Date) => void;
}

export const DateHeader = ({ date, strings, onDateChange }: DateHeaderProps) => {
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

  // Visual text formatting
  const dayName = strings.days[date.getDay()];
  const formattedVisualDate = `${date.getDate()} ${strings.months[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="date-header-card">
      <input
        ref={inputRef}
        type="date"
        className="date-picker-input-hidden"
        value={formatDateString(date)}
        onChange={handleInputChange}
        title="Select Date"
      />
      <div className="date-header-day">
        <span>{dayName}</span>
      </div>
      <div className="date-header-date">
        <CalendarIcon size={15} className="lesson-meta-icon" />
        <span>{formattedVisualDate}</span>
      </div>
    </div>
  );
};

export default DateHeader;
