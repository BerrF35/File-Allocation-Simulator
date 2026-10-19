import React from 'react';

export interface HoverChatData {
  title: string;
  role: string;
  explanation: string;
  details?: string;
  tradeOff?: string;
  x?: number;
  y?: number;
}

interface HoverChatWindowProps {
  data: HoverChatData | null;
}

export const HoverChatWindow: React.FC<HoverChatWindowProps> = ({ data }) => {
  if (!data) return null;

  const viewportWidth = window.innerWidth || 1920;
  const viewportHeight = window.innerHeight || 1080;

  const mouseX = data.x ?? viewportWidth / 2;
  const mouseY = data.y ?? 200;

  const isRightSide = mouseX > viewportWidth / 2;
  const chatWidth = 350;
  const chatHeight = 240;

  // If cursor is on right half of screen, position tooltip to the LEFT of cursor
  const offsetLeft = isRightSide ? mouseX - chatWidth - 16 : mouseX + 20;
  const offsetTop = mouseY - 60;

  // Clamp within viewport
  const clampedX = Math.min(Math.max(16, offsetLeft), viewportWidth - chatWidth - 16);
  const clampedY = Math.min(Math.max(16, offsetTop), viewportHeight - chatHeight - 20);

  return (
    <div
      className={`hover-chat-window-container ${isRightSide ? 'align-left' : 'align-right'}`}
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="hover-chat-bubble">
        {/* Chat Header */}
        <div className="hover-chat-header">
          <div className="hover-chat-avatar">
            <span className="hover-chat-avatar-icon">🤖</span>
            <span className="hover-chat-status-dot" />
          </div>
          <div className="hover-chat-titles">
            <span className="hover-chat-name">Kernel Storage Assistant</span>
            <span className="hover-chat-role">{data.role}</span>
          </div>
          <div className="hover-chat-badge">Live System Tutor</div>
        </div>

        {/* Chat Body */}
        <div className="hover-chat-body">
          <div className="hover-chat-title">{data.title}</div>
          <p className="hover-chat-message">{data.explanation}</p>

          {data.details && (
            <div className="hover-chat-detail-box">
              <span className="hover-chat-detail-label">⚡ Mechanism:</span>
              <span className="hover-chat-detail-text">{data.details}</span>
            </div>
          )}

          {data.tradeOff && (
            <div className="hover-chat-tradeoff-box">
              <span className="hover-chat-tradeoff-label">⚖️ Architecture Trade-off:</span>
              <span className="hover-chat-tradeoff-text">{data.tradeOff}</span>
            </div>
          )}
        </div>

        {/* Pointer Tail */}
        <div className={`hover-chat-tail ${isRightSide ? 'tail-right' : 'tail-left'}`} />
      </div>
    </div>
  );
};
