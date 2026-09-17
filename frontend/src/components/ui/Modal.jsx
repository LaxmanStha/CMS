import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  footer,
  variant = 'default',
  anchor = 'center',
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  onCloseRef.current = onClose;
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length) {
      focusable[0].focus();
    } else {
      modalRef.current?.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEscapeRef.current) onCloseRef.current();
      if (e.key === 'Tab') trapFocus(e);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  const trapFocus = (e) => {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  const isTopRight = anchor === 'top-right';

  return (
    <div className="fixed inset-0 z-[1000]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute inset-0 p-4',
          isTopRight ? 'flex items-start justify-end' : 'flex items-center justify-center'
        )}
        onClick={closeOnOverlayClick ? () => onCloseRef.current() : undefined}
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative w-full my-4 max-h-[calc(100vh-2rem)] rounded-2xl shadow-[var(--shadow-elevated)] flex flex-col overflow-hidden animate-scale-in',
            sizes[size],
            'bg-[var(--color-bg-card)] border border-[var(--color-border)]',
            className
          )}
        >
        {(title || showClose) && (
          <div className="flex flex-shrink-0 items-start justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {children}
        </div>
        {footer && (
          <div className="flex flex-shrink-0 items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {footer}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const variants = {
    danger: { icon: AlertTriangle, iconColor: 'text-[var(--color-warning)]', btnColor: 'btn-danger' },
    success: { icon: Check, iconColor: 'text-[var(--color-success)]', btnColor: 'btn-primary' },
    info: { icon: Info, iconColor: 'text-[var(--color-info)]', btnColor: 'btn-primary' },
    warning: { icon: AlertCircle, iconColor: 'text-[var(--color-warning)]', btnColor: 'btn-primary' },
  };

  const { icon: Icon, iconColor, btnColor } = variants[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={loading}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn('btn', btnColor)}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirming...
              </span>
            ) : confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-[var(--color-text-muted)]">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export { Modal, ConfirmDialog };
export default Modal;