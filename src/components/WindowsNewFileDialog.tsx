import React, { useState } from 'react';
import type { AllocationMethod, FileType, SimConfig } from '../types/simulator';
import { IconWindowsTxt, IconX, IconCheck } from './Icons';

interface WindowsNewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileData: {
    name: string;
    type: FileType;
    sizeBytes: number;
    content?: string;
  }) => void;
  activeMethod: AllocationMethod;
  onSelectMethod: (method: AllocationMethod) => void;
  config: SimConfig;
}

export const WindowsNewFileDialog: React.FC<WindowsNewFileDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  activeMethod,
  onSelectMethod,
  config,
}) => {
  const [fileName, setFileName] = useState('notes.txt');
  const [sizeKb, setSizeKb] = useState(2); // 2 KB = 4 blocks of 512B
  const [content, setContent] = useState('Operating System File Allocation: Experimenting with block storage allocation.');

  if (!isOpen) return null;

  const sizeBytes = sizeKb * 1024;
  const requiredBlocks = Math.max(1, Math.ceil(sizeBytes / config.blockSize));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    // Ensure extension
    let finalName = fileName.trim();
    if (!finalName.includes('.')) {
      finalName += '.txt';
    }

    onSubmit({
      name: finalName,
      type: 'TXT',
      sizeBytes,
      content,
    });
    onClose();
  };

  return (
    <div className="win-modal-backdrop" onClick={onClose}>
      <div
        className="win-notepad-window animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="win-dialog-title"
      >
        {/* Windows Titlebar */}
        <div className="win-titlebar">
          <div className="win-titlebar-left">
            <IconWindowsTxt size={16} />
            <span id="win-dialog-title" className="win-titlebar-text">
              {fileName || 'Untitled.txt'} — Notepad (Storage Allocator)
            </span>
          </div>
          <div className="win-titlebar-controls">
            <button className="win-titlebar-btn" tabIndex={-1}>─</button>
            <button className="win-titlebar-btn" tabIndex={-1}>◻</button>
            <button className="win-titlebar-btn close" onClick={onClose} aria-label="Close">
              <IconX size={12} />
            </button>
          </div>
        </div>

        {/* Windows Notepad Menu Bar */}
        <div className="win-menubar">
          <span className="win-menubar-item">File</span>
          <span className="win-menubar-item">Edit</span>
          <span className="win-menubar-item">View</span>
          <span className="win-menubar-item" style={{ color: '#0078d4', fontWeight: 600 }}>Allocation Config</span>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="win-notepad-body">
          <div className="win-form-row">
            <label className="win-label">File Name</label>
            <input
              type="text"
              className="win-input"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., project_report.txt"
              required
              autoFocus
            />
          </div>

          <div className="win-form-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <label className="win-label">File Size: {sizeKb} KB ({sizeBytes.toLocaleString()} Bytes)</label>
              <span className="win-badge-pill">
                Requires <strong>{requiredBlocks}</strong> Disk Blocks ({config.blockSize}B each)
                {activeMethod === 'indexed' && ' + 1 Index Block'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
              {[1, 2, 4, 8, 16].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  className={`win-preset-chip ${sizeKb === kb ? 'active' : ''}`}
                  onClick={() => setSizeKb(kb)}
                >
                  {kb} KB ({Math.ceil((kb * 1024) / config.blockSize)} blks)
                </button>
              ))}
            </div>

            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={sizeKb}
              onChange={(e) => setSizeKb(Number(e.target.value))}
              style={{ width: '100%', marginTop: '10px', accentColor: '#0078d4' }}
            />
          </div>

          {/* Allocation Strategy Selection */}
          <div className="win-form-row">
            <label className="win-label">OS Allocation Algorithm</label>
            <div className="win-method-grid">
              <div
                className={`win-method-card ${activeMethod === 'contiguous' ? 'active' : ''}`}
                onClick={() => onSelectMethod('contiguous')}
              >
                <div className="win-method-card-header">
                  <strong>Contiguous</strong>
                  {activeMethod === 'contiguous' && <IconCheck size={14} />}
                </div>
                <p className="win-method-card-desc">
                  Consecutive disk sectors. Maximum sequential read speed; vulnerable to external fragmentation.
                </p>
              </div>

              <div
                className={`win-method-card ${activeMethod === 'linked' ? 'active' : ''}`}
                onClick={() => onSelectMethod('linked')}
              >
                <div className="win-method-card-header">
                  <strong>Linked List</strong>
                  {activeMethod === 'linked' && <IconCheck size={14} />}
                </div>
                <p className="win-method-card-desc">
                  Scattered sectors with pointers. Zero external fragmentation; slower random direct access.
                </p>
              </div>

              <div
                className={`win-method-card ${activeMethod === 'indexed' ? 'active' : ''}`}
                onClick={() => onSelectMethod('indexed')}
              >
                <div className="win-method-card-header">
                  <strong>Indexed</strong>
                  {activeMethod === 'indexed' && <IconCheck size={14} />}
                </div>
                <p className="win-method-card-desc">
                  Dedicated index block with direct address table. Fast $O(1)$ random seek; 1-block index overhead.
                </p>
              </div>
            </div>
          </div>

          <div className="win-form-row">
            <label className="win-label">Text Content (Simulation Payload)</label>
            <textarea
              className="win-textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type file content here..."
            />
          </div>

          {/* Action Footer */}
          <div className="win-notepad-footer">
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Saving commits write syscall ➔ triggers cinematic split view
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-win secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-win primary">
                💾 Save to Disk & Split
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
