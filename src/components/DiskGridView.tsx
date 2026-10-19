import React from 'react';
import type { AllocationMethod, DiskBlock } from '../types/simulator';

interface DiskGridViewProps {
  blocks: DiskBlock[];
  selectedBlockId: number | null;
  onSelectBlock: (id: number | null) => void;
  highlightedBlockIds: number[];
  activeMethod: AllocationMethod;
}

export const DiskGridView: React.FC<DiskGridViewProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  highlightedBlockIds,
  activeMethod,
}) => {
  return (
    <div className="disk-container" aria-label="Physical Disk Blocks View">
      <div className="section-header">
        <h3 className="section-title">
          <span>Physical Disk Blocks</span>
          <span className="text-xs text-muted" style={{ fontWeight: 400 }}>
            ({blocks.length} blocks · 512 bytes each)
          </span>
        </h3>
        <span className="text-xs text-muted">Click any block to inspect its sector metadata</span>
      </div>

      {/* Grid of Blocks */}
      <div className="disk-grid-layout" role="grid">
        {blocks.map((block) => {
          const isSelected = selectedBlockId === block.id;
          const isHighlighted = highlightedBlockIds.includes(block.id);
          const isFree = block.state === 'free';
          const isIndex = block.state === 'index';

          let stateClass = 'state-free';
          if (!isFree) {
            stateClass = isIndex ? 'state-index' : 'state-data';
          }

          const style: React.CSSProperties = {};
          if (!isFree && block.fileColor && !isIndex) {
            style.backgroundColor = `${block.fileColor}12`;
            style.borderColor = `${block.fileColor}50`;
          }

          return (
            <div
              key={block.id}
              role="gridcell"
              tabIndex={0}
              className={`disk-block ${stateClass} ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
              style={style}
              onClick={() => onSelectBlock(isSelected ? null : block.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectBlock(isSelected ? null : block.id);
                }
              }}
              title={
                isFree
                  ? `Block #${block.id}: Free (512 Bytes)`
                  : isIndex
                  ? `Block #${block.id}: Index block for ${block.fileName} (${block.indexEntries?.length || 0} pointers)`
                  : `Block #${block.id}: ${block.fileName} (Block ${block.blockOffset! + 1} of ${block.totalBlocksInFile})`
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="block-num">#{block.id}</span>
                {!isFree && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: isIndex ? '#b45309' : block.fileColor || 'var(--text-secondary)',
                    }}
                  >
                    {isIndex ? 'IDX' : block.fileTag}
                  </span>
                )}
              </div>

              <div className="block-content-label">
                {isFree ? (
                  <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>free</span>
                ) : isIndex ? (
                  <span style={{ color: '#b45309', fontWeight: 600 }}>Index</span>
                ) : (
                  <span style={{ color: 'var(--text-primary)' }}>{block.fileName}</span>
                )}
              </div>

              <div className="block-sub-label">
                {isFree ? (
                  <span>512B</span>
                ) : isIndex ? (
                  <span style={{ color: '#b45309' }}>{block.indexEntries?.length || 0} ptrs</span>
                ) : activeMethod === 'linked' ? (
                  <span style={{ color: 'var(--color-primary)' }}>
                    {block.nextBlockId !== null ? `➔ #${block.nextBlockId}` : 'EOF'}
                  </span>
                ) : activeMethod === 'indexed' ? (
                  <span>blk {block.blockOffset! + 1}</span>
                ) : (
                  <span>blk {block.blockOffset! + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clean, Restrained Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          paddingTop: '4px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#fafaf9', border: '1px solid #e7e7e4', borderRadius: '2px' }} />
          <span>Free block</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#e0e7ff', border: '1px solid #a5b4fc', borderRadius: '2px' }} />
          <span>Data block</span>
        </div>
        {activeMethod === 'indexed' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '2px' }} />
            <span style={{ color: '#b45309' }}>Index block</span>
          </div>
        )}
        {activeMethod === 'linked' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="font-mono text-primary" style={{ fontWeight: 600 }}>➔</span>
            <span>Forward link pointer</span>
          </div>
        )}
      </div>
    </div>
  );
};
