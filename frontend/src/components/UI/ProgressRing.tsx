import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'var(--accent)',
  trackColor = 'var(--border)',
  children
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  color = 'var(--accent)',
  trackColor = 'var(--border)',
  showLabel = false
}: ProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div 
          className="w-full rounded-full overflow-hidden"
          style={{ height, backgroundColor: trackColor }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      {showLabel && (
        <span className="text-body-medium text-[var(--accent)] font-semibold min-w-[3.5rem] text-right">
          {progress.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
