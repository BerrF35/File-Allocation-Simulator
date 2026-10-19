import React, { useState, useEffect, useRef } from 'react';
import { IconWindowsTxt, IconWindowsFolder } from './Icons';

interface WindowsContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNewFile: () => void;
  onRefresh: () => void;
}

export const WindowsContextMenu: React.FC<WindowsContextMenuProps> = ({
  x,
  y,
  onClose,
  onNewFile,
  onRefresh,
}) => {
  const [showNewSubmenu, setShowNewSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Clamp menu coordinates so it doesn't overflow screen boundaries
  const menuWidth = 240;
  const menuHeight = 290;
  const posX = Math.min(x, window.innerWidth - menuWidth - 10);
  const posY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      className="win-context-menu"
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="win-context-item disabled">
        <span className="win-context-icon">🪟</span>
        <span className="win-context-text">View</span>
        <span className="win-context-arrow">›</span>
      </div>

      <div className="win-context-item disabled">
        <span className="win-context-icon">🔃</span>
        <span className="win-context-text">Sort by</span>
        <span className="win-context-arrow">›</span>
      </div>

      <div
        className="win-context-item"
        onClick={() => {
          onRefresh();
          onClose();
        }}
      >
        <span className="win-context-icon">🔄</span>
        <span className="win-context-text">Refresh</span>
      </div>

      <div className="win-context-divider" />

      {/* New Menu with Submenu Flyout */}
      <div
        className="win-context-item win-context-item-has-sub"
        onMouseEnter={() => setShowNewSubmenu(true)}
        onMouseLeave={() => setShowNewSubmenu(false)}
        onClick={() => {
          // If clicked directly, trigger New File as primary convenient action
          onNewFile();
          onClose();
        }}
      >
        <span className="win-context-icon">➕</span>
        <span className="win-context-text" style={{ fontWeight: 600 }}>New</span>
        <span className="win-context-arrow">›</span>

        {showNewSubmenu && (
          <div className="win-context-submenu">
            <div
              className="win-context-item"
              onClick={(e) => {
                e.stopPropagation();
                onNewFile();
                onClose();
              }}
            >
              <IconWindowsTxt size={18} style={{ marginRight: '8px' }} />
              <span className="win-context-text" style={{ fontWeight: 600 }}>Text Document (.txt)</span>
            </div>
            <div className="win-context-item disabled">
              <IconWindowsFolder size={18} style={{ marginRight: '8px' }} />
              <span className="win-context-text">Folder</span>
            </div>
          </div>
        )}
      </div>

      <div className="win-context-divider" />

      <div className="win-context-item disabled">
        <span className="win-context-icon">🖥️</span>
        <span className="win-context-text">Display settings</span>
      </div>

      <div className="win-context-item disabled">
        <span className="win-context-icon">🎨</span>
        <span className="win-context-text">Personalize</span>
      </div>

      <div className="win-context-divider" />

      <div className="win-context-item disabled">
        <span className="win-context-icon">💻</span>
        <span className="win-context-text">Open in Terminal</span>
      </div>
    </div>
  );
};
