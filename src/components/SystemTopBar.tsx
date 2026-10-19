import React from 'react';
import type { AllocationMethod, DiskStats } from '../types/simulator';
import { IconCpu, IconPlus, IconRotateCcw } from './Icons';

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
          <div className="brand-icon">
            <IconCpu size={14} />
          </div>
          <span>File Allocation Simulator</span>
        </div>

        <div className="student-tag">
          <span>Jaijitesh Suryaprakash (25BIT0235)</span>
          <span>·</span>
          <span>OS Principles</span>
        </div>
      </div>

      <div className="topbar-center">
        {/* Simple, clear segmented control */}
        <div className="method-segmented-control" role="tablist" aria-label="Allocation Method">
          <button
            role="tab"
            aria-selected={method === 'contiguous'}
            className={`method-btn ${method === 'contiguous' ? 'active' : ''}`}
            onClick={() => onSelectMethod('contiguous')}
            title="Contiguous: stores files in consecutive disk blocks"
          >
            Contiguous
          </button>
          <button
            role="tab"
            aria-selected={method === 'linked'}
            className={`method-btn ${method === 'linked' ? 'active' : ''}`}
            onClick={() => onSelectMethod('linked')}
            title="Linked: files occupy scattered blocks linked by pointers"
          >
            Linked
          </button>
          <button
            role="tab"
            aria-selected={method === 'indexed'}
            className={`method-btn ${method === 'indexed' ? 'active' : ''}`}
            onClick={() => onSelectMethod('indexed')}
            title="Indexed: dedicated index block stores pointers to data blocks"
          >
            Indexed
          </button>
        </div>
      </div>

      <div className="topbar-right">
        {/* The single clear primary action */}
        <button className="btn-ui primary" onClick={onOpenNewFile}>
          <IconPlus size={14} />
          <span>New File</span>
        </button>

        {/* Secondary actions as clean, quiet buttons */}
        <button className="btn-ui subtle" onClick={onOpenScenarios} title="Pre-configured lab experiments">
          Scenarios
        </button>

        <button className="btn-ui subtle" onClick={onOpenComparison} title="Compare all three methods on the same workload">
          Compare (3×)
        </button>

        {recycleBinCount > 0 && (
          <button className="btn-ui subtle" onClick={onOpenRecycleBin}>
            Trash ({recycleBinCount})
          </button>
        )}

        <button
          className="btn-ui subtle"
          onClick={onToggleView}
          title={isSplitView ? 'Switch to Desktop Mode' : 'Switch to Split Learning Mode'}
        >
          {isSplitView ? 'Desktop' : 'Split View'}
        </button>

        <button className="btn-ui subtle" onClick={onOpenAbout} title="Principles of file allocation and project info">
          About
        </button>

        <button className="btn-ui subtle" onClick={onResetDisk} title="Reset simulated disk">
          <IconRotateCcw size={13} />
        </button>
      </div>
    </header>
  );
};
