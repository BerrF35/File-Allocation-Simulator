import React from 'react';
import type { AllocationMethod, DiskStats, SimConfig } from '../types/simulator';

interface DiskSummaryCardProps {
  stats: DiskStats;
  method: AllocationMethod;
  config: SimConfig;
  onUpdateCapacity: (newCap: number) => void;
}

export const DiskSummaryCard: React.FC<DiskSummaryCardProps> = ({
  stats,
  method,
  config,
  onUpdateCapacity,
}) => {
  const isContiguous = method === 'contiguous';
  const extFrag = stats.externalFragmentationMetric;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Unobtrusive One-Line Volume Summary */}
      <div className="disk-summary-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>
            Storage: <strong>{stats.occupiedBlocks}</strong> of <strong>{stats.totalBlocks}</strong> blocks (
            {stats.utilizationPercent}%)
            <span className="disk-meter" title={`${stats.utilizationPercent}% utilized`}>
              <span className="disk-meter-fill" style={{ width: `${stats.utilizationPercent}%` }} />
            </span>
          </span>
          <span style={{ color: 'var(--border-dark)' }}>·</span>
          <span>
            Free: <strong>{stats.freeBlocks} blocks</strong> ({((stats.freeBlocks * config.blockSize) / 1024).toFixed(1)} KB)
          </span>
          <span style={{ color: 'var(--border-dark)' }}>·</span>
          <span>
            Slack: <strong>{stats.internalFragmentationBytes} B</strong> internal fragmentation
          </span>
        </div>

        {/* Discreet Capacity Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Capacity:</span>
          <select
            className="form-select"
            style={{ padding: '2px 6px', fontSize: '11.5px', height: '24px' }}
            value={config.totalBlocks}
            onChange={(e) => onUpdateCapacity(Number(e.target.value))}
          >
            <option value={32}>32 Blocks (16 KB)</option>
            <option value={48}>48 Blocks (24 KB)</option>
            <option value={64}>64 Blocks (32 KB)</option>
            <option value={96}>96 Blocks (48 KB)</option>
            <option value={128}>128 Blocks (64 KB)</option>
          </select>
        </div>
      </div>

      {/* External Fragmentation Inline Alert (Only shown when actually present) */}
      {isContiguous && extFrag.hasFragmentation && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            fontSize: '12px',
            color: '#78350f',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <strong style={{ color: '#92400e', whiteSpace: 'nowrap' }}>External Fragmentation:</strong>
          <span>
            {extFrag.freeBlocksAvailable} free blocks exist, but the longest consecutive gap is only {extFrag.maxContiguousRun} blocks. Files larger than {extFrag.maxContiguousRun} blocks will fail to allocate.
          </span>
        </div>
      )}
    </div>
  );
};
