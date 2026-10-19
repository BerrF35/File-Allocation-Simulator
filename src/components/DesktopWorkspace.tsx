import React from 'react';
import type { AllocationMethod, DiskBlock, DiskStats, FileRecord, SimConfig } from '../types/simulator';
import { FileManagerWindow } from './FileManagerWindow';
import { DiskGridView } from './DiskGridView';
import { DiskSummaryCard } from './DiskSummaryCard';
import { BlockInspectorDrawer } from './BlockInspectorDrawer';
import { IconPlus } from './Icons';

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
  onUpdateCapacity,
}) => {
  const selectedBlock = selectedBlockId !== null ? blocks[selectedBlockId] : null;
  const ownerFile = selectedBlock?.fileId
    ? files.find((f) => f.id === selectedBlock.fileId) || null
    : null;

  return (
    <div className="desktop-canvas">
      {/* First-Run Calm Hero Invitation */}
      {!firstSaveHappened && files.length === 0 ? (
        <div className="desktop-hero">
          <h1 className="desktop-hero-title">Let&apos;s create your first file</h1>
          <p className="desktop-hero-subtitle">
            This simulator demonstrates how an operating system translates file sizes into physical disk sectors, manages block pointers, and handles storage fragmentation across Contiguous, Linked, and Indexed allocation.
          </p>
          <button
            className="btn-ui primary"
            style={{ padding: '8px 20px', fontSize: '13.5px' }}
            onClick={onOpenNewFile}
          >
            <IconPlus size={15} />
            <span>Create File</span>
          </button>
        </div>
      ) : null}

      {/* Main Desktop Window Workspace */}
      <div className="desktop-window-frame">
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* File Manager */}
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

          {/* Volume Summary */}
          <DiskSummaryCard
            stats={stats}
            method={method}
            config={config}
            onUpdateCapacity={onUpdateCapacity}
          />

          {/* Disk Grid */}
          <DiskGridView
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            highlightedBlockIds={highlightedBlockIds}
            activeMethod={method}
          />

          {/* Contextual Block Inspector */}
          <BlockInspectorDrawer
            block={selectedBlock}
            ownerFile={ownerFile}
            method={method}
            onClose={() => onSelectBlock(null)}
            onSelectFile={(fId) => onSelectFile(fId)}
          />
        </div>
      </div>
    </div>
  );
};
