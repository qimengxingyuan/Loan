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
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom mx-auto max-w-[414px] border-t border-white/40 bg-white/75 backdrop-blur-xl md:top-0 md:bottom-0 md:right-auto md:mx-0 md:h-screen md:w-24 md:max-w-none md:border-r md:border-t-0 md:border-[var(--divider)] md:bg-white/85"
    >
      <div className="flex h-16 items-center justify-around px-2 md:h-full md:flex-col md:justify-center md:gap-8 md:px-0">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full relative
              md:h-auto md:flex-none md:px-3 md:py-2
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
                      className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[var(--accent)] md:left-[-18px] md:top-1/2 md:h-8 md:w-1 md:-translate-y-1/2 md:translate-x-0"
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
