# Visual Simulator for File Allocation Techniques in Operating Systems

**Course:** Operating System Principles  
**Student:** Jaijitesh Suryaprakash  
**Registration Number:** 25BIT0235  
**Project Repository:** https://github.com/BerrF35/File-Allocation-Simulator

---

## 1. Overview & Educational Purpose

This interactive visual simulator demonstrates how an Operating System manages secondary storage allocation. Rather than presenting static theory, the simulator immerses the user in an **operating system desktop and disk architecture environment (AetherOS FS-SIM)** where every file operation triggers genuine, transactional storage algorithms and an OS execution pipeline.

The simulator implements the three classical file allocation techniques:
1. **Contiguous Allocation**
2. **Linked Allocation**
3. **Indexed Allocation**

### Key Educational Features
- **Two-Stage User Journey:** Starts with a clean simulated desktop inviting the student to create their first file; smoothly transitions upon saving into a **Split View** (Simulated Computer & Disk on the left, Live OS Execution Pipeline on the right).
- **4-Quadrant Step Explanation:** Every execution step breaks down into:
  - **WHAT HAPPENED:** Clear description of the physical operation.
  - **WHY IT HAPPENED:** Underlying OS theory and kernel context.
  - **WHAT CHANGED:** Specific sectors, pointers, and metadata altered.
  - **TRADE-OFF:** Speed, storage efficiency, fragmentation, and seek overhead.
- **Physical Sector Grid & Sector Inspector:** Individual 512-byte disk blocks with addresses (hex and decimal), visual patterns, file tags, link pointers, and dedicated Index Blocks (`[IDX]`).
- **Dynamic File Operations:** Real-time file creation, in-place growth vs. collision handling, file truncation, renaming, and unlinking with recycle bin recovery.
- **Transactional Consistency & Atomic Rollback:** If an allocation cannot be fulfilled (e.g., out of disk space, external fragmentation, or index table overflow), no blocks are leaked or left in an inconsistent state.
- **Isolated Multi-Method Comparison (3× Mode):** Evaluates the exact same active file workload across isolated simulated instances of Contiguous, Linked, and Indexed disks simultaneously.
- **Pre-Configured OS Lab Scenarios:** Instant setups for demonstrating external fragmentation traps, linked block scattering, direct indexed addressing, and contiguous in-place growth collisions.

---

## 2. The Three Allocation Techniques

### A. Contiguous Allocation
- **Algorithm:** Scans free-space runs using **First-Fit** (or Best-Fit / Worst-Fit). Requires an unbroken sequence of consecutive physical disk blocks equal to $\lceil \text{fileSize} / \text{blockSize} \rceil$.
- **Directory Metadata:** Compact directory entry recording only `startBlock` and `length`.
- **Addressing Formula:** $\text{Physical Address} = \text{startBlock} + \text{logicalBlockOffset}$.
- **Performance:** $O(1)$ random access address calculation with maximum sequential throughput and zero disk head seek hops.
- **Trade-Offs:** Severe vulnerability to **External Fragmentation**. When files are deleted, free storage fractures into small holes. A file may fail to allocate even if total free disk space is abundant. Furthermore, in-place file expansion fails if the adjacent sector is occupied by another file.

### B. Linked Allocation
- **Algorithm:** Allocates any available free blocks across the disk volume. Each block stores both user payload and an embedded forward pointer (`nextBlockId`) in its sector header. The terminal block points to `NULL` (`EOF`).
- **Directory Metadata:** Directory stores `startBlock` and `endBlock`.
- **Addressing Formula:** Traverses the pointer chain: $\text{Block}_0 \to \text{Block}_1 \to \dots \to \text{Block}_k$.
- **Performance:** Sequential access only. Random access requires $O(k)$ physical sector reads to access block $k$.
- **Trade-Offs:** Completely eliminates external fragmentation. Files can grow dynamically across any free sectors on disk. However, forward pointers consume sector header space (4 bytes/block), scattered blocks cause seek latency, and a corrupted link severs access to the remainder of the file.

