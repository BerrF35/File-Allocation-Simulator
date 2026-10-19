import React from 'react';
import type { AllocationMethod, FileRecord, SimConfig } from '../types/simulator';
import {
  IconFolder,
  IconFile,
  IconPlus,
  IconTrash,
} from './Icons';

interface FileManagerWindowProps {
  files: FileRecord[];
  selectedFileId: string | null;
  onSelectFile: (id: string | null) => void;
  onOpenNewFile: () => void;
  onResizeFile: (file: FileRecord) => void;
  onRenameFile: (file: FileRecord) => void;
  onDeleteFile: (file: FileRecord) => void;
  method: AllocationMethod;
  config: SimConfig;
}

export const FileManagerWindow: React.FC<FileManagerWindowProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onOpenNewFile,
  onResizeFile,
  onRenameFile,
  onDeleteFile,
  method,
}) => {
  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  return (
    <div className="os-window" aria-label="Simulated File Manager">
      <div className="window-titlebar">
        <div className="window-title">
          <IconFolder size={15} className="text-primary" />
          <span>Simulated File Manager — /root/storage</span>
          <span className="os-badge">{files.length} Item{files.length === 1 ? '' : 's'}</span>
        </div>

        <div className="window-actions">
          <button
            className="btn-ui primary"
            style={{ padding: '3px 8px', fontSize: '11px' }}
            onClick={onOpenNewFile}
          >
            <IconPlus size={12} />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="window-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn-ui"
            disabled={!selectedFile}
            onClick={() => selectedFile && onResizeFile(selectedFile)}
            title="Modify file size (grow or shrink)"
          >
            <span>Resize</span>
          </button>

          <button
            className="btn-ui"
            disabled={!selectedFile}
            onClick={() => selectedFile && onRenameFile(selectedFile)}
            title="Rename file"
          >
            <span>Rename</span>
          </button>

          <button
            className="btn-ui danger"
            disabled={!selectedFile}
            onClick={() => selectedFile && onDeleteFile(selectedFile)}
            title="Delete file and reclaim blocks"
          >
            <IconTrash size={13} />
            <span>Delete</span>
          </button>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {selectedFile ? (
            <span>
              Selected: <strong>{selectedFile.name}</strong> ({selectedFile.sizeBytes} B)
            </span>
          ) : (
            <span>Click a file row to select</span>
          )}
        </div>
      </div>

      {/* File List Table */}
      <div className="file-table-container">
        {files.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <IconFolder size={32} className="text-muted" style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              No files stored on the simulated disk
            </p>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>
              Click <strong>&ldquo;New File&rdquo;</strong> to create your first file or select an educational scenario above.
            </p>
          </div>
        ) : (
          <table className="file-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>File Name</th>
                <th style={{ width: '10%' }}>Type</th>
                <th style={{ width: '20%' }}>Size</th>
                <th style={{ width: '25%' }}>Disk Block Allocation</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isSelected = selectedFileId === file.id;

                let blockAllocationDisplay: React.ReactNode;
                if (method === 'contiguous') {
                  blockAllocationDisplay = (
                    <span className="font-mono text-primary" style={{ fontSize: '11px' }}>
                      Start: #{file.startBlock}, Len: {file.length} [{file.allocatedBlocks.join('..')}]
                    </span>
                  );
                } else if (method === 'linked') {
                  blockAllocationDisplay = (
                    <span className="font-mono text-primary" style={{ fontSize: '11px' }}>
                      {file.allocatedBlocks.map((b, i) => (
                        <React.Fragment key={b}>
                          #{b}
                          {i < file.allocatedBlocks.length - 1 ? ' ➔ ' : ' (EOF)'}
                        </React.Fragment>
                      ))}
                    </span>
                  );
                } else {
                  // Indexed
                  blockAllocationDisplay = (
                    <span className="font-mono" style={{ fontSize: '11px' }}>
                      <strong style={{ color: '#d97706' }}>Index: #{file.indexBlockId}</strong> ➔ [
                      {file.allocatedBlocks.join(', ')}]
                    </span>
                  );
                }

                return (
                  <tr
                    key={file.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => onSelectFile(isSelected ? null : file.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span
                          className="file-tag-badge"
                          style={{ backgroundColor: file.color }}
                        >
                          {file.tag}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconFile size={15} className="text-muted" />
                          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {file.name}
                          </strong>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="os-badge" style={{ fontSize: '10px' }}>
                        {file.type}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="font-mono" style={{ fontWeight: 600 }}>
                          {file.sizeBytes.toLocaleString()} Bytes
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {file.requiredBlocks} Data Block{file.requiredBlocks > 1 ? 's' : ''}
                          {method === 'indexed' ? ' + 1 Index' : ''}
                        </span>
                      </div>
                    </td>

                    <td>{blockAllocationDisplay}</td>

                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{ display: 'inline-flex', gap: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-ui"
                          style={{ padding: '2px 5px', fontSize: '11px' }}
                          onClick={() => onResizeFile(file)}
                          title="Resize file"
                        >
                          Resize
                        </button>
                        <button
                          className="btn-ui danger"
                          style={{ padding: '2px 5px', fontSize: '11px' }}
                          onClick={() => onDeleteFile(file)}
                          title="Delete file"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
