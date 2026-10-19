import React from 'react';
import type { AllocationMethod, DiskBlock, DiskStats, FileRecord, SimConfig } from '../types/simulator';
import { FileManagerWindow } from './FileManagerWindow';
import { DiskGridView } from './DiskGridView';
import { DiskSummaryCard } from './DiskSummaryCard';
import { BlockInspectorDrawer } from './BlockInspectorDrawer';
import {
  IconFolder,
  IconTrash,
  IconInfo,
  IconPlus,
} from './Icons';

interface DesktopWorkspaceProps {
  files: FileRecord[];
  blocks: DiskBlock[];
  stats: DiskStats;
  method: AllocationMethod;
  config: SimConfig;
  selectedFileId: string | null;
  selectedBlockId: number | null;
  highlightedBlockIds: number[];
  firstSaveHappened: boolean;
  onSelectFile: (id: string | null) => void;
  onSelectBlock: (id: number | null) => void;
  onOpenNewFile: () => void;
  onResizeFile: (file: FileRecord) => void;
  onRenameFile: (file: FileRecord) => void;
  onDeleteFile: (file: FileRecord) => void;
  onOpenRecycleBin: () => void;
  onOpenAbout: () => void;
  onUpdateCapacity: (newCap: number) => void;
  recycleBinCount: number;
}

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  files,
  blocks,
  stats,
  method,
  config,
  selectedFileId,
  selectedBlockId,
  highlightedBlockIds,
  firstSaveHappened,
  onSelectFile,
  onSelectBlock,
  onOpenNewFile,
  onResizeFile,
  onRenameFile,
  onDeleteFile,
  onOpenRecycleBin,
  onOpenAbout,
  onUpdateCapacity,
  recycleBinCount,
}) => {
  const selectedBlock = selectedBlockId !== null ? blocks[selectedBlockId] : null;
  const ownerFile = selectedBlock?.fileId
    ? files.find((f) => f.id === selectedBlock.fileId) || null
    : null;

  return (
    <div className="desktop-canvas">
      {/* Stage 1: Contextual Invitation Callout */}
      {!firstSaveHappened && files.length === 0 && (
        <div className="first-run-callout" role="alert">
          <div className="first-run-content">
            <h2>Let&apos;s create your first file</h2>
            <p>
              Welcome to the Operating System File Allocation Simulator. Experience how the OS kernel translates file sizes into physical blocks, reserves disk sectors, and creates directory metadata across <strong>Contiguous</strong>, <strong>Linked</strong>, and <strong>Indexed</strong> allocation strategies.
            </p>
          </div>
          <button
            className="btn-ui primary"
            style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
            onClick={onOpenNewFile}
          >
            <IconPlus size={16} />
            <span>Create Your First File</span>
          </button>
        </div>
      )}

      {/* Desktop Main Content Container */}
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Desktop Bar / Quick Launch Icons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <IconFolder size={16} className="text-primary" />
            <span>File Manager ({files.length})</span>
          </div>

          <div
            onClick={onOpenRecycleBin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: recycleBinCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <IconTrash size={16} />
            <span>Recycle Bin ({recycleBinCount})</span>
          </div>

          <div
            onClick={onOpenAbout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <IconInfo size={16} />
            <span>System Guide & Glossary</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-ui primary" onClick={onOpenNewFile}>
              <IconPlus size={14} />
              <span>New File</span>
            </button>
          </div>
        </div>

        {/* File Manager Window */}
        <FileManagerWindow
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={onSelectFile}
          onOpenNewFile={onOpenNewFile}
          onResizeFile={onResizeFile}
          onRenameFile={onRenameFile}
          onDeleteFile={onDeleteFile}
          method={method}
          config={config}
        />

        {/* Disk Summary Telemetry */}
        <DiskSummaryCard
          stats={stats}
          method={method}
          config={config}
          onUpdateCapacity={onUpdateCapacity}
        />

        {/* Physical Disk Block Grid */}
        <DiskGridView
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
          highlightedBlockIds={highlightedBlockIds}
          activeMethod={method}
        />

        {/* Block Inspector Drawer */}
        <BlockInspectorDrawer
          block={selectedBlock}
          ownerFile={ownerFile}
          method={method}
          onClose={() => onSelectBlock(null)}
          onSelectFile={(fId) => onSelectFile(fId)}
        />
      </div>
    </div>
  );
};
