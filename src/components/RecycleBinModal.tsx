import React from 'react';
import type { FileRecord } from '../types/simulator';
import { IconTrash, IconX } from './Icons';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  recycledFiles: FileRecord[];
  onRestoreFile: (file: FileRecord) => void;
  onEmptyBin: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  recycledFiles,
  onRestoreFile,
  onEmptyBin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-bin">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title" id="modal-title-bin">
            <IconTrash size={16} className="text-warning" />
            <span>Simulated OS Recycle Bin</span>
            <span className="os-badge">{recycledFiles.length} item{recycledFiles.length === 1 ? '' : 's'}</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <div className="modal-body">
          {recycledFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Recycle bin is empty. No deleted files staged for recovery.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                When files are deleted, their physical disk sectors are deallocated. Restoring a file will re-trigger the allocation pipeline under the currently active allocation method.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recycledFiles.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{f.name}</strong>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {f.sizeBytes.toLocaleString()} Bytes ({f.requiredBlocks} Blocks) • Type: {f.type}
                      </div>
                    </div>

                    <button
                      className="btn-ui primary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => onRestoreFile(f)}
                    >
                      Restore to Disk
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {recycledFiles.length > 0 && (
            <button className="btn-ui danger" onClick={onEmptyBin}>
              Empty Recycle Bin
            </button>
          )}
          <button className="btn-ui" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
