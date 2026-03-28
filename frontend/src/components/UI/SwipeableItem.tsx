import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { Trash2, Edit2 } from 'lucide-react';

interface SwipeableItemProps {
  children: ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function SwipeableItem({ 
  children, 
  onDelete, 
  onEdit
}: SwipeableItemProps) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-150, 0],
    ['rgba(255, 59, 48, 0.9)', 'rgba(255, 59, 48, 0)']
  );

  const handleDragEnd = () => {
    const currentX = x.get();
    if (currentX < -100 && onDelete) {
      onDelete();
    }
    // Reset position
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background Actions */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-4"
        style={{ background }}
      >
        {onEdit && (
          <button
            className="touch-target mr-2 bg-[var(--accent)] rounded-full p-2"
            onClick={onEdit}
          >
            <Edit2 size={18} className="text-white" />
          </button>
        )}
        {onDelete && (
          <button
            className="touch-target bg-[var(--danger)] rounded-full p-2"
            onClick={onDelete}
          >
            <Trash2 size={18} className="text-white" />
          </button>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative bg-white"
      >
        {children}
      </motion.div>
    </div>
  );
}
