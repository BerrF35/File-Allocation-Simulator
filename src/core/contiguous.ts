/**
 * Contiguous File Allocation Algorithm & Pipeline Step Generator
 * Operating System Principles - Jaijitesh Suryaprakash (25BIT0235)
 */

import type {
  DiskBlock,
  AllocationResult,
  PipelineStep,
  SimConfig,
} from '../types/simulator';

interface FreeRun {
  start: number;
  length: number;
}

/**
 * Finds all contiguous runs of free blocks on the disk.
 */
export function findFreeRuns(blocks: DiskBlock[]): FreeRun[] {
  const runs: FreeRun[] = [];
  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].state === 'free') {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentStart !== -1) {
        runs.push({ start: currentStart, length: currentLength });
        currentStart = -1;
        currentLength = 0;
      }
    }
  }

  if (currentStart !== -1) {
    runs.push({ start: currentStart, length: currentLength });
  }

  return runs;
}

/**
 * Executes Contiguous Allocation transactionally.
 */
export function allocateContiguous(
  blocks: DiskBlock[],
  fileName: string,
  fileSizeBytes: number,
  requiredBlocks: number,
  config: SimConfig
): AllocationResult {
  const steps: PipelineStep[] = [];
  const freeBlocksCount = blocks.filter((b) => b.state === 'free').length;
  const runs = findFreeRuns(blocks);
  const maxRunLength = runs.length > 0 ? Math.max(...runs.map((r) => r.length)) : 0;

  // Step 1: Application Syscall
  steps.push({
    id: 1,
    phase: 'Syscall',
    title: 'sys_write() / sys_open() System Call Dispatched',
    status: 'completed',
    whatHappened: `User requested to persist file "${fileName}" with logical size of ${fileSizeBytes.toLocaleString()} bytes.`,
    whyItHappened: `User space applications cannot manipulate hardware storage directly. The process transitions to kernel mode via a software interrupt/system call.`,
    whatChanged: `CPU switched from user mode (Ring 3) to supervisor mode (Ring 0); file metadata entered the VFS pipeline.`,
    tradeOff: `System call context switches incur minor CPU overhead, but guarantee kernel-level memory and hardware protection.`,
    technicalDetails: `Registers loaded: RAX=sys_open/write, RDI=fd, RSI=buf, RDX=${fileSizeBytes}. Kernel VFS layer resolves storage driver.`,
    highlightedBlockIds: [],
  });

  // Step 2: Translation to Fixed-Size Blocks
  const totalAllocatedBytes = requiredBlocks * config.blockSize;
  const internalFragBytes = totalAllocatedBytes - fileSizeBytes;
  steps.push({
    id: 2,
    phase: 'VFS Translation',
    title: 'Block Translation & Geometry Calculation',
    status: 'completed',
    whatHappened: `The VFS translated ${fileSizeBytes.toLocaleString()} bytes into ${requiredBlocks} disk block${requiredBlocks > 1 ? 's' : ''} (Block size = ${config.blockSize} bytes).`,
    whyItHappened: `Disks operate on fixed physical sector/block sizes. Storage is allocated in discrete blocks rather than individual byte streams.`,
    whatChanged: `Calculated required data blocks: ⌈${fileSizeBytes} / ${config.blockSize}⌉ = ${requiredBlocks} block${requiredBlocks > 1 ? 's' : ''}. Last block has ${internalFragBytes} bytes internal fragmentation.`,
    tradeOff: `Fixed block sizes simplify disk geometry and hardware alignment, but cause internal fragmentation in the final partially used block.`,
    technicalDetails: `Mathematical mapping: requiredBlocks = Math.ceil(fileSize / blockSize). Internal fragmentation = (requiredBlocks * blockSize) - fileSize.`,
    highlightedBlockIds: [],
  });

  // Step 3: Run-Length Free Space Scan
  steps.push({
    id: 3,
    phase: 'Free Space Search',
    title: `Contiguous Free-Run Scan (${config.contiguousStrategy.toUpperCase()})`,
    status: 'completed',
    whatHappened: `Operating system searched the disk bitmap for a contiguous sequence of at least ${requiredBlocks} free block${requiredBlocks > 1 ? 's' : ''}.`,
    whyItHappened: `Contiguous allocation requires all file blocks to be physically consecutive on the storage medium to support direct linear access.`,
    whatChanged: `Evaluated ${runs.length} free segment runs. Longest available contiguous run is ${maxRunLength} block${maxRunLength === 1 ? '' : 's'}. Total free blocks on disk: ${freeBlocksCount}.`,
    tradeOff: `Extremely fast sequential and random lookups (O(1) address calculation), but requires unbroken consecutive free space.`,
    technicalDetails: `Free runs identified: [${runs.map((r) => `{start: ${r.start}, len: ${r.length}}`).join(', ')}]. Strategy applied: ${config.contiguousStrategy}.`,
    highlightedBlockIds: [],
  });

  // Check Failure: Not enough total disk space
  if (freeBlocksCount < requiredBlocks) {
    steps.push({
      id: 4,
      phase: 'Space Check Failed',
      title: 'Allocation Failed: Insufficient Storage Capacity',
      status: 'failed',
      whatHappened: `Allocation halted. Disk has only ${freeBlocksCount} free block${freeBlocksCount === 1 ? '' : 's'}, but file demands ${requiredBlocks} block${requiredBlocks > 1 ? 's' : ''}.`,
      whyItHappened: `The physical disk volume has exceeded its storage ceiling. The file system cannot write beyond physical medium boundaries.`,
      whatChanged: `Transaction aborted. No disk blocks were reserved or mutated.`,
      tradeOff: `Operating systems enforce strict quota and space boundaries to prevent volume corruption and unrecoverable disk states.`,
      technicalDetails: `Error: ENOSPC (Error No Space Left on Device). Free blocks = ${freeBlocksCount}, required = ${requiredBlocks}.`,
      highlightedBlockIds: [],
    });

    return {
      success: false,
      allocatedDataBlocks: [],
      failureCode: 'OUT_OF_SPACE',
      errorMessage: `Disk full: Only ${freeBlocksCount} free blocks available, but ${requiredBlocks} required.`,
      steps,
      startBlock: -1,
    };
  }

  // Check Failure: External Fragmentation (Total free blocks >= required, but no run is long enough)
  const qualifyingRuns = runs.filter((r) => r.length >= requiredBlocks);
  if (qualifyingRuns.length === 0) {
    steps.push({
      id: 4,
      phase: 'Fragmentation Trap',
      title: 'Allocation Failed: External Fragmentation Encountered',
      status: 'failed',
      whatHappened: `Allocation aborted! The disk has ${freeBlocksCount} total free blocks (more than the ${requiredBlocks} needed), but NO single contiguous run is large enough (max run = ${maxRunLength}).`,
      whyItHappened: `As files of varying lifespans are created and deleted, free storage becomes fractured into small, isolated gaps. Contiguous allocation cannot span non-adjacent gaps.`,
      whatChanged: `Transaction rolled back cleanly with 0 leaked sectors. Free space remains fragmented.`,
      tradeOff: `The primary drawback of Contiguous Allocation: external fragmentation renders free space unusable for larger files unless expensive disk compaction/defragmentation is performed.`,
      technicalDetails: `External Fragmentation Metric: (Free blocks: ${freeBlocksCount} >= Required: ${requiredBlocks}), but Max Contiguous Gap = ${maxRunLength}. Remedy: File system defragmentation or Linked/Indexed allocation.`,
      highlightedBlockIds: runs.map((r) => r.start),
    });

    return {
      success: false,
      allocatedDataBlocks: [],
      failureCode: 'EXTERNAL_FRAGMENTATION',
      errorMessage: `External Fragmentation: ${freeBlocksCount} total free blocks exist, but longest contiguous run is only ${maxRunLength} (file needs ${requiredBlocks}).`,
      steps,
      startBlock: -1,
    };
  }

  // Select suitable run based on configured strategy
  let chosenRun: FreeRun;
  if (config.contiguousStrategy === 'best-fit') {
    chosenRun = qualifyingRuns.reduce((best, cur) =>
      cur.length < best.length ? cur : best
    );
  } else if (config.contiguousStrategy === 'worst-fit') {
    chosenRun = qualifyingRuns.reduce((worst, cur) =>
      cur.length > worst.length ? cur : worst
    );
  } else {
    // First-fit
    chosenRun = qualifyingRuns[0];
  }

  const startBlock = chosenRun.start;
  const allocatedBlocks: number[] = [];
  for (let i = 0; i < requiredBlocks; i++) {
    allocatedBlocks.push(startBlock + i);
  }

  // Step 4: Block Reservation
  steps.push({
    id: 4,
    phase: 'Block Reservation',
    title: `Reserved Contiguous Blocks [${startBlock} ... ${startBlock + requiredBlocks - 1}]`,
    status: 'completed',
    whatHappened: `Operating system claimed ${requiredBlocks} consecutive physical blocks beginning at block ${startBlock} through block ${startBlock + requiredBlocks - 1}.`,
    whyItHappened: `The chosen free run at block ${startBlock} (run length = ${chosenRun.length}) accommodates the required ${requiredBlocks} blocks with ${chosenRun.length - requiredBlocks} blocks remaining free in this run.`,
    whatChanged: `Bitmap bits [${startBlock} .. ${startBlock + requiredBlocks - 1}] marked as ALLOCATED. In-flight transaction locks blocks.`,
    tradeOff: `Block assignment is contiguous, enabling maximum read throughput with minimal disk head movement.`,
    technicalDetails: `Allocated block indices: [${allocatedBlocks.join(', ')}]. Remaining free gap after allocation starts at ${startBlock + requiredBlocks}.`,
    highlightedBlockIds: allocatedBlocks,
  });

  // Step 5: Directory Structure Update
  steps.push({
    id: 5,
    phase: 'Directory Registration',
    title: 'Directory Table Metadata Entry Created',
    status: 'completed',
    whatHappened: `File system directory entry registered: Name="${fileName}", Start Block=${startBlock}, Length=${requiredBlocks}.`,
    whyItHappened: `Contiguous allocation requires minimal directory metadata: storing only the starting block address and total block count is sufficient to access any byte in the file.`,
    whatChanged: `Directory table appended: { filename: "${fileName}", start: ${startBlock}, length: ${requiredBlocks}, sizeBytes: ${fileSizeBytes} }.`,
    tradeOff: `Extremely compact metadata footprint (only two integers). Direct block lookup formula: physicalAddress = startBlock + logicalBlockNumber.`,
    technicalDetails: `Direct address lookup: logical block #i maps directly to physical block (${startBlock} + i). Seek time is O(1).`,
    highlightedBlockIds: [startBlock],
  });

  // Step 6: Disk Sector Commit & Transaction Verification
  steps.push({
    id: 6,
    phase: 'Disk Commit',
    title: 'Simulated Sector Write & Data Flush (fsync)',
    status: 'completed',
    whatHappened: `Data payloads successfully committed to simulated disk sectors ${startBlock} through ${startBlock + requiredBlocks - 1}. Buffer caches flushed.`,
    whyItHappened: `Storage transactions must be flushed from volatile system RAM to non-volatile disk blocks to guarantee durability (ACID compliance).`,
    whatChanged: `Disk blocks transitioned from FREE to OCCUPIED. File ID and checksums written to sector headers.`,
    tradeOff: `Synchronous disk flush ensures data integrity against power failure, but involves physical I/O latency.`,
    technicalDetails: `Write barrier executed. Simulated write IOPS: ${requiredBlocks} sequential sector write commands.`,
    highlightedBlockIds: allocatedBlocks,
  });

  // Step 7: VFS Completion
  steps.push({
    id: 7,
    phase: 'Complete',
    title: 'File Manager & Inode Table Reflected',
    status: 'completed',
    whatHappened: `System call returned SUCCESS (exit code 0). File manager UI refreshed to display the new file.`,
    whyItHappened: `All storage reservation, metadata write, and verification steps succeeded without error.`,
    whatChanged: `File "${fileName}" is now active in the file manager and highlighted on the disk map.`,
    tradeOff: `File is ready for high-speed sequential reading, but future in-place expansion will be blocked if block ${startBlock + requiredBlocks} is subsequently occupied.`,
    technicalDetails: `VFS file descriptor closed. File system state clean. Total blocks: ${requiredBlocks}.`,
    highlightedBlockIds: allocatedBlocks,
  });

  return {
    success: true,
    allocatedDataBlocks: allocatedBlocks,
    startBlock,
    endBlock: startBlock + requiredBlocks - 1,
    steps,
  };
}

/**
 * Evaluates in-place expansion of a contiguous file.
 */
export function canExpandContiguous(
  blocks: DiskBlock[],
  fileStart: number,
  fileLength: number,
  additionalBlocks: number
): { canExpand: boolean; blockedAt?: number; blockingOwner?: string } {
  for (let i = 0; i < additionalBlocks; i++) {
    const targetBlockIndex = fileStart + fileLength + i;
    if (targetBlockIndex >= blocks.length) {
      return { canExpand: false, blockedAt: targetBlockIndex, blockingOwner: 'End of Physical Disk' };
    }
    const blk = blocks[targetBlockIndex];
    if (blk.state !== 'free') {
      return {
        canExpand: false,
        blockedAt: targetBlockIndex,
        blockingOwner: blk.fileName || `File ${blk.fileId}`,
      };
    }
  }
  return { canExpand: true };
}
