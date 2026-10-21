/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState } from 'react';
import type {
  AllocationMethod,
  DiskBlock,
  DiskStats,
  FileRecord,
  PipelineSession,
  SimConfig,
} from '../types/simulator';

interface MobileViewProps {
  method: AllocationMethod;
  onSelectMethod: (m: AllocationMethod) => void;
  blocks: DiskBlock[];
  files: FileRecord[];
  stats: DiskStats;
  config: SimConfig;
  selectedFileId: string | null;
  onSelectFile: (id: string | null) => void;
  selectedBlockId: number | null;
  onSelectBlock: (id: number | null) => void;
  highlightedBlockIds: number[];
  pipelineSession: PipelineSession | null;
  onOpenNewFile: () => void;
  onOpenFile: (file: FileRecord) => void;
  onDeleteFile: (file: FileRecord) => void;
  onResizeFile: (file: FileRecord) => void;
  onRenameFile: (file: FileRecord) => void;
  onOpenPlatter: () => void;
  onOpenDefrag: () => void;
  onOpenTerminal: () => void;
  onOpenComparison: () => void;
  onOpenScenarios: () => void;
  onOpenRecycleBin: () => void;
  onResetDisk: () => void;
  onSwitchToDesktop: () => void;
}

type MobileTab = 'disk' | 'files' | 'pipeline' | 'tools';

