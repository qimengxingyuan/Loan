import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
  showNav?: boolean;
  rightAction?: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30
};

export function MobileLayout({ 
  children, 
  title, 
  showHeader = true, 
  showNav = true,
  rightAction 
}: MobileLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen gradient-mesh">
      {showHeader && <Header title={title} rightAction={rightAction} />}
      
      <main 
        className="flex-1 overflow-y-auto hide-scrollbar"
        style={{ 
          paddingBottom: showNav ? 'calc(80px + env(safe-area-inset-bottom, 20px))' : '0'
        }}
      >
        {showHeader && <div className="h-14 safe-top" />}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="px-4 py-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}
