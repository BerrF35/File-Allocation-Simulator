import React from 'react';
import type { FileRecord } from '../types/simulator';
import { IconX } from './Icons';

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
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-bin">
            Recycle Bin ({recycledFiles.length})
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <div className="modal-body">
          {recycledFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Recycle bin is empty.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p className="text-xs text-muted">
                Restoring a file will re-allocate its required blocks on the disk under the currently active allocation method.
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
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{f.name}</strong>
                      <div className="text-xs text-muted">
                        {f.sizeBytes.toLocaleString()} B · {f.requiredBlocks} blocks · {f.type}
                      </div>
                    </div>

                    <button
                      className="btn-ui primary"
                      style={{ padding: '3px 8px', fontSize: '12px' }}
                      onClick={() => onRestoreFile(f)}
                    >
                      Restore
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
              Empty Bin
            </button>
          )}
          <button className="btn-ui subtle" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
