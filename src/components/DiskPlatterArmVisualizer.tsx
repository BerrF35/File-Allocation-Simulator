/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DiskBlock, FileRecord, SimConfig } from '../types/simulator';
import { IconX } from './Icons';
import * as k from '../core/iso-kit';

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

// --------------------------------------------------------------------------
// 3.5-inch Winchester Hard Disk Physical Model (World Space in mm)
// Azimuth: 45°, Elevation: 30°
// --------------------------------------------------------------------------
const CHASSIS: k.Plan = { x: -130, y: -90, w: 250, d: 170, r: 8 };
const CHASSIS_H = 14;
const FOOT_H = 5;

const SPINDLE: k.Plane = [20, -5];
const PLATTER_R = 68;
const PLATTER_1_Z = 5;
const PLATTER_THICK = 2;
const SPACER_Z = PLATTER_1_Z + PLATTER_THICK; // 7
const SPACER_H = 4;
const PLATTER_2_Z = SPACER_Z + SPACER_H; // 11
const CLAMP_Z = PLATTER_2_Z + PLATTER_THICK; // 13
const CLAMP_H = 4.5;
const CAP_Z = CLAMP_Z + CLAMP_H; // 17.5

const PIVOT: k.Plane = [-72, 22];
const PIVOT_R = 8.5;
const PIVOT_H = 22;
const VCM_MAGNET: k.Plan = { x: -122, y: 12, w: 34, d: 36, r: 4 };

// Concentric cylinder track radii in mm (Cylinder 0 outer -> Cylinder 3 inner)
const CYLINDER_RADII = [60, 48, 36, 24];
// Derived kinematic arm angles (degrees) so pico-slider aligns with cylinders
const ARM_ANGLES = [20.5, 12.2, 3.8, -4.5];
const SECTORS_PER_TRACK = 16;

const WIDTH = 580;
const HEIGHT = 420;

