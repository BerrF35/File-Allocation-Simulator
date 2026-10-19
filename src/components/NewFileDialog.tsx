import React, { useState } from 'react';
import type { AllocationMethod, FileType, SimConfig } from '../types/simulator';
import { IconX } from './Icons';

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
  const [name, setName] = useState('lecture_notes.txt');
  const [type, setType] = useState<FileType>('TXT');
  const [unitMode, setUnitMode] = useState<'bytes' | 'blocks'>('bytes');
  const [sizeInput, setSizeInput] = useState('1450');
  const [content, setContent] = useState('Operating System Principles: File Allocation Techniques.');

  if (!isOpen) return null;

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
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-newfile">
            Create New File
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Quick Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="form-label">Presets</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-ui subtle"
                  style={{ padding: '3px 8px', fontSize: '11.5px', border: '1px solid var(--border-medium)' }}
                  onClick={() => handlePreset('quick_note.txt', 'TXT', 850)}
                >
                  Text note (850 B · 2 blk)
                </button>
                <button
                  type="button"
                  className="btn-ui subtle"
                  style={{ padding: '3px 8px', fontSize: '11.5px', border: '1px solid var(--border-medium)' }}
                  onClick={() => handlePreset('os_report.pdf', 'PDF', 2200)}
                >
                  Document (2.2 KB · 5 blk)
                </button>
                <button
                  type="button"
                  className="btn-ui subtle"
                  style={{ padding: '3px 8px', fontSize: '11.5px', border: '1px solid var(--border-medium)' }}
                  onClick={() => handlePreset('kernel_dump.bin', 'BINARY', 4600)}
                >
                  Binary (4.6 KB · 9 blk)
                </button>
              </div>
            </div>

            {/* Name & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Filename</label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="document.txt"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
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

            {/* File Size */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">File Size</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`btn-ui ${unitMode === 'bytes' ? 'primary' : 'subtle'}`}
                    style={{ padding: '2px 6px', fontSize: '10.5px' }}
                    onClick={() => {
                      setUnitMode('bytes');
                      setSizeInput(sizeBytes.toString());
                    }}
                  >
                    Bytes
                  </button>
                  <button
                    type="button"
                    className={`btn-ui ${unitMode === 'blocks' ? 'primary' : 'subtle'}`}
                    style={{ padding: '2px 6px', fontSize: '10.5px' }}
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

            {/* Allocation Details */}
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
              <div>
                Will allocate <strong>{requiredDataBlocks} data block{requiredDataBlocks > 1 ? 's' : ''}</strong>{' '}
                {method === 'indexed' && <span style={{ color: '#b45309' }}>+ 1 index block ({totalPhysicalBlocks} blocks total)</span>}
                {' '}under {method} allocation.
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                {internalFragBytes} bytes internal slack in final block ({config.blockSize} B block size).
              </div>
            </div>

            {type === 'TXT' && (
              <div className="form-group">
                <label className="form-label">Sample Text (optional)</label>
                <textarea
                  className="form-input"
                  style={{ height: '60px', resize: 'vertical' }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ui subtle" onClick={onClose}>
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
