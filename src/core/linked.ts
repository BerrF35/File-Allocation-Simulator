/**
 * Linked File Allocation Algorithm & Pipeline Step Generator
 * Operating System Principles - Jaijitesh Suryaprakash (25BIT0235)
 */

import type {
  DiskBlock,
  AllocationResult,
  PipelineStep,
  SimConfig,
} from '../types/simulator';

/**
 * Executes Linked Allocation transactionally.
 */
export function allocateLinked(
  blocks: DiskBlock[],
  fileName: string,
  fileSizeBytes: number,
  requiredBlocks: number,
  config: SimConfig
): AllocationResult {
  const steps: PipelineStep[] = [];
  const freeBlockIndices: number[] = [];

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].state === 'free') {
      freeBlockIndices.push(i);
    }
  }

  // Step 1: Application Syscall
  steps.push({
    id: 1,
    phase: 'Syscall',
    title: 'sys_write() Dispatched for Linked Allocation',
    status: 'completed',
    whatHappened: `Process requested to allocate "${fileName}" (${fileSizeBytes.toLocaleString()} bytes) under the Linked Allocation strategy.`,
    whyItHappened: `The VFS routes file creation through the linked file system driver, which does not require consecutive blocks.`,
    whatChanged: `Kernel initialized linked descriptor structure and entered block allocation subsystem.`,
    tradeOff: `Eliminates external fragmentation entirely, but imposes pointer storage overhead and slower non-sequential access.`,
    technicalDetails: `VFS driver: LinkedFS. Inode structure allocates start and end pointers.`,
    highlightedBlockIds: [],
  });

  // Step 2: Translation & Pointer Overhead
  const effectivePayloadPerBlock = config.blockSize - config.pointerOverheadBytes;
  const totalPointerOverhead = requiredBlocks * config.pointerOverheadBytes;
  const totalAllocatedBytes = requiredBlocks * config.blockSize;
  const internalFragBytes = totalAllocatedBytes - fileSizeBytes;

  steps.push({
    id: 2,
    phase: 'VFS Translation',
    title: 'Block Translation & Pointer Overhead Model',
    status: 'completed',
    whatHappened: `Calculated ${requiredBlocks} required data block${requiredBlocks > 1 ? 's' : ''}. Each block reserves ${config.pointerOverheadBytes} bytes for its forward link pointer.`,
    whyItHappened: `In linked allocation, each physical block stores both file payload and metadata (the address of the subsequent block).`,
    whatChanged: `Effective data payload per block: ${effectivePayloadPerBlock} bytes. Total pointer overhead: ${totalPointerOverhead} bytes. Internal fragmentation in final block: ${internalFragBytes} bytes.`,
    tradeOff: `Storage overhead per block for link pointers (${config.pointerOverheadBytes} bytes/block), reducing raw usable sector capacity slightly.`,
    technicalDetails: `In-band pointer model: Block format = [4-byte next_ptr | (blockSize - 4) payload bytes]. Total required blocks = ${requiredBlocks}.`,
    highlightedBlockIds: [],
  });

  // Check Failure: Insufficient free blocks
  if (freeBlockIndices.length < requiredBlocks) {
    steps.push({
      id: 3,
      phase: 'Space Check Failed',
      title: 'Allocation Failed: Not Enough Free Blocks on Disk',
      status: 'failed',
      whatHappened: `Allocation halted. Disk has only ${freeBlockIndices.length} free block${freeBlockIndices.length === 1 ? '' : 's'}, but file requires ${requiredBlocks}.`,
      whyItHappened: `Although linked allocation can use non-consecutive blocks, the total volume capacity has been exhausted.`,
      whatChanged: `Transaction aborted cleanly. 0 blocks modified.`,
      tradeOff: `Guarantees atomic rollback; disk free list remains uncorrupted.`,
      technicalDetails: `Error: ENOSPC. Free blocks: ${freeBlockIndices.length}, Required: ${requiredBlocks}.`,
      highlightedBlockIds: [],
    });

    return {
      success: false,
      allocatedDataBlocks: [],
      failureCode: 'OUT_OF_SPACE',
      errorMessage: `Disk full: Only ${freeBlockIndices.length} free blocks available, but ${requiredBlocks} required.`,
      steps,
      startBlock: -1,
    };
  }

  // Step 3: Harvesting scattered free blocks
  // Notice: Linked allocation takes ANY free blocks, showing they can be completely scattered!
  const chosenBlocks = freeBlockIndices.slice(0, requiredBlocks);

  steps.push({
    id: 3,
    phase: 'Free Space Search',
    title: `Harvested ${requiredBlocks} Scattered Free Blocks from Disk Pool`,
    status: 'completed',
    whatHappened: `OS scanned the free-space list and selected ${requiredBlocks} blocks: [${chosenBlocks.join(', ')}]. Notice that these blocks do NOT need to be adjacent!`,
    whyItHappened: `Linked allocation does not suffer from external fragmentation. Any free block anywhere on disk is immediately usable.`,
    whatChanged: `Selected block set: [${chosenBlocks.join(', ')}]. No defragmentation or compaction required.`,
    tradeOff: `High allocation flexibility, but scattered block placement causes physical disk seek latency (head movement) during reading.`,
    technicalDetails: `Blocks retrieved from free-list head: ${chosenBlocks.map((b) => `#${b}`).join(' -> ')}.`,
    highlightedBlockIds: chosenBlocks,
  });

  // Step 4: Pointer Chaining
  const pointerMap: Record<number, number | null> = {};
  const pointerLines: Array<{ from: number; to: number }> = [];

  for (let i = 0; i < chosenBlocks.length; i++) {
    const current = chosenBlocks[i];
    const next = i < chosenBlocks.length - 1 ? chosenBlocks[i + 1] : null;
    pointerMap[current] = next;
    if (next !== null) {
      pointerLines.push({ from: current, to: next });
    }
  }

  const startBlock = chosenBlocks[0];
  const endBlock = chosenBlocks[chosenBlocks.length - 1];

  steps.push({
    id: 4,
    phase: 'Pointer Chaining',
    title: 'Linked Pointer Chain Synthesized',
    status: 'completed',
    whatHappened: `Formed forward linked pointers: ${chosenBlocks.map((b, idx) => (idx < chosenBlocks.length - 1 ? `#${b} ➔ #${chosenBlocks[idx + 1]}` : `#${b} ➔ NULL (EOF)`)).join(', ')}.`,
    whyItHappened: `To read the file later, the operating system will start at block #${startBlock} and follow the embedded pointer to the next block until reaching the EOF marker.`,
    whatChanged: `Constructed pointer map with ${chosenBlocks.length - 1} directional links. Block #${endBlock} set as End-of-File terminal.`,
    tradeOff: `Direct/random access is impossible without traversal: jumping to logical block #k requires reading all preceding k-1 blocks sequentially.`,
    technicalDetails: `Chain: ${chosenBlocks.join(' -> ')} -> EOF. Reliability caveat: a single corrupted pointer breaks all subsequent block references.`,
    highlightedBlockIds: chosenBlocks,
    pointerLines,
  });

  // Step 5: Directory Structure Update
  steps.push({
    id: 5,
    phase: 'Directory Registration',
    title: 'Directory Table Metadata Entry Created',
    status: 'completed',
    whatHappened: `Directory table recorded: Name="${fileName}", Start Block=${startBlock}, End Block=${endBlock}, Total Blocks=${requiredBlocks}.`,
    whyItHappened: `The OS only needs to keep pointers to the first and last blocks in its directory table. All intermediate blocks are discovered via chain traversal.`,
    whatChanged: `Directory registered: { name: "${fileName}", start: ${startBlock}, end: ${endBlock}, sizeBytes: ${fileSizeBytes} }.`,
    tradeOff: `Directory table remains compact. Appending new blocks to the end of the file is O(1) because endBlock pointer is cached.`,
    technicalDetails: `Directory record: start=${startBlock}, end=${endBlock}. Intermediate addresses are decoupled from directory table.`,
    highlightedBlockIds: [startBlock, endBlock],
    pointerLines,
  });

  // Step 6: Disk Sector Commit & Pointer Serialization
  steps.push({
    id: 6,
    phase: 'Disk Commit',
    title: 'Disk Write & Pointer Serialization',
    status: 'completed',
    whatHappened: `Payload bytes and next-block pointer addresses were written into physical sectors [${chosenBlocks.join(', ')}].`,
    whyItHappened: `Physical writes persist the pointers into disk block headers so the chain survives system reboots.`,
    whatChanged: `Target disk blocks updated to 'data' state with active link references.`,
    tradeOff: `Writing to scattered blocks incurs multiple non-sequential disk head seeks compared to contiguous allocation.`,
    technicalDetails: `Sector write operations: ${chosenBlocks.length} non-contiguous sector writes.`,
    highlightedBlockIds: chosenBlocks,
    pointerLines,
  });

  // Step 7: VFS Completion
  steps.push({
    id: 7,
    phase: 'Complete',
    title: 'Linked Allocation Successfully Finalized',
    status: 'completed',
    whatHappened: `File creation finalized. File manager updated with linked file chain.`,
    whyItHappened: `All blocks and pointers verified without cycles or broken links.`,
    whatChanged: `File "${fileName}" active. Disk visualization displays directional link arrows connecting allocated blocks.`,
    tradeOff: `The file can easily grow in the future simply by claiming any free block and linking it to block #${endBlock}.`,
    technicalDetails: `Verified acyclic traversal from #${startBlock} to #${endBlock}. Hop count: ${chosenBlocks.length - 1} links.`,
    highlightedBlockIds: chosenBlocks,
    pointerLines,
  });

  return {
    success: true,
    allocatedDataBlocks: chosenBlocks,
    pointerMap,
    startBlock,
    endBlock,
    steps,
  };
}
