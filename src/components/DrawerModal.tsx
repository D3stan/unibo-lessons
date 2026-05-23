import { useEffect } from 'preact/hooks';

interface DrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: any;
}

export const DrawerModal = ({ isOpen, onClose, title, children }: DrawerModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('drawer-overlay')) {
      onClose();
    }
  };

  return (
    <div>
      <div
        className={`drawer-overlay ${isOpen ? 'is-open' : ''}`}
        onClick={handleOverlayClick}
      />
      <div className="drawer-sheet">
        <div className="drawer-drag-handle" onClick={onClose} />
        <div className="drawer-header">
          <h3 className="drawer-title">{title}</h3>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="drawer-content">{children}</div>
      </div>
    </div>
  );
};

export default DrawerModal;
