/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState, useEffect, useRef } from 'react';
import type { DiskBlock, FileRecord, SimConfig } from '../types/simulator';
import { IconX } from './Icons';

interface DiskPlatterArmVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: DiskBlock[];
  files: FileRecord[];
  config: SimConfig;
  selectedFileId: string | null;
  onSelectFile: (fileId: string | null) => void;
  onSelectBlock: (blockId: number | null) => void;
}

// 64 blocks arranged across 4 concentric tracks (cylinders)
// Track 0 (outer): blocks 0..15
// Track 1: blocks 16..31
// Track 2: blocks 32..47
// Track 3 (inner): blocks 48..63
const TRACK_RADII = [170, 135, 100, 65]; // Radii in SVG coords
const SECTORS_PER_TRACK = 16;

export const DiskPlatterArmVisualizer: React.FC<DiskPlatterArmVisualizerProps> = ({
  isOpen,
  onClose,
  blocks,
  files,
  selectedFileId,
  onSelectFile,
  onSelectBlock,
}) => {
  const [activeFileId, setActiveFileId] = useState<string | null>(selectedFileId || (files[0]?.id || null));
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [armTrack, setArmTrack] = useState<number>(0); // 0..3
  const [armAngle, setArmAngle] = useState<number>(-28); // Pivot angle in degrees
  const [seekCount, setSeekCount] = useState(0);
  const [totalSeekTimeMs, setTotalSeekTimeMs] = useState(0);
  const [rotationalLatencyMs, setRotationalLatencyMs] = useState(0);
  const [headThrashWarning, setHeadThrashWarning] = useState(false);
  const [seekLog, setSeekLog] = useState<Array<{ step: number; blockId: number; track: number; seekMs: number; desc: string }>>([]);

  const platterAngleRef = useRef(0);
  const [platterRotation, setPlatterRotation] = useState(0);

  // Platter continuous spin animation
  useEffect(() => {
    let animId: number;
    const spin = () => {
      platterAngleRef.current = (platterAngleRef.current + 0.6) % 360;
      setPlatterRotation(platterAngleRef.current);
      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animId);
  }, []);

  const [prevSelectedId, setPrevSelectedId] = useState(selectedFileId);
  if (selectedFileId !== prevSelectedId) {
    setPrevSelectedId(selectedFileId);
    if (selectedFileId) {
      setActiveFileId(selectedFileId);
    }
  }

  const activeFile = files.find((f) => f.id === activeFileId);

  // Calculate track and sector coordinate for a blockId
  const getBlockCoords = (blockId: number) => {
    const track = Math.floor(blockId / SECTORS_PER_TRACK);
    const sectorIndex = blockId % SECTORS_PER_TRACK;
    const radius = TRACK_RADII[track] || 100;
    const angleRad = (sectorIndex / SECTORS_PER_TRACK) * 2 * Math.PI;
    return { track, sectorIndex, radius, angleRad };
  };

  // Convert track (0..3) to arm pivot angle
  const getArmAngleForTrack = (track: number) => {
    // Track 0 (outer): -34 deg, Track 3 (inner): -16 deg
    return -34 + track * 6;
  };

  // Simulate file read sequence
  const handleStartSimulation = async () => {
    if (!activeFile || isSimulating) return;

    setIsSimulating(true);
    setSeekCount(0);
    setTotalSeekTimeMs(0);
    setRotationalLatencyMs(0);
    setHeadThrashWarning(false);
    setSeekLog([]);

    const sequence: number[] = [];
    if (activeFile.indexBlockId !== undefined) {
      sequence.push(activeFile.indexBlockId);
    }
    sequence.push(...activeFile.allocatedBlocks);

    let prevTrack = 0;
    let accumulatedSeekMs = 0;
    let accumulatedRotMs = 0;
    let seeks = 0;
    let thrashDetected = false;
    const logs: typeof seekLog = [];

    for (let i = 0; i < sequence.length; i++) {
      const blockId = sequence[i];
      const { track } = getBlockCoords(blockId);
      const isIndexBlock = activeFile.indexBlockId === blockId;

      // Track distance
      const trackDistance = Math.abs(track - prevTrack);
      const seekMs = trackDistance === 0 ? 0.8 : 3.5 + trackDistance * 4.2;
      const rotMs = 4.17; // 7200 RPM average 1/2 rotation = 4.17 ms
      accumulatedSeekMs += seekMs;
      accumulatedRotMs += rotMs;

      if (trackDistance > 1) {
        thrashDetected = true;
      }
      if (trackDistance > 0) {
        seeks++;
      }

      setArmTrack(track);
      setArmAngle(getArmAngleForTrack(track));
      setActiveBlockIndex(blockId);
      setSeekCount(seeks);
      setTotalSeekTimeMs(Math.round(accumulatedSeekMs * 10) / 10);
      setRotationalLatencyMs(Math.round(accumulatedRotMs * 10) / 10);
      if (thrashDetected && activeFile.endBlock !== undefined) {
        setHeadThrashWarning(true);
      }

      logs.push({
        step: i + 1,
        blockId,
        track,
        seekMs: Math.round(seekMs * 10) / 10,
        desc: isIndexBlock
          ? `Read Index Block #${blockId} (Track ${track})`
          : `Read Sector #${blockId} (Track ${track})`,
      });
      setSeekLog([...logs]);

      // Delay to let user see mechanical head repositioning
      await new Promise((res) => setTimeout(res, 550));
      prevTrack = track;
    }

    setIsSimulating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-platter">
      <div className="modal-dialog" style={{ maxWidth: '960px', width: '95vw', maxHeight: '92vh' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💽</span>
            <div>
              <h2 className="modal-title" id="modal-title-platter" style={{ fontSize: '15px' }}>
                Mechanical Hard Disk Platter &amp; Read/Write Head Visualizer
              </h2>
              <span className="text-xs text-muted">
                Silberschatz OS Mass-Storage Model · Rotational Latency $T_{'{rot}'}$, Seek Time $T_{'{seek}'}$, and Cylinder Thrashing
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '4px 6px' }} title="Close">
            <IconX size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px', padding: '16px' }}>
          {/* Left Column: Platter & Mechanical Arm SVG */}
          <div
            style={{
              background: '#070b14',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Platter Header Badge */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="live-indicator-dot" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                  Simulated 7200 RPM Spindle Motor
                </span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                Arm on Cylinder {armTrack} · LBA 0..63 · 4 Cylinders
              </span>
            </div>

            {/* SVG Visualizer */}
            <svg
              viewBox="0 0 460 400"
              style={{ width: '100%', height: '320px', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
            >
              <defs>
                {/* Platter Mirror Finish Gradient */}
                <radialGradient id="platterGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="35%" stopColor="#334155" />
                  <stop offset="70%" stopColor="#475569" />
                  <stop offset="90%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                {/* Arm Metal Texture */}
                <linearGradient id="armMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Chassis Base */}
              <rect x="15" y="15" width="430" height="370" rx="16" fill="#0b1120" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

              {/* Platter Disc (Rotates) */}
              <g transform="translate(190, 200)">
                {/* Main Platter Circle */}
                <circle cx="0" cy="0" r="185" fill="url(#platterGrad)" stroke="#64748b" strokeWidth="2" />

                {/* Rotating concentric tracks and sectors */}
                <g transform={`rotate(${platterRotation})`}>
                  {/* Concentric Cylinder Track Lines */}
                  {TRACK_RADII.map((r, trackIdx) => (
                    <circle
                      key={trackIdx}
                      cx="0"
                      cy="0"
                      r={r}
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                  ))}

                  {/* 64 Sector Blocks arranged in tracks */}
                  {blocks.map((block) => {
                    const { radius, angleRad } = getBlockCoords(block.id);
                    const cx = Math.cos(angleRad) * radius;
                    const cy = Math.sin(angleRad) * radius;
                    const isAllocated = block.state !== 'free';
                    const isSelected = activeBlockIndex === block.id;
                    const isPartOfActiveFile = activeFile?.allocatedBlocks.includes(block.id) || activeFile?.indexBlockId === block.id;

                    let fillColor = 'rgba(255,255,255,0.06)';
                    let strokeColor = 'rgba(255,255,255,0.15)';

                    if (isAllocated) {
                      if (block.fileTag?.includes('IDX')) {
                        fillColor = '#f59e0b'; // Amber index block
                        strokeColor = '#fbbf24';
                      } else if (isPartOfActiveFile) {
                        fillColor = '#3b82f6'; // Bright cobalt
                        strokeColor = '#60a5fa';
                      } else {
                        fillColor = '#1e3a5f'; // Other file
                        strokeColor = '#2563eb';
                      }
                    }

                    if (isSelected) {
                      fillColor = '#ef4444'; // Red active read head target
                      strokeColor = '#f87171';
                    }

                    return (
                      <g
                        key={block.id}
                        transform={`translate(${cx}, ${cy})`}
                        onClick={() => onSelectBlock(block.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r={isSelected ? 6.5 : 4.5}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 2 : 1}
                          filter={isSelected ? 'url(#glow)' : undefined}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* Spindle Hub Center Motor */}
                <circle cx="0" cy="0" r="36" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="16" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="6" fill="#0284c7" />
              </g>

              {/* Actuator Voice Coil Motor & Mechanical Arm */}
              {/* Arm Pivot Base at top-right (x: 400, y: 70) */}
              <g transform="translate(400, 70)">
                {/* Voice Coil Magnet Arcs */}
                <path d="M -45,-30 A 60 60 0 0 1 -10,-55" stroke="#475569" strokeWidth="12" fill="none" strokeLinecap="round" />
                <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Pivoting Head Arm */}
                <g
                  style={{
                    transform: `rotate(${armAngle}deg)`,
                    transformOrigin: '0px 0px',
                    transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                >
                  {/* Triangular Arm Body */}
                  <polygon points="0,-8 -190,-3 -220,0 -190,3 0,8" fill="url(#armMetal)" stroke="#475569" strokeWidth="1" />
                  {/* Gimbal Flexure */}
                  <line x1="-220" y1="0" x2="-235" y2="0" stroke="#f1f5f9" strokeWidth="2" />
                  {/* Slider & Read/Write Magnetic Head Tip */}
                  <rect x="-244" y="-3" width="9" height="6" rx="1.5" fill="#f87171" stroke="#ef4444" strokeWidth="1" filter="url(#glow)" />
                  {/* Head Laser/Read Pulse */}
                  {isSimulating && (
                    <circle cx="-240" cy="0" r="7" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8">
                      <animate attributeName="r" values="3;9;3" dur="0.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              </g>

              {/* Cylinder Guide Indicators */}
              <text x="28" y="370" fill="#64748b" fontSize="10.5" fontFamily="var(--font-mono)">
                Cylinder 0 (Outer) ➔ Cylinder 3 (Inner)
              </text>
            </svg>

            {/* Head Thrashing Alert Box */}
            {headThrashWarning && (
              <div
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                <span>
                  <strong>Mechanical Head Thrashing Detected!</strong> Non-contiguous block scatter forces repeated actuator seeks across cylinders.
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Controls, Telemetry & Seek Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Target File Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target File for Physical Read Simulation</span>
                <span className="text-muted">{files.length} Files Mounted</span>
              </label>
              <select
                className="form-input"
                value={activeFileId || ''}
                onChange={(e) => {
                  setActiveFileId(e.target.value);
                  onSelectFile(e.target.value);
                }}
                disabled={isSimulating}
              >
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type.toUpperCase()}, {f.requiredBlocks} blocks, {f.sizeBytes.toLocaleString()} B)
                  </option>
                ))}
              </select>
            </div>

            {/* Mechanical Telemetry Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Actuator Seeks</span>
                <strong style={{ fontSize: '18px', color: seekCount > 2 ? '#f87171' : 'var(--text-primary)' }}>
                  {seekCount}
                </strong>
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: '2px' }}>
                  {seekCount === 1 ? 'Optimal (Contiguous)' : 'Multiple Seeks'}
                </span>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Est. Seek Time ($T_s$)</span>
                <strong style={{ fontSize: '18px', color: totalSeekTimeMs > 15 ? '#f87171' : '#38bdf8' }}>
                  {totalSeekTimeMs} ms
                </strong>
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: '2px' }}>
                  Head traversal
                </span>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Total I/O Access</span>
                <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
                  {(totalSeekTimeMs + rotationalLatencyMs).toFixed(1)} ms
                </strong>
                <span className="text-xs text-muted" style={{ display: 'block', marginTop: '2px' }}>
                  $T_s + T_{'{rot}'} + T_{'{xfer}'}$
                </span>
              </div>
            </div>

            {/* Run Simulation Action Button */}
            <button
              type="button"
              className="btn-ui primary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={handleStartSimulation}
              disabled={!activeFile || isSimulating}
            >
              <span>{isSimulating ? '⏳' : '▶️'}</span>
              <span>
                {isSimulating
                  ? `Simulating Read Head Movement... (Sector #${activeBlockIndex})`
                  : `Simulate Physical Seek for "${activeFile?.name || 'File'}"`}
              </span>
            </button>

            {/* Real-time Cylinder Hop / Seek Trace Log */}
            <div style={{ flex: 1, minHeight: '140px', display: 'flex', flexDirection: 'column' }}>
              <span className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: '6px' }}>
                LBA Physical Seek Hop Trace (Kernel ➔ Disk Controller)
              </span>
              <div
                style={{
                  flex: 1,
                  maxHeight: '160px',
                  overflowY: 'auto',
                  background: '#040711',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: 1.6,
                }}
              >
                {seekLog.length === 0 ? (
                  <span style={{ color: '#475569' }}>
                    Click &ldquo;Simulate Physical Seek&rdquo; to observe actuator arm repositioning across cylinders and seek latency calculations...
                  </span>
                ) : (
                  seekLog.map((log) => (
                    <div key={log.step} style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>
                        <strong style={{ color: '#38bdf8' }}>Step {log.step}:</strong> {log.desc}
                      </span>
                      <span style={{ color: log.seekMs > 5 ? '#f87171' : '#10b981' }}>
                        +{log.seekMs} ms
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Academic Theoretical Context */}
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '6px',
                fontSize: '11.5px',
                color: '#94a3b8',
                lineHeight: 1.45,
              }}
            >
              <strong>Professor Evaluation Note:</strong> File allocation methods exist to minimize physical seek time ($T_s$) and rotational delay ($T_{'{rot}'}$). Contiguous allocation requires exactly 1 head seek for sequential reads. Linked allocation scatters across random cylinders, incurring high rotational latency on mechanical drives.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
