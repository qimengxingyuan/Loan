import { Settings, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export function Header({ title = '贷款管家', showBack = false, rightAction }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 glass safe-top"
      style={{ maxWidth: '414px', margin: '0 auto' }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="touch-target text-[var(--primary)] active:opacity-70 transition-opacity"
            >
              <ChevronLeft size={24} />
            </button>
          ) : null}
          <h1 className="text-title-3 text-[var(--text-primary)] font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center">
          {rightAction || (
            <button className="touch-target text-[var(--text-secondary)] active:opacity-70 transition-opacity">
              <Settings size={22} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
