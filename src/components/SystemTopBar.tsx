import React from 'react';
import type { AllocationMethod, DiskStats } from '../types/simulator';
import {
  IconHardDrive,
  IconPlus,
  IconLayers,
  IconInfo,
  IconRotateCcw,
  IconLayout,
  IconTrash,
  IconCpu,
} from './Icons';

interface SystemTopBarProps {
  method: AllocationMethod;
  onSelectMethod: (m: AllocationMethod) => void;
  stats: DiskStats;
  isSplitView: boolean;
  onToggleView: () => void;
  onOpenNewFile: () => void;
  onOpenScenarios: () => void;
  onOpenComparison: () => void;
  onOpenAbout: () => void;
  onResetDisk: () => void;
  recycleBinCount: number;
  onOpenRecycleBin: () => void;
}

export const SystemTopBar: React.FC<SystemTopBarProps> = ({
  method,
  onSelectMethod,
  stats,
  isSplitView,
  onToggleView,
  onOpenNewFile,
  onOpenScenarios,
  onOpenComparison,
  onOpenAbout,
  onResetDisk,
  recycleBinCount,
  onOpenRecycleBin,
}) => {
  return (
    <header className="system-topbar" role="banner">
      <div className="topbar-left">
        <div className="system-brand">
          <IconCpu size={18} className="text-primary" />
          <span>AetherOS</span>
          <span className="os-badge">FS-SIM v4.2</span>
        </div>

        <div className="student-tag">
          <span>Student:</span>
          <strong>Jaijitesh Suryaprakash (25BIT0235)</strong>
          <span>• Course: <strong>OS Principles</strong></span>
        </div>
      </div>

      <div className="topbar-center">
        {/* Method Segmented Control */}
        <div className="method-segmented-control" role="tablist" aria-label="File Allocation Method">
          <button
            role="tab"
            aria-selected={method === 'contiguous'}
            className={`method-btn ${method === 'contiguous' ? 'active' : ''}`}
            onClick={() => onSelectMethod('contiguous')}
            title="Contiguous Allocation: Stores files in consecutive physical blocks. Direct access, but causes external fragmentation."
          >
            Contiguous
          </button>
          <button
            role="tab"
            aria-selected={method === 'linked'}
            className={`method-btn ${method === 'linked' ? 'active' : ''}`}
            onClick={() => onSelectMethod('linked')}
            title="Linked Allocation: Each block stores a pointer to the next block. No external fragmentation, but slow sequential traversal."
          >
            Linked
          </button>
          <button
            role="tab"
            aria-selected={method === 'indexed'}
            className={`method-btn ${method === 'indexed' ? 'active' : ''}`}
            onClick={() => onSelectMethod('indexed')}
            title="Indexed Allocation: Dedicated index block stores pointers to all data blocks. Direct access + no external fragmentation."
          >
            Indexed
          </button>
        </div>

        {/* Disk Quick Status Badge */}
        <div
          className="os-badge"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title={`Disk Capacity: ${stats.occupiedBlocks} of ${stats.totalBlocks} blocks occupied (${stats.utilizationPercent}%)`}
        >
          <IconHardDrive size={13} className="text-muted" />
          <span>
            {stats.occupiedBlocks}/{stats.totalBlocks} Blk ({stats.utilizationPercent}%)
          </span>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="btn-ui primary"
          onClick={onOpenNewFile}
          title="Create a new simulated file on disk"
        >
          <IconPlus size={14} />
          <span>New File</span>
        </button>

        <button
          className="btn-ui"
          onClick={onOpenScenarios}
          title="Load pre-built OS teaching scenarios (Fragmentation, Pointer traversal, Growth collision)"
        >
          <IconLayers size={14} />
          <span>Scenarios</span>
        </button>

        <button
          className="btn-ui"
          onClick={onOpenComparison}
          title="Compare the same file operations side-by-side across Contiguous, Linked, and Indexed"
        >
          <span style={{ fontWeight: 700, fontSize: '11px' }}>3×</span>
          <span>Compare Methods</span>
        </button>

        <button
          className={`btn-ui ${isSplitView ? 'active-toggle' : ''}`}
          onClick={onToggleView}
          title={isSplitView ? 'Switch to Desktop Mode' : 'Switch to Split Learning View'}
        >
          <IconLayout size={14} />
          <span>{isSplitView ? 'Split View' : 'Desktop View'}</span>
        </button>

        {recycleBinCount > 0 && (
          <button
            className="btn-ui"
            onClick={onOpenRecycleBin}
            title={`${recycleBinCount} deleted file${recycleBinCount > 1 ? 's' : ''} in recycle bin`}
          >
            <IconTrash size={14} className="text-warning" />
            <span>Bin ({recycleBinCount})</span>
          </button>
        )}

        <button
          className="btn-ui"
          onClick={onOpenAbout}
          title="Project Information, Allocation Theory & Glossary"
        >
          <IconInfo size={14} />
          <span>About</span>
        </button>

        <button
          className="btn-ui danger"
          onClick={onResetDisk}
          title="Wipe and format simulated disk blocks"
        >
          <IconRotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
