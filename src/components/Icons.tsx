import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const IconFolder: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

export const IconFile: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
  </svg>
);

export const IconTrash: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export const IconHardDrive: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="22" y1="12" x2="2" y2="12"></line>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
    <line x1="6" y1="16" x2="6.01" y2="16"></line>
    <line x1="10" y1="16" x2="10.01" y2="16"></line>
  </svg>
);

export const IconPlay: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} style={style}>
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

export const IconPause: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} style={style}>
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

export const IconSkipBack: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="19 20 9 12 19 4 19 20"></polygon>
    <line x1="5" y1="19" x2="5" y2="5"></line>
  </svg>
);

export const IconSkipForward: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="5 4 15 12 5 20 5 4"></polygon>
    <line x1="19" y1="5" x2="19" y2="19"></line>
  </svg>
);

export const IconChevronLeft: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export const IconRotateCcw: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="1 4 1 10 7 10"></polyline>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const IconInfo: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const IconX: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export const IconCpu: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </svg>
);

/* Windows 11 Desktop Replica Icons */
export const IconWindows11: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0078d4" className={className} style={style}>
    <rect x="2" y="2" width="9.2" height="9.2" rx="1"></rect>
    <rect x="12.8" y="2" width="9.2" height="9.2" rx="1"></rect>
    <rect x="2" y="12.8" width="9.2" height="9.2" rx="1"></rect>
    <rect x="12.8" y="12.8" width="9.2" height="9.2" rx="1"></rect>
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 16, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const IconThisPC: React.FC<IconProps> = ({ size = 32, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <rect x="6" y="8" width="36" height="24" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2"/>
    <rect x="10" y="12" width="28" height="16" rx="1" fill="#60a5fa"/>
    <rect x="18" y="32" width="12" height="4" fill="#64748b"/>
    <rect x="14" y="36" width="20" height="3" rx="1.5" fill="#475569"/>
  </svg>
);

export const IconWindowsTrash: React.FC<IconProps> = ({ size = 32, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <path d="M12 14L15 40C15.2 41.5 16.5 42 18 42H30C31.5 42 32.8 41.5 33 40L36 14" fill="#94a3b8" stroke="#64748b" strokeWidth="2"/>
    <path d="M10 12H38V14H10V12Z" fill="#64748b"/>
    <path d="M20 8H28V12H20V8Z" fill="#475569"/>
    <line x1="20" y1="18" x2="20" y2="36" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round"/>
    <line x1="24" y1="18" x2="24" y2="36" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round"/>
    <line x1="28" y1="18" x2="28" y2="36" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IconWindowsFolder: React.FC<IconProps> = ({ size = 32, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <path d="M8 12C8 10.9 8.9 10 10 10H20L24 14H38C39.1 14 40 14.9 40 16V36C40 37.1 39.1 38 38 38H10C8.9 38 8 37.1 8 36V12Z" fill="#f59e0b"/>
    <path d="M8 18H40V36C40 37.1 39.1 38 38 38H10C8.9 38 8 37.1 8 36V18Z" fill="#fbbf24"/>
  </svg>
);

export const IconWindowsTxt: React.FC<IconProps> = ({ size = 32, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <rect x="10" y="6" width="28" height="36" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5"/>
    <rect x="14" y="14" width="20" height="2.5" rx="1" fill="#3b82f6"/>
    <rect x="14" y="20" width="16" height="2" rx="1" fill="#94a3b8"/>
    <rect x="14" y="25" width="20" height="2" rx="1" fill="#94a3b8"/>
    <rect x="14" y="30" width="12" height="2" rx="1" fill="#94a3b8"/>
  </svg>
);

export const IconEdge: React.FC<IconProps> = ({ size = 20, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style}>
    <circle cx="24" cy="24" r="18" fill="#0078d4"/>
    <path d="M24 12C18 12 12 18 12 24C12 30 18 36 24 36C30 36 36 30 36 24" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const IconWifi: React.FC<IconProps> = ({ size = 15, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
    <line x1="12" y1="20" x2="12.01" y2="20"></line>
  </svg>
);

export const IconVolume: React.FC<IconProps> = ({ size = 15, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>
);
