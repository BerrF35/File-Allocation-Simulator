import React from 'react';
import type { AllocationMethod, FileRecord, SimConfig } from '../types/simulator';
import { IconFolder, IconPlus, IconTrash } from './Icons';

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
    <div className="workspace-section">
      <div className="section-header">
        <h3 className="section-title">
          <span>Files on Disk</span>
          <span className="text-xs text-muted" style={{ fontWeight: 400 }}>
            ({files.length} item{files.length === 1 ? '' : 's'})
          </span>
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedFile && (
            <>
              <button
                className="btn-ui subtle"
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onResizeFile(selectedFile)}
              >
                Resize
              </button>
              <button
                className="btn-ui subtle"
                style={{ padding: '3px 8px', fontSize: '12px' }}
                onClick={() => onRenameFile(selectedFile)}
              >
                Rename
              </button>
              <button
                className="btn-ui subtle"
                style={{ padding: '3px 8px', fontSize: '12px', color: 'var(--color-danger)' }}
                onClick={() => onDeleteFile(selectedFile)}
              >
                <IconTrash size={13} />
                <span>Delete</span>
              </button>
              <span style={{ color: 'var(--border-medium)', margin: '0 2px' }}>|</span>
            </>
          )}

          <button
            className="btn-ui"
            style={{ padding: '4px 10px', fontSize: '12.5px' }}
            onClick={onOpenNewFile}
          >
            <IconPlus size={13} />
            <span>New File</span>
          </button>
        </div>
      </div>

      <div className="file-list-card">
        {files.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <IconFolder size={28} className="text-muted" style={{ marginBottom: '8px', opacity: 0.4 }} />
            <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              No files on disk yet
            </p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Click <strong>&ldquo;New File&rdquo;</strong> above to create and save your first file.
            </p>
          </div>
        ) : (
          <table className="file-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Name</th>
                <th style={{ width: '18%' }}>Size</th>
                <th style={{ width: '28%' }}>Allocation Layout</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isSelected = selectedFileId === file.id;

                let layoutDisplay: React.ReactNode;
                if (method === 'contiguous') {
                  layoutDisplay = (
                    <span className="font-mono text-xs">
                      Start #{file.startBlock} · {file.length} blocks [
                      {file.allocatedBlocks.join('..')}]
                    </span>
                  );
                } else if (method === 'linked') {
                  layoutDisplay = (
                    <span className="font-mono text-xs">
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
                  layoutDisplay = (
                    <span className="font-mono text-xs">
                      <span style={{ color: '#b45309', fontWeight: 500 }}>Index #{file.indexBlockId}</span>
                      <span> ➔ [{file.allocatedBlocks.join(', ')}]</span>
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
                          className="file-color-dot"
                          style={{ backgroundColor: file.color }}
                        />
                        <strong style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {file.name}
                        </strong>
                        <span className="text-xs text-muted" style={{ marginLeft: '8px' }}>
                          {file.type}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-xs">
                        {file.sizeBytes.toLocaleString()} B
                      </span>
                      <span className="text-xs text-muted" style={{ marginLeft: '4px' }}>
                        ({file.requiredBlocks} blk{method === 'indexed' ? ' + 1 idx' : ''})
                      </span>
                    </td>

                    <td>{layoutDisplay}</td>

                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{ display: 'inline-flex', gap: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-ui subtle"
                          style={{ padding: '2px 6px', fontSize: '11.5px' }}
                          onClick={() => onResizeFile(file)}
                          title="Resize file"
                        >
                          Resize
                        </button>
                        <button
                          className="btn-ui subtle"
                          style={{ padding: '2px 6px', fontSize: '11.5px', color: 'var(--color-danger)' }}
                          onClick={() => onDeleteFile(file)}
                          title="Delete file"
                        >
                          <IconTrash size={13} />
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
