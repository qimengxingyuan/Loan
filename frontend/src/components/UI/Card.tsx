import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pressable?: boolean;
}

export function Card({ children, className = '', onClick, pressable = false }: CardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={pressable ? { scale: 0.98 } : undefined}
      className={`bg-[var(--surface)] rounded-lg p-5 shadow-[var(--shadow-card)] border border-[var(--border)] transition-colors ${
        pressable ? 'cursor-pointer hover:bg-gray-50/50' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'accent' | 'success' | 'warning';
}

export function StatCard({ label, value, unit, color = 'primary' }: StatCardProps) {
  const colorMap = {
    primary: 'from-slate-800 to-slate-900 shadow-slate-900/20',
    accent: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    success: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    warning: 'from-amber-500 to-amber-600 shadow-amber-500/20'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-lg p-7 bg-gradient-to-br ${colorMap[color]} text-white shadow-[var(--shadow-md)] min-w-[280px] flex-shrink-0 border border-white/10 md:min-w-0`}
    >
      <div className="relative z-10">
        <div className="text-white/80 text-[15px] font-medium mb-3">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] font-bold font-mono leading-none drop-shadow-sm">{value}</span>
          {unit && <span className="text-white/80 text-[16px] font-medium font-mono">{unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}
