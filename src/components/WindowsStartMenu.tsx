/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState } from 'react';
import {
  IconWindowsTxt,
  IconWindowsFolder,
  IconWindowsTrash,
} from './Icons';

interface WindowsStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewFile: () => void;
  onOpenDefrag: () => void;
  onOpenTerminal: () => void;
  onOpenPlatter: () => void;
  onOpenBenchmark: () => void;
  onOpenScenarios: () => void;
  onOpenRecycleBin: () => void;
  onToggleSplitView: () => void;
  onResetDisk: () => void;
}

export const WindowsStartMenu: React.FC<WindowsStartMenuProps> = ({
  isOpen,
  onClose,
  onOpenNewFile,
  onOpenDefrag,
  onOpenTerminal,
  onOpenPlatter,
  onOpenBenchmark,
  onOpenScenarios,
  onOpenRecycleBin,
  onToggleSplitView,
  onResetDisk,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const pinnedApps = [
    {
      id: 'notepad',
      name: 'Notepad',
      sub: 'File Allocator',
      icon: <IconWindowsTxt size={32} />,
      action: onOpenNewFile,
    },
    {
      id: 'terminal',
      name: 'Terminal',
      sub: 'Kernel Shell (pwsh)',
      icon: (
        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          💻
        </div>
      ),
      action: onOpenTerminal,
    },
    {
      id: 'platter',
      name: 'Platter & Seek',
      sub: 'HDD Head Arm',
      icon: (
        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          💽
        </div>
      ),
      action: onOpenPlatter,
    },
    {
      id: 'defrag',
      name: 'Defragmenter',
      sub: 'Compaction Tool',
      icon: (
        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          ⚡
        </div>
      ),
      action: onOpenDefrag,
    },
    {
      id: 'bench',
      name: '3x Benchmark',
      sub: 'Workload Metrics',
      icon: (
        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          📊
        </div>
      ),
      action: onOpenBenchmark,
    },
    {
      id: 'scenarios',
      name: 'Lab Scenarios',
      sub: 'OS Experiments',
      icon: (
        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          🧪
        </div>
      ),
      action: onOpenScenarios,
    },
    {
      id: 'explorer',
      name: 'File Explorer',
      sub: 'Split Engine',
      icon: <IconWindowsFolder size={32} />,
      action: onToggleSplitView,
    },
    {
      id: 'bin',
      name: 'Recycle Bin',
      sub: 'Deallocation',
      icon: <IconWindowsTrash size={32} />,
      action: onOpenRecycleBin,
    },
  ];

  const filteredApps = pinnedApps.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="win-start-menu-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
      }}
    >
      <div
        className="win-start-menu-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: '56px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          maxWidth: '94vw',
          height: '560px',
          maxHeight: '82vh',
          background: 'rgba(23, 27, 38, 0.85)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2) inset',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'winStartSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Search Bar */}
        <div style={{ padding: '24px 28px 16px 28px' }}>
          <div
            style={{
              height: '38px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Type here to search apps, commands, or tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '13px',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Pinned Section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>Pinned Apps &amp; Subsystems</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>All Apps ({pinnedApps.length})</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px 10px',
            }}
          >
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  app.action();
                  onClose();
                }}
                className="win-start-app-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 6px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: '6px' }}>{app.icon}</div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0', lineHeight: 1.2 }}>
                  {app.name}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  {app.sub}
                </span>
              </div>
            ))}
          </div>

          {/* Recommended Educational Scenarios */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
              Recommended OS Experiments
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div
                onClick={() => {
                  onOpenScenarios();
                  onClose();
                }}
                className="win-start-rec-item"
                style={{
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                    External Fragmentation
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                    Contiguous allocation gap trap
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  onOpenPlatter();
                  onClose();
                }}
                className="win-start-rec-item"
                style={{
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '18px' }}>💽</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                    Head Thrashing Trace
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                    Observe actuator seek penalty
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Profile Bar */}
        <div
          style={{
            height: '60px',
            background: 'rgba(15, 18, 27, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: '13px',
              }}
            >
              JS
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                Jaijitesh Suryaprakash (25BIT0235)
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                Operating System Principles · Vitest &amp; SimFS Kernel
              </div>
            </div>
          </div>

          {/* Reset / Power Options */}
          <button
            onClick={() => {
              onResetDisk();
              onClose();
            }}
            className="btn-ui subtle"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
            }}
            title="Format / Reset Simulated Disk Partition"
          >
            <span>⏻</span>
            <span>Format Disk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
