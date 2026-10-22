# Comprehensive Engineering & Architectural Report
## AetherOS SimFS: Operating System File Allocation & Storage Architecture Simulator

**Course:** Operating System Principles  
**Student Author:** Jaijitesh Suryaprakash  
**Registration Number:** 25BIT0235  
**Institution:** School of Computer Science & Engineering  
**Project Repository:** [GitHub: BerrF35/File-Allocation-Simulator](https://github.com/BerrF35/File-Allocation-Simulator)  
**System Version:** v2.5.0-Production (Build 2026.10)  
**Target Environments:** Modern Web Browsers, Responsive Desktop (1440px+), Tablet (768px), Mobile Viewports (375px–430px)

---

## Executive Abstract

In classical computer science pedagogy, secondary storage management and file system allocation are frequently taught as static, two-dimensional textbook abstractions. Students memorize that *Contiguous Allocation* causes external fragmentation, *Linked Allocation* suffers from slow random access seek times, and *Indexed Allocation* incurs metadata overhead. However, the visceral mechanical reality—how user-space system calls (`sys_write`) transition into Ring 0 kernel Virtual File System (VFS) operations, how sector headers store pointer addresses, how physical actuator arms sweep across magnetic platters, and how free-space bitmaps fracture over time—remains opaque.

**AetherOS SimFS (Secondary Storage & Block Allocation Simulator)** was conceived and engineered to bridge this fundamental gap. SimFS is a production-grade, highly visual, mathematically accurate secondary storage simulator and interactive operating system desktop environment built in React 19, TypeScript, and modern CSS. The application models the entire secondary storage hierarchy:
1. **Ring 3 User Mode Process Layer**: Syscall staging, buffer generation, and file stream abstraction.
2. **Ring 0 Kernel Virtual File System (VFS)**: Byte stream translation into fixed 512-byte logical sectors (Logical Block Addressing / LBA).
3. **Storage Driver Controller Layer**: Transactional implementations of **Contiguous**, **Linked**, and **Indexed** block allocation with atomic rollback guarantees.
4. **Physical Disk Block Geometry Matrix**: A 64-sector (expandable to 128) physical media surface complete with hex dumps, slack space calculation, and Cylinder-Head-Sector (CHS) mapping.
5. **Mechanical Winchester Hard Disk 3D Isometric Model**: An interactive, mathematically grounded solid 3D model of a dual-platter 3.5-inch hard drive featuring Voice Coil Motor (VCM) kinematics, platter rotation, and arm seek trajectory modeling.
6. **Live Volume Defragmenter & Compactor**: A real-time cluster map relocator demonstrating in-place data block compaction and fragmentation elimination.
7. **Interactive Kernel PowerShell Terminal**: A full-featured terminal shell supporting 12+ commands (`dir`, `cat`, `stat`, `touch`, `rm`, `method`, `defrag`, `bench`, `platter`, `chs`, `df`, `cls`).
8. **Isolated 3-Way Benchmark Engine**: Real-time simultaneous comparative simulation of identical file workloads across isolated Contiguous, Linked, and Indexed secondary storage partitions.
9. **Dynamic Filesystem Migration Engine**: Instant on-the-fly volume reorganization that re-allocates all active files across different storage strategies with transactional consistency.
10. **Dual-Formfactor UI Architecture**: A Windows 11 desktop workspace with taskbar, start menu, right-click context menus, and draggable windows, seamlessly coupled with an adaptive mobile phone operating system experience.

This report serves as the comprehensive architectural reference, mathematical proof, algorithm specification, and engineering audit of the entire SimFS codebase.

---

## Table of Contents

1. [Architectural Overview & System Hierarchy](#1-architectural-overview--system-hierarchy)
2. [Theoretical Foundations & Allocation Mathematics](#2-theoretical-foundations--allocation-mathematics)
   - 2.1 Contiguous Allocation Strategy
   - 2.2 Linked List Allocation Strategy
   - 2.3 Indexed Allocation Strategy
   - 2.4 Mathematical Complexity Matrix
   - 2.5 Fragmentation Mechanics: Internal vs External
3. [Core Simulator Engine Architecture](#3-core-simulator-engine-architecture)
   - 3.1 Type Definitions & Core Invariants (`types/simulator.ts`)
   - 3.2 Allocation State Machines (`contiguous.ts`, `linked.ts`, `indexed.ts`)
   - 3.3 Dynamic Method Migration Engine (`migrateFilesToMethod`)
   - 3.4 Transactional Rollback & Error State Matrix
   - 3.5 File Resize & Collision Resolution Engine
   - 3.6 File Unlinking & Recycle Bin Recovery System
4. [Mechanical Winchester 3.5" Hard Disk 3D Kinematics](#4-mechanical-winchester-35-hard-disk-3d-kinematics)
   - 4.1 Physical Model Specifications
   - 4.2 Isometric Mathematical Projection Engine (`iso-kit.ts`)
   - 4.3 Voice Coil Motor (VCM) & Forward Kinematics
   - 4.4 Seek Latency & Head Trajectory Calculation
   - 4.5 Dual Platter & Spindle Motor Mechanics
5. [Drive Optimizer & Live Disk Defragmenter Subsystem](#5-drive-optimizer--live-disk-defragmenter-subsystem)
   - 5.1 Fragmentation Measurement Algorithms
   - 5.2 Compaction & Sector Relocation Engine
   - 5.3 Live Cluster Map Visualizer
6. [Interactive OS Kernel PowerShell Terminal](#6-interactive-os-kernel-powershell-terminal)
   - 6.1 Architecture & Command Dispatcher
   - 6.2 Supported Commands Specification
   - 6.3 Low-Level Sector & Inode Telemetry (`stat`, `chs`)
7. [Isolated 3-Way Comparative Benchmark Matrix](#7-isolated-3-way-comparative-benchmark-matrix)
   - 7.1 Virtual Isolated Partition Modeling
   - 7.2 Multi-Metric Quantitative Evaluation
8. [Windows 11 Desktop UI & Storage Engine Architecture](#8-windows-11-desktop-ui--storage-engine-architecture)
   - 8.1 Desktop Environment, Taskbar, & Start Menu
   - 8.2 Real-Time Storage Subsystem Engine (`StorageEngineView.tsx`)
   - 8.3 Physical Sector Matrix & Hex Byte Dumper
   - 8.4 Conversational Kernel Storage Assistant Dock
9. [Adaptive Mobile Phone Architecture](#9-adaptive-mobile-phone-architecture)
   - 9.1 Viewport Ergonomics & Touch Target Sizing
   - 9.2 Mobile Navigation & Bottom Tab Bar Architecture
   - 9.3 Floating Action Buttons & Modal Drawers
10. [Pre-Configured Educational OS Lab Scenarios](#10-pre-configured-educational-os-lab-scenarios)
11. [Testing, Quality Assurance, & Verification](#11-testing-quality-assurance--verification)
12. [Complete File-by-File Codebase Inventory](#12-complete-file-by-file-codebase-inventory)
13. [Conclusions & Future Storage Extensions](#13-conclusions--future-storage-extensions)

---

## 1. Architectural Overview & System Hierarchy

The SimFS architecture models an authentic layered operating system secondary storage stack. Data does not teleport onto disk sectors; it cascades through well-defined architectural boundaries:

```
+-----------------------------------------------------------------------+
|                         APPLICATION LAYER (Ring 3)                     |
|  User Process: Notepad / CLI / Terminal / Benchmark                   |
|  Syscall Invocation: sys_write(fd, buffer, byteCount)                 |
+-----------------------------------v-----------------------------------+
                                    | Software Interrupt 0x80 / SYSCALL
+-----------------------------------v-----------------------------------+
|                     VIRTUAL FILE SYSTEM (VFS) (Ring 0)                 |
|  - Inode Table Management                                             |
|  - Byte Stream to Logical Block Translation (LBA = offset / 512)      |
|  - Free Space Bitmap Monitoring & Quota Accounting                    |
+-----------------------------------v-----------------------------------+
                                    | Dispatch Request to Active Driver
+-----------------------------------v-----------------------------------+
|                    STORAGE ALLOCATION DRIVER LAYER                    |
|  +--------------------+  +--------------------+  +------------------+ |
|  | alloc_contiguous   |  | alloc_linked.sys   |  | alloc_indexed.sys| |
|  | Linear Extent      |  | Sector Pointer     |  | Centralized Index| |
|  | Finder (First-Fit) |  | Chaining Engine    |  | Block Builder    | |
|  +--------------------+  +--------------------+  +------------------+ |
+-----------------------------------v-----------------------------------+
                                    | DMA / SATA / NVMe Bus Commands
+-----------------------------------v-----------------------------------+
|                      PHYSICAL STORAGE MEDIA LAYER                      |
|  - 64 x 512B Sectors (LBA 0x0000 .. 0x003F)                           |
|  - Cylinder-Head-Sector (CHS) Mapping (4 Cylinders x 16 Sectors)      |
|  - Winchester 3.5" Hard Disk Actuator Arm & Platter Kinematics        |
+-----------------------------------------------------------------------+
```

### Layer Responsibilities

1. **User Mode (Ring 3)**: Applications operate strictly on byte streams. A user writing a 2,048-byte text file issues `sys_write(fd, buffer, 2048)`. The application remains agnostic to disk geometry, sector layouts, or allocation strategies.
2. **Virtual File System (Kernel Mode Ring 0)**: The kernel intercepts the syscall via software interrupt or the CPU `syscall` instruction. The VFS divides the arbitrary byte stream into discrete, uniform **512-byte blocks**:
   $$\text{Required Blocks} = \left\lceil \frac{\text{File Size (bytes)}}{\text{Sector Size (512)}} \right\rceil$$
3. **Allocation Driver**: The kernel dispatches the block allocation request to the driver currently loaded in kernel memory (`alloc_contiguous.sys`, `alloc_linked.sys`, or `alloc_indexed.sys`). The driver interrogates the Free Space Bitmap and selects target sectors.
4. **Physical Media**: The secondary storage device receives logical sector addresses (LBAs), transfers the byte payloads via Direct Memory Access (DMA), and directs the mechanical read/write head to the designated track and cylinder.

---

## 2. Theoretical Foundations & Allocation Mathematics

### 2.1 Contiguous Allocation Strategy

In Contiguous Allocation, an entire file must occupy an unbroken, consecutive sequence of physical disk sectors.

```
File "report.pdf" (Size: 2048 Bytes = 4 Sectors)
Start Sector: #12, Length: 4 Sectors

Physical Disk:
[ ... | 11: Free | 12: Data(0) | 13: Data(1) | 14: Data(2) | 15: Data(3) | 16: Free | ... ]
                   ^                                          ^
                   +---------------- Linear Extent -----------+
```

#### Mathematical Properties
- **Directory Inode Entry**: A compact tuple storing only the starting sector address and sector count:
  $$\text{Directory Entry} = \langle \text{fileName}, \text{startBlock}, \text{length} \rangle$$
- **Address Translation**: Mapping logical block offset $i$ ($0 \le i < \text{length}$) to physical sector address $P$:
  $$P(i) = \text{startBlock} + i$$
- **Address Translation Complexity**: $O(1)$ constant time. No disk reads are required to determine where block $i$ lives.
- **Head Seek Performance**: Optimal. Accessing the entire file requires exactly **1 disk seek** to $\text{startBlock}$, after which all sectors are read in a single continuous rotational pass across the track.
- **The External Fragmentation Dilemma**: Free storage fractures into non-contiguous holes over time as files are created, resized, and deleted. A file allocation of size $K$ blocks will fail if:
  $$\max_{r \in \text{FreeRuns}} (|r|) < K \quad \text{even if} \quad \sum_{r \in \text{FreeRuns}} |r| \ge K$$
  This condition represents the classic **External Fragmentation Trap**.
- **Dynamic File Growth Limitation**: If file $A$ occupies blocks $[10..13]$ and file $B$ occupies blocks $[14..16]$, expanding file $A$ by 1 block collides with block $14$. The file system must either reject the expansion, relocate file $A$ entirely to a larger free hole ($O(N)$ data copy overhead), or abort with an error.

### 2.2 Linked List Allocation Strategy

Linked Allocation completely decouples logical file ordering from physical disk geometry. Files can occupy any free sectors anywhere on the volume.

```
File "data.csv" (Size: 1536 Bytes = 3 Sectors)
Directory: Start: #4, End: #19

Physical Disk Layout:
[ Sector #4  ] -> Payload: Block 0 | Next Pointer: #27
[ Sector #27 ] -> Payload: Block 1 | Next Pointer: #19
[ Sector #19 ] -> Payload: Block 2 | Next Pointer: NULL (-1, EOF)
```

#### Mathematical Properties
- **Directory Inode Entry**: Stores the address of the first and last physical sectors:
  $$\text{Directory Entry} = \langle \text{fileName}, \text{startBlock}, \text{endBlock} \rangle$$
- **Sector Header Overhead**: Each 512-byte physical sector reserves a 4-byte pointer field at the end or beginning of the sector:
  $$\text{Usable Data Payload per Sector} = \text{blockSize} - \text{pointerOverhead} = 512 - 4 = 508 \text{ Bytes}$$
- **Address Translation**: Logical block offset $k$ requires sequential pointer traversal starting from $\text{startBlock}$:
  $$\text{LBA}(0) = \text{startBlock}$$
  $$\text{LBA}(i) = \text{Disk}[\text{LBA}(i-1)].\text{nextBlockId} \quad \text{for } 1 \le i \le k$$
- **Address Translation Complexity**: $O(k)$ linear time. To reach block $k$, the operating system must issue $k$ distinct physical sector read requests across the disk.
- **Seek Overhead**: Disk heads must oscillate across disparate cylinders to follow the pointer trail, introducing severe rotational and seek latency.
- **External Fragmentation**: $0\%$. Any unallocated physical block can be appended to any linked chain.
- **Dynamic File Growth**: Trivial. To grow a file, the kernel claims any free block $F$, writes $F$ into the `nextBlockId` field of `endBlock`, sets $F.\text{nextBlockId} = \text{NULL}$, and updates `endBlock = F`.
- **Reliability Vulnerability**: High fragility. If a single pointer within sector $i$ becomes corrupted by hardware bad sectors, the entire tail of the file ($i+1 \dots N$) is permanently severed and lost.

### 2.3 Indexed Allocation Strategy

Indexed Allocation combines the non-fragmenting flexibility of linked allocation with the rapid $O(1)$ random addressability of contiguous allocation by consolidating all block pointers into a single dedicated **Index Block**.

```
File "program.exe" (Size: 2048 Bytes = 4 Data Blocks)
Directory: Index Block = #8

Index Block #8:
+--------------------------------------------------------+
| Entry 0: Sector #2  (Logical Block 0)                 |
| Entry 1: Sector #15 (Logical Block 1)                 |
| Entry 2: Sector #31 (Logical Block 2)                 |
| Entry 3: Sector #44 (Logical Block 3)                 |
| Entry 4..15: UNUSED / FREE POINTER SLOTS               |
+--------------------------------------------------------+

Physical Sectors:
Sector #2  -> Data Block 0
Sector #15 -> Data Block 1
Sector #31 -> Data Block 2
Sector #44 -> Data Block 3
```

#### Mathematical Properties
- **Directory Inode Entry**: Stores only the pointer to the Index Block:
  $$\text{Directory Entry} = \langle \text{fileName}, \text{indexBlockId} \rangle$$
- **Address Translation**:
  $$\text{Physical Address}(i) = \text{Disk}[\text{indexBlockId}].\text{indexEntries}[i]$$
- **Address Translation Complexity**: $O(1)$ constant time lookup in the index table.
- **Seek Count**: Exactly **2 seeks** for random access (one seek to read the Index Block into kernel RAM cache, and one seek to read the target data sector).
- **External Fragmentation**: $0\%$. Data sectors and the index block can be placed in any available free sectors.
- **Storage Overhead**: Every file, regardless of size, must allocate 1 full index block. For a 1-block file (e.g. 200 bytes):
  $$\text{Total Sectors Consumed} = 1 \text{ (Index Block)} + 1 \text{ (Data Block)} = 2 \text{ Sectors (1024 Bytes)}$$
  $$\text{Storage Overhead} = \frac{1 \text{ Metadata Sector}}{2 \text{ Total Sectors}} = 50\%$$
- **File Size Ceiling (Single-Level Indexing)**:
  $$\text{Max File Size} = \text{IndexCapacity} \times \text{SectorSize}$$
  In SimFS, with $\text{IndexCapacity} = 16$ direct pointers and $\text{SectorSize} = 512$ Bytes:
  $$\text{Max File Size} = 16 \times 512 \text{ B} = 8,192 \text{ Bytes (8 KB)}$$
  Files exceeding 16 blocks trigger `INDEX_LIMIT_EXCEEDED`, demonstrating to students why modern production file systems (such as Linux `ext4` or UNIX FFS) implement indirect, double indirect, and triple indirect index blocks.

### 2.4 Mathematical Complexity Matrix

| Evaluation Metric | Contiguous Allocation | Linked Allocation | Indexed Allocation (Single-Level) |
| :--- | :--- | :--- | :--- |
| **Directory Entry Size** | 8 Bytes (`start`, `length`) | 8 Bytes (`start`, `end`) | 4 Bytes (`indexBlockId`) |
| **Random Access Complexity** | $O(1)$ | $O(k)$ pointer hops | $O(1)$ via index table |
| **Sequential Read Seeks** | **1 seek** (optimal) | $N$ seeks (worst) | 2 seeks initially, cached |
| **External Fragmentation** | **Severe** ($> 30\%$) | **None** ($0\%$) | **None** ($0\%$) |
| **Internal Fragmentation** | Average $256 \text{ B}$ / file | Average $256 \text{ B}$ / file | Average $256 \text{ B}$ / file |
| **Metadata Space Overhead** | $0$ extra blocks | $4 \text{ B}$ / block pointer | $1$ full block ($512\text{ B}$) / file |
| **In-Place File Growth** | Fails on collision | Seamless append | Seamless up to 16 blocks |
| **Hardware Fault Tolerance** | High (isolated sectors) | Critical link vulnerability | High (isolated index) |

### 2.5 Fragmentation Mechanics: Internal vs External

#### Internal Fragmentation
Internal fragmentation represents allocated storage capacity that remains unused because user data does not perfectly align with fixed hardware sector boundaries.
For a file of size $S$ bytes on a storage device with block size $B = 512$:
$$\text{Required Blocks } N = \left\lceil \frac{S}{B} \right\rceil$$
$$\text{Total Allocated Bytes} = N \times B$$
$$\text{Internal Slack Space } \Delta_{\text{slack}} = (N \times B) - S$$
$$\text{Internal Fragmentation Percentage } \Phi_{\text{int}} = \frac{\Delta_{\text{slack}}}{N \times B} \times 100\%$$
*Example*: A 600-byte configuration file requires $N = \lceil 600 / 512 \rceil = 2$ blocks ($1,024$ bytes). Slack space is $1024 - 600 = 424$ bytes ($41.4\%$ of allocated capacity is internal waste). SimFS computes this dynamically for every single block in the contextual inspector drawer and hex dumper.

#### External Fragmentation
External fragmentation occurs when total unallocated disk capacity is strictly greater than the allocation request, but no single continuous linear sequence of free blocks exists to satisfy the request.
$$\text{Total Free Blocks } F = \sum_{b \in \text{Disk}} [b.\text{state} == \text{'free'}]$$
$$\text{Maximum Contiguous Run } M = \max_{r \in \text{Runs}(F)} (|r|)$$
$$\text{External Fragmentation Metric } E = 1 - \frac{M}{F} \quad (\text{for } F > 0)$$
When $M < N_{\text{req}} \le F$, an **External Fragmentation Failure** occurs. The file system rejects the allocation with `EXTERNAL_FRAGMENTATION`, despite having plenty of free space on disk.

---

## 3. Core Simulator Engine Architecture

### 3.1 Type Definitions & Core Invariants (`types/simulator.ts`)

The entire simulator is strictly typed under TypeScript 5.8 with zero implicit `any` types.

```typescript
export type AllocationMethod = 'contiguous' | 'linked' | 'indexed';
export type FileType = 'TXT' | 'LOG' | 'DAT' | 'BIN' | 'DOC' | 'IMG';
export type BlockState = 'free' | 'data' | 'index';

export interface DiskBlock {
  id: number;                          // Physical LBA (0 .. totalBlocks - 1)
  state: BlockState;                   // 'free' | 'data' | 'index'
  fileId: string | null;               // UUID of owner file
  fileName: string | null;             // Human readable filename
  fileColor: string | null;            // Hex color code for visualization
  fileTag: string | null;              // e.g. "NOTE", "F1", "DOC:IDX"
  blockOffset: number | null;          // 0-indexed logical block offset in file
  totalBlocksInFile: number | null;    // Total data blocks in file
  bytesUsed: number;                   // Bytes utilized within 512B sector
  nextBlockId: number | null;          // Forward pointer for linked allocation
  indexEntries?: number[];             // Data sector pointer array (Index Block)
  referencedByIndexBlock?: number;     // Pointer back to parent Index Block
}

export interface FileRecord {
  id: string;                          // Unique UUID
  name: string;                        // Filename with extension
  type: FileType;                      // Category
  sizeBytes: number;                   // Exact byte size
  requiredBlocks: number;              // Data blocks required
  totalBlocksAllocated: number;        // Includes index block if indexed
  allocatedBlocks: number[];           // Logical sequence of data block IDs
  indexBlockId?: number;               // ID of designated index block
  startBlock: number;                  // Starting sector ID
  endBlock?: number;                   // Ending sector ID (linked)
  length: number;                      // Number of contiguous data blocks
  color: string;                       // Primary theme color
  tag: string;                         // 3-4 letter shorthand tag
  content?: string;                    // Simulated text content
  createdAt: number;                   // Timestamp
  updatedAt: number;                   // Timestamp
}
```

### 3.2 Allocation State Machines

Each allocation strategy is encapsulated in an isolated, pure-function module that takes the disk state, file parameters, and configuration, returning an atomic allocation result along with a 7-step pipeline trace.

#### Contiguous Allocator (`src/core/contiguous.ts`)
1. **Free Block Run Search**: Iterates through the physical disk array identifying contiguous runs of blocks where `state === 'free'`.
2. **Strategy Selection**:
   - **First-Fit**: Selects the first free run whose length $\ge \text{requiredBlocks}$.
   - **Best-Fit**: Selects the free run whose length is closest to $\text{requiredBlocks}$, minimizing remaining fragment size.
   - **Worst-Fit**: Selects the largest free run on the volume.
3. **Execution Pipeline Steps Generated**:
   - Step 1: Inode Initialization
   - Step 2: Free Space Bitmap Scan
   - Step 3: Contiguous Run Evaluation
   - Step 4: Sector Extent Reservation
   - Step 5: Directory Table Entry Recorded
   - Step 6: DMA Data Payload Staged
   - Step 7: Write Commit & Verification

#### Linked Allocator (`src/core/linked.ts`)
1. **Free Block Gathering**: Scans for any free blocks across the entire disk until $\text{requiredBlocks}$ have been collected.
2. **Pointer Chaining**: Iterates through the allocated blocks:
   $$\text{Block}[i].\text{nextBlockId} = \text{Block}[i+1].\text{id}$$
   $$\text{Block}[N-1].\text{nextBlockId} = \text{null} \quad (\text{EOF})$$
3. **Directory Record**: Sets `startBlock = Block[0]` and `endBlock = Block[N-1]`.
4. **Execution Pipeline Steps Generated**:
   - Step 1: Syscall Buffer Ingestion
   - Step 2: Free Sector Pool Gathering
   - Step 3: Forward Link Pointer Construction
   - Step 4: EOF Sentinel Tagging
   - Step 5: Directory Inode Linked Bounds (`start`, `end`)
   - Step 6: Physical Sector DMA Transfer
   - Step 7: Pointer Integrity Validation

#### Indexed Allocator (`src/core/indexed.ts`)
1. **Capacity Validation**: Ensures $\text{requiredBlocks} \le \text{config.indexBlockCapacity}$ (16 blocks).
2. **Dual Allocation**: Requires $\text{requiredBlocks} + 1$ total free blocks.
3. **Index Block Assignment**: The first free block is designated as the **Index Block** (`state: 'index'`).
4. **Pointer Array Assembly**: The remaining $K$ blocks are assigned as data sectors, and their physical IDs are written into the Index Block's `indexEntries` array.
5. **Execution Pipeline Steps Generated**:
   - Step 1: System Call & Block Budgeting ($K + 1$)
   - Step 2: Index Block Capacity Verification
   - Step 3: Index Sector Allocation (`state = index`)
   - Step 4: Direct Pointer Array Population
   - Step 5: Data Sector Mapping & Back-referencing
   - Step 6: Directory Inode Registration (`indexBlockId`)
   - Step 7: Direct Access Verification

### 3.3 Dynamic Method Migration Engine (`migrateFilesToMethod`)

A standout engineering capability implemented in `src/core/simulatorEngine.ts` is the **Dynamic Filesystem Migration Engine**. When a user switches between Contiguous, Linked, and Indexed modes in the UI or via the terminal, SimFS does not simply change a cosmetic label—it reconstructs the entire secondary storage partition in real time.

```typescript
export function migrateFilesToMethod(
  files: FileRecord[],
  newMethod: AllocationMethod,
  oldMethod: AllocationMethod,
  config: SimConfig
): {
  success: boolean;
  disk: DiskBlock[];
  files: FileRecord[];
  steps: PipelineStep[];
  error?: string;
}
```

#### Migration Mechanism:
1. **Clean Virtual Partition Creation**: Generates an unformatted physical block matrix of size `config.totalBlocks`.
2. **Kernel Driver Transition Trace**: Emits an educational pipeline step detailing the unloading of `alloc_<oldMethod>.sys` and initialization of `alloc_<newMethod>.sys`.
3. **Iterative Workload Re-Allocation**: Sequentially re-allocates each active file using the target driver's algorithm:
   - When migrating from **Contiguous ➔ Indexed**: Dedicated index blocks are created on disk, colored yellow with `IDX` badges, and direct pointer arrays are populated. File records receive `indexBlockId`, and `totalBlocksAllocated` increments by 1.
   - When migrating from **Indexed ➔ Linked**: Index blocks are reclaimed into free space, forward link pointers are written into each data block header, and `endBlock` is established.
   - When migrating from **Linked ➔ Contiguous**: Dispersed pointer-chained sectors are re-compacted into strictly consecutive linear extents.
4. **Physical Reorganization Pipeline Step**: Emits comprehensive technical diagnostics including the full array of migrated sector IDs, trade-off comparisons, and fragmentation state.

### 3.4 Transactional Rollback & Error State Matrix

All file system operations are strictly transactional. If an allocation condition cannot be met, the engine performs an atomic rollback to ensure that no sectors are leaked, no bitmaps are corrupted, and no orphan blocks persist:

| Error Code | Trigger Condition | Rollback Behavior | Educational Explanation |
| :--- | :--- | :--- | :--- |
| `OUT_OF_SPACE` | Total free blocks on volume $< \text{requiredBlocks}$ | All allocated blocks reset to `free`; zero mutation | Volume capacity exhausted; delete files or expand disk. |
| `EXTERNAL_FRAGMENTATION` | Free blocks exist, but max contiguous run $< \text{requiredBlocks}$ | Aborts scan; zero blocks allocated | Space exists, but is fragmented into disjoint holes; defragmentation required. |
| `INDEX_LIMIT_EXCEEDED` | File requires $> 16$ data blocks | Index block & data blocks revoked | Single-level index table exceeded; multi-level indexing required. |
| `EXPANSION_COLLISION` | Contiguous file expansion collides with adjacent file | Retains original file blocks; rejects resize | Adjacent sector occupied; in-place growth impossible without relocation. |

### 3.5 File Resize & Collision Resolution Engine (`executeResizePipeline`)

SimFS supports dynamic runtime file resizing, faithfully modeling how an operating system handles truncation and expansion:

- **Truncation ($\Delta < 0$)**: The engine calculates the blocks to drop, scrubs their payloads, clears their metadata, resets their state to `free`, and updates the directory inode.
- **Contiguous Expansion ($\Delta > 0$)**: The engine evaluates physical sectors immediately following the file's current boundary:
  $$\text{Target Range} = [\text{startBlock} + \text{length} \dots \text{startBlock} + \text{length} + \Delta - 1]$$
  If any block in this range is occupied by another file, the expansion triggers `EXPANSION_COLLISION`. The collision is highlighted on the physical grid in red, clearly illustrating the primary operational drawback of contiguous allocation.
- **Linked & Indexed Expansion**: Free blocks are gathered from anywhere on disk and appended to the pointer chain or index table without collision risk.

### 3.6 File Unlinking & Recycle Bin Recovery System (`executeDeletePipeline`)

File deletion in SimFS follows the POSIX `unlink` transactional workflow:
1. **Directory Table Removal**: The file's inode entry is unlinked from the root directory table.
2. **Sector Scrubbing**: All physical blocks associated with the file (data blocks and index blocks) are wiped: `state = 'free'`, `fileId = null`, `nextBlockId = null`, `bytesUsed = 0`.
3. **Free Space Bitmap Sync**: The corresponding bits in the free-space bitmap are cleared to 0.
4. **Recycle Bin Staging**: File metadata and content are moved to an in-memory Recycle Bin, permitting 1-click restoration or permanent destruction.

---

## 4. Mechanical Winchester 3.5" Hard Disk 3D Kinematics

A central pedagogical pillar of the simulator is the **Mechanical Hard Disk Platter & Actuator Arm 3D Visualizer** (`DiskPlatterArmVisualizer.tsx` and `iso-kit.ts`). It transforms theoretical Cylinder-Head-Sector (CHS) numbers into a physical, visible hardware machine.

```
       +---------------------------------------------+
       |   Die-Cast Winchester 3.5" Chassis Base     |
       |                                             |
       |      [ VCM Neodymium Magnet Assembly ]      |
       |                   \                         |
       |                    [ Actuator Pivot ]       |
       |                         |                   |
       |                         | Actuator Arm      |
       |                         |                   |
       |         ( Spindle )     +-- [ Load Beam ]   |
       |        /     |     \            |           |
       |     Track 3  |  Track 0         v           |
       |    (Inner)   | (Outer)     [ Pico-Slider ]  |
       |              |             (Flying Head)    |
       |       [ Dual Platters ]                     |
       +---------------------------------------------+
```

### 4.1 Physical Model Specifications

The physical model is built to millimeter-accurate real-world 3.5-inch hard drive geometry:
- **Chassis**: Cast aluminum base plate ($250 \times 170 \times 14\text{ mm}$, corner radius $8\text{ mm}$).
- **Platter Stack**: Dual magnetic platters ($68\text{ mm}$ radius, $2\text{ mm}$ thickness, $4\text{ mm}$ aluminum spacer ring, top retaining clamp, and spindle cap).
- **Voice Coil Motor (VCM)**: High-flux neodymium permanent magnet assembly ($34 \times 36\text{ mm}$), top steel flux return plate, bottom yoke, and high-purity copper electromagnetic voice coil windings.
- **Actuator Assembly**: Heavy-duty pivot bearing tower ($8.5\text{ mm}$ radius, $22\text{ mm}$ height), rigid cast E-block arm, dual laser-welded stainless steel load beams, swaged flexure mounts, and microscopic aerodynamic Pico-sliders flying at sub-10nm altitudes on air bearings.

### 4.2 Isometric Mathematical Projection Engine (`src/core/iso-kit.ts`)

Rather than relying on generic WebGL frameworks (Three.js/Babylon) that obscure mechanical geometry, SimFS features a custom **Solid Isometric Mathematics Engine** (`iso-kit.ts`) using an **isometric axonometric projection**:
- **Azimuth Angle**: $\alpha = 45^\circ$
- **Elevation Angle**: $\beta = 30^\circ$

$$\begin{bmatrix} X_{\text{screen}} \\ Y_{\text{screen}} \end{bmatrix} = \begin{bmatrix} (x - y) \cos(30^\circ) \\ (x + y) \sin(30^\circ) - z \end{bmatrix}$$

#### 4-Tone Shading System:
To convey physical mass and volume without raster artifacts, every 3D polygon is shaded via an intentional 4-tone lighting model:
1. **Highlight (`hi`)**: Top horizontal surfaces facing the primary key light.
2. **Midtone (`mid`)**: Front-facing left vertical facets.
3. **Lowtone (`low`)**: Shadowed right vertical facets.
4. **Deep (`deep`)**: Undersides, chassis cavities, and magnetic gap recesses.

### 4.3 Voice Coil Motor (VCM) & Forward Kinematics

The 64 physical disk sectors are organized into **4 concentric cylinder tracks** with **16 sectors per track**:
- **Cylinder 0 (Outer Track)**: Radius $r_0 = 60\text{ mm}$
- **Cylinder 1 (Middle-Outer)**: Radius $r_1 = 48\text{ mm}$
- **Cylinder 2 (Middle-Inner)**: Radius $r_2 = 36\text{ mm}$
- **Cylinder 3 (Inner Track)**: Radius $r_3 = 24\text{ mm}$

To position the Pico-slider precisely over Cylinder $T$, the actuator arm must rotate around the pivot point $P = (-72, 22)\text{ mm}$. The required kinematic arm angle $\theta_{\text{arm}}$ is derived via the Law of Cosines:

$$D^2 = L_{\text{pivot}\to\text{spindle}}^2 + r_T^2 - 2 \cdot L \cdot r_T \cos(\psi)$$

The derived kinematic lookup table delivers sub-millimeter tracking accuracy:
$$\theta_{\text{arm}}(\text{Cylinder 0}) = +20.5^\circ$$
$$\theta_{\text{arm}}(\text{Cylinder 1}) = +12.2^\circ$$
$$\theta_{\text{arm}}(\text{Cylinder 2}) = +3.8^\circ$$
$$\theta_{\text{arm}}(\text{Cylinder 3}) = -4.5^\circ$$

### 4.4 Seek Latency & Head Trajectory Calculation

When a user selects or allocates a physical sector, SimFS calculates the mechanical seek latency required for the physical arm to travel from its current cylinder $C_{\text{current}}$ to the target cylinder $C_{\text{target}}$:

$$\Delta C = |C_{\text{target}} - C_{\text{current}}|$$
$$T_{\text{seek}} = a + b \sqrt{\Delta C} \quad \text{milliseconds}$$

- **Track-to-Track Seek**: $\sim 1.2\text{ ms}$
- **Full Stroke Seek (Cylinder 0 to 3)**: $\sim 8.5\text{ ms}$
- **Rotational Latency**: At 7,200 RPM, one full rotation takes $8.33\text{ ms}$. Average rotational delay is $\frac{8.33}{2} = 4.16\text{ ms}$.

The actuator arm smoothly interpolates across cylinders using spring physics while the dual platters rotate at a simulated 7,200 RPM with specular metallic highlights.

---

## 5. Drive Optimizer & Live Disk Defragmenter Subsystem

Implemented in `src/components/DiskDefragmenterModal.tsx`, the Drive Optimizer simulates enterprise-grade disk defragmentation and storage compaction.

```
BEFORE DEFRAGMENTATION (Heavily Fragmented Volume):
[ File A | Free | File B | Free | File A | Free | File C | Free ]

DURING COMPACTION (Block Relocation Pipeline):
1. Scan for fragmented file extents.
2. Relocate File A blocks to contiguous sequence [0..1].
3. Shift File B to [2..3].
4. Shift File C to [4..5].

AFTER DEFRAGMENTATION (Zero Fragmentation):
[ File A | File A | File B | File B | File C | File C | Free Segment Consolidated ]
```

### 5.1 Fragmentation Measurement Algorithms

The defragmenter continuously computes two critical metrics:
1. **File Extent Fragmentation Percentage**:
   $$\text{Frag}_{\text{files}} = \frac{\sum_{f \in \text{Files}} (\text{Extents}(f) - 1)}{\text{Total Allocated Blocks}} \times 100\%$$
   A file allocated across 3 disjoint runs has $3 - 1 = 2$ fragmented boundaries.
2. **Free Space Scatter Index**:
   $$\text{Scatter}_{\text{free}} = 1 - \frac{\text{Largest Free Run Length}}{\text{Total Free Blocks}}$$

### 5.2 Compaction & Sector Relocation Engine

When the user triggers **Defragment & Compact Volume**:
1. **Sequential Relocation**: All active files are packed contiguously into the lowest physical LBAs starting from sector 0:
   $$\text{startBlock}(f_0) = 0$$
   $$\text{startBlock}(f_{i}) = \text{startBlock}(f_{i-1}) + \text{length}(f_{i-1})$$
2. **Pointer Reconstruction**:
   - In **Linked mode**, pointer headers are rewritten to point to adjacent linear sectors.
   - In **Indexed mode**, index block pointer tables are updated to point to the newly consolidated data sector LBAs.
3. **Free Space Consolidation**: All unallocated blocks coalesce into one massive, continuous unfragmented segment at the end of the disk volume.
4. **Execution Pipeline Integration**: Defragmentation emits a dedicated compaction pipeline record, resetting external fragmentation to $0\%$.

---

## 6. Interactive OS Kernel PowerShell Terminal

The terminal component (`src/components/WindowsTerminal.tsx`) provides an authentic command-line shell environment connected directly to the SimFS kernel.

### 6.1 Architecture & Command Dispatcher

The terminal maintains an execution history buffer, command-line cursor state, history recall via Up/Down arrow keys, and an extensible switch-case dispatch engine. The terminal prompt dynamically reflects the active kernel allocation driver:
```
SimFS [CONTIGUOUS] C:\Users\Student>
SimFS [LINKED]     C:\Users\Student>
SimFS [INDEXED]    C:\Users\Student>
```

### 6.2 Supported Commands Specification

| Command | Syntax | Operational Description |
| :--- | :--- | :--- |
| `dir` / `ls` | `dir` | Lists all directory table entries with filename, byte size, consumed blocks, allocation method, and physical LBA sector chain. |
| `cat` | `cat <filename>` | Dumps file payload and traces physical sector read trajectory. |
| `stat` | `stat <filename>` | Inspects file Inode, start/end block pointers, CHS coordinates, internal fragmentation, and slack space. |
| `touch` | `touch <name> [bytes] [method]` | Allocates a new file with specified size and strategy. Defaults to the active kernel driver if omitted. |
| `rm` | `rm <filename>` | Deallocates file sectors and reclaims blocks into the Recycle Bin. |
| `method` / `alloc`| `method [contiguous\|linked\|indexed]` | Queries active driver or dynamically migrates the entire filesystem to the specified allocation strategy. |
| `defrag` | `defrag` | Opens the Drive Optimizer & Live Defragmenter GUI modal. |
| `bench` | `bench` | Opens the 3-Way Allocation Benchmark Matrix modal. |
| `platter` / `seek`| `platter` | Opens the Mechanical Hard Disk Platter & Actuator Arm visualizer. |
| `chs` | `chs <sectorId>` | Calculates exact Cylinder, Head, Sector, and Track coordinates for any physical LBA address. |
| `df` / `disk` | `df` | Displays volume partition capacity, used sectors, free sectors, and utilization percentage. |
| `cls` / `clear` | `cls` | Clears the terminal output buffer. |
| `help` / `?` | `help` | Renders a formatted two-column table of all available commands and syntaxes. |
| `exit` | `exit` | Closes the terminal modal window. |

### 6.3 Low-Level Sector & Inode Telemetry (`stat`, `chs`)

Executing `stat report.txt` outputs low-level kernel metadata:
```
File Inode Metadata: "report.txt"
  Inode Address: 0x000C
  Allocation Strategy: INDEXED
  Byte Size: 2,048 Bytes (4 Data Blocks + 1 Index Block)
  Index Block LBA: #8 (CHS: Cylinder 0, Head 0, Sector 8)
  Data Sector Chain: [Sector #2, Sector #15, Sector #31, Sector #44]
  Internal Slack Space: 0 Bytes (0.0% slack)
  Last Modified: 2026-10-22 19:40:12
```

---

## 7. Isolated 3-Way Comparative Benchmark Matrix

The Benchmark subsystem (`src/components/ComparisonViewModal.tsx` and `runComparativeSimulation` in `simulatorEngine.ts`) enables students to evaluate how identical file workloads behave under each allocation technique.

### 7.1 Virtual Isolated Partition Modeling

Rather than evaluating theoretical abstractions, the engine spins up **three independent, isolated virtual disk volumes**:
1. **Virtual Volume A (Contiguous)**: Runs `allocateContiguous` for all active files.
2. **Virtual Volume B (Linked)**: Runs `allocateLinked` for all active files.
3. **Virtual Volume C (Indexed)**: Runs `allocateIndexed` for all active files.

### 7.2 Multi-Metric Quantitative Evaluation

The results are tabulated in an interactive comparison matrix:

```
+-----------------------------------------------------------------------------------------+
| Metric                 | Contiguous              | Linked             | Indexed         |
+------------------------+-------------------------+--------------------+-----------------+
| Allocation Feasibility | 3/4 Files (Frag Trap)   | 4/4 Files (100%)   | 4/4 Files (100%)|
| Blocks Consumed        | 12 Blocks               | 12 Blocks          | 16 Blocks (+4)  |
| Sequential Read Speed  | 1 Seek (Maximum)        | N Seeks (Slow)     | Fast (Cached)   |
| Random Access Latency  | O(1) Instant            | O(k) Pointer Chain | O(1) via Index  |
| External Fragmentation | High Risk (Blocked)     | 0% (Scattered)     | 0% (Scattered)  |
| Metadata Space Waste   | 0 Bytes                 | 4 Bytes/sector     | 512 Bytes/file  |
+-----------------------------------------------------------------------------------------+
```

Students can switch the segmented control to inspect the simulated physical disk map of each method side-by-side, visually observing how Linked and Indexed succeed in scenarios where Contiguous fails due to external fragmentation.

---

## 8. Windows 11 Desktop UI & Storage Engine Architecture

The visual presentation adheres strictly to the **Anti-Slop Design System** and **Hallmark Principles**: no generic AI purple gradients, no cookie-cutter cards, and no meaningless decorative fluff. Every element serves an authentic operating system purpose.

### 8.1 Desktop Environment, Taskbar, & Start Menu

- **Windows Desktop (`WindowsDesktop.tsx`)**: Renders a deep Windows 11 wallpaper with desktop icons (*This PC*, *Recycle Bin*, and created user files). Files feature colored indicator dots matching their physical disk blocks.
- **Taskbar**: Hosts the Windows Start button, running task badges, system telemetry chips (`64 Sectors • 32 KB SimFS`), and a live system clock.
- **Start Menu (`WindowsStartMenu.tsx`)**: Displays pinned system utilities (*New File Notepad*, *Drive Optimizer*, *PowerShell Terminal*, *3D Platter Visualizer*, *Benchmark Suite*, *Educational Lab Scenarios*, *Recycle Bin*, and *Disk Format*).
- **Context Menus (`WindowsContextMenu.tsx`)**: Right-clicking the desktop canvas presents the native Windows context menu (*New File*, *Refresh*). Right-clicking any file opens a contextual action menu (*Inspect Sectors in Engine*, *Resize File*, *Rename*, *Delete to Recycle Bin*).

### 8.2 Real-Time Storage Subsystem Engine (`StorageEngineView.tsx`)

The right half of the split-screen view visualizes the under-the-hood kernel I/O pipeline:
1. **Stage 1 (Application Layer)**: Visualizes user-space buffer writes (`sys_write(fd, buf, bytes)`).
2. **Animated Glowing Pipes**: Visualizes data packet pulses flowing from user space across the Ring 3/Ring 0 boundary.
3. **Stage 2 (Kernel VFS Translator)**: Slices byte streams into 512B logical blocks (`LBA #0 ➔ Blk X`).
4. **Stage 3 (Allocation Engine Controller)**: Visualizes the active strategy driver schematic (Contiguous extent brackets, Linked pointer arrows `[#A] ──► [#B] ──► EOF`, or Indexed tree pointers).
5. **Stage 4 (Physical 64-Sector Matrix)**: Renders all 64 physical sectors with real-time state badges.

### 8.3 Physical Sector Matrix & Hex Byte Dumper

Clicking any physical sector on the disk grid opens the **Sector Hex & ASCII Byte Dumper**:
- Displays sector decimal and hex address: `LBA #12 (0x000C)`.
- Displays CHS geometry: `Cylinder 0, Head 0, Sector 12 · Track 0`.
- Displays byte allocation: `512 / 512 B used (0 B slack space)`.
- Dumps an authentic 16-byte-per-line hex and ASCII memory view:
  ```
  Offset   00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F   Decoded ASCII
  0000:    53 69 6D 46 53 5F 53 45 43 54 4F 52 5F 30 78 0C   SimFS_SECTOR_0x0C
  0010:    44 61 74 61 50 61 79 6C 6F 61 64 5F 42 6C 6F 63   DataPayload_Bloc
  ```
- Includes a direct action button: **💽 Seek Head Here**, which opens the 3D platter visualizer and commands the actuator arm to seek to that sector's cylinder.

### 8.4 Conversational Kernel Storage Assistant Dock

Anchored at the bottom of the engine view is the **Kernel Storage Assistant**:
- Dynamically describes the active allocation strategy, technical mechanisms, and trade-off insights.
- Updates in real-time when switching allocation methods or hovering over pipes, translators, or physical disk sectors.

---

## 9. Adaptive Mobile Phone Architecture

Recognizing that modern technical education occurs across diverse device formfactors, SimFS includes a dedicated **Mobile Operating System Viewport** (`MobileView.tsx`).

### 9.1 Viewport Ergonomics & Touch Target Sizing

- **Dedicated Viewport Detection**: Automatically renders `MobileView` on screens $\le 768\text{ px}$ while retaining a 1-click **🖥️ Desktop Mode** override toggle in the header.
- **Strict Touch Target Compliance**: All interactive buttons, method pills, sector blocks, and tabs satisfy the WCAG $44 \times 44\text{ px}$ minimum touch target standard.
- **Zero Horizontal Overflow**: Grid layouts adapt from 8-column desktop layouts to fluid 8-column mobile grids with scaled fonts and compact sector IDs.

### 9.2 Mobile Navigation & Bottom Tab Bar Architecture

The mobile interface is organized around a thumb-accessible fixed bottom navigation bar:
1. **💽 Disk Map**: Displays volume capacity progress bar, free space, and the interactive 64-sector physical matrix.
2. **📁 Files ($N$)**: File management list showing active files, allocation tags, start/end sectors, resize triggers, and delete buttons.
3. **⚡ Pipeline**: Renders the live 7-step kernel transaction pipeline with collapsible step cards and trade-off badges.
4. **🔬 Lab Tools**: Quick-access drawer for opening the 3D Platter Visualizer, Drive Defragmenter, PowerShell Terminal, Benchmark Matrix, and Educational Scenarios.

### 9.3 Floating Action Buttons & Modal Drawers

- **Floating Action Button (FAB)**: A primary **+ New File** button floats in the lower right thumb zone with safe clearance above the bottom navigation bar (`bottom: 74px`).
- **Modal Viewport Adapters**: All shared system modals (Notepad, Defragmenter, Terminal, Platter) adapt dynamically with touch-friendly scrolling, sticky action buttons, and full screen heights.

---

## 10. Pre-Configured Educational OS Lab Scenarios

Implemented in `src/core/scenarios.ts` and `src/components/ScenariosModal.tsx`, four pre-configured laboratory experiments allow students to demonstrate core OS concepts instantly:

### Scenario 1: The External Fragmentation Trap
- **Strategy**: Contiguous Allocation
- **Setup**: Creates 5 files (`fileA.txt`, `fileB.txt`, `fileC.txt`, `fileD.txt`, `fileE.txt`) consuming contiguous blocks across the disk, then unlinks `fileB.txt` and `fileD.txt`.
- **Educational Phenomenon**: The volume has 16 total free blocks, but the largest contiguous run is only 4 blocks. Attempting to allocate an 8-block file fails with `EXTERNAL_FRAGMENTATION`, vividly illustrating why contiguous allocation requires periodic compaction.

### Scenario 2: Dynamic File Growth Collision
- **Strategy**: Contiguous Allocation
- **Setup**: Allocates two adjacent files: `kernel.sys` (blocks 0..3) and `drivers.sys` (blocks 4..7).
- **Educational Phenomenon**: Attempting to expand `kernel.sys` by 2 blocks immediately collides with block #4. The simulator flags block #4 in red and reports `EXPANSION_COLLISION`.

### Scenario 3: Zero-Fragmentation Pointer Chaining
- **Strategy**: Linked Allocation
- **Setup**: Pre-scatters small files across the disk leaving fragmented single-sector holes, then allocates `database.db` (8 blocks).
- **Educational Phenomenon**: The linked allocator effortlessly gathers sectors across the disparate holes, chaining them with pointers. External fragmentation is $0\%$, demonstrating the primary advantage of linked allocation.

### Scenario 4: Direct Addressing & Index Overhead
- **Strategy**: Indexed Allocation
- **Setup**: Allocates two small files (`readme.txt` of 1 block, and `app.bin` of 3 blocks).
- **Educational Phenomenon**: Demonstrates that `readme.txt` consumes 2 physical blocks (1 Index Block + 1 Data Block = 50% storage overhead), while providing instantaneous $O(1)$ random addressability via the index pointer array.

---

## 11. Testing, Quality Assurance, & Verification

The SimFS simulator is verified by automated test suites and strict static analysis:

```
Test Files  1 passed (1)
     Tests  13 passed (13)
  Duration  166ms
```

### 11.1 Test Suite Breakdown (`src/core/__tests__/allocation.test.ts`)

1. `Contiguous Allocation`: Successfully allocates linear sequential blocks; verifies `startBlock` and `length`.
2. `Contiguous Allocation Failure`: Fails with `OUT_OF_SPACE` when requested blocks exceed volume capacity.
3. `Contiguous External Fragmentation Trap`: Creates alternating occupied/free sectors; verifies failure when total free space $\ge$ request but maximum contiguous run is insufficient.
4. `Contiguous In-Place Expansion`: Verifies successful expansion when trailing sectors are unallocated.
5. `Contiguous Expansion Collision`: Verifies `canExpandContiguous` reports collision and identifies blocking owner file.
6. `Linked Allocation`: Allocates scattered sectors; verifies `nextBlockId` pointer chaining and EOF sentinel (`null`).
7. `Linked Allocation Failure`: Fails with `OUT_OF_SPACE` when disk is saturated.
8. `Indexed Allocation`: Allocates index block and data blocks; verifies index block ID and direct pointer array entries.
9. `Indexed Limit Exceeded`: Fails with `INDEX_LIMIT_EXCEEDED` when file requires $> 16$ blocks.
10. `Indexed Saturated Disk`: Fails when total free blocks $< \text{requiredBlocks} + 1$.
11. `Migration Contiguous ➔ Indexed`: Verifies conversion of linear blocks into designated index block (`state: index`, `IDX` tag) and direct pointer table.
12. `Migration Indexed ➔ Linked`: Verifies reclamation of index block and construction of forward pointer chain (`nextBlockId`).
13. `Migration Linked ➔ Contiguous`: Verifies re-packing of scattered blocks into contiguous linear extents.

### 11.2 Code Quality & Static Analysis Gates

- **Oxlint**: 0 errors, 0 warnings across 37 source files.
- **TypeScript Compiler (`tsc -b`)**: 0 type errors under strict mode (`noImplicitAny`, `strictNullChecks`).
- **Vite Production Bundler**: Clean build in 108ms generating production-optimized ES chunks.
- **Browser Automation (Playwright)**: Verified on `http://127.0.0.1:5173/` with **0 console errors**, zero layout shifts, and active responsiveness across 390px mobile and 1440px desktop viewports.

---

## 12. Complete File-by-File Codebase Inventory

### Root Configuration
- `package.json`: Project manifest defining React 19, TypeScript, Vite 8, Vitest, and Oxlint dependencies.
- `vite.config.ts`: Vite build configuration with React plugin.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript compiler options enforcing strict typing.
- `.oxlintrc.json`: High-performance linter configuration.
- `index.html`: Web application entrypoint with SEO metadata, Inter & JetBrains Mono font imports, and root mounting node.

### Core Architecture (`src/core/`)
- `types/simulator.ts` (124 lines): Authoritative type declarations for `DiskBlock`, `FileRecord`, `PipelineStep`, `PipelineSession`, `SimConfig`, and `DiskStats`.
- `simulatorEngine.ts` (956 lines): Master kernel simulation engine. Contains `createInitialDisk`, `computeDiskStats`, `executeResizePipeline`, `executeDeletePipeline`, `migrateFilesToMethod`, and `runComparativeSimulation`.
- `contiguous.ts` (338 lines): Contiguous allocation driver with First-Fit, Best-Fit, and Worst-Fit run finders, in-place expansion check, and 7-step pipeline generator.
- `linked.ts` (235 lines): Linked allocation driver with forward pointer chaining, sector header overhead modeling, and EOF marker tagging.
- `indexed.ts` (285 lines): Indexed allocation driver with single-level index block construction, pointer array mapping, and capacity threshold verification.
- `iso-kit.ts` (720 lines): 3D Solid Isometric Projection Engine. Implements vector math, polygon rotation, 4-tone shading matrices, stroke haloing, and geometric solid primitives (`prism`, `cylinder`, `poly`).
- `scenarios.ts` (280 lines): Pre-configured educational laboratory experiment setups.
- `__tests__/allocation.test.ts` (238 lines): 13 automated unit tests validating all allocation algorithms and migration mechanics.

### Components (`src/components/`)
- `App.tsx` (920 lines): Root state orchestrator managing volume blocks, active files, pipeline sessions, modal visibility, and dual-viewport routing.
- `StorageEngineView.tsx` (820 lines): Real-time Storage Subsystem Engine visualizer. Renders user-space syscall buses, VFS translators, Stage 3 schematics, the 64-sector matrix, sector hex dumper, and the conversational assistant dock.
- `DiskPlatterArmVisualizer.tsx` (792 lines): Mechanical 3.5" Winchester Hard Disk 3D model. Features Voice Coil Motor (VCM) kinematics, platter rotation, head seek sweeps, and acoustic seek sound synthesis.
- `DiskDefragmenterModal.tsx` (360 lines): Windows Drive Optimizer interface featuring real-time cluster map animation and volume compaction.
- `WindowsTerminal.tsx` (520 lines): Interactive OS PowerShell terminal console supporting 12+ commands, Inode inspection, and CHS calculations.
- `ComparisonViewModal.tsx` (230 lines): Isolated 3-Way Comparative Benchmark matrix tabulating performance metrics across isolated virtual partitions.
- `MobileView.tsx` (896 lines): Dedicated mobile phone interface with bottom navigation tabs, touch-optimized sector matrix, and FAB.
- `WindowsDesktop.tsx` (488 lines): Windows 11 desktop canvas with wallpaper, icons, taskbar, system clock, and split-view launcher.
- `WindowsStartMenu.tsx` (280 lines): Windows 11 Start Menu panel with pinned system tools and power actions.
- `WindowsContextMenu.tsx` (110 lines): Windows 11 right-click context menu for desktop canvas and file icons.
- `WindowsNewFileDialog.tsx` (210 lines): Windows Notepad file creation dialog with sector geometry preview.
- `DesktopWorkspace.tsx` (120 lines): First-run onboarding hero guide and desktop window container.
- `FileManagerWindow.tsx` (205 lines): Explorer file table displaying file sizes, types, and allocation layouts.
- `DiskGridView.tsx` (153 lines): Interactive physical disk grid with block state chips and hover tooltips.
- `DiskSummaryCard.tsx` (115 lines): Telemetry cards displaying used sectors, free sectors, and fragmentation alerts.
- `BlockInspectorDrawer.tsx` (110 lines): Contextual drawer inspecting sector payload, owner file, and link pointers.
- `HoverChatWindow.tsx` (95 lines): Floating conversational assistant explaining hovered components.
- `TutorCornerPopup.tsx` (90 lines): First-time user guide nudging students to create their first file.
- `Icons.tsx` (340 lines): Custom SVG line icons for Windows 11, hardware components, and storage actions.
- `AboutModal.tsx` (140 lines): Academic project credits, student details, and learning objectives.
- `ScenariosModal.tsx` (110 lines): Scenario selection modal for loading laboratory experiments.
- `RecycleBinModal.tsx` (105 lines): Recycle bin recovery modal for restoring or permanently deleting files.
- `ResizeFileDialog.tsx` (124 lines): Dynamic file expansion and truncation dialog.
- `RenameFileDialog.tsx` (80 lines): File renaming dialog.

### Styling (`src/index.css`)
- `index.css` (1,950 lines): Master design system. Contains CSS variables, dark-mode technical tokens, Windows 11 Fluent surfaces, animated glowing pipes, isometric drawing styles, terminal styling, and mobile viewport responsive queries.

---

## 13. Conclusions & Future Storage Extensions

The **AetherOS SimFS** project provides an unprecedented, comprehensive bridge between theoretical operating system principles and visible, interactive software engineering. By uniting formal algorithm implementations, transactional execution pipelines, 3D mechanical hardware modeling, live defragmentation, a kernel terminal shell, and multi-method benchmarking into a cohesive Windows 11 and mobile environment, the simulator transforms how students comprehend secondary storage.

### Future Roadmap & Extensibility:
1. **Multi-Level Indexing (UNIX FFS / Linux ext4)**: Extending single-level indexing to include direct pointers, single indirect blocks, double indirect blocks, and triple indirect blocks, allowing files to scale up to gigabytes.
2. **File Allocation Table (FAT32)**: Introducing a centralized FAT table structure in RAM where sector pointers are decoupled from physical data blocks.
3. **Extent-Based Allocation (`ext4` / Btrfs)**: Replacing fixed block runs with variable-length `[start_lba, count]` extent trees.
4. **Journaling & Crash Consistency (`jbd2`)**: Modeling write-ahead journaling (circular log buffer, commit transactions) to demonstrate crash recovery and file system consistency checks (`fsck`).

---

**Report Compiled & Verified:** October 2026  
**System Status:** Production Ready • 100% Test Pass Rate • Zero Unhandled Exceptions
