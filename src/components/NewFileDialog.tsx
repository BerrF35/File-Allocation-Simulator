import React, { useState } from 'react';
import type { AllocationMethod, FileType, SimConfig } from '../types/simulator';
import { IconFile, IconX } from './Icons';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: FileType;
    sizeBytes: number;
    content?: string;
  }) => void;
  method: AllocationMethod;
  config: SimConfig;
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  method,
  config,
}) => {
  const [name, setName] = useState('notes.txt');
  const [type, setType] = useState<FileType>('TXT');
  const [unitMode, setUnitMode] = useState<'bytes' | 'blocks'>('bytes');
  const [sizeInput, setSizeInput] = useState('1450');
  const [content, setContent] = useState('Operating System Principles: File Allocation Techniques.');

  if (!isOpen) return null;

  // Convert input to numeric bytes
  const numericVal = parseInt(sizeInput, 10) || 512;
  const sizeBytes = unitMode === 'blocks' ? numericVal * config.blockSize : numericVal;
  const requiredDataBlocks = Math.max(1, Math.ceil(sizeBytes / config.blockSize));
  const totalPhysicalBlocks = method === 'indexed' ? requiredDataBlocks + 1 : requiredDataBlocks;
  const allocatedBytes = requiredDataBlocks * config.blockSize;
  const internalFragBytes = allocatedBytes - sizeBytes;

  const handlePreset = (presetName: string, presetType: FileType, presetBytes: number) => {
    setName(presetName);
    setType(presetType);
    setUnitMode('bytes');
    setSizeInput(presetBytes.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      sizeBytes: Math.max(1, sizeBytes),
      content,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-newfile">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title" id="modal-title-newfile">
            <IconFile size={16} className="text-primary" />
            <span>Create New Simulated File</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Quick Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="form-label" style={{ fontSize: '11px' }}>Quick Size Presets:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-ui"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => handlePreset('quick_note.txt', 'TXT', 850)}
                >
                  Small Note (850B, 2 blk)
                </button>
                <button
                  type="button"
                  className="btn-ui"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => handlePreset('os_report.pdf', 'PDF', 2200)}
                >
                  Medium PDF (2.2KB, 5 blk)
                </button>
                <button
                  type="button"
                  className="btn-ui"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => handlePreset('kernel_image.bin', 'BINARY', 4600)}
                >
                  Large Binary (4.6KB, 9 blk)
                </button>
              </div>
            </div>

            {/* File Name & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">File Name</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. document.txt"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">File Type</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as FileType)}
                >
                  <option value="TXT">TXT</option>
                  <option value="PDF">PDF</option>
                  <option value="IMAGE">IMAGE</option>
                  <option value="BINARY">BINARY</option>
                  <option value="CODE">CODE</option>
                </select>
              </div>
            </div>

            {/* File Size & Unit Toggle */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Simulated File Size</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`btn-ui ${unitMode === 'bytes' ? 'active-toggle' : ''}`}
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() => {
                      setUnitMode('bytes');
                      setSizeInput(sizeBytes.toString());
                    }}
                  >
                    Bytes
                  </button>
                  <button
                    type="button"
                    className={`btn-ui ${unitMode === 'blocks' ? 'active-toggle' : ''}`}
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                    onClick={() => {
                      setUnitMode('blocks');
                      setSizeInput(requiredDataBlocks.toString());
                    }}
                  >
                    Blocks
                  </button>
                </div>
              </div>

              <input
                type="number"
                min="1"
                max={unitMode === 'blocks' ? config.totalBlocks : config.totalBlocks * config.blockSize}
                className="form-input font-mono"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                required
              />
            </div>

            {/* Real-time Block Geometry Preview Box */}
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
                Storage Allocation Geometry ({method.toUpperCase()}FS):
              </strong>
              <div style={{ color: 'var(--text-secondary)' }}>
                • Physical Block Size: <strong>{config.blockSize} Bytes</strong>
                <br />
                • Data Blocks Required: <strong>{requiredDataBlocks} Data Block{requiredDataBlocks > 1 ? 's' : ''}</strong> (⌈{sizeBytes} / {config.blockSize}⌉)
                {method === 'indexed' && (
                  <span style={{ color: '#b45309', display: 'block' }}>
                    • Index Overhead: <strong>+1 Dedicated Index Block</strong> (Total: {totalPhysicalBlocks} physical blocks)
                  </span>
                )}
                {method === 'linked' && (
                  <span style={{ color: 'var(--color-primary)', display: 'block' }}>
                    • Linked Pointers: <strong>{requiredDataBlocks * config.pointerOverheadBytes} Bytes</strong> reserved across sector headers
                  </span>
                )}
                • Internal Fragmentation: <strong>{internalFragBytes} Bytes</strong> unused in final block
              </div>
            </div>

            {/* Optional Sample Text for TXT files */}
            {type === 'TXT' && (
              <div className="form-group">
                <label className="form-label">Optional Text Content</label>
                <textarea
                  className="form-input"
                  style={{ height: '60px', resize: 'vertical', fontSize: '12px' }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Sample content..."
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ui" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-ui primary">
              Create & Save File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
