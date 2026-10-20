import React, { useState, useEffect } from 'react';
import { IconWindowsTxt, IconX } from './Icons';

interface TutorCornerPopupProps {
  onOpenNewFile: () => void;
  isVisible: boolean;
}

export const TutorCornerPopup: React.FC<TutorCornerPopupProps> = ({ onOpenNewFile, isVisible }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isOpen || !isVisible) return null;

  if (minimized) {
    return (
      <button
        className="tutor-minimized-bubble"
        onClick={() => setMinimized(false)}
        title="Open OS Storage Assistant"
      >
        <span className="tutor-pulse-dot" />
        <span style={{ fontSize: '18px' }}>🤖</span>
        <span style={{ fontWeight: 600, fontSize: '12px' }}>OS Storage Guide</span>
      </button>
    );
  }

  return (
    <div className="tutor-corner-popup animate-slide-up" role="region" aria-label="OS Assistant Guidance">
      {/* Header */}
      <div className="tutor-popup-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="tutor-avatar-ring">
            <span style={{ fontSize: '16px' }}>🤖</span>
            <span className="tutor-online-badge" />
          </div>
          <div>
            <div className="tutor-name">Kernel Storage Assistant</div>
            <div className="tutor-status">Interactive Learning Lab</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="tutor-icon-btn"
            onClick={() => setMinimized(true)}
            title="Minimize"
          >
            ─
          </button>
          <button
            className="tutor-icon-btn"
            onClick={() => setIsOpen(false)}
            title="Dismiss"
          >
            <IconX size={13} />
          </button>
        </div>
      </div>

      {/* Message Body */}
      <div className="tutor-popup-body">
        <p className="tutor-speech">
          👋 <strong>Welcome!</strong> You are looking at the user desktop. Underneath, an operating system storage manager is ready to allocate physical disk blocks.
        </p>

        <div className="tutor-instruction-box">
          <span className="tutor-pointer-icon">👉</span>
          <div>
            <strong>Right-click anywhere on the desktop</strong> and select{' '}
            <span className="tutor-highlight">New &gt; Text Document</span> to begin!
          </div>
        </div>

        <button
          className="tutor-cta-btn"
          onClick={() => {
            onOpenNewFile();
          }}
        >
          <IconWindowsTxt size={16} />
          <span>Or click here to create a file</span>
        </button>
      </div>
    </div>
  );
};