### C. Indexed Allocation
- **Algorithm:** Allocates one dedicated **Index Block** per file, plus $k$ data blocks. The Index Block houses an array of direct physical sector addresses: $\text{IndexTable}[i] = \text{DataBlockID}_i$.
- **Directory Metadata:** Directory stores only the address of the Index Block.
- **Addressing Formula:** $\text{Physical Address} = \text{IndexBlock}[\text{logicalBlockOffset}]$.
- **Performance:** Direct random access with only two sector reads (one to the Index Block, one to the target data block).
- **Trade-Offs:** Eliminates external fragmentation while retaining fast random access. However, small files suffer high metadata overhead (a 1-block file requires 2 physical blocks = 50% overhead). Additionally, single-level indexing is bounded by the index block capacity ($M$ pointers).

---

## 3. Simulator Model Assumptions & Specifications

- **Sector Geometry:** Default block size is fixed at **512 Bytes** per physical block.
- **Volume Capacity:** Default simulated disk contains **64 Blocks** (32 KB total capacity), dynamically scalable up to 128 blocks with physical boundaries validation.
- **Internal Fragmentation:** Calculated as $(\text{requiredBlocks} \times \text{blockSize}) - \text{fileSizeBytes}$.
- **Index Block Capacity:** Set to **16 direct pointers** per index block. Exceeding 16 blocks triggers the educational `INDEX_LIMIT_EXCEEDED` failure, explaining the need for multi-level indexing.
- **Linked Pointer Overhead:** Modeled as **4 bytes** reserved per physical sector header for forward pointer storage.
- **Transactional Rollback:** All operations are atomic transactions. Failed writes report error diagnostics (e.g., `EXTERNAL_FRAGMENTATION`, `OUT_OF_SPACE`) without mutating disk bitmaps.

---

## 4. Technology Stack & Architecture

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Modular Vanilla CSS Design System (`index.css`) featuring a warm editorial technical aesthetic, high contrast, typography hierarchy (Inter and JetBrains Mono), responsive grid layouts, and zero heavy UI dependencies.
- **Test Automation:** Vitest unit test suite validating allocation algorithms, fragmentation edge cases, and atomic rollback.
- **Local Storage:** Automatic session persistence across browser refreshes with one-click disk format/reset.

### Project Structure
```
os-page-alloc-viz/
├── src/
│   ├── types/
│   │   └── simulator.ts          # Type definitions for disk blocks, files, and pipelines
│   ├── core/
│   │   ├── contiguous.ts         # Contiguous allocation algorithm & run finder
│   │   ├── linked.ts             # Linked allocation algorithm & pointer chaining
│   │   ├── indexed.ts            # Indexed allocation algorithm & index table builder
│   │   ├── simulatorEngine.ts    # Master state machine, resize, delete, and comparison
│   │   ├── scenarios.ts          # Pre-configured OS lab teaching experiments
│   │   └── __tests__/
│   │       └── allocation.test.ts # Vitest unit tests for all 3 algorithms
│   ├── components/
│   │   ├── Icons.tsx             # Purposeful SVG system line icons
│   │   ├── SystemTopBar.tsx      # Application header, student info, and method selector
│   │   ├── DesktopWorkspace.tsx  # Stage 1 desktop environment & first-file guide
│   │   ├── FileManagerWindow.tsx # Native OS file manager window & file table
│   │   ├── DiskGridView.tsx      # Interactive physical disk grid & sector badges
│   │   ├── DiskSummaryCard.tsx   # Real-time volume telemetry & fragmentation alerts
│   │   ├── BlockInspectorDrawer.tsx # Deep-dive physical sector inspector
│   │   ├── PipelineExplanationPanel.tsx # Execution pipeline & 4-quadrant cards
│   │   ├── NewFileDialog.tsx     # File creation dialog with geometry preview
│   │   ├── ResizeFileDialog.tsx  # File expansion/shrink dialog with collision preview
│   │   ├── RenameFileDialog.tsx  # Directory metadata renaming dialog
│   │   ├── RecycleBinModal.tsx   # Unlinked files staging and recovery
│   │   ├── ScenariosModal.tsx    # Lab experiment scenarios launcher
│   │   ├── ComparisonViewModal.tsx # 3× side-by-side isolated method comparison
│   │   └── AboutModal.tsx        # Project documentation, theory, and OS glossary
│   ├── App.tsx                   # Master application orchestrator
│   ├── index.css                 # Comprehensive technical design system CSS
│   └── main.tsx                  # React DOM entrypoint
├── index.html                    # HTML5 shell with Google Fonts & metadata
├── package.json                  # Dependencies and execution scripts
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite build configuration
```

