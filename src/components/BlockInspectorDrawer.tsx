import React from 'react';
import type { AllocationMethod, DiskBlock, FileRecord } from '../types/simulator';
import { IconHardDrive, IconX } from './Icons';

interface BlockInspectorDrawerProps {
  block: DiskBlock | null;
  ownerFile: FileRecord | null;
  method: AllocationMethod;
  onClose: () => void;
  onSelectFile: (fileId: string) => void;
}

export const BlockInspectorDrawer: React.FC<BlockInspectorDrawerProps> = ({
  block,
  ownerFile,
  method,
  onClose,
  onSelectFile,
}) => {
  if (!block) return null;

  const isFree = block.state === 'free';
  const isIndex = block.state === 'index';

  return (
    <div
      className="os-window"
      style={{
        border: '1px solid var(--color-primary-border)',
        boxShadow: 'var(--shadow-md)',
        background: 'var(--bg-surface)',
      }}
    >
      <div className="window-titlebar" style={{ background: 'var(--color-primary-bg)' }}>
        <div className="window-title" style={{ color: 'var(--color-primary)' }}>
          <IconHardDrive size={15} />
          <span>Physical Sector Inspector: Block #{block.id}</span>
        </div>
        <button
          onClick={onClose}
          style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          title="Close Inspector"
        >
          <IconX size={14} />
        </button>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          <div className="stat-box">
            <div className="stat-label">Block Address</div>
            <div className="stat-value font-mono">
              #{block.id}{' '}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                (0x{block.id.toString(16).padStart(2, '0').toUpperCase()})
              </span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Sector State</div>
            <div
              className="stat-value"
              style={{
                color: isFree ? 'var(--text-muted)' : isIndex ? '#d97706' : 'var(--color-primary)',
              }}
            >
              {isFree ? 'Free Unallocated' : isIndex ? 'Index Block [IDX]' : 'Data Sector'}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Physical Sector Size</div>
            <div className="stat-value font-mono">512 Bytes</div>
          </div>

          {!isFree && (
            <div className="stat-box">
              <div className="stat-label">File Owner</div>
              <div
                className="stat-value"
                style={{
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: ownerFile ? 'pointer' : 'default',
                  color: 'var(--color-primary)',
                }}
                onClick={() => ownerFile && onSelectFile(ownerFile.id)}
                title={ownerFile ? `View file ${ownerFile.name}` : undefined}
              >
                {block.fileName || 'System'}
              </div>
            </div>
          )}
        </div>

        {/* Technical Allocation Specific Details */}
        {!isFree && (
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              fontSize: '11px',
              lineHeight: 1.5,
            }}
          >
            {isIndex ? (
              <div>
                <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>
                  Index Block Pointer Table:
                </strong>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  This block stores the centralized address map for all {block.indexEntries?.length || 0} data blocks of file &ldquo;{block.fileName}&rdquo;.
                </p>
                <div
                  className="font-mono"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    background: '#ffffff',
                    padding: '6px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  {block.indexEntries?.map((targetId, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 5px',
                        background: 'var(--color-primary-bg)',
                        color: 'var(--color-primary)',
                        borderRadius: '2px',
                        border: '1px solid var(--color-primary-border)',
                      }}
                    >
                      [{idx}] ➔ Block #{targetId}
                    </span>
                  ))}
                </div>
              </div>
            ) : method === 'linked' ? (
              <div>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                  Linked Pointer Metadata:
                </strong>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Block offset in file: <strong>Block {block.blockOffset! + 1} of {block.totalBlocksInFile}</strong>
                  <br />
                  Embedded forward pointer: <strong className="font-mono text-primary">{block.nextBlockId !== null ? `Next Sector ➔ #${block.nextBlockId}` : 'End-of-File (NULL / EOF)'}</strong>
                  <br />
                  Pointer storage overhead: 4 Bytes reserved in sector header.
                </p>
              </div>
            ) : method === 'indexed' ? (
              <div>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                  Indexed Data Sector Reference:
                </strong>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Block offset in file: <strong>Block {block.blockOffset! + 1} of {block.totalBlocksInFile}</strong>
                  <br />
                  Parent Index Block: <strong className="font-mono text-warning">Index Block #{block.referencedByIndexBlock}</strong>
                  <br />
                  Direct Access Time: 1 Index Block read + 1 direct sector read = 2 disk I/Os.
                </p>
              </div>
            ) : (
              <div>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                  Contiguous Allocation Span:
                </strong>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Block offset in file: <strong>Block {block.blockOffset! + 1} of {block.totalBlocksInFile}</strong>
                  <br />
                  Contiguous address formula: <code className="font-mono">Physical Address = StartBlock ({ownerFile?.startBlock}) + Offset ({block.blockOffset}) = #{block.id}</code>
                  <br />
                  Sequential read speed: Maximum throughput with zero head seek hops.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
