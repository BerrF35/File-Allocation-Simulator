import React from 'react';
import { IconX } from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-about">
      <div className="modal-dialog wide" style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-about">
            Project Overview & Operating System Principles
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {/* Academic Info */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div>
              <strong>Course:</strong> Operating System Principles
            </div>
            <div>
              <strong>Student:</strong> Jaijitesh Suryaprakash (Registration: <strong>25BIT0235</strong>)
            </div>
            <div>
              <strong>Project:</strong> Visual Simulator for File Allocation Techniques in Operating Systems
            </div>
          </div>

          {/* Theoretical Foundations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Allocation Strategies
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Contiguous Allocation
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Files are stored in consecutive blocks on disk. Provides fast O(1) random access and high sequential throughput, but suffers from severe external fragmentation as files are created and deleted.
                </p>
              </div>

              <div style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Linked Allocation
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Each block contains a pointer to the next block in the chain. Solves external fragmentation by scattering blocks anywhere, but limits access to sequential reading and incurs pointer overhead.
                </p>
              </div>

              <div style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Indexed Allocation
                </strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Brings all block pointers together into a single Index Block. Combines direct access with zero external fragmentation, at the expense of an entire index block of metadata overhead.
                </p>
              </div>
            </div>
          </div>

          {/* Model Assumptions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Simulator Assumptions
            </h3>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li><strong>Block Size:</strong> 512 bytes per physical sector.</li>
              <li><strong>Internal Fragmentation:</strong> Calculated in the final allocated block as slack bytes.</li>
              <li><strong>Metadata Overhead:</strong> Indexed allocation allocates 1 dedicated Index Block per file. Linked allocation reserves 4 bytes in each block header for its pointer.</li>
              <li><strong>Transactional Rollback:</strong> Operations are atomic; failed allocations leave zero leaked sectors.</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ui subtle" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