---

## 5. Running and Testing Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/BerrF35/File-Allocation-Simulator.git

# Navigate to project directory
cd "File-Allocation-Simulator"

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Running Unit Tests
```bash
npm test
```
Executes the Vitest suite covering contiguous allocation, external fragmentation detection, linked pointer chaining, indexed table population, capacity limits, and collision handling.

### Production Build & Linting
```bash
# Type check and build bundle
npm run build

# Preview production build
npm run preview
```

---

## 6. Faculty Demonstration Script

To present this project during an academic evaluation:

1. **Initial Visit (Stage 1 Desktop):** Show the clean desktop environment with student info (`Jaijitesh Suryaprakash - 25BIT0235`), allocation method selector, and the contextual instruction **"Let's create your first file"**.
2. **First File Creation (Stage 2):** Click **"Create Your First File"**. Show how entering a size of `1,450 Bytes` automatically computes `3 Data Blocks` and `86 Bytes` of internal fragmentation. Click **"Create & Save File"**.
3. **Split View & Pipeline (Stage 3):** Demonstrate the transition into the split view. Step through the 7-stage OS pipeline (from `sys_open/write` through block translation, run scanning, reservation, directory registration, and disk commit). Highlight the 4 quadrants: **WHAT HAPPENED**, **WHY IT HAPPENED**, **WHAT CHANGED**, and **TRADE-OFF**.
4. **Physical Sector Inspector & Hex Dumper:** Click on any allocated block on the disk grid to reveal the physical sector inspector drawer and raw 16-byte hex memory dump with CHS coordinates.
5. **3D Winchester Hard Disk Platter:** Click **"💽 Platter"** to open the solid 3D isometric model showing dual platters rotating at 7,200 RPM and the Voice Coil Motor actuator arm seeking to the selected sector's cylinder.
6. **Drive Optimizer & Defragmentation:** Click **"⚡ Defrag"** to run live volume compaction, packing scattered files into consecutive low-LBA blocks and consolidating free space.
7. **Interactive PowerShell Terminal:** Click **"💻 Terminal"** to launch `SimFS` shell. Run `dir`, `stat`, `chs`, and `method linked` to demonstrate low-level OS operations.
8. **External Fragmentation Demonstration:** Click **"Scenarios"** in the top bar and select **"The Contiguous External Fragmentation Trap"**. Point out the warning banner indicating that although 12 free blocks exist, the largest contiguous run is only 3 blocks. Attempt to create a 5-block file and observe the explicit failure and atomic rollback.
9. **Dynamic Method Migration:** Switch the method selector from **Contiguous** to **Linked** or **Indexed**, and watch the entire physical partition, VFS translators, and sector badges dynamically reorganize in real time.
10. **Multi-Method Comparison:** Click **"3× Compare Methods"** to show the live comparison matrix comparing success rates, total blocks consumed (including Index Block overhead), utilization, read speed, and fragmentation across all three methods simultaneously.

---

## 7. Comprehensive Engineering Report

For an exhaustive, publication-grade technical analysis detailing every single mathematical formula, algorithm implementation, physical hardware geometry, test suite, and architectural decision, please see:
📖 **[PROJECT_COMPLETE_TECHNICAL_REPORT.md](./PROJECT_COMPLETE_TECHNICAL_REPORT.md)** (Full 14-Section Technical Treatise)

