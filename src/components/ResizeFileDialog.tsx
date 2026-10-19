import React, { useState } from 'react';
import type { AllocationMethod, FileRecord, SimConfig } from '../types/simulator';
import { IconFile, IconX } from './Icons';

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
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title" id="modal-title-resize">
            <IconFile size={16} className="text-primary" />
            <span>Resize File: {file.name}</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="stat-box">
                <div className="stat-label">Current Size</div>
                <div className="stat-value font-mono">{currentSize.toLocaleString()} Bytes</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{currentBlocks} blocks allocated</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Block Allocation Method</div>
                <div className="stat-value" style={{ textTransform: 'capitalize' }}>
                  {method}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{config.blockSize} B/block</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Logical File Size (Bytes)</label>
              <input
                type="number"
                min="1"
                max={config.totalBlocks * config.blockSize}
                className="form-input font-mono"
                defaultValue={currentSize}
                onChange={(e) => setNewSizeInput(e.target.value)}
                required
              />
              <span className="form-hint">
                New blocks required: <strong>{targetBlocks} blocks</strong> (Delta: {blockDelta >= 0 ? `+${blockDelta}` : blockDelta} blocks)
              </span>
            </div>

            {/* Educational behavior preview */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '11px',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                How {method.toUpperCase()} allocation handles resizing:
              </strong>
              {method === 'contiguous' ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  If growing: The OS will check if the adjacent blocks directly after block #{file.startBlock + file.length - 1} are currently free. If another file occupies the adjacent block, <strong>in-place expansion will FAIL</strong> with a collision!
                </p>
              ) : method === 'linked' ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  If growing: The OS will harvest any free blocks across the disk and link them onto the end of the existing chain at block #{file.endBlock}.
                </p>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  If growing: The OS will claim free blocks and append their addresses to Index Block #{file.indexBlockId}. Fails only if disk is full or index block capacity ({config.indexBlockCapacity}) is exceeded.
                </p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ui" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-ui primary">
              Commit Resize Operation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
