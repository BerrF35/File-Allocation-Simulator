import React, { useState, useEffect } from 'react';
import type { FileRecord } from '../types/simulator';
import {
  IconWindows11,
  IconSearch,
  IconThisPC,
  IconWindowsTrash,
  IconWindowsFolder,
  IconWindowsTxt,
  IconEdge,
  IconWifi,
  IconVolume,
  IconHardDrive,
} from './Icons';
import type { HoverChatData } from './HoverChatWindow';

interface WindowsDesktopProps {
  files: FileRecord[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string | null) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onFileContextMenu?: (e: React.MouseEvent, file: FileRecord) => void;
  onBinContextMenu?: (e: React.MouseEvent) => void;
  onOpenRecycleBin?: () => void;
  onDeleteFile?: (file: FileRecord) => void;
  onOpenNewFile: () => void;
  isSplitView: boolean;
  onToggleSplitView?: () => void;
  recycleBinCount: number;
  onHoverChat: (data: HoverChatData | null) => void;
  onOpenScenarios?: () => void;
  onOpenComparison?: () => void;
  onOpenStartMenu?: () => void;
  onOpenDefrag?: () => void;
  onOpenTerminal?: () => void;
  onOpenPlatter?: () => void;
}

export const WindowsDesktop: React.FC<WindowsDesktopProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onContextMenu,
  onFileContextMenu,
  onBinContextMenu,
  onOpenRecycleBin,
  isSplitView,
  onToggleSplitView,
  recycleBinCount,
  onHoverChat,
  onOpenScenarios,
  onOpenComparison,
  onOpenStartMenu,
  onOpenDefrag,
  onOpenTerminal,
  onOpenPlatter,
}) => {
  const [selectedSystemIcon, setSelectedSystemIcon] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState({ time: '', date: '' });

  // Real-time Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime({
        time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        date: now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }),
      });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicked directly on canvas background
    if (e.target === e.currentTarget) {
      setSelectedSystemIcon(null);
      onSelectFile(null);
    }
  };

  return (
    <div
      className={`win-desktop-container ${isSplitView ? 'split-mode' : 'fullscreen-mode'}`}
      onContextMenu={onContextMenu}
      onClick={handleCanvasClick}
    >
      {/* Authentic Windows 11 Bloom / Ambient Wallpaper Layer */}
      <div className="win-wallpaper-bg">
        <div className="win-bloom-center" />
        <div className="win-bloom-glow" />
        <div className="win-bloom-secondary" />
      </div>

      {/* Top Academic Subtitle Bar (Discreet, professional) */}
      <div className="win-academic-header">
        <div className="win-academic-left">
          <span className="win-pill-badge">OS Principles</span>
          <span>Student: <strong>Jaijitesh Suryaprakash</strong> (25BIT0235)</span>
        </div>
        <div className="win-academic-right">
          {onOpenScenarios && (
            <button className="win-nav-glass-btn" onClick={onOpenScenarios}>
              📚 Scenarios
            </button>
          )}
          {onOpenComparison && (
            <button className="win-nav-glass-btn" onClick={onOpenComparison}>
              📊 3× Benchmark
            </button>
          )}
          {isSplitView && onToggleSplitView && (
            <button className="win-nav-glass-btn active" onClick={onToggleSplitView}>
              🖥️ Full Desktop
            </button>
          )}
        </div>
      </div>

      {/* Desktop Icons Area */}
      <div className="win-desktop-icons-area">
        {/* System Icon: This PC */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'this-pc' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('this-pc');
            onSelectFile(null);
          }}
          onDoubleClick={() => {
            if (onToggleSplitView && !isSplitView) onToggleSplitView();
          }}
          onMouseEnter={(e) =>
            onHoverChat({
              title: 'This PC (Logical Volume)',
              role: 'Hardware Abstraction Layer',
              explanation:
                'Represents the root block device (LBA 0..63). In modern operating systems, filesystems mount on raw disk partitions.',
              details: 'Mounted filesystem: SimFS (512B Block Size, 64 Physical Sectors = 32 KB Total Capacity).',
              tradeOff: 'Hides physical sector geometry from user space via Uniform Block Addressing.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="win-icon-wrapper">
            <IconThisPC size={42} />
          </div>
          <span className="win-icon-label">This PC</span>
        </div>

        {/* System Icon: Recycle Bin */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'recycle-bin' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('recycle-bin');
            onSelectFile(null);
          }}
          onDoubleClick={() => {
            if (onOpenRecycleBin) onOpenRecycleBin();
          }}
          onContextMenu={(e) => {
            if (onBinContextMenu) {
              e.stopPropagation();
              onBinContextMenu(e);
            }
          }}
          onMouseEnter={(e) =>
            onHoverChat({
              title: 'Recycle Bin (Block Deallocation)',
              role: 'Storage Reclamation',
              explanation:
                'When a file is deleted in an OS, its allocated sectors are reclaimed back into the Free Space Bitmap or Free Block List. Double-click to open and restore files.',
              details: `Files pending purge: ${recycleBinCount}. Deallocation zeroes pointers and marks sectors as free.`,
              tradeOff: 'Fast delete only frees metadata pointers; data payload remains until overwritten.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="win-icon-wrapper" style={{ position: 'relative' }}>
            <IconWindowsTrash size={42} />
            {recycleBinCount > 0 && (
              <span className="win-bin-badge">{recycleBinCount}</span>
            )}
          </div>
          <span className="win-icon-label">Recycle Bin</span>
        </div>

        {/* System Icon: File Explorer */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'explorer' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('explorer');
            onSelectFile(null);
          }}
          onDoubleClick={() => {
            if (onToggleSplitView) onToggleSplitView();
          }}
          onMouseEnter={(e) =>
            onHoverChat({
              title: 'File Explorer (Directory Tree)',
              role: 'Virtual File System (VFS)',
              explanation:
                'Provides hierarchical namespace abstraction (`/`, `C:\\`). Maps human-readable path strings to low-level Inodes or Directory Entry Table records.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="win-icon-wrapper">
            <IconWindowsFolder size={42} />
          </div>
          <span className="win-icon-label">File Explorer</span>
        </div>

        {/* System Icon: Microsoft Edge */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'edge' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('edge');
            onSelectFile(null);
          }}
        >
          <div className="win-icon-wrapper">
            <IconEdge size={42} />
          </div>
          <span className="win-icon-label">Microsoft Edge</span>
        </div>

        {/* System Icon: OS Kernel Terminal */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'terminal' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('terminal');
            onSelectFile(null);
          }}
          onDoubleClick={() => onOpenTerminal && onOpenTerminal()}
          onMouseEnter={(e) =>
            onHoverChat({
              title: 'OS Kernel PowerShell Terminal',
              role: 'System Shell Interface',
              explanation: 'Interactive command-line shell with real filesystem operations: `dir`, `cat`, `stat`, `touch`, `rm`, `chs`, `defrag`, and `bench`.',
              details: 'Double-click to open terminal prompt.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="win-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              💻
            </div>
          </div>
          <span className="win-icon-label">Terminal</span>
        </div>

        {/* System Icon: Mechanical Platter & Head Arm */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'platter' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('platter');
            onSelectFile(null);
          }}
          onDoubleClick={() => onOpenPlatter && onOpenPlatter()}
          onMouseEnter={(e) =>
            onHoverChat({
              title: 'Hard Disk Platter & Actuator Arm',
              role: 'Mass-Storage Hardware Simulation',
              explanation: 'Simulates rotating magnetic disc cylinders and pivoting read/write head arm to demonstrate seek latency and head thrashing in real time.',
              details: 'Double-click to open physical drive visualizer.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="win-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#0284c7', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              💽
            </div>
          </div>
          <span className="win-icon-label">HDD Platter</span>
        </div>

        {/* System Icon: Drive Optimizer / Defrag */}
        <div
          className={`win-desktop-icon ${selectedSystemIcon === 'defrag' ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSystemIcon('defrag');
            onSelectFile(null);
          }}
          onDoubleClick={() => onOpenDefrag && onOpenDefrag()}
          onMouseEnter={(e) =>
            onHoverChat({
              title: 'Drive Optimizer & Defragmenter (dfrgui.exe)',
              role: 'Compaction Engine',
              explanation: 'Eliminates external fragmentation by shifting allocated files into a single contiguous pool and compacting free holes.',
              details: 'Double-click to open drive optimizer.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="win-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 8, background: '#059669', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              ⚡
            </div>
          </div>
          <span className="win-icon-label">Defragmenter</span>
        </div>

        {/* Dynamically Created User Files on Desktop */}
        {files.map((file) => {
          const isSelected = selectedFileId === file.id;
          return (
            <div
              key={file.id}
              className={`win-desktop-icon user-file ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSystemIcon(null);
                onSelectFile(file.id);
              }}
              onDoubleClick={() => {
                onSelectFile(file.id);
                if (onToggleSplitView && !isSplitView) onToggleSplitView();
              }}
              onContextMenu={(e) => {
                if (onFileContextMenu) {
                  e.stopPropagation();
                  onFileContextMenu(e, file);
                }
              }}
              onMouseEnter={(e) =>
                onHoverChat({
                  title: `File: ${file.name}`,
                  role: 'User Space File Stream',
                  explanation: `This file contains ${file.sizeBytes.toLocaleString()} bytes. The OS maps it to ${file.allocatedBlocks.length} physical disk sectors on the right panel.`,
                  details: `Allocated Sectors: [${file.allocatedBlocks.join(', ')}]. Start Sector: #${file.startBlock}${file.indexBlockId !== undefined ? ` • Index Block: #${file.indexBlockId}` : ''}`,
                  tradeOff: 'Application sees linear byte stream [0..N], kernel handles sector mapping.',
                  x: e.clientX,
                  y: e.clientY,
                })
              }
              onMouseLeave={() => onHoverChat(null)}
            >
              <div className="win-icon-wrapper" style={{ position: 'relative' }}>
                <IconWindowsTxt size={42} />
                <span
                  className="win-file-color-dot"
                  style={{ backgroundColor: file.color }}
                  title={`File Tag: ${file.tag}`}
                />
              </div>
              <span className="win-icon-label">{file.name}</span>
              <span className="win-icon-sublabel">
                {Math.ceil(file.sizeBytes / 1024)} KB ({file.allocatedBlocks.length} blks)
              </span>
            </div>
          );
        })}
      </div>

      {/* Windows 11 Taskbar */}
      <footer className="win-taskbar">
        {/* Left Widget / Academic Attribution */}
        <div className="win-taskbar-left">
          <div className="win-taskbar-widget">
            <span style={{ fontSize: '13px' }}>⚡</span>
            <span style={{ fontSize: '11.5px', color: '#e2e8f0', fontWeight: 500 }}>
              64 Sectors • 32 KB SimFS
            </span>
          </div>
        </div>

        {/* Center: Windows 11 Taskbar App Icons */}
        <div className="win-taskbar-center">
          {/* Start Button */}
          <button
            className="win-taskbar-btn"
            title="Start Menu"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenStartMenu) onOpenStartMenu();
              else onContextMenu(e);
            }}
          >
            <IconWindows11 size={20} />
          </button>

          {/* Search Box / Pill */}
          <div
            className="win-taskbar-search"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenStartMenu) onOpenStartMenu();
              else onContextMenu(e);
            }}
          >
            <IconSearch size={14} style={{ color: '#94a3b8' }} />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Search</span>
          </div>

          {/* Terminal Taskbar Icon */}
          {onOpenTerminal && (
            <button
              className="win-taskbar-btn"
              title="OS Kernel Terminal (PowerShell)"
              onClick={onOpenTerminal}
            >
              <span style={{ fontSize: '16px' }}>💻</span>
            </button>
          )}

          {/* Platter & Seek Taskbar Icon */}
          {onOpenPlatter && (
            <button
              className="win-taskbar-btn"
              title="Mechanical Platter & Seek Arm"
              onClick={onOpenPlatter}
            >
              <span style={{ fontSize: '16px' }}>💽</span>
            </button>
          )}

          {/* Defragmenter Taskbar Icon */}
          {onOpenDefrag && (
            <button
              className="win-taskbar-btn"
              title="Drive Optimizer (Defrag)"
              onClick={onOpenDefrag}
            >
              <span style={{ fontSize: '16px' }}>⚡</span>
            </button>
          )}

          {/* File Explorer */}
          <button className="win-taskbar-btn" title="File Explorer" onClick={onToggleSplitView}>
            <IconWindowsFolder size={20} />
          </button>

          {/* Storage Simulator App (Active with Indicator Underline) */}
          <button
            className="win-taskbar-btn active"
            title="OS File Allocation Simulator"
            onClick={onToggleSplitView}
          >
            <IconHardDrive size={20} />
            <div className="win-taskbar-active-bar" />
          </button>
        </div>

        {/* Right System Tray */}
        <div className="win-taskbar-right">
          <button className="win-tray-btn" title="Chevron">
            <span>^</span>
          </button>
          <button className="win-tray-btn" title="Network status: Connected">
            <IconWifi size={14} />
          </button>
          <button className="win-tray-btn" title="Speakers: 100%">
            <IconVolume size={14} />
          </button>

          {/* Live Dynamic Clock & Date */}
          <div className="win-tray-clock" title="Date & Time">
            <span className="win-clock-time">{currentTime.time || '11:00 PM'}</span>
            <span className="win-clock-date">{currentTime.date || '10/19/2026'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
