import React, { useState } from 'react';
import type { FileRecord, SimConfig } from '../types/simulator';
import { runComparativeSimulation } from '../core/simulatorEngine';
import { IconX } from './Icons';

interface ComparisonViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileRecord[];
  config: SimConfig;
}

export const ComparisonViewModal: React.FC<ComparisonViewModalProps> = ({
  isOpen,
  onClose,
  files,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'contiguous' | 'linked' | 'indexed'>('contiguous');

  if (!isOpen) return null;

  const comparisonResults = runComparativeSimulation(files, config);
  const selectedResult = comparisonResults.find((r) => r.method === activeTab)!;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-compare">
      <div className="modal-dialog wide" style={{ maxWidth: '860px' }}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-compare">
            Workload Comparison (Contiguous vs Linked vs Indexed)
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-muted">
            The active set of {files.length} file{files.length === 1 ? '' : 's'} is simulated simultaneously across three isolated disk volumes. Observe how identical files produce different block placements and trade-offs.
          </p>

          {/* Comparative Table */}
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="file-table" style={{ fontSize: '12.5px', minWidth: '480px' }}>
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Metric</th>
                  <th style={{ width: '24%' }}>Contiguous</th>
                  <th style={{ width: '24%' }}>Linked</th>
                  <th style={{ width: '24%' }}>Indexed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Feasibility</strong></td>
                  <td>
                    {comparisonResults[0].files.length === files.length ? (
                      <span className="text-success font-medium">All {files.length} files allocated</span>
                    ) : (
                      <span className="text-danger font-medium">
                        {comparisonResults[0].files.length}/{files.length} (Fragmentation)
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-success font-medium">
                      {comparisonResults[1].files.length}/{files.length} files allocated
                    </span>
                  </td>
                  <td>
                    <span className="text-success font-medium">
                      {comparisonResults[2].files.length}/{files.length} files allocated
                    </span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Blocks Consumed</strong></td>
                  <td className="font-mono">{comparisonResults[0].stats.occupiedBlocks} blocks</td>
                  <td className="font-mono">{comparisonResults[1].stats.occupiedBlocks} blocks</td>
                  <td className="font-mono">
                    {comparisonResults[2].stats.occupiedBlocks} blocks{' '}
                    <span className="text-muted" style={{ fontSize: '11px' }}>(+index blocks)</span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Sequential Read</strong></td>
                  <td>Maximum (zero seek hops)</td>
                  <td>Moderate (sequential seeks)</td>
                  <td>Fast (sequential via index)</td>
                </tr>

                <tr>
                  <td><strong>Random Access</strong></td>
                  <td>O(1) Instant (Start + Offset)</td>
                  <td>O(k) Slow (traverse chain)</td>
                  <td>O(1) Fast (1 index + 1 data read)</td>
                </tr>

                <tr>
                  <td><strong>External Fragmentation</strong></td>
                  <td><span className="text-danger">High vulnerability</span></td>
                  <td><span className="text-success">None (scatters anywhere)</span></td>
                  <td><span className="text-success">None (scatters anywhere)</span></td>
                </tr>

                <tr>
                  <td><strong>Dynamic Growth</strong></td>
                  <td>Collides with neighbors</td>
                  <td>Effortless append</td>
                  <td>Good (bounded by index table)</td>
                </tr>

                <tr>
                  <td><strong>Metadata Overhead</strong></td>
                  <td>2 numbers in directory</td>
                  <td>4B pointer per block header</td>
                  <td>1 full index block per file</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mini Layout Inspector */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-sm font-medium">
                Simulated disk layout:
              </span>

              <div className="method-segmented-control">
                <button
                  className={`method-btn ${activeTab === 'contiguous' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contiguous')}
                >
                  Contiguous
                </button>
                <button
                  className={`method-btn ${activeTab === 'linked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('linked')}
                >
                  Linked
                </button>
                <button
                  className={`method-btn ${activeTab === 'indexed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('indexed')}
                >
                  Indexed
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(16, 1fr)',
                gap: '3px',
                background: 'var(--bg-subtle)',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
              }}
            >
              {selectedResult.disk.map((b) => {
                const isFree = b.state === 'free';
                const isIdx = b.state === 'index';
                return (
                  <div
                    key={b.id}
                    className="font-mono text-xs"
                    style={{
                      aspectRatio: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      borderRadius: '2px',
                      background: isFree
                        ? '#ffffff'
                        : isIdx
                        ? '#fffbeb'
                        : b.fileColor ? `${b.fileColor}20` : '#e0e7ff',
                      border: isFree
                        ? '1px solid #e7e7e4'
                        : isIdx
                        ? '1px solid #f59e0b'
                        : `1px solid ${b.fileColor || '#1d4ed8'}`,
                      color: isFree
                        ? 'var(--text-faint)'
                        : isIdx
                        ? '#b45309'
                        : b.fileColor || '#1d4ed8',
                      fontWeight: 600,
                    }}
                    title={
                      isFree
                        ? `Block #${b.id}: Free`
                        : isIdx
                        ? `Block #${b.id}: Index block for ${b.fileName}`
                        : `Block #${b.id}: ${b.fileName}`
                    }
                  >
                    {isFree ? b.id : isIdx ? 'IDX' : b.fileTag}
                  </div>
                );
              })}
            </div>
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
