import React, { useState } from 'react';
import type { FileRecord } from '../types/simulator';
import { IconFile, IconX } from './Icons';

interface RenameFileDialogProps {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileId: string, newName: string) => void;
}

export const RenameFileDialog: React.FC<RenameFileDialogProps> = ({
  file,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(file.id, name.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-rename">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title" id="modal-title-rename">
            <IconFile size={16} className="text-primary" />
            <span>Rename File: {file.name}</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">New File Name</label>
              <input
                type="text"
                className="form-input font-mono"
                defaultValue={file.name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <span className="form-hint">
                Renaming modifies only the file system directory table entry; physical disk sectors remain untouched.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ui" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-ui primary">
              Rename File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
