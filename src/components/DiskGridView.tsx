import React from 'react';
import type { AllocationMethod, DiskBlock } from '../types/simulator';
import { IconHardDrive } from './Icons';

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
    <div className="disk-grid-wrapper" aria-label="Simulated Physical Disk Blocks Grid">
      <div className="disk-grid-header">
        <div className="disk-grid-title">
          <IconHardDrive size={16} className="text-primary" />
          <span>Simulated Physical Disk Sectors ({blocks.length} Blocks)</span>
          <span className="os-badge" style={{ textTransform: 'capitalize' }}>
            {activeMethod} Allocation Mode
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Click any block to inspect its sector metadata
        </div>
      </div>

      <div className="disk-grid" role="grid" aria-label="Disk sectors table">
        {blocks.map((block) => {
          const isSelected = selectedBlockId === block.id;
          const isHighlighted = highlightedBlockIds.includes(block.id);
          const isFree = block.state === 'free';
          const isIndex = block.state === 'index';

          let cellClass = 'disk-block-cell';
          if (isFree) cellClass += ' state-free';
          else if (isIndex) cellClass += ' state-index';
          else cellClass += ' state-data';

          if (isSelected) cellClass += ' selected';
          if (isHighlighted) cellClass += ' highlighted';

          // Custom styling for occupied file block
          const customStyle: React.CSSProperties = {};
          if (!isFree && block.fileColor) {
            if (isIndex) {
              customStyle.backgroundColor = '#fffbeb';
              customStyle.borderColor = '#d97706';
              customStyle.color = '#78350f';
            } else {
              customStyle.backgroundColor = `${block.fileColor}18`; // 10% opacity tint
              customStyle.borderColor = block.fileColor;
              customStyle.color = block.fileColor;
            }
          }

          return (
            <div
              key={block.id}
              role="gridcell"
              tabIndex={0}
              aria-selected={isSelected}
              className={cellClass}
              style={customStyle}
              onClick={() => onSelectBlock(isSelected ? null : block.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectBlock(isSelected ? null : block.id);
                }
              }}
              title={
                isFree
                  ? `Block #${block.id}: Free physical sector (512 Bytes available)`
                  : isIndex
                  ? `Block #${block.id}: INDEX BLOCK for "${block.fileName}" (${block.indexEntries?.length || 0} data block pointers)`
                  : `Block #${block.id}: File "${block.fileName}" (Block ${block.blockOffset! + 1} of ${block.totalBlocksInFile})`
              }
            >
              <div className="block-header">
                <span className="block-id">#{block.id}</span>
                {!isFree && (
                  <span
                    className="block-tag"
                    style={{
                      backgroundColor: isIndex ? '#d97706' : block.fileColor || '#334155',
                      color: '#ffffff',
                    }}
                  >
                    {isIndex ? 'IDX' : `${block.fileTag}:${block.blockOffset}`}
                  </span>
                )}
              </div>

              <div className="block-center">
                {isFree ? (
                  <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>FREE</span>
                ) : isIndex ? (
                  <span style={{ color: '#b45309', fontSize: '10px', fontWeight: 700 }}>
                    [{block.indexEntries?.length || 0} PTRS]
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {block.fileName}
                  </span>
                )}
              </div>

              <div className="block-footer">
                {isFree ? (
                  <span>512B</span>
                ) : isIndex ? (
                  <span style={{ color: '#d97706' }}>Index Table</span>
                ) : activeMethod === 'linked' ? (
                  <span className="block-next-indicator">
                    {block.nextBlockId !== null ? `➔ #${block.nextBlockId}` : 'EOF'}
                  </span>
                ) : activeMethod === 'indexed' ? (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {block.referencedByIndexBlock !== undefined ? `Idx:#${block.referencedByIndexBlock}` : 'Data'}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Offset {block.blockOffset}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '16px',
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-light)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Legend:</span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              background: '#f8fafc',
              border: '1px dashed var(--border-medium)',
              borderRadius: '2px',
            }}
          />
          <span>Free Block</span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              background: '#eff6ff',
              border: '1.5px solid #2563eb',
              borderRadius: '2px',
            }}
          />
          <span>Occupied Data Block</span>
        </div>

        {activeMethod === 'indexed' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                background: '#fffbeb',
                border: '2px solid #d97706',
                borderRadius: '2px',
              }}
            />
            <span style={{ color: '#b45309', fontWeight: 600 }}>Index Block [IDX]</span>
          </div>
        )}

        {activeMethod === 'linked' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span className="font-mono text-primary" style={{ fontWeight: 700 }}>
              ➔ #id
            </span>
            <span>Next Forward Pointer</span>
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              border: '2px solid #f59e0b',
              boxShadow: '0 0 4px #f59e0b',
              borderRadius: '2px',
            }}
          />
          <span>Active Pipeline Step Target</span>
        </div>
      </div>
    </div>
  );
};
