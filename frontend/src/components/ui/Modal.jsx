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

  const variants = {
    default: 'bg-card',
    danger: 'bg-card border-danger',
    success: 'bg-card border-success',
  };

  const isTopRight = anchor === 'top-right';

  return (
    <div className="fixed inset-0 z-[1000] animate-fade-in">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
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
            'relative w-full my-4 max-h-[calc(100vh-2rem)] rounded-2xl shadow-xl flex flex-col overflow-hidden',
            isTopRight ? 'animate-toast' : 'animate-modal',
            sizes[size],
            variants[variant],
            'border border-border',
            className
          )}
        >
        {(title || showClose) && (
          <div
            className={cn(
              'flex flex-shrink-0 items-start justify-between p-6 border-b border-border'
            )}
          >
            <div>
              {title && (
                <h2 id="modal-title" className="text-xl font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {children}
        </div>
        {footer && (
          <div className="flex flex-shrink-0 items-center justify-end gap-3 p-6 border-t border-border">
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
    danger: { icon: AlertTriangle, iconColor: 'text-warning', btnColor: 'btn-danger' },
    success: { icon: Check, iconColor: 'text-success', btnColor: 'btn-success' },
    info: { icon: Info, iconColor: 'text-info', btnColor: 'btn-primary' },
    warning: { icon: AlertCircle, iconColor: 'text-warning', btnColor: 'btn-warning' },
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
          <p className="text-text-secondary">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export { Modal, ConfirmDialog };
export default Modal;