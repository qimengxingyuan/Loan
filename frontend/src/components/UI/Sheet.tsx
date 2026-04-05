import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: 'auto' | 'full' | 'half';
}

export function Sheet({ isOpen, onClose, title, children, height = 'auto' }: SheetProps) {
  const heightClasses = {
    auto: 'max-h-[85vh]',
    full: 'h-[95vh]',
    half: 'h-[50vh]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            style={{ maxWidth: '414px', margin: '0 auto' }}
            onClick={onClose}
          />

          {/* Sheet Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[var(--shadow-lg)] border-t border-white/50 flex flex-col ${heightClasses[height]}`}
            style={{ maxWidth: '414px', margin: '0 auto' }}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-black/10 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-4 border-b border-[var(--border)]">
                <h2 className="text-title-2 font-semibold text-[var(--text-primary)]">{title}</h2>
                <button 
                  onClick={onClose}
                  className="touch-target text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
        </>
      )}
    </AnimatePresence>
  );
}
