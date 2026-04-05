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

interface MultiProgressRingProps {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  children?: React.ReactNode;
}

export function MultiProgressRing({
  segments,
  size = 120,
  strokeWidth = 8,
  trackColor = 'var(--border)',
  children
}: MultiProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate total to convert values to percentages
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  
  let currentOffset = 0;

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
        {/* Segments */}
        {segments.map((segment, index) => {
          const progress = (segment.value / total);
          // Calculate stroke length based on progress
          const strokeLength = progress * circumference;
          // Use strokeDasharray to create the segment and empty space
          // First value is the segment length, second value is the rest of the circle
          const dashArray = `${strokeLength} ${circumference}`;
          
          // Calculate how much to rotate this segment to start where the previous one ended
          // The rotation is in degrees, but we apply it via strokeDashoffset
          // We subtract currentOffset because strokeDashoffset pushes the dash backwards
          const dashOffset = -currentOffset * circumference;
          
          // Update offset for the next segment
          currentOffset += progress;

          if (progress === 0) return null;

          return (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt" // Changed from 'round' to 'butt' to prevent overlapping ends
              initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: dashOffset }}
              animate={{ strokeDasharray: dashArray, strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: 'easeOut', delay: index * 0.2 }}
            />
          );
        })}
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
