import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full ${sizeClass} rounded-xl bg-cream shadow-card-hover animate-fade-up border border-charcoal/10`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
            <h3 className="font-fraunces text-lg font-semibold text-charcoal">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-charcoal/60 hover:bg-charcoal/10 hover:text-charcoal"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
