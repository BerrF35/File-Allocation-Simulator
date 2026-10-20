/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState } from 'react';
import type { DiskBlock, FileRecord, SimConfig } from '../types/simulator';
import { IconX } from './Icons';

interface DiskDefragmenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: DiskBlock[];
  files: FileRecord[];
  config: SimConfig;
  onApplyDefrag: (newBlocks: DiskBlock[], newFiles: FileRecord[]) => void;
}

export const DiskDefragmenterModal: React.FC<DiskDefragmenterModalProps> = ({
  isOpen,
  onClose,
  blocks,
  files,
  config,
  onApplyDefrag,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [defragging, setDefragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [defragComplete, setDefragComplete] = useState(false);

  if (!isOpen) return null;

  // Calculate current fragmentation metrics
  const totalBlocks = config.totalBlocks;
  const allocatedCount = blocks.filter((b) => b.state !== 'free').length;
  const freeCount = totalBlocks - allocatedCount;

  // Count contiguous free runs
  let freeGaps = 0;
  let maxFreeRun = 0;
  let currentRun = 0;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].state === 'free') {
      currentRun++;
      if (currentRun > maxFreeRun) maxFreeRun = currentRun;
    } else {
      if (currentRun > 0) freeGaps++;
      currentRun = 0;
    }
  }
  if (currentRun > 0) freeGaps++;

  const fragmentationPercent =
    freeCount === 0 || freeCount === maxFreeRun
      ? 0
      : Math.min(100, Math.round(((freeCount - maxFreeRun) / freeCount) * 100));

  // Handle Drive Analysis
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setProgress(0);
    setDefragComplete(false);

    for (let p = 10; p <= 100; p += 15) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(p);
    }

    setAnalyzing(false);
    setAnalysisDone(true);
  };

  // Handle Defragmentation / Compaction
  const handleDefrag = async () => {
    if (defragging || files.length === 0) return;
    setDefragging(true);
    setProgress(0);

    for (let p = 10; p <= 90; p += 20) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress(p);
    }

    // Execute compaction algorithm:
    // Place all active files one after another starting from sector 0
    let currentLba = 0;
    const updatedFiles: FileRecord[] = [];
    const newBlocks: DiskBlock[] = blocks.map((b) => ({
      ...b,
      state: 'free' as const,
      fileId: null,
      fileName: null,
      fileColor: null,
      fileTag: null,
      blockOffset: null,
      totalBlocksInFile: null,
      bytesUsed: 0,
      nextBlockId: null,
      indexEntries: undefined,
      referencedByIndexBlock: undefined,
    }));

    for (const file of files) {
      const isIndexed = file.indexBlockId !== undefined;
      const isLinked = file.endBlock !== undefined;
      let newIndexBlockId: number | undefined = undefined;

      // If indexed, allocate index block first
      if (isIndexed) {
        newIndexBlockId = currentLba;
        newBlocks[newIndexBlockId] = {
          ...newBlocks[newIndexBlockId],
          state: 'index',
          fileId: file.id,
          fileName: file.name,
          fileColor: file.color,
          fileTag: `${file.name.slice(0, 4)}:IDX`,
          bytesUsed: config.blockSize,
          indexEntries: [],
        };
        currentLba++;
      }

      const newAllocatedBlocks: number[] = [];
      const numDataBlocks = file.requiredBlocks;

      for (let offset = 0; offset < numDataBlocks; offset++) {
        const lba = currentLba++;
        newAllocatedBlocks.push(lba);

        const isLast = offset === numDataBlocks - 1;
        const bytesInThisBlock = isLast
          ? file.sizeBytes % config.blockSize || config.blockSize
          : config.blockSize;

        newBlocks[lba] = {
          ...newBlocks[lba],
          state: 'data',
          fileId: file.id,
          fileName: file.name,
          fileColor: file.color,
          fileTag: `${file.name.slice(0, 4)}:[${offset}]`,
          blockOffset: offset,
          totalBlocksInFile: numDataBlocks,
          bytesUsed: bytesInThisBlock,
          referencedByIndexBlock: newIndexBlockId,
          nextBlockId: isLinked && !isLast ? lba + 1 : null,
        };
      }

      // Update index entries if indexed
      if (isIndexed && newIndexBlockId !== undefined) {
        newBlocks[newIndexBlockId].indexEntries = [...newAllocatedBlocks];
      }

      updatedFiles.push({
        ...file,
        allocatedBlocks: newAllocatedBlocks,
        indexBlockId: newIndexBlockId,
        startBlock: newAllocatedBlocks[0] ?? -1,
        endBlock: isLinked ? newAllocatedBlocks[newAllocatedBlocks.length - 1] : undefined,
        updatedAt: Date.now(),
      });
    }

    setProgress(100);
    setDefragging(false);
    setDefragComplete(true);

    // Apply to main application state
    onApplyDefrag(newBlocks, updatedFiles);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-defrag">
      <div className="modal-dialog" style={{ maxWidth: '680px', width: '92vw' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <h2 className="modal-title" id="modal-title-defrag" style={{ fontSize: '15px' }}>
                Drive Optimizer &amp; Disk Defragmenter (dfrgui.exe)
              </h2>
              <span className="text-xs text-muted">
                OS Compaction Algorithm · External Fragmentation Elimination
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '4px 6px' }} title="Close">
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Volume Status Card */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💾</span>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    Drive C: (SimFS Logical Volume)
                  </strong>
                  <span className="text-xs text-muted" style={{ display: 'block' }}>
                    {config.totalBlocks} Sectors · {((config.totalBlocks * config.blockSize) / 1024).toFixed(0)} KB Total Capacity
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background:
                      fragmentationPercent > 20
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    color: fragmentationPercent > 20 ? '#f87171' : '#34d399',
                  }}
                >
                  {defragComplete
                    ? '0% Fragmented (Compacted)'
                    : `${fragmentationPercent}% Fragmented`}
                </span>
                {analysisDone && !defragComplete && (
                  <span className="text-xs" style={{ display: 'block', marginTop: '4px', color: '#38bdf8' }}>
                    Scan complete · {fragmentationPercent > 10 ? 'Compaction recommended' : 'Drive optimal'}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {(analyzing || defragging) && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>{analyzing ? 'Scanning sector allocation headers...' : 'Moving blocks and updating directory table...'}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metric Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs text-muted" style={{ display: 'block' }}>Occupied Sectors</span>
              <strong style={{ fontSize: '16px', color: '#38bdf8' }}>{allocatedCount}</strong>
              <span className="text-xs text-muted" style={{ display: 'block' }}>of {totalBlocks}</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs text-muted" style={{ display: 'block' }}>Free Gaps</span>
              <strong style={{ fontSize: '16px', color: freeGaps > 1 ? '#f87171' : 'var(--text-primary)' }}>
                {defragComplete ? 1 : freeGaps}
              </strong>
              <span className="text-xs text-muted" style={{ display: 'block' }}>Scattered holes</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs text-muted" style={{ display: 'block' }}>Max Contiguous Run</span>
              <strong style={{ fontSize: '16px', color: '#34d399' }}>
                {defragComplete ? freeCount : maxFreeRun}
              </strong>
              <span className="text-xs text-muted" style={{ display: 'block' }}>blocks</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs text-muted" style={{ display: 'block' }}>Compaction Delta</span>
              <strong style={{ fontSize: '16px', color: '#a78bfa' }}>
                {defragComplete ? 0 : Math.max(0, freeCount - maxFreeRun)}
              </strong>
              <span className="text-xs text-muted" style={{ display: 'block' }}>Recoverable blocks</span>
            </div>
          </div>

          {/* Academic Principle Card */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#94a3b8',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#38bdf8' }}>Operating Systems Compaction Theory:</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Defragmentation shifts all allocated files to one side of the address space and compacts all free holes into a single continuous block pool. This solves <strong>external fragmentation</strong> in contiguous allocation, enabling large files to be written in sequential physical sectors.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn-ui subtle" onClick={onClose} disabled={defragging}>
            Close
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-ui subtle"
              onClick={handleAnalyze}
              disabled={analyzing || defragging}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Drive'}
            </button>
            <button
              type="button"
              className="btn-ui primary"
              onClick={handleDefrag}
              disabled={defragging || files.length === 0}
            >
              {defragging ? 'Compacting Sectors...' : defragComplete ? 'Compaction Done (0%)' : 'Defragment (Compact)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
