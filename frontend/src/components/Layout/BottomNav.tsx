import { Home, Wallet, List, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/loans', icon: Wallet, label: '贷款' },
  { path: '/details', icon: List, label: '明细' },
  { path: '/forecast', icon: TrendingUp, label: '预估' },
];

export function BottomNav() {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom"
      style={{ maxWidth: '414px', margin: '0 auto' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full relative
              ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}
              transition-colors duration-200
            `}
          >
            {({ isActive }) => (
              <>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--accent)] rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
