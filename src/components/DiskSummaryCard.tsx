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
    <div className="os-window" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Simulated Disk Volume Telemetry
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Physical Sector Size: {config.blockSize} Bytes/Block • File System: {method.toUpperCase()}FS
          </span>
        </div>

        {/* Capacity Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Disk Capacity:</span>
          <select
            className="form-select"
            style={{ padding: '3px 6px', fontSize: '11px', height: '26px' }}
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

      {/* Utilization Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Volume Utilization</span>
          <span className="font-mono" style={{ fontWeight: 600 }}>
            {stats.occupiedBlocks} / {stats.totalBlocks} Blocks ({stats.utilizationPercent}%)
          </span>
        </div>
        <div
          style={{
            height: '8px',
            background: 'var(--bg-hover)',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: `${stats.utilizationPercent}%`,
              background:
                stats.utilizationPercent > 85
                  ? 'var(--color-danger)'
                  : stats.utilizationPercent > 60
                  ? 'var(--color-warning)'
                  : 'var(--color-primary)',
              transition: 'width 300ms ease',
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="disk-stats-grid">
        <div className="stat-box">
          <div className="stat-label">Total Volume Capacity</div>
          <div className="stat-value">{(stats.totalCapacityBytes / 1024).toFixed(1)} KB</div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{stats.totalBlocks} physical sectors</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Free Unallocated Space</div>
          <div className="stat-value text-success">
            {((stats.freeBlocks * config.blockSize) / 1024).toFixed(1)} KB
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{stats.freeBlocks} free blocks</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Active Files Stored</div>
          <div className="stat-value text-primary">{stats.fileCount}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{stats.totalDataBytes.toLocaleString()} payload bytes</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Internal Fragmentation</div>
          <div className="stat-value text-warning">
            {stats.internalFragmentationBytes.toLocaleString()} B
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Unused slack in last blocks</div>
        </div>
      </div>

      {/* External Fragmentation Educational Banner (If Contiguous) */}
      {isContiguous && extFrag.hasFragmentation && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '11px',
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>
              External Fragmentation Detected!
            </strong>
            <span style={{ color: '#78350f' }}>
              Disk has <strong>{extFrag.freeBlocksAvailable} total free blocks</strong>, but the largest contiguous run is only <strong>{extFrag.maxContiguousRun} blocks</strong>. Any new file needing more than {extFrag.maxContiguousRun} blocks will fail, even though total free space is sufficient.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
