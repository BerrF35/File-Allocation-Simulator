import React from 'react';
import { IconInfo, IconX } from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-about">
      <div className="modal-card wide" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div className="modal-title" id="modal-title-about">
            <IconInfo size={16} className="text-primary" />
            <span>About this Simulation & Technical Documentation</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '16px' }}>
          {/* Academic Attribution Card */}
          <div
            style={{
              background: 'var(--color-primary-bg)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
              Operating System Principles — Academic Mini-Project
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Project:</strong> Visual Simulator for File Allocation Techniques in Operating Systems
              <br />
              <strong>Student:</strong> Jaijitesh Suryaprakash
              <br />
              <strong>Registration Number:</strong> 25BIT0235
            </div>
          </div>

          {/* Core Allocation Methods Comparison */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              The Three Classical File Allocation Techniques
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div className="stat-box" style={{ background: '#ffffff' }}>
                <strong style={{ color: '#2563eb', display: 'block', marginBottom: '4px' }}>
                  1. Contiguous Allocation
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Files occupy consecutive physical disk blocks. Directory entry stores only the start block and file length.
                  <br /><br />
                  <strong>Pros:</strong> Fast sequential and direct random access (O(1)). Minimal directory metadata.
                  <br />
                  <strong>Cons:</strong> Severe external fragmentation; dynamic file expansion is difficult if adjacent sectors are occupied.
                </p>
              </div>

              <div className="stat-box" style={{ background: '#ffffff' }}>
                <strong style={{ color: '#059669', display: 'block', marginBottom: '4px' }}>
                  2. Linked Allocation
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Files occupy scattered blocks connected via forward link pointers embedded in sector headers.
                  <br /><br />
                  <strong>Pros:</strong> Completely eliminates external fragmentation; dynamic growth is effortless across any free blocks.
                  <br />
                  <strong>Cons:</strong> Sequential traversal only (random access requires O(N) seeks); pointer overhead; single broken pointer corrupts remainder of file.
                </p>
              </div>

              <div className="stat-box" style={{ background: '#ffffff' }}>
                <strong style={{ color: '#d97706', display: 'block', marginBottom: '4px' }}>
                  3. Indexed Allocation
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Each file allocates a dedicated Index Block that houses a pointer array pointing directly to all data blocks.
                  <br /><br />
                  <strong>Pros:</strong> Combines direct O(1) random access with zero external fragmentation.
                  <br />
                  <strong>Cons:</strong> High space overhead for small files (1 whole block dedicated to index); single-level index capacity is limited.
                </p>
              </div>
            </div>
          </div>

          {/* Simulator Assumptions */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Simulator Model Assumptions & Specifications
            </h4>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li><strong>Block Size:</strong> Fixed at 512 Bytes per physical sector by default (configurable).</li>
              <li><strong>Internal Fragmentation:</strong> Calculated in the final allocated data block as <code>(requiredBlocks * blockSize) - fileSize</code>.</li>
              <li><strong>Metadata Representation:</strong> Indexed allocation allocates 1 dedicated Index Block per file. Linked allocation reserves 4 bytes in each block header for its forward pointer.</li>
              <li><strong>Transactional Safety:</strong> If an allocation fails (e.g. disk full, external fragmentation, or index limit exceeded), all operations are rolled back atomically to avoid orphaned sectors.</li>
            </ul>
          </div>

          {/* OS Glossary */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Glossary of Operating System Storage Concepts
            </h4>
            <dl style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <dt><strong>Disk Block:</strong></dt>
              <dd style={{ marginBottom: '6px', paddingLeft: '8px' }}>
                The smallest addressable physical unit of disk storage managed by the file system.
              </dd>

              <dt><strong>Internal Fragmentation:</strong></dt>
              <dd style={{ marginBottom: '6px', paddingLeft: '8px' }}>
                Wasted space inside an allocated block because the file does not completely fill the final sector.
              </dd>

              <dt><strong>External Fragmentation:</strong></dt>
              <dd style={{ marginBottom: '6px', paddingLeft: '8px' }}>
                Wasted space occurring when total free memory/disk space is sufficient, but fractured into small isolated gaps so that a contiguous file cannot fit.
              </dd>

              <dt><strong>Index Block:</strong></dt>
              <dd style={{ marginBottom: '6px', paddingLeft: '8px' }}>
                A specialized disk sector that stores direct pointers to all the physical data sectors of a file.
              </dd>
            </dl>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ui" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
