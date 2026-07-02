import { Minus, Square, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../stores/settingsStore';
import { useEffect } from 'react';
import logoFull from '../../../../logo/uxxiii logo.png';
import logoNoBg from '../../../../logo/logo without bg.png';
import { DotMenu } from './DotMenu';

export function TitleBar() {
  const isMaximized = useUIStore((s) => s.isMaximized);
  const setIsMaximized = useUIStore((s) => s.setIsMaximized);

  useEffect(() => {
    window.uxxxiii.window.isMaximized().then(setIsMaximized);
  }, []);

  return (
    <div className="drag-region flex items-center justify-between h-10 px-3 bg-surface-secondary border-b border-border-subtle chrome-ui">
      <div className="flex items-center gap-2 no-drag">
        <img src={logoNoBg} alt="Uxxiii" className="w-6 h-6 rounded-md object-cover" />
        <span className="text-xs font-medium text-text-secondary">Uxxiii</span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.uxxxiii.window.minimize()}
          className="w-10 h-10 flex items-center justify-center hover:bg-surface-tertiary transition-colors rounded-md"
        >
          <Minus size={14} className="text-text-secondary" />
        </button>
        <button
          onClick={async () => {
            await window.uxxxiii.window.maximize();
            setIsMaximized(await window.uxxxiii.window.isMaximized());
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-surface-tertiary transition-colors rounded-md"
        >
          <Square size={12} className="text-text-secondary" />
        </button>
        <button
          onClick={() => window.uxxxiii.window.close()}
          className={cn(
            'w-10 h-10 flex items-center justify-center transition-colors rounded-md',
            'hover:bg-red-500 hover:text-white'
          )}
        >
          <X size={14} className="text-text-secondary hover:text-white" />
        </button>
      </div>
    </div>
  );
}
