import React, { useState, useEffect } from 'react';
import type { FileRecord } from '../types/simulator';
import { IconX } from './Icons';

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

  useEffect(() => {
    if (file && isOpen) {
      setName(file.name);
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(file.id, trimmed);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-rename">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-rename">
            Rename File
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">New Filename</label>
              <input
                type="text"
                className="form-input font-mono"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <span className="text-xs text-muted">
                Renaming updates the directory table record. Physical disk sector addresses are unchanged.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ui subtle" onClick={onClose}>
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