export const MobileView: React.FC<MobileViewProps> = ({
  method,
  onSelectMethod,
  blocks,
  files,
  stats,
  config,
  selectedFileId,
  onSelectFile,
  selectedBlockId,
  onSelectBlock,
  highlightedBlockIds,
  pipelineSession,
  onOpenNewFile,
  onOpenFile,
  onDeleteFile,
  onResizeFile,
  onRenameFile,
  onOpenPlatter,
  onOpenDefrag,
  onOpenTerminal,
  onOpenComparison,
  onOpenScenarios,
  onOpenRecycleBin,
  onResetDisk,
  onSwitchToDesktop,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('disk');

  const selectedBlock =
    selectedBlockId !== null ? blocks[selectedBlockId] || null : null;

  const currentFile = files.find((f) => f.id === selectedFileId);

  // Free and occupied counts
  const occupiedCount = blocks.filter((b) => b.state !== 'free').length;
  const freeCount = blocks.length - occupiedCount;
  const utilization = Math.round((occupiedCount / blocks.length) * 100);

  return (
    <div className="mobile-app-root">
      {/* Top App Header */}
      <header className="mobile-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💾</span>
              <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                SimFS Mobile
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                v2.4
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
              Operating Systems Principles · Jaijitesh (25BIT0235)
            </span>
          </div>

          {/* Desktop Mode Switcher */}
          <button
            type="button"
            onClick={onSwitchToDesktop}
            style={{
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🖥️ Desktop</span>
          </button>
        </div>

        {/* Allocation Method Selector Pills */}
        <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {(['contiguous', 'linked', 'indexed'] as AllocationMethod[]).map((m) => {
            const isActive = method === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMethod(m)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '6px',
                  border: isActive
                    ? `1px solid ${m === 'contiguous' ? '#38bdf8' : m === 'linked' ? '#34d399' : '#fbbf24'}`
                    : '1px solid rgba(255,255,255,0.08)',
                  background: isActive
                    ? m === 'contiguous'
                      ? 'rgba(56, 189, 248, 0.2)'
                      : m === 'linked'
                      ? 'rgba(52, 211, 153, 0.2)'
                      : 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(255,255,255,0.03)',
                  color: isActive
                    ? m === 'contiguous'
                      ? '#38bdf8'
                      : m === 'linked'
                      ? '#34d399'
                      : '#fbbf24'
                    : '#94a3b8',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Quick Tools Launch Strip */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            type="button"
            className="mobile-quick-btn"
            onClick={onOpenPlatter}
          >
            <span>💽 3D Platter</span>
          </button>
          <button
            type="button"
            className="mobile-quick-btn"
            onClick={onOpenDefrag}
          >
            <span>⚡ Defrag</span>
          </button>
          <button
            type="button"
            className="mobile-quick-btn"
            onClick={onOpenTerminal}
          >
            <span>💻 Terminal</span>
          </button>
          <button
            type="button"
            className="mobile-quick-btn"
            onClick={onOpenComparison}
          >
            <span>📊 3x Bench</span>
          </button>
          <button
            type="button"
            className="mobile-quick-btn"
            onClick={onOpenScenarios}
          >
            <span>🧪 Lab Tests</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content Area */}
      <main className="mobile-content">
        {/* TAB 1: 💽 PHYSICAL DISK MAP */}
        {activeTab === 'disk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Storage Metric Summary Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                <span>Physical Disk Capacity</span>
                <strong style={{ color: '#f1f5f9' }}>{occupiedCount} / {blocks.length} Sectors ({utilization}%)</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${utilization}%`,
                    height: '100%',
                    background: method === 'contiguous' ? '#38bdf8' : method === 'linked' ? '#34d399' : '#fbbf24',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                <span>Free Space: {freeCount * config.blockSize} B ({freeCount} blks)</span>
                <span>External Frag: {stats.externalFragmentationMetric.hasFragmentation ? 'Present' : '0%'}</span>
              </div>
            </div>

            {/* 64-Block Responsive Matrix (8 columns x 8 rows) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f1f5f9' }}>
                  64-Sector Physical Disk Layout (LBA 0..63)
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Tap sector to inspect</span>
              </div>

              <div className="mobile-disk-grid">
                {blocks.map((block) => {
                  const isIndex = block.state === 'index';
                  const isOccupied = block.state !== 'free';
                  const isSelected = selectedBlockId === block.id;
                  const isHighlighted = highlightedBlockIds.includes(block.id);
                  const isCurrentFile = currentFile?.allocatedBlocks.includes(block.id) || currentFile?.indexBlockId === block.id;

                  let bgColor = 'rgba(255,255,255,0.04)';
                  let borderColor = 'rgba(255,255,255,0.08)';
                  let textColor = '#64748b';

                  if (isIndex) {
                    bgColor = 'rgba(245, 158, 11, 0.25)';
                    borderColor = '#fbbf24';
                    textColor = '#fbbf24';
                  } else if (isOccupied) {
                    if (isCurrentFile) {
                      bgColor = 'rgba(56, 189, 248, 0.35)';
                      borderColor = '#38bdf8';
                      textColor = '#f8fafc';
                    } else {
                      bgColor = block.fileColor ? `${block.fileColor}44` : 'rgba(59, 130, 246, 0.2)';
                      borderColor = block.fileColor || '#3b82f6';
                      textColor = '#cbd5e1';
                    }
                  }

                  if (isSelected) {
                    borderColor = '#ef4444';
                    bgColor = 'rgba(239, 68, 68, 0.3)';
                    textColor = '#ffffff';
                  } else if (isHighlighted) {
                    borderColor = '#38bdf8';
                    bgColor = 'rgba(56, 189, 248, 0.3)';
                  }

                  return (
                    <div
                      key={block.id}
                      className="mobile-disk-block"
                      style={{
                        background: bgColor,
                        borderColor,
                        color: textColor,
                      }}
                      onClick={() => {
                        onSelectBlock(block.id);
                        if (block.fileId) {
                          onSelectFile(block.fileId);
                        }
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>{block.id}</span>
                      {isIndex && <span style={{ fontSize: '8px', color: '#fbbf24', fontWeight: 700 }}>IDX</span>}
                      {block.fileTag && !isIndex && (
                        <span style={{ fontSize: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                          {block.fileTag}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Color Code Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
                  Free (0x00)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#3b82f6', border: '1px solid #60a5fa' }} />
                  Data Sector
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#f59e0b', border: '1px solid #fbbf24' }} />
                  Index Block
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: '#ef4444', border: '1px solid #f87171' }} />
                  Active / Selected
                </span>
              </div>
            </div>

            {/* Selected Sector Inspector Card */}
            {selectedBlock ? (
              <div
                style={{
                  background: '#040711',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: '#38bdf8' }}>
                    SECTOR LBA #{selectedBlock.id} INSPECTOR
                  </strong>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    Cyl {Math.floor(selectedBlock.id / 16)} · Head 0 · Sec {selectedBlock.id % 16}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11.5px', marginBottom: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Status:</span>
                    <strong style={{ color: selectedBlock.state !== 'free' ? '#38bdf8' : '#34d399' }}>
                      {selectedBlock.state !== 'free'
                        ? selectedBlock.fileTag?.includes('IDX')
                          ? 'INDEX BLOCK'
                          : `ALLOCATED (${selectedBlock.fileName || 'File'})`
                        : 'FREE SECTOR'}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Slack Space:</span>
                    <span style={{ color: '#cbd5e1' }}>
                      {selectedBlock.bytesUsed} / {config.blockSize} B (
                      <span style={{ color: '#f59e0b' }}>{config.blockSize - selectedBlock.bytesUsed}B slack</span>)
                    </span>
                  </div>
                </div>

                {/* Raw Hex & ASCII Stream */}
                <div
                  style={{
                    background: '#020409',
                    borderRadius: '4px',
                    padding: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    lineHeight: 1.5,
                    color: '#94a3b8',
                    overflowX: 'auto',
                  }}
                >
                  <div style={{ color: '#475569', marginBottom: '2px' }}>
                    0000: 53 69 6D 46 53 5F 53 45 43 54 4F 52 5F 30 78{selectedBlock.id.toString(16).padStart(2, '0').toUpperCase()} &nbsp;
                    <span style={{ color: '#f1f5f9' }}>SimFS_SECTOR</span>
                  </div>
                  <div>
                    0010: {selectedBlock.state !== 'free' ? '44 61 74 61 50 61 79 6C 6F 61 64 5F 42 6C 6F 63' : '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'} &nbsp;
                    <span style={{ color: '#f1f5f9' }}>{selectedBlock.state !== 'free' ? 'DataPayload_Bloc' : '................'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                Tap any block above to inspect physical sector payload, slack space, and hex bytes.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 📁 MOBILE FILE MANAGER */}
        {activeTab === 'files' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                  Allocated Files ({files.length})
                </h2>
                <span className="text-xs text-muted">Mounted on volume C:\Users\Student</span>
              </div>
              <button
                type="button"
                className="btn-ui primary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={onOpenNewFile}
              >
                + New File
              </button>
            </div>

            {files.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '36px 16px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📂</span>
                <strong style={{ fontSize: '13px', color: '#f1f5f9', display: 'block' }}>No files on Volume C:</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 14px 0' }}>
                  Create your first file to observe how blocks are allocated on disk.
                </p>
                <button type="button" className="btn-ui primary" onClick={onOpenNewFile}>
                  Create First File
                </button>
              </div>
            ) : (
              files.map((file) => {
                const isSelected = selectedFileId === file.id;
                const fileMethod: AllocationMethod =
                  file.indexBlockId !== undefined
                    ? 'indexed'
                    : file.endBlock !== undefined
                    ? 'linked'
                    : 'contiguous';

                return (
                  <div
                    key={file.id}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <div>
                          <strong style={{ fontSize: '13.5px', color: '#f1f5f9' }}>{file.name}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                            {file.sizeBytes.toLocaleString()} Bytes · {file.requiredBlocks} Sectors
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background:
                            fileMethod === 'contiguous'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : fileMethod === 'linked'
                              ? 'rgba(52, 211, 153, 0.15)'
                              : 'rgba(251, 191, 36, 0.15)',
                          color:
                            fileMethod === 'contiguous'
                              ? '#38bdf8'
                              : fileMethod === 'linked'
                              ? '#34d399'
                              : '#fbbf24',
                        }}
                      >
                        {fileMethod}
                      </span>
                    </div>

                    {/* Sector Chain Display */}
                    <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                      Sectors: [{file.indexBlockId !== undefined ? `IDX:#${file.indexBlockId} ➔ ` : ''}
                      {file.allocatedBlocks.join(', ')}]
                    </div>

                    {/* Mobile File Actions */}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#f1f5f9',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          onSelectFile(file.id);
                          onOpenFile(file);
                          setActiveTab('disk');
                        }}
                      >
                        🔍 Map Blocks
                      </button>

                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                        }}
                        onClick={() => onResizeFile(file)}
                      >
                        📐 Resize
                      </button>

                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#cbd5e1',
                          cursor: 'pointer',
                        }}
                        onClick={() => onRenameFile(file)}
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                        onClick={() => onDeleteFile(file)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: ⚡ EXECUTION PIPELINE */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                OS Execution Pipeline
              </h2>
              <span className="text-xs text-muted">
                Step-by-step kernel trace of allocation events
              </span>
            </div>

            {!pipelineSession || pipelineSession.steps.length === 0 ? (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '36px 16px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⚡</span>
                <strong style={{ fontSize: '13px', color: '#f1f5f9', display: 'block' }}>No Active Pipeline Session</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 14px 0' }}>
                  Create or resize a file to generate a live step-by-step kernel trace.
                </p>
                <button type="button" className="btn-ui primary" onClick={onOpenNewFile}>
                  Create File to Test
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Pipeline Session Summary */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                      {pipelineSession.operationType} Operation
                    </span>
                    <strong style={{ display: 'block', fontSize: '13.5px', color: '#f8fafc' }}>
                      {pipelineSession.fileName}
                    </strong>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {pipelineSession.steps.length} Steps
                  </span>
                </div>

                {/* Step Cards */}
                {pipelineSession.steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        STEP {idx + 1}: {step.phase.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: '#34d399' }}>✓ Completed</span>
                    </div>

                    <strong style={{ fontSize: '13px', color: '#f1f5f9', display: 'block', marginBottom: '4px' }}>
                      {step.title}
                    </strong>

                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {step.whatHappened}
                    </p>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', fontSize: '11.5px', lineHeight: 1.5 }}>
                      <div style={{ color: '#94a3b8', marginBottom: '4px' }}>
                        <strong style={{ color: '#fbbf24' }}>Why it happened:</strong> {step.whyItHappened}
                      </div>
                      <div style={{ color: '#94a3b8' }}>
                        <strong style={{ color: '#34d399' }}>OS Tradeoff:</strong> {step.tradeOff}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: 🔬 OS LAB TOOLS */}
        {activeTab === 'tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                Advanced Operating System Tools
              </h2>
              <span className="text-xs text-muted">
                Hardware inspection, defragmentation, and benchmarks
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <div
                className="mobile-tool-card"
                onClick={onOpenPlatter}
              >
                <span style={{ fontSize: '24px' }}>💽</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                    3D Platter &amp; Head Seek Visualizer
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    7200 RPM dual platters, VCM actuator, and mechanical head thrashing.
                  </span>
                </div>
              </div>

              <div
                className="mobile-tool-card"
                onClick={onOpenDefrag}
              >
                <span style={{ fontSize: '24px' }}>⚡</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                    Drive Optimizer &amp; Disk Defragmenter
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Live OS compaction algorithm to eliminate contiguous external fragmentation.
                  </span>
                </div>
              </div>

              <div
                className="mobile-tool-card"
                onClick={onOpenTerminal}
              >
                <span style={{ fontSize: '24px' }}>💻</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                    OS Kernel PowerShell Terminal
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    CLI shell with dir, df, cat, chs, stat, and touch commands.
                  </span>
                </div>
              </div>

              <div
                className="mobile-tool-card"
                onClick={onOpenComparison}
              >
                <span style={{ fontSize: '24px' }}>📊</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                    3-Way Allocation Benchmark Matrix
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Side-by-side performance comparison for Contiguous, Linked, and Indexed.
                  </span>
                </div>
              </div>

              <div
                className="mobile-tool-card"
                onClick={onOpenScenarios}
              >
                <span style={{ fontSize: '24px' }}>🧪</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                    Pre-Configured OS Lab Experiments
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    One-tap scenarios showing external fragmentation and head thrashing.
                  </span>
                </div>
              </div>

              <div
                className="mobile-tool-card"
                onClick={onOpenRecycleBin}
              >
                <span style={{ fontSize: '24px' }}>🗑️</span>
                <div>
                  <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                    Recycle Bin &amp; Deallocation
                  </strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Inspect deallocated blocks, restore files, or empty the bin.
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Disk Button */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={onResetDisk}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Format / Reset Volume C:
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) for Creating New File */}
      <button
        type="button"
        className="mobile-fab"
        onClick={onOpenNewFile}
        aria-label="Create New File"
        title="Create New File"
      >
        <span style={{ fontSize: '22px', lineHeight: 1 }}>+</span>
        <span style={{ fontSize: '12px', fontWeight: 700 }}>New File</span>
      </button>

      {/* Bottom Touch Navigation Bar (48px+ touch targets) */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'disk' ? 'active' : ''}`}
          onClick={() => setActiveTab('disk')}
        >
          <span style={{ fontSize: '18px' }}>💽</span>
          <span style={{ fontSize: '10.5px', marginTop: '2px' }}>Disk Map</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <span style={{ fontSize: '18px' }}>📁</span>
          <span style={{ fontSize: '10.5px', marginTop: '2px' }}>Files ({files.length})</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <span style={{ fontSize: '18px' }}>⚡</span>
          <span style={{ fontSize: '10.5px', marginTop: '2px' }}>Pipeline</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <span style={{ fontSize: '18px' }}>🔬</span>
          <span style={{ fontSize: '10.5px', marginTop: '2px' }}>Lab Tools</span>
        </button>
      </nav>
    </div>
  );
};
