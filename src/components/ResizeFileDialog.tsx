import React, { useState } from 'react';
import type { AllocationMethod, FileRecord, SimConfig } from '../types/simulator';
import { IconX } from './Icons';

interface ResizeFileDialogProps {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileId: string, newSizeBytes: number) => void;
  method: AllocationMethod;
  config: SimConfig;
}

export const ResizeFileDialog: React.FC<ResizeFileDialogProps> = ({
  file,
  isOpen,
  onClose,
  onSubmit,
  method,
  config,
}) => {
  const [newSizeInput, setNewSizeInput] = useState('');

  if (!isOpen || !file) return null;

  const currentSize = file.sizeBytes;
  const currentBlocks = file.requiredBlocks;
  const targetSize = parseInt(newSizeInput, 10) || currentSize;
  const targetBlocks = Math.max(1, Math.ceil(targetSize / config.blockSize));
  const blockDelta = targetBlocks - currentBlocks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetSize <= 0) return;
    onSubmit(file.id, targetSize);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-resize">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-resize">
            Resize &ldquo;{file.name}&rdquo;
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <span>
                Current size: <strong>{currentSize.toLocaleString()} B</strong> ({currentBlocks} blocks)
              </span>
              <span>·</span>
              <span>
                Method: <strong>{method}</strong>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">New Size in Bytes</label>
              <input
                type="number"
                min="1"
                max={config.totalBlocks * config.blockSize}
                className="form-input font-mono"
                defaultValue={currentSize}
                onChange={(e) => setNewSizeInput(e.target.value)}
                required
              />
              <span className="text-xs text-muted">
                Requires {targetBlocks} blocks ({blockDelta >= 0 ? `+${blockDelta}` : blockDelta} blocks delta)
              </span>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {method === 'contiguous' ? (
                <span>
                  <strong>Contiguous allocation:</strong> Growing requires the adjacent physical sectors immediately following this file to be unallocated. If occupied, in-place expansion will fail.
                </span>
              ) : method === 'linked' ? (
                <span>
                  <strong>Linked allocation:</strong> New blocks will be appended to the end of the pointer chain using any available free sectors.
                </span>
              ) : (
                <span>
                  <strong>Indexed allocation:</strong> New block addresses will be added to Index Block #{file.indexBlockId}.
                </span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ui subtle" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-ui primary">
              Apply Resize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
