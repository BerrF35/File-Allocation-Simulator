import React, { useState } from 'react';
import type { FileRecord, SimConfig } from '../types/simulator';
import { runComparativeSimulation } from '../core/simulatorEngine';
import { IconHardDrive, IconX } from './Icons';

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

  // Run isolated simulation for all 3 methods with active files
  const comparisonResults = runComparativeSimulation(files, config);
  const selectedResult = comparisonResults.find((r) => r.method === activeTab)!;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-compare">
      <div className="modal-card wide" style={{ maxWidth: '960px' }}>
        <div className="modal-header">
          <div className="modal-title" id="modal-title-compare">
            <IconHardDrive size={16} className="text-primary" />
            <span>Multi-Method Architectural Comparison (Isolated Simulation States)</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            The current active workload of {files.length} file{files.length === 1 ? '' : 's'} has been simulated simultaneously across three completely isolated simulated disk volumes. Review how the identical file set behaves under Contiguous, Linked, and Indexed allocation.
          </p>

          {/* Comparative Matrix Table */}
          <div className="file-table-container" style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}>
            <table className="file-table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Allocation Metric</th>
                  <th>Contiguous Allocation</th>
                  <th>Linked Allocation</th>
                  <th>Indexed Allocation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Allocation Feasibility</strong></td>
                  <td>
                    {comparisonResults[0].files.length === files.length ? (
                      <span className="text-success font-medium">All {files.length} Files Placed</span>
                    ) : (
                      <span className="text-danger font-medium">
                        {comparisonResults[0].files.length}/{files.length} Placed (Fragmentation)
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-success font-medium">
                      {comparisonResults[1].files.length}/{files.length} Placed
                    </span>
                  </td>
                  <td>
                    <span className="text-success font-medium">
                      {comparisonResults[2].files.length}/{files.length} Placed
                    </span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Total Blocks Consumed</strong></td>
                  <td className="font-mono">{comparisonResults[0].stats.occupiedBlocks} Blocks</td>
                  <td className="font-mono">{comparisonResults[1].stats.occupiedBlocks} Blocks</td>
                  <td className="font-mono">
                    {comparisonResults[2].stats.occupiedBlocks} Blocks{' '}
                    <span style={{ color: '#d97706', fontSize: '10px' }}>(Includes Index Blocks)</span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Volume Space Utilization</strong></td>
                  <td className="font-mono">{comparisonResults[0].stats.utilizationPercent}%</td>
                  <td className="font-mono">{comparisonResults[1].stats.utilizationPercent}%</td>
                  <td className="font-mono">{comparisonResults[2].stats.utilizationPercent}%</td>
                </tr>

                <tr>
                  <td><strong>Sequential Read Throughput</strong></td>
                  <td className="text-success font-medium">Maximum (Zero head seeks)</td>
                  <td className="text-warning font-medium">Moderate (Sequential chain seeks)</td>
                  <td className="text-success font-medium">High (Sequential via index)</td>
                </tr>

                <tr>
                  <td><strong>Direct / Random Access Time</strong></td>
                  <td className="text-success font-medium">O(1) Instant (Start + Offset)</td>
                  <td className="text-danger font-medium">O(N) Slow (Must traverse chain)</td>
                  <td className="text-success font-medium">O(1) Fast (1 Index + 1 Data Read)</td>
                </tr>

                <tr>
                  <td><strong>External Fragmentation Risk</strong></td>
                  <td className="text-danger font-medium">HIGH (Requires contiguous runs)</td>
                  <td className="text-success font-medium">NONE (Scatters anywhere)</td>
                  <td className="text-success font-medium">NONE (Scatters anywhere)</td>
                </tr>

                <tr>
                  <td><strong>Dynamic File Growth Flexibility</strong></td>
                  <td className="text-danger font-medium">Poor (Collides with neighbors)</td>
                  <td className="text-success font-medium">Excellent (Grows anywhere)</td>
                  <td className="text-warning font-medium">Good (Bounded by index table)</td>
                </tr>

                <tr>
                  <td><strong>Metadata / Pointer Overhead</strong></td>
                  <td className="text-success font-medium">Minimal (2 numbers in directory)</td>
                  <td className="text-warning font-medium">4B per block in sector header</td>
                  <td className="text-warning font-medium">1 Dedicated Index Block per file</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Isolated Disk Preview Selector */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                Inspect Isolated Disk Layout for:
              </strong>

              <div className="method-segmented-control">
                <button
                  className={`method-btn ${activeTab === 'contiguous' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contiguous')}
                >
                  Contiguous Layout
                </button>
                <button
                  className={`method-btn ${activeTab === 'linked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('linked')}
                >
                  Linked Layout
                </button>
                <button
                  className={`method-btn ${activeTab === 'indexed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('indexed')}
                >
                  Indexed Layout
                </button>
              </div>
            </div>

            {/* Mini Disk Visualization for Selected Method */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(16, 1fr)',
                gap: '4px',
                background: '#f8fafc',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
              }}
            >
              {selectedResult.disk.map((b) => {
                const isFree = b.state === 'free';
                const isIdx = b.state === 'index';
                return (
                  <div
                    key={b.id}
                    className="font-mono"
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
                        ? '#fef3c7'
                        : `${b.fileColor}25` || '#dbeafe',
                      border: isFree
                        ? '1px dashed var(--border-medium)'
                        : isIdx
                        ? '1.5px solid #d97706'
                        : `1.5px solid ${b.fileColor || '#2563eb'}`,
                      color: isFree
                        ? 'var(--text-faint)'
                        : isIdx
                        ? '#b45309'
                        : b.fileColor || '#1e40af',
                      fontWeight: 600,
                    }}
                    title={
                      isFree
                        ? `Block #${b.id}: Free`
                        : isIdx
                        ? `Block #${b.id}: Index block for ${b.fileName}`
                        : `Block #${b.id}: ${b.fileName} (Offset ${b.blockOffset})`
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
          <button className="btn-ui" onClick={onClose}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
