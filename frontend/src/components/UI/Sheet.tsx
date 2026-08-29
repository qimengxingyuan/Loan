import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: 'auto' | 'full' | 'half';
}

export function Sheet({ isOpen, onClose, title, children, height = 'auto' }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const heightClasses = {
    auto: 'max-h-[85vh]',
    full: 'h-[95vh]',
    half: 'h-[50vh]'
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 pointer-events-auto"
            onClick={onClose}
          />

          {/* Sheet Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={`fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[414px] pointer-events-auto bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-[var(--shadow-lg)] border-t border-white/50 flex flex-col md:top-8 md:bottom-8 md:max-w-[560px] md:rounded-2xl md:border ${heightClasses[height]}`}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-black/10 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-4 border-b border-[var(--border)]">
                <h2 id={titleId} className="text-title-2 font-semibold text-[var(--text-primary)]">{title}</h2>
                <button 
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="touch-target text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="关闭"
                >
                  <X size={24} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar safe-bottom">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
