import React from 'react';
import type { AllocationMethod, DiskBlock, FileRecord } from '../types/simulator';
import { IconX } from './Icons';

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
    <div className="block-inspector-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
            Sector Inspector: Block #{block.id}
          </strong>
          <span className="font-mono text-xs text-muted">
            (0x{block.id.toString(16).padStart(2, '0').toUpperCase()})
          </span>
        </div>

        <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
          <IconX size={14} />
        </button>
      </div>

      {isFree ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Unallocated free sector. Capacity: 512 bytes available for new allocations.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Owner:</span>
            <button
              onClick={() => ownerFile && onSelectFile(ownerFile.id)}
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {block.fileName}
            </button>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>
              {isIndex ? 'Index Block' : `Data Block ${block.blockOffset! + 1} of ${block.totalBlocksInFile}`}
            </span>
          </div>

          {/* Allocation details */}
          <div style={{ color: 'var(--text-secondary)' }}>
            {isIndex ? (
              <div>
                <span style={{ fontWeight: 500, color: '#b45309' }}>Index Table entries:</span>
                <span className="font-mono" style={{ marginLeft: '6px' }}>
                  [{block.indexEntries?.map((id, i) => `${i}: #${id}`).join(', ')}]
                </span>
              </div>
            ) : method === 'linked' ? (
              <div>
                <span>Link pointer: </span>
                <strong className="font-mono" style={{ color: 'var(--color-primary)' }}>
                  {block.nextBlockId !== null ? `➔ Block #${block.nextBlockId}` : 'End-of-File (EOF)'}
                </strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (4-byte pointer header)
                </span>
              </div>
            ) : method === 'indexed' ? (
              <div>
                <span>Indexed reference: </span>
                <span>Referenced by <strong>Index Block #{block.referencedByIndexBlock}</strong></span>
              </div>
            ) : (
              <div>
                <span>Contiguous address: </span>
                <span className="font-mono">
                  #{block.id} = Start #{ownerFile?.startBlock} + Offset {block.blockOffset}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
