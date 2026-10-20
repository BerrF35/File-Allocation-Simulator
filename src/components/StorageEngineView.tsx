import React, { useState } from 'react';
import type {
  AllocationMethod,
  DiskBlock,
  DiskStats,
  FileRecord,
  SimConfig,
} from '../types/simulator';
import type { HoverChatData } from './HoverChatWindow';
import { IconCpu, IconRotateCcw } from './Icons';

interface StorageEngineViewProps {
  method: AllocationMethod;
  onSelectMethod: (method: AllocationMethod) => void;
  blocks: DiskBlock[];
  files: FileRecord[];
  stats: DiskStats;
  config: SimConfig;
  selectedFileId: string | null;
  selectedBlockId: number | null;
  onSelectBlock: (blockId: number | null) => void;
  highlightedBlockIds: number[];
  onHoverChat: (data: HoverChatData | null) => void;
  onOpenComparison: () => void;
  onOpenScenarios: () => void;
  onResetDisk: () => void;
  onOpenPlatter?: () => void;
  onOpenDefrag?: () => void;
  onOpenTerminal?: () => void;
}

export const StorageEngineView: React.FC<StorageEngineViewProps> = ({
  method,
  onSelectMethod,
  blocks,
  files,
  stats,
  config,
  selectedFileId,
  selectedBlockId,
  onSelectBlock,
  highlightedBlockIds,
  onHoverChat,
  onOpenComparison,
  onOpenScenarios,
  onResetDisk,
  onOpenPlatter,
  onOpenDefrag,
  onOpenTerminal,
}) => {
  const activeFile = files.find((f) => f.id === selectedFileId) || files[files.length - 1] || null;
  const selectedBlock = selectedBlockId !== null ? blocks.find((b) => b.id === selectedBlockId) || null : null;

  // Active chat topic for the live dock chat window
  const [activeChatTopic, setActiveChatTopic] = useState<HoverChatData>({
    title: `${method.toUpperCase()} Allocation Subsystem Active`,
    role: 'Kernel Storage Controller',
    explanation:
      'Hover your cursor over any pipe, VFS translator, or physical sector block to inspect how the operating system handles data movement and sector allocation in real time.',
    details: `Active File: ${activeFile ? activeFile.name : 'None'} • Block Size: ${config.blockSize}B • Capacity: ${config.totalBlocks} Sectors`,
    tradeOff:
      method === 'contiguous'
        ? 'Contiguous allocation maximizes sequential read speed (1 disk seek), but risks external fragmentation.'
        : method === 'linked'
        ? 'Linked list allocation eliminates external fragmentation completely, but random access requires sequential traversal.'
        : 'Indexed allocation provides direct O(1) random seek without external fragmentation, using 1 index block.',
  });

  const triggerHover = (data: HoverChatData) => {
    onHoverChat(data);
    setActiveChatTopic(data);
  };

  return (
    <div className="engine-view-container" aria-label="OS Storage Architecture Engine">
      {/* Engine Top Navigation Bar */}
      <div className="engine-top-bar">
        <div className="engine-title-area">
          <div className="engine-status-pulse" />
          <div>
            <h2 className="engine-title">Kernel I/O & Block Allocation Subsystem</h2>
            <span className="engine-subtitle">Real-Time Data Bus & Physical Disk Sector Mapping</span>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="engine-method-tabs" role="tablist">
          {(['contiguous', 'linked', 'indexed'] as AllocationMethod[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={method === m}
              className={`engine-method-tab ${method === m ? 'active' : ''}`}
              onClick={() => onSelectMethod(m)}
              onMouseEnter={(e) =>
                triggerHover({
                  title: `${m.toUpperCase()} Allocation Strategy`,
                  role: 'Allocation Engine Driver',
                  explanation:
                    m === 'contiguous'
                      ? 'Allocates consecutive linear sectors. Delivers optimal sequential throughput (only 1 disk seek), but risks external fragmentation when files are deleted.'
                      : m === 'linked'
                      ? 'Allocates free sectors anywhere, chained via pointer in each block. Completely eliminates external fragmentation, but requires sequential pointer hops for random seek.'
                      : 'Allocates an Index Block holding a pointer array to all data sectors. Combines O(1) random seek with zero external fragmentation, with 1-block metadata overhead.',
                  tradeOff:
                    m === 'contiguous'
                      ? 'Pros: 1 disk seek, simple inode. Cons: External fragmentation, file size fixed upfront.'
                      : m === 'linked'
                      ? 'Pros: No external fragmentation, easy file growth. Cons: Slow random seek, pointer corruption risk.'
                      : 'Pros: Instant direct seek, no fragmentation. Cons: Index block overhead on small files.',
                  x: e.clientX,
                  y: e.clientY,
                })
              }
              onMouseLeave={() => onHoverChat(null)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Global Lab Tools */}
        <div className="engine-actions">
          {onOpenPlatter && (
            <button className="btn-engine-tool" onClick={onOpenPlatter} title="Physical Hard Disk Platter & Seek Arm">
              💽 Platter
            </button>
          )}
          {onOpenDefrag && (
            <button className="btn-engine-tool" onClick={onOpenDefrag} title="Drive Optimizer & Defragmenter">
              ⚡ Defrag
            </button>
          )}
          {onOpenTerminal && (
            <button className="btn-engine-tool" onClick={onOpenTerminal} title="Kernel PowerShell Terminal">
              💻 Terminal
            </button>
          )}
          <button className="btn-engine-tool" onClick={onOpenScenarios} title="Load Scenarios">
            📚 Scenarios
          </button>
          <button className="btn-engine-tool" onClick={onOpenComparison} title="Compare Algorithms">
            📊 Benchmark
          </button>
          <button className="btn-engine-tool danger" onClick={onResetDisk} title="Format / Reset Disk">
            <IconRotateCcw size={13} />
            <span>Format</span>
          </button>
        </div>
      </div>

      {/* Main Flow Diagram with Animated Glowing Pipes */}
      <div className="engine-pipeline-stage">
        {/* Stage 1: User Application Layer */}
        <div
          className="pipeline-card app-node"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'Application Layer (User Mode)',
              role: 'Ring 3 User Space',
              explanation:
                'The user-space process issues a write syscall `sys_write(fd, buffer, bytes)`. Applications view files as contiguous byte streams and remain completely oblivious to physical disk geometry.',
              details: activeFile
                ? `Writing: "${activeFile.name}" • Size: ${activeFile.sizeBytes} Bytes • Required Sectors: ${activeFile.totalBlocksAllocated}`
                : 'No active write. Ready to process file stream.',
              tradeOff: 'Hardware abstraction separates program logic from block device drivers.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseMove={(e) =>
            triggerHover({
              title: 'Application Layer (User Mode)',
              role: 'Ring 3 User Space',
              explanation:
                'The user-space process issues a write syscall `sys_write(fd, buffer, bytes)`. Applications view files as contiguous byte streams and remain completely oblivious to physical disk geometry.',
              details: activeFile
                ? `Writing: "${activeFile.name}" • Size: ${activeFile.sizeBytes} Bytes • Required Sectors: ${activeFile.totalBlocksAllocated}`
                : 'No active write. Ready to process file stream.',
              tradeOff: 'Hardware abstraction separates program logic from block device drivers.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="pipeline-card-badge">Ring 3 • User Mode</div>
          <div className="pipeline-card-header">
            <span style={{ fontSize: '18px' }}>📄</span>
            <div>
              <div className="pipeline-node-name">
                {activeFile ? activeFile.name : 'Virtual Process Stream'}
              </div>
              <div className="pipeline-node-sub">
                {activeFile
                  ? `${activeFile.sizeBytes.toLocaleString()} Bytes (${Math.ceil(activeFile.sizeBytes / config.blockSize)} Sectors)`
                  : 'Idle buffer awaiting syscall'}
              </div>
            </div>
          </div>
          <div className="pipeline-code-snippet">
            <code>sys_write(fd, buf, {activeFile ? activeFile.sizeBytes : 4096});</code>
          </div>
        </div>

        {/* Animated Pipe 1: User to Kernel Syscall Bus */}
        <div
          className="pipeline-pipe"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'Syscall Bus & Page Cache',
              role: 'Hardware Boundary Crossing',
              explanation:
                'The CPU transitions from Ring 3 (User) to Ring 0 (Kernel) via software interrupt `0x80` or `syscall` instruction. The byte payload copies into the kernel page cache.',
              details: 'Throughput: High-speed system bus. Buffers 512B chunks into DMA staging area.',
              tradeOff: 'Context switch overhead between user and kernel space is optimized via page buffers.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseMove={(e) =>
            triggerHover({
              title: 'Syscall Bus & Page Cache',
              role: 'Hardware Boundary Crossing',
              explanation:
                'The CPU transitions from Ring 3 (User) to Ring 0 (Kernel) via software interrupt `0x80` or `syscall` instruction. The byte payload copies into the kernel page cache.',
              details: 'Throughput: High-speed system bus. Buffers 512B chunks into DMA staging area.',
              tradeOff: 'Context switch overhead between user and kernel space is optimized via page buffers.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="pipe-line-glow" />
          <div className="pipe-packet-stream">
            <span className="pipe-packet pulse-1" />
            <span className="pipe-packet pulse-2" />
            <span className="pipe-packet pulse-3" />
          </div>
          <div className="pipe-label">I/O BUS • SYSCALL</div>
        </div>

        {/* Stage 2: Virtual File System (VFS) */}
        <div
          className="pipeline-card vfs-node"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'Virtual File System (VFS)',
              role: 'Kernel Mode Abstraction',
              explanation:
                'The VFS slices arbitrary byte streams into fixed-size 512-byte disk blocks. It computes logical offsets [Block 0, Block 1, Block 2...] regardless of storage medium.',
              details: `Block Geometry: ${config.blockSize} Bytes/Sector. Logical file length: ${activeFile?.totalBlocksAllocated ?? 1} blocks.`,
              tradeOff: 'Enables uniform read/write APIs across ext4, NTFS, FAT, and SSD flash devices.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseMove={(e) =>
            triggerHover({
              title: 'Virtual File System (VFS)',
              role: 'Kernel Mode Abstraction',
              explanation:
                'The VFS slices arbitrary byte streams into fixed-size 512-byte disk blocks. It computes logical offsets [Block 0, Block 1, Block 2...] regardless of storage medium.',
              details: `Block Geometry: ${config.blockSize} Bytes/Sector. Logical file length: ${activeFile?.totalBlocksAllocated ?? 1} blocks.`,
              tradeOff: 'Enables uniform read/write APIs across ext4, NTFS, FAT, and SSD flash devices.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="pipeline-card-badge">Ring 0 • Kernel VFS</div>
          <div className="pipeline-card-header">
            <span style={{ fontSize: '18px' }}>🧠</span>
            <div>
              <div className="pipeline-node-name">VFS Block Translator</div>
              <div className="pipeline-node-sub">Byte Stream ➔ 512B Logical Sectors</div>
            </div>
          </div>
          <div className="vfs-block-chips">
            {activeFile ? (
              activeFile.allocatedBlocks.slice(0, 4).map((b, idx) => (
                <span key={b} className="vfs-chip">
                  LBA #{idx} ➔ Blk {b}
                </span>
              ))
            ) : (
              <span className="vfs-chip">Awaiting allocation</span>
            )}
            {activeFile && activeFile.allocatedBlocks.length > 4 && (
              <span className="vfs-chip">+{activeFile.allocatedBlocks.length - 4} more</span>
            )}
          </div>
        </div>

        {/* Animated Pipe 2: VFS to Allocation Engine */}
        <div
          className="pipeline-pipe"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'Allocation Scheduler Bus',
              role: 'Kernel Memory Bus',
              explanation:
                'Dispatches logical block allocation requests to the active storage strategy driver.',
              details: `Active Strategy Driver: alloc_${method}.sys`,
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseMove={(e) =>
            triggerHover({
              title: 'Allocation Scheduler Bus',
              role: 'Kernel Memory Bus',
              explanation:
                'Dispatches logical block allocation requests to the active storage strategy driver.',
              details: `Active Strategy Driver: alloc_${method}.sys`,
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="pipe-line-glow" />
          <div className="pipe-packet-stream">
            <span className="pipe-packet pulse-1" />
            <span className="pipe-packet pulse-2" />
          </div>
          <div className="pipe-label">{method.toUpperCase()} DISPATCH</div>
        </div>

        {/* Stage 3: Allocation Engine Controller */}
        <div
          className="pipeline-card engine-node"
          onMouseEnter={(e) =>
            triggerHover({
              title: `${method.toUpperCase()} Allocation Engine`,
              role: 'Storage Controller Driver',
              explanation:
                method === 'contiguous'
                  ? 'Searches Free Block Bitmap for a sequence of adjacent sectors. If found, returns {startBlock, length}. If gaps break continuity, external fragmentation occurs!'
                  : method === 'linked'
                  ? 'Searches Free Block Bitmap for any free sectors. Writes physical address of the next sector into the pointer field of the current block. Terminates with EOF (-1).'
                  : 'Designates a single Index Block on disk to store the complete array of physical sector addresses, enabling direct index lookup.',
              details: `Total disk capacity: ${config.totalBlocks} blocks. Used: ${stats.occupiedBlocks} blocks. Free: ${stats.freeBlocks} blocks.`,
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseMove={(e) =>
            triggerHover({
              title: `${method.toUpperCase()} Allocation Engine`,
              role: 'Storage Controller Driver',
              explanation:
                method === 'contiguous'
                  ? 'Searches Free Block Bitmap for a sequence of adjacent sectors. If found, returns {startBlock, length}. If gaps break continuity, external fragmentation occurs!'
                  : method === 'linked'
                  ? 'Searches Free Block Bitmap for any free sectors. Writes physical address of the next sector into the pointer field of the current block. Terminates with EOF (-1).'
                  : 'Designates a single Index Block on disk to store the complete array of physical sector addresses, enabling direct index lookup.',
              details: `Total disk capacity: ${config.totalBlocks} blocks. Used: ${stats.occupiedBlocks} blocks. Free: ${stats.freeBlocks} blocks.`,
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="pipeline-card-badge">
            <IconCpu size={12} style={{ marginRight: '4px' }} />
            {method.toUpperCase()} Engine
          </div>
          <div className="pipeline-card-header">
            <span style={{ fontSize: '18px' }}>⚙️</span>
            <div>
              <div className="pipeline-node-name">
                {method === 'contiguous'
                  ? 'Contiguous Extent Finder'
                  : method === 'linked'
                  ? 'Pointer Chaining Resolver'
                  : 'Index Block Directory'}
              </div>
              <div className="pipeline-node-sub">
                {method === 'contiguous'
                  ? `Run: Start #${activeFile?.startBlock ?? 0}, Length: ${activeFile?.length ?? 0}`
                  : method === 'linked'
                  ? `List: Start #${activeFile?.startBlock ?? 0} ➔ End #${activeFile?.endBlock ?? 0}`
                  : `Index Block #${activeFile?.indexBlockId ?? 0} ➔ Direct Pointers`}
              </div>
            </div>
          </div>

          {/* Mini schematic display */}
          <div className="engine-mini-schematic">
            {method === 'contiguous' && (
              <div className="schematic-contiguous">
                <span>[ Sector {activeFile?.startBlock ?? 0} ]</span>
                <span className="schematic-arrow">═══►</span>
                <span>[ Sector {(activeFile?.startBlock ?? 0) + (activeFile?.length ?? 1) - 1} ]</span>
              </div>
            )}
            {method === 'linked' && (
              <div className="schematic-linked">
                <span>[ #{activeFile?.startBlock ?? 0} | ptr ]</span>
                <span className="schematic-arrow">──►</span>
                <span>[ #{activeFile?.allocatedBlocks[1] ?? '...'} | ptr ]</span>
                <span className="schematic-arrow">──►</span>
                <span>[ EOF ]</span>
              </div>
            )}
            {method === 'indexed' && (
              <div className="schematic-indexed">
                <span className="schematic-idx-tag">Index Blk #{activeFile?.indexBlockId ?? 0}</span>
                <span className="schematic-arrow">▼</span>
                <span className="schematic-entries">
                  [{activeFile?.allocatedBlocks.slice(0, 3).join(', ') ?? '...'}]
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Animated Pipe 3: Controller to Physical Disk */}
        <div
          className="pipeline-pipe"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'DMA & SATA/NVMe Bus',
              role: 'Hardware Storage Controller',
              explanation:
                'Direct Memory Access (DMA) transfers block payload directly from RAM to the storage controller, bypassing CPU cycles and writing to magnetic platters or flash cells.',
              details: 'LBA (Logical Block Addressing) translated into physical NAND flash cells / disk sectors.',
              tradeOff: 'Sequential access completes in single rotational sweep; fragmented blocks require seek latency.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseMove={(e) =>
            triggerHover({
              title: 'DMA & SATA/NVMe Bus',
              role: 'Hardware Storage Controller',
              explanation:
                'Direct Memory Access (DMA) transfers block payload directly from RAM to the storage controller, bypassing CPU cycles and writing to magnetic platters or flash cells.',
              details: 'LBA (Logical Block Addressing) translated into physical NAND flash cells / disk sectors.',
              tradeOff: 'Sequential access completes in single rotational sweep; fragmented blocks require seek latency.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <div className="pipe-line-glow" />
          <div className="pipe-packet-stream">
            <span className="pipe-packet pulse-1" />
            <span className="pipe-packet pulse-2" />
            <span className="pipe-packet pulse-3" />
          </div>
          <div className="pipe-label">STORAGE BUS • DMA</div>
        </div>

        {/* Stage 4: Physical Storage Media Grid */}
        <div className="pipeline-card disk-node">
          <div className="pipeline-card-badge">Physical Hardware (LBA 0x00 .. 0x3F)</div>
          <div className="pipeline-card-header">
            <span style={{ fontSize: '18px' }}>💾</span>
            <div>
              <div className="pipeline-node-name">64-Sector Physical Disk Matrix</div>
              <div className="pipeline-node-sub">
                {stats.occupiedBlocks} Occupied • {stats.freeBlocks} Free (512B Each)
              </div>
            </div>
          </div>

          {/* 64 Block Grid with Animated Flow Pulsing */}
          <div className="engine-disk-grid">
            {blocks.map((block) => {
              const isOccupied = block.state !== 'free';
              const isIndex = block.state === 'index';
              const isSelected = selectedBlockId === block.id;
              const isHighlighted = highlightedBlockIds.includes(block.id);

              return (
                <div
                  key={block.id}
                  className={`engine-block-cell ${block.state} ${isSelected ? 'selected' : ''} ${
                    isHighlighted ? 'highlighted' : ''
                  }`}
                  style={{
                    backgroundColor: block.fileColor || undefined,
                  }}
                  onClick={() => onSelectBlock(block.id)}
                  onMouseEnter={(e) =>
                    triggerHover({
                      title: `Physical Sector #${block.id}`,
                      role: isIndex ? 'Index Block (Metadata)' : isOccupied ? 'Data Sector' : 'Free Sector',
                      explanation: isIndex
                        ? `Designated Index Block for "${block.fileName}". Holds direct pointer table to data sectors: [${block.indexEntries?.join(', ') || 'empty'}].`
                        : isOccupied
                        ? `Contains byte payload for file "${block.fileName}" at logical offset ${block.blockOffset} of ${block.totalBlocksInFile} blocks.`
                        : `Free physical sector available for allocation. Bit #${block.id} is set to 0 in Free Space Bitmap.`,
                      details: isIndex
                        ? `LBA: 0x${block.id.toString(16).padStart(4, '0').toUpperCase()} • Capacity: ${config.blockSize}B`
                        : isOccupied
                        ? `LBA: 0x${block.id.toString(16).padStart(4, '0').toUpperCase()}${
                            block.nextBlockId !== null && block.nextBlockId !== undefined
                              ? ` • Pointer ➔ Blk #${block.nextBlockId}`
                              : ''
                          }`
                        : `LBA: 0x${block.id.toString(16).padStart(4, '0').toUpperCase()} • Unallocated`,
                      tradeOff:
                        method === 'contiguous' && !isOccupied
                          ? 'Can only be utilized if adjacent free blocks match file request size.'
                          : method === 'linked' && isOccupied
                          ? `Reserves 4 bytes for next pointer (0x${block.nextBlockId ?? 'EOF'}).`
                          : undefined,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e) =>
                    triggerHover({
                      title: `Physical Sector #${block.id}`,
                      role: isIndex ? 'Index Block (Metadata)' : isOccupied ? 'Data Sector' : 'Free Sector',
                      explanation: isIndex
                        ? `Designated Index Block for "${block.fileName}". Holds direct pointer table to data sectors: [${block.indexEntries?.join(', ') || 'empty'}].`
                        : isOccupied
                        ? `Contains byte payload for file "${block.fileName}" at logical offset ${block.blockOffset} of ${block.totalBlocksInFile} blocks.`
                        : `Free physical sector available for allocation. Bit #${block.id} is set to 0 in Free Space Bitmap.`,
                      details: isIndex
                        ? `LBA: 0x${block.id.toString(16).padStart(4, '0').toUpperCase()} • Capacity: ${config.blockSize}B`
                        : isOccupied
                        ? `LBA: 0x${block.id.toString(16).padStart(4, '0').toUpperCase()}${
                            block.nextBlockId !== null && block.nextBlockId !== undefined
                              ? ` • Pointer ➔ Blk #${block.nextBlockId}`
                              : ''
                          }`
                        : `LBA: 0x${block.id.toString(16).padStart(4, '0').toUpperCase()} • Unallocated`,
                      tradeOff:
                        method === 'contiguous' && !isOccupied
                          ? 'Can only be utilized if adjacent free blocks match file request size.'
                          : method === 'linked' && isOccupied
                          ? `Reserves 4 bytes for next pointer (0x${block.nextBlockId ?? 'EOF'}).`
                          : undefined,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => onHoverChat(null)}
                >
                  <span className="engine-block-id">{block.id}</span>
                  {isIndex && <span className="engine-idx-marker">IDX</span>}
                  {block.fileTag && !isIndex && (
                    <span className="engine-tag-marker">{block.fileTag}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Sector Byte Dump & CHS Coordinates Card (Active when sector selected) */}
      {selectedBlock && (
        <div
          className="engine-sector-hex-card"
          style={{
            margin: '0 20px 16px 20px',
            background: '#040711',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '14px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <div>
                <strong style={{ fontSize: '13px', color: '#f8fafc' }}>
                  Physical Sector LBA #{selectedBlock.id} (0x{selectedBlock.id.toString(16).padStart(4, '0').toUpperCase()})
                </strong>
                <span className="text-xs text-muted" style={{ display: 'block' }}>
                  CHS: Cylinder {Math.floor(selectedBlock.id / 16)}, Head 0, Sector {selectedBlock.id % 16} · Track {Math.floor(selectedBlock.id / 16)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onOpenPlatter && (
                <button
                  type="button"
                  className="btn-ui subtle"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={onOpenPlatter}
                  title="Watch Mechanical Head seek to this sector"
                >
                  💽 Seek Head Here
                </button>
              )}
              <button
                type="button"
                className="btn-ui subtle"
                style={{ fontSize: '11px', padding: '2px 6px' }}
                onClick={() => onSelectBlock(null)}
                title="Close Inspector"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Allocation & Slack Space Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px', fontSize: '11.5px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b', display: 'block' }}>Status:</span>
              <strong style={{ color: selectedBlock.state !== 'free' ? '#38bdf8' : '#34d399' }}>
                {selectedBlock.state !== 'free'
                  ? selectedBlock.fileTag?.includes('IDX')
                    ? 'INDEX BLOCK (Pointer Table)'
                    : `ALLOCATED (${selectedBlock.fileName || 'File'})`
                  : 'FREE SECTOR (Unallocated)'}
              </strong>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b', display: 'block' }}>Payload &amp; Slack:</span>
              <span style={{ color: '#cbd5e1' }}>
                {selectedBlock.bytesUsed} / {config.blockSize} B used (
                  <span style={{ color: '#f59e0b' }}>
                    {config.blockSize - selectedBlock.bytesUsed} B slack space
                  </span>
                )
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b', display: 'block' }}>Pointer Chain:</span>
              <span style={{ color: '#cbd5e1' }}>
                {selectedBlock.nextBlockId !== null && selectedBlock.nextBlockId !== undefined
                  ? `Next LBA ➔ #${selectedBlock.nextBlockId}`
                  : selectedBlock.referencedByIndexBlock !== undefined
                  ? `Index Parent ➔ #${selectedBlock.referencedByIndexBlock}`
                  : selectedBlock.indexEntries
                  ? `Indexes: [${selectedBlock.indexEntries.join(', ')}]`
                  : 'Sequential / EOF'}
              </span>
            </div>
          </div>

          {/* Raw Hex & ASCII Dump Table */}
          <div
            style={{
              background: '#020409',
              borderRadius: '4px',
              padding: '8px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              lineHeight: 1.5,
              color: '#94a3b8',
              overflowX: 'auto',
            }}
          >
            <div style={{ color: '#475569', marginBottom: '2px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2px' }}>
              Offset &nbsp; 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F &nbsp; Decoded ASCII
            </div>
            <div>
              <span style={{ color: '#38bdf8' }}>0000:</span> 53 69 6D 46 53 5F 53 45 43 54 4F 52 5F 30 78{' '}
              {selectedBlock.id.toString(16).padStart(2, '0').toUpperCase()} &nbsp;
              <span style={{ color: '#f1f5f9' }}>SimFS_SECTOR_0x{selectedBlock.id.toString(16).padStart(2, '0')}</span>
            </div>
            <div>
              <span style={{ color: '#38bdf8' }}>0010:</span>{' '}
              {selectedBlock.state !== 'free'
                ? '44 61 74 61 50 61 79 6C 6F 61 64 5F 42 6C 6F 63'
                : '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00'}{' '}
              &nbsp;
              <span style={{ color: '#f1f5f9' }}>
                {selectedBlock.state !== 'free' ? 'DataPayload_Bloc' : '................'}
              </span>
            </div>
            <div>
              <span style={{ color: '#38bdf8' }}>0020:</span>{' '}
              {selectedBlock.nextBlockId !== null && selectedBlock.nextBlockId !== undefined
                ? `4E 58 54 3A 00 00 00 ${selectedBlock.nextBlockId.toString(16).padStart(2, '0')} 00 00 00 00 00 00 00 00`
                : '6B 5F 43 6F 6E 74 65 6E 74 53 74 72 65 61 6D 00'}{' '}
              &nbsp;
              <span style={{ color: '#f1f5f9' }}>
                {selectedBlock.nextBlockId !== null && selectedBlock.nextBlockId !== undefined
                  ? `NXT:...${selectedBlock.nextBlockId}........`
                  : 'k_ContentStream.'}
              </span>
            </div>
            <div>
              <span style={{ color: '#38bdf8' }}>01F0:</span> 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 AA &nbsp;
              <span style={{ color: '#f59e0b' }}>..............U.</span>
            </div>
          </div>
        </div>
      )}

      {/* Docked Live Kernel Chat Window Box */}
      <div className="engine-docked-chat-card" role="region" aria-label="Kernel Storage Chat Assistant">
        <div className="engine-docked-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <div>
              <span className="engine-docked-chat-name">Kernel Storage Assistant</span>
              <span className="engine-docked-chat-tag">• {activeChatTopic.role}</span>
            </div>
          </div>
          <span className="engine-docked-live-pill">Live Inspector Active</span>
        </div>
        <div className="engine-docked-chat-content">
          <h4 className="engine-docked-chat-title">{activeChatTopic.title}</h4>
          <p className="engine-docked-chat-desc">{activeChatTopic.explanation}</p>
          {activeChatTopic.details && (
            <div className="engine-docked-detail-chip">
              <strong>⚡ Hardware / Syscall Action:</strong> {activeChatTopic.details}
            </div>
          )}
          {activeChatTopic.tradeOff && (
            <div className="engine-docked-tradeoff-chip">
              <strong>⚖️ Trade-off Insight:</strong> {activeChatTopic.tradeOff}
            </div>
          )}
        </div>
      </div>

      {/* Live Telemetry & Fragmentation Banner */}
      <div className="engine-telemetry-strip">
        <div
          className="telemetry-item"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'Storage Utilization',
              role: 'Capacity Telemetry',
              explanation: `${stats.occupiedBlocks} of ${config.totalBlocks} physical sectors are currently occupied (${stats.utilizationPercent}%).`,
              details: `Total disk capacity: ${(config.totalBlocks * config.blockSize) / 1024} KB. Free: ${(stats.freeBlocks * config.blockSize) / 1024} KB.`,
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <span className="telemetry-label">Capacity</span>
          <span className="telemetry-val">
            {stats.occupiedBlocks}/{config.totalBlocks} Sectors ({stats.utilizationPercent}%)
          </span>
          <div className="telemetry-bar">
            <div className="telemetry-bar-fill" style={{ width: `${stats.utilizationPercent}%` }} />
          </div>
        </div>

        <div
          className="telemetry-item"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'Fragmentation Analysis',
              role: 'Allocation Efficiency',
              explanation:
                method === 'contiguous'
                  ? stats.externalFragmentationMetric.hasFragmentation
                    ? '⚠️ External Fragmentation Trap Active! Total free space is sufficient, but no single contiguous run can satisfy large file allocation.'
                    : `Contiguous free blocks exist. Largest free run: ${stats.externalFragmentationMetric.maxContiguousRun} blocks.`
                  : method === 'linked'
                  ? 'Zero external fragmentation! Any scattered free sector can be linked. Pointer overhead consumes 4 bytes per sector.'
                  : 'Zero external fragmentation! Direct index block maps sectors directly. 1-block index overhead.',
              tradeOff:
                method === 'contiguous'
                  ? 'Compaction or defragmentation required to coalesce free sectors.'
                  : method === 'linked'
                  ? 'Random seek requires traversing N block pointers across disk.'
                  : 'Fast O(1) random seek without external fragmentation.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <span className="telemetry-label">Fragmentation Status</span>
          <span
            className="telemetry-val"
            style={{
              color:
                method === 'contiguous' && stats.externalFragmentationMetric.hasFragmentation
                  ? '#ef4444'
                  : '#10b981',
            }}
          >
            {method === 'contiguous'
              ? stats.externalFragmentationMetric.hasFragmentation
                ? '⚠️ External Fragmentation Warning'
                : `Optimal (Max Run: ${stats.externalFragmentationMetric.maxContiguousRun} blks)`
              : `${method.toUpperCase()} (Zero Ext. Frag)`}
          </span>
          <span className="telemetry-sub">
            {method === 'contiguous'
              ? 'External fragmentation risk when files are deleted'
              : method === 'linked'
              ? 'Pointers chain scattered sectors seamlessly'
              : 'Index block table provides direct O(1) mapping'}
          </span>
        </div>

        <div
          className="telemetry-item"
          onMouseEnter={(e) =>
            triggerHover({
              title: 'I/O Seek Time Estimation',
              role: 'Mechanical & Bus Latency',
              explanation:
                method === 'contiguous'
                  ? '1 Seek Required. The drive head moves once to the start sector and reads all data in a single continuous rotational sweep.'
                  : method === 'linked'
                  ? `Average ${activeFile?.totalBlocksAllocated ?? 1} Seeks for random access. Drive head must jump to traverse each block pointer.`
                  : '2 Seeks Required. 1 seek to read the Index Block, followed by 1 direct seek to target data block.',
              details: 'Contiguous: O(1) seek • Linked: O(N) traversal • Indexed: O(1) direct via index.',
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => onHoverChat(null)}
        >
          <span className="telemetry-label">Access Complexity</span>
          <span className="telemetry-val">
            {method === 'contiguous'
              ? 'Sequential: O(1) Seek'
              : method === 'linked'
              ? 'Random: O(N) Traversal'
              : 'Direct: O(1) Index Seek'}
          </span>
          <span className="telemetry-sub">Hover to view trade-off analysis</span>
        </div>
      </div>
    </div>
  );
};