// Reusable 3D Solid component
const SolidShape: React.FC<{
  paths: k.SolidPaths;
  tone?: k.Tone;
  crease?: k.Tone | 'none';
  halo?: boolean;
  lit?: boolean;
  className?: string;
}> = ({ paths, tone = 'mid', crease = 'faint', halo = false, lit = false, className }) => (
  <g className={`iso-solid ${className || ''}`} data-lit={lit ? '' : undefined}>
    {halo && <path className="iso-halo" d={paths.fill} />}
    <path className="iso-fill" d={paths.fill} />
    {paths.shades.map((d, shade) => (d ? <path key={shade} className="iso-shade" data-shade={shade} d={d} /> : null))}
    <path className="iso-top" d={paths.top} />
    {crease !== 'none' && paths.crease ? <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} /> : null}
    {crease !== 'none' && paths.bevel ? <path className="iso-line iso-bevel" data-tone={crease} d={paths.bevel} /> : null}
    <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
  </g>
);

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
  const [explodedView, setExplodedView] = useState(false);
  const [seekCount, setSeekCount] = useState(0);
  const [totalSeekTimeMs, setTotalSeekTimeMs] = useState(0);
  const [rotationalLatencyMs, setRotationalLatencyMs] = useState(0);
  const [headThrashWarning, setHeadThrashWarning] = useState(false);
  const [seekLog, setSeekLog] = useState<Array<{ step: number; blockId: number; track: number; seekMs: number; desc: string }>>([]);

  const platterAngleRef = useRef(0);
  const [platterRotation, setPlatterRotation] = useState(0);

  // Platter continuous spin animation (simulates 7200 RPM rotation)
  useEffect(() => {
    let animId: number;
    const spin = () => {
      platterAngleRef.current = (platterAngleRef.current + 0.8) % 360;
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

  // Setup true isometric projection camera
  const P: k.Projection = useMemo(() => {
    return k.fitProjection(
      [
        ...k.boxCorners(CHASSIS, -CHASSIS_H - FOOT_H, 0),
        [PIVOT[0], PIVOT[1], PIVOT_H + 8],
        [SPINDLE[0], SPINDLE[1], CAP_Z + 25],
        [VCM_MAGNET.x, VCM_MAGNET.y, 28],
      ],
      WIDTH,
      HEIGHT,
      { pad: 26, azimuth: 45, elevation: 30 }
    );
  }, []);

  // Precomputed static isometric solids
  const staticGeometry = useMemo(() => {
    const feetPoints = k.corners(CHASSIS, 18);
    const feetSolids = feetPoints.flatMap(([fx, fy]) => [
      k.cylinder(fx, fy, 8, -CHASSIS_H - FOOT_H, 2, P, 24),
      k.cylinder(fx, fy, 6, -CHASSIS_H - FOOT_H + 2, FOOT_H - 2, P, 24),
    ]);

    const chassisSlab = k.slabOf(CHASSIS, -CHASSIS_H, CHASSIS_H, P, 8, 1.8);
    const gasketChannel = k.planOutline(k.insetPlan(CHASSIS, 5), 0, P);
    const cornerScrews = k.corners(CHASSIS, 10);
    const screwRings = cornerScrews.map(([sx, sy]) => k.ring(sx, sy, 2.4, 0, P, 16)).join('');

    const specPlate = k.slabOf({ x: -120, y: -78, w: 60, d: 20, r: 2 }, 0, 0.8, P, 3);
    const rulerTicks = k.topTicks(-120, -62, 4, 5, -76, 0.8, [1.5, 3], P);

    // Preamp chip & FPC bracket
    const preampChip = k.slabOf({ x: -74, y: -24, w: 14, d: 10, r: 1 }, 1, 2.5, P, 4);

    // Bottom VCM magnet stator plate
    const bottomVcmMagnet = k.slabOf(VCM_MAGNET, 2, 4.5, P, 6, 0.8);

    // Lower Platter (Stationary in exploded view)
    const lowerPlatter = k.cylinder(SPINDLE[0], SPINDLE[1], PLATTER_R, PLATTER_1_Z, PLATTER_THICK, P, 48);
    const spacerRing = k.cylinder(SPINDLE[0], SPINDLE[1], 28, SPACER_Z, SPACER_H, P, 32);

    // Actuator Pivot Bearing Tower
    const pivotTower = k.cylinder(PIVOT[0], PIVOT[1], PIVOT_R, 1, PIVOT_H, P, 32);
    const pivotLockNut = k.cylinder(PIVOT[0], PIVOT[1], PIVOT_R + 1.5, PIVOT_H - 2, 2.5, P, 32);
    const pivotKnurl = k.knurl(PIVOT[0], PIVOT[1], PIVOT_R + 1.5, PIVOT_H - 2, PIVOT_H + 0.5, 32, P);

    return {
      feetSolids,
      chassisSlab,
      gasketChannel,
      cornerScrews,
      screwRings,
      specPlate,
      rulerTicks,
      preampChip,
      bottomVcmMagnet,
      lowerPlatter,
      spacerRing,
      pivotTower,
      pivotLockNut,
      pivotKnurl,
    };
  }, [P]);

  // Exploded view vertical offset
  const expZ = explodedView ? 24 : 0;

  // Upper Platter & Spindle Clamp Assembly (dynamic with expZ)
  const upperPlatterAssembly = useMemo(() => {
    const topPlatterZ = PLATTER_2_Z + expZ * 0.9;
    const topPlatter = k.cylinder(SPINDLE[0], SPINDLE[1], PLATTER_R, topPlatterZ, PLATTER_THICK, P, 48);

    const clampZ = CLAMP_Z + expZ * 1.3;
    const clampRing = k.cylinder(SPINDLE[0], SPINDLE[1], 20, clampZ, CLAMP_H, P, 36);
    const clampKnurl = k.knurl(SPINDLE[0], SPINDLE[1], 20, clampZ, clampZ + CLAMP_H, 36, P);

    const capZ = CAP_Z + expZ * 1.5;
    const centralCap = k.cylinder(SPINDLE[0], SPINDLE[1], 10, capZ, 2.5, P, 28);
    const balanceScrewRings = [0, 120, 240].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const bx = SPINDLE[0] + 5.5 * Math.cos(rad);
      const by = SPINDLE[1] + 5.5 * Math.sin(rad);
      return k.ring(bx, by, 1.2, capZ + 2.5, P, 12);
    }).join('');

    // Concentric Cylinder Track etch rings on top platter surface
    const trackRings = CYLINDER_RADII.map((radius) =>
      k.ring(SPINDLE[0], SPINDLE[1], radius, topPlatterZ + PLATTER_THICK + 0.1, P, 48)
    );

    // Top VCM Stator Magnet
    const topVcmZ = 16 + expZ * 1.6;
    const topVcmMagnet = k.slabOf(VCM_MAGNET, topVcmZ, 4.5, P, 6, 0.8);

    return {
      topPlatterZ,
      topPlatter,
      clampRing,
      clampKnurl,
      centralCap,
      balanceScrewRings,
      trackRings,
      topVcmMagnet,
    };
  }, [P, expZ]);

  // Dynamic Actuator Arm & Head Slider Geometry
  const actuatorGeometry = useMemo(() => {
    const armAngleDeg = ARM_ANGLES[armTrack] ?? 12.2;
    const armAngleRad = (armAngleDeg * Math.PI) / 180;
    const armZ = 13 + expZ * 0.5;

    // Head slider position at tip of arm
    const ARM_LENGTH = 92;
    const hx = PIVOT[0] + ARM_LENGTH * Math.cos(armAngleRad);
    const hy = PIVOT[1] + ARM_LENGTH * Math.sin(armAngleRad);

    // Rear Voice Coil position
    const COIL_LENGTH = 32;
    const cx = PIVOT[0] - COIL_LENGTH * Math.cos(armAngleRad);
    const cy = PIVOT[1] - COIL_LENGTH * Math.sin(armAngleRad);

    // Magnesium Arm triangular body in world space
    const armWing1 = [
      PIVOT[0] + 8 * Math.cos(armAngleRad + Math.PI / 2),
      PIVOT[1] + 8 * Math.sin(armAngleRad + Math.PI / 2),
    ];
    const armWing2 = [
      PIVOT[0] + 8 * Math.cos(armAngleRad - Math.PI / 2),
      PIVOT[1] + 8 * Math.sin(armAngleRad - Math.PI / 2),
    ];
    const headTip = [hx, hy];

    const armOutline = k.pathOf([
      k.iso([armWing1[0], armWing1[1], armZ], P),
      k.iso([headTip[0], headTip[1], armZ], P),
      k.iso([armWing2[0], armWing2[1], armZ], P),
      k.iso([PIVOT[0], PIVOT[1], armZ], P),
    ], true);

    // Voice Coil loop hovering in VCM gap
    const coilCenter: k.Plane = [cx, cy];
    const coilWinding = k.ring(coilCenter[0], coilCenter[1], 10, armZ - 1, P, 24);

    // Head slider (pico-slider) at arm tip
    const sliderBox = k.boxCorners({ x: hx - 2.5, y: hy - 2, w: 5, d: 4, r: 0.5 }, armZ - 1.2, armZ + 0.8);
    const sliderIso = sliderBox.map((pt) => k.iso(pt, P));

    // Flexible Ribbon Cable (FPC) curved arc
    const fpcFrom = k.iso([PIVOT[0] - 4, PIVOT[1] - 4, armZ - 2], P);
    const fpcTo = k.iso([-70, -18, 2], P);
    const fpcVia = [
      k.iso([PIVOT[0] - 14, PIVOT[1] - 18, armZ - 4], P),
      k.iso([-82, -10, 4], P),
    ];

    return {
      armZ,
      hx,
      hy,
      headTip,
      armOutline,
      coilWinding,
      sliderIso,
      fpcFrom,
      fpcTo,
      fpcVia,
    };
  }, [P, armTrack, expZ]);

  // Project 64 Sectors onto rotating top platter surface
  const sectorMarkers = useMemo(() => {
    const platterRad = (platterRotation * Math.PI) / 180;
    const platterSurfaceZ = upperPlatterAssembly.topPlatterZ + PLATTER_THICK + 0.15;

    return blocks.map((block) => {
      const track = Math.floor(block.id / SECTORS_PER_TRACK);
      const sectorInTrack = block.id % SECTORS_PER_TRACK;
      const radius = CYLINDER_RADII[track] ?? 40;
      const angle = platterRad + (sectorInTrack / SECTORS_PER_TRACK) * 2 * Math.PI;

      const wx = SPINDLE[0] + radius * Math.cos(angle);
      const wy = SPINDLE[1] + radius * Math.sin(angle);
      const [screenX, screenY] = k.iso([wx, wy, platterSurfaceZ], P);

      const isAllocated = block.state !== 'free';
      const isSelected = activeBlockIndex === block.id;
      const isPartOfActiveFile =
        activeFile?.allocatedBlocks.includes(block.id) || activeFile?.indexBlockId === block.id;

      let color = 'rgba(255,255,255,0.18)';
      let size = 2.4;

      if (isAllocated) {
        if (block.fileTag?.includes('IDX')) {
          color = '#f59e0b'; // Amber index
          size = 3.6;
        } else if (isPartOfActiveFile) {
          color = '#38bdf8'; // Vivid cobalt data
          size = 3.6;
        } else {
          color = '#2563eb';
          size = 2.8;
        }
      }

      if (isSelected) {
        color = '#ef4444'; // Red active read head target
        size = 4.8;
      }

      return {
        id: block.id,
        screenX,
        screenY,
        color,
        size,
        isSelected,
        track,
      };
    });
  }, [blocks, platterRotation, upperPlatterAssembly.topPlatterZ, activeBlockIndex, activeFile, P]);

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
      const track = Math.floor(blockId / SECTORS_PER_TRACK);
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

      // Delay to let user observe actuator arm physical movement
      await new Promise((res) => setTimeout(res, 520));
      prevTrack = track;
    }

    setIsSimulating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-platter">
      <div className="modal-dialog" style={{ maxWidth: '1020px', width: '96vw', maxHeight: '92vh' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💽</span>
            <div>
              <h2 className="modal-title" id="modal-title-platter" style={{ fontSize: '15px' }}>
                Mechanical Hard Disk 3D Anatomy &amp; Actuator Seek Visualizer
              </h2>
              <span className="text-xs text-muted">
                Precision Winchester Model · 7200 RPM Spindle · Voice Coil Motor (VCM) · Seek Latency $T_s$ &amp; Rotational Delay $T_{'{rot}'}$
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '4px 6px' }} title="Close">
            <IconX size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body platter-modal-grid">
          {/* Left Column: 3D Isometric Winchester HDD Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* View Mode & Cylinder Track Quick Switch Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="text-xs" style={{ color: '#94a3b8', fontWeight: 600 }}>Cylinders:</span>
                {[0, 1, 2, 3].map((cyl) => (
                  <button
                    key={cyl}
                    type="button"
                    onClick={() => {
                      setArmTrack(cyl);
                      setActiveBlockIndex(null);
                    }}
                    disabled={isSimulating}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '4px',
                      border: armTrack === cyl ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      background: armTrack === cyl ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: armTrack === cyl ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    Cyl {cyl}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setExplodedView(!explodedView)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: explodedView ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.12)',
                  background: explodedView ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: explodedView ? '#fbbf24' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{explodedView ? '🔍 Assembled View' : '📐 Exploded 3D Anatomy'}</span>
              </button>
            </div>

            {/* Engineering Plate Card (Anatomy Design System) */}
            <div className="iso iso-plate" style={{ padding: '34px 16px 20px 16px', background: '#070c14', borderRadius: '8px' }}>
              <div className="iso-plate-corners">
                <span className="iso-plate-corner" data-corner="fig">FIG 1 · WINCHESTER HDD</span>
                <span className="iso-plate-corner" data-corner="title">7200 RPM DUAL-PLATTER ASSEMBLY</span>
                <span className="iso-plate-corner" data-corner="hint">CLICK ANY SECTOR TO INSPECT</span>
                <span className="iso-plate-corner" data-corner="readout">
                  CYLINDER {armTrack} · {totalSeekTimeMs}ms SEEK · {rotationalLatencyMs}ms ROT
                </span>
              </div>

              {/* 3D Isometric SVG Scene */}
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="iso-svg"
                style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.6))', maxHeight: '380px' }}
                aria-label="3D Isometric Winchester Hard Disk Drive Hardware Anatomy"
              >
                {/* 1. Base / Feet halo & Rubber dampers */}
                <path className="iso-halo" d={staticGeometry.chassisSlab.fill} />
                {staticGeometry.feetSolids.map((foot, idx) => (
                  <SolidShape key={idx} paths={foot} tone="lo" />
                ))}

                {/* 2. Heavy Cast Aluminum Chassis Base */}
                <SolidShape paths={staticGeometry.chassisSlab} tone="mid" crease="faint" />
                <path className="iso-line" data-tone="lo" d={staticGeometry.gasketChannel} />
                <path className="iso-line" data-tone="lo" d={staticGeometry.screwRings} />
                <g className="iso-dots" data-tone="mid">
                  {staticGeometry.cornerScrews.map(([sx, sy], idx) => {
                    const [px, py] = k.iso([sx, sy, 0], P);
                    return <circle key={idx} cx={px} cy={py} r={0.7} />;
                  })}
                </g>

                {/* 3. Engraved Nameplate & Rail Ruler */}
                <SolidShape paths={staticGeometry.specPlate} tone="lo" crease="none" />
                <path className="iso-line" data-tone="lo" d={staticGeometry.rulerTicks.minor} />
                <path className="iso-line" data-tone="mid" d={staticGeometry.rulerTicks.major} />
                <text
                  className="iso-face-text"
                  data-tone="hi"
                  transform={k.topMatrix([-118, -75], 0.8, P)}
                  fontSize={2.8}
                >
                  SimFS W3500 · 7200 RPM · 64 SECTORS
                </text>

                {/* 4. Preamp IC & FPC ribbon bracket */}
                <SolidShape paths={staticGeometry.preampChip} tone="hi" />
                <path className="iso-wire" data-tone="mid" d={k.pathOf([actuatorGeometry.fpcFrom, ...actuatorGeometry.fpcVia, actuatorGeometry.fpcTo])} fill="none" strokeWidth={1.2} />

                {/* 5. Bottom VCM Magnet */}
                <SolidShape paths={staticGeometry.bottomVcmMagnet} tone="mid" />

                {/* 6. Lower Platter & Spacer */}
                <SolidShape paths={staticGeometry.lowerPlatter} tone="lo" />
                <SolidShape paths={staticGeometry.spacerRing} tone="mid" />

                {/* 7. Exploded Vertical Axis Guide Lines */}
                {explodedView && (
                  <g className="iso-line" data-tone="amber" data-dashed="" opacity={0.6}>
                    <path d={k.pathOf([k.iso([SPINDLE[0], SPINDLE[1], 5], P), k.iso([SPINDLE[0], SPINDLE[1], CAP_Z + expZ * 1.5 + 8], P)])} />
                    <path d={k.pathOf([k.iso([PIVOT[0], PIVOT[1], 2], P), k.iso([PIVOT[0], PIVOT[1], PIVOT_H + 6], P)])} />
                    <path d={k.pathOf([k.iso([VCM_MAGNET.x + 17, VCM_MAGNET.y + 18, 2], P), k.iso([VCM_MAGNET.x + 17, VCM_MAGNET.y + 18, 16 + expZ * 1.6 + 6], P)])} />
                  </g>
                )}

                {/* 8. Upper Platter (Active Data Surface) */}
                <SolidShape paths={upperPlatterAssembly.topPlatter} tone="hi" lit={true} />

                {/* 9. Concentric Cylinder Tracks */}
                {upperPlatterAssembly.trackRings.map((ringD, idx) => (
                  <path
                    key={idx}
                    className="iso-line"
                    data-tone={armTrack === idx ? 'lit' : 'lo'}
                    strokeDasharray={armTrack === idx ? undefined : '3 3'}
                    d={ringD}
                  />
                ))}

                {/* 10. 64 Interactive Sectors on Rotating Platter */}
                {sectorMarkers.map((sec) => (
                  <g
                    key={sec.id}
                    onClick={() => onSelectBlock(sec.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={sec.screenX}
                      cy={sec.screenY}
                      r={sec.size}
                      fill={sec.color}
                      stroke={sec.isSelected ? '#ffffff' : 'rgba(0,0,0,0.5)'}
                      strokeWidth={sec.isSelected ? 1.5 : 0.6}
                    />
                    {sec.isSelected && (
                      <circle
                        cx={sec.screenX}
                        cy={sec.screenY}
                        r={sec.size + 3}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={1}
                        opacity={0.8}
                      >
                        <animate attributeName="r" values={`${sec.size + 1};${sec.size + 5};${sec.size + 1}`} dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                ))}

                {/* 11. Spindle Clamp Ring & Knurl */}
                <SolidShape paths={upperPlatterAssembly.clampRing} tone="mid" />
                <path className="iso-line" data-tone="lo" d={upperPlatterAssembly.clampKnurl} />
                <SolidShape paths={upperPlatterAssembly.centralCap} tone="hi" />
                <path className="iso-line" data-tone="mid" d={upperPlatterAssembly.balanceScrewRings} />

                {/* 12. Actuator Pivot Tower & Knurled Nut */}
                <SolidShape paths={staticGeometry.pivotTower} tone="mid" />
                <SolidShape paths={staticGeometry.pivotLockNut} tone="hi" />
                <path className="iso-line" data-tone="lo" d={staticGeometry.pivotKnurl} />

                {/* 13. Voice Coil Windings Loop */}
                <path className="iso-line" data-tone="amber" strokeWidth={1.4} d={actuatorGeometry.coilWinding} />

                {/* 14. Actuator Magnesium Swing Arm */}
                <g style={{ transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)' }}>
                  <path
                    d={actuatorGeometry.armOutline}
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth={0.8}
                    style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
                  />
                  {/* Pico-slider read head block */}
                  <polygon
                    points={`${actuatorGeometry.sliderIso[0]?.[0]},${actuatorGeometry.sliderIso[0]?.[1]} ${actuatorGeometry.sliderIso[1]?.[0]},${actuatorGeometry.sliderIso[1]?.[1]} ${actuatorGeometry.sliderIso[5]?.[0]},${actuatorGeometry.sliderIso[5]?.[1]} ${actuatorGeometry.sliderIso[4]?.[0]},${actuatorGeometry.sliderIso[4]?.[1]}`}
                    fill="#f8fafc"
                    stroke="#38bdf8"
                    strokeWidth={0.8}
                  />
                </g>

                {/* 15. Top VCM Magnet Stator Plate */}
                <SolidShape paths={upperPlatterAssembly.topVcmMagnet} tone="mid" />
              </svg>
            </div>

            {/* Head Thrashing Alert Box */}
            {headThrashWarning && (
              <div
                style={{
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
                  <strong>Mechanical Head Thrashing Detected!</strong> Non-contiguous block scatter in Linked Allocation forces the actuator arm to oscillate between physical cylinders.
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Controls, Telemetry & Physical Seek Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Target File Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target File for Physical Seek</span>
                <span className="text-muted">{files.length} Mounted</span>
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
                    {f.name} ({f.requiredBlocks} blks, {f.sizeBytes.toLocaleString()} B)
                  </option>
                ))}
              </select>
            </div>

            {/* Mechanics Telemetry KPI Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                background: 'rgba(255,255,255,0.03)',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Actuator Seeks:</span>
                <strong style={{ fontSize: '15px', color: '#f1f5f9' }}>{seekCount} hops</strong>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Seek Time (Tₛ):</span>
                <strong style={{ fontSize: '15px', color: '#38bdf8' }}>{totalSeekTimeMs} ms</strong>
              </div>
              <div>
                <span className="text-xs text-muted" style={{ display: 'block' }}>Rot. Delay (Tᵣₒₜ):</span>
                <strong style={{ fontSize: '15px', color: '#34d399' }}>{rotationalLatencyMs} ms</strong>
              </div>
            </div>

            {/* Physical Seek Simulation Control Button */}
            <button
              type="button"
              className="btn-ui primary"
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              onClick={handleStartSimulation}
              disabled={isSimulating || !activeFile}
            >
              {isSimulating ? 'Head Traveling Across Cylinders...' : 'Simulate Physical Seek'}
            </button>

            {/* Seek Hop Log */}
            <div style={{ flex: 1, minHeight: '170px', display: 'flex', flexDirection: 'column' }}>
              <span className="text-xs text-muted" style={{ marginBottom: '6px' }}>
                Actuator Head Trace Log:
              </span>
              <div
                style={{
                  flex: 1,
                  maxHeight: '190px',
                  overflowY: 'auto',
                  background: '#030712',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  color: '#cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {seekLog.length === 0 ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px 0', textAlign: 'center' }}>
                    Click &apos;Simulate Physical Seek&apos; to watch the actuator head traverse cylinders.
                  </div>
                ) : (
                  seekLog.map((log) => (
                    <div
                      key={log.step}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                    >
                      <span>
                        <strong style={{ color: '#38bdf8' }}>#{log.step}</strong> {log.desc}
                      </span>
                      <span style={{ color: '#f59e0b' }}>+{log.seekMs}ms</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Student Credential & Academic Note */}
            <div style={{ padding: '8px 10px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
              <div><strong>OS Principles Lab:</strong> Winchester 3.5&quot; Mass Storage Model</div>
              <div>Student: <strong>Jaijitesh Suryaprakash</strong> (25BIT0235)</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="text-xs text-muted">
            {explodedView ? 'Exploded Anatomy View: Components unstacked vertically.' : 'Operational View: Dynamic 7200 RPM rotation with pivoting head.'}
          </div>
          <button type="button" className="btn-ui subtle" onClick={onClose}>
            Close Visualizer
          </button>
        </div>
      </div>
    </div>
  );
};
