/**
 * Indexed File Allocation Algorithm & Pipeline Step Generator
 * Operating System Principles - Jaijitesh Suryaprakash (25BIT0235)
 */

import type {
  DiskBlock,
  AllocationResult,
  PipelineStep,
  SimConfig,
} from '../types/simulator';

/**
 * Executes Indexed Allocation transactionally.
 */
export function allocateIndexed(
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

  // Total blocks required = 1 Index Block + required data blocks
  const totalBlocksNeeded = 1 + requiredBlocks;

  // Step 1: Application Syscall
  steps.push({
    id: 1,
    phase: 'Syscall',
    title: 'sys_write() Dispatched for Indexed Allocation',
    status: 'completed',
    whatHappened: `User initiated write of "${fileName}" (${fileSizeBytes.toLocaleString()} bytes) under the Indexed Allocation strategy.`,
    whyItHappened: `Indexed allocation eliminates the sequential traversal penalty of linked allocation while avoiding contiguous external fragmentation.`,
    whatChanged: `Kernel initialized indexed inode metadata allocator.`,
    tradeOff: `Fast direct random access to any block, but requires an entire dedicated index block for metadata overhead.`,
    technicalDetails: `Indexed file system subsystem activated. Directory entry will point to index block.`,
    highlightedBlockIds: [],
  });

  // Step 2: Capacity & Overhead Calculation
  const totalAllocatedBytes = totalBlocksNeeded * config.blockSize;
  const internalFragBytes = (requiredBlocks * config.blockSize) - fileSizeBytes;
  const metadataOverheadBytes = config.blockSize; // 1 whole block is dedicated to index table

  steps.push({
    id: 2,
    phase: 'VFS Translation',
    title: 'Index Block Capacity & Metadata Overhead Calculation',
    status: 'completed',
    whatHappened: `File requires ${requiredBlocks} data block${requiredBlocks > 1 ? 's' : ''} PLUS 1 dedicated Index Block (Total: ${totalBlocksNeeded} physical blocks, ${totalAllocatedBytes} bytes).`,
    whyItHappened: `Indexed allocation separates metadata from payload by storing all block pointers in a centralized index block rather than inside individual data blocks.`,
    whatChanged: `Evaluated index block limit: max entries per index block = ${config.indexBlockCapacity}. Requested entries: ${requiredBlocks}. Overhead: 1 entire block (${metadataOverheadBytes} bytes). Internal fragmentation: ${internalFragBytes} bytes.`,
    tradeOff: `High metadata overhead for small files (a 1-block file requires 2 physical blocks = 50% storage overhead), but gives O(1) random block addressing.`,
    technicalDetails: `Index block formula: totalBlocks = 1 (Index Block) + ⌈fileSize / blockSize⌉. Single-level index limit = ${config.indexBlockCapacity} pointers.`,
    highlightedBlockIds: [],
  });

  // Check Failure: Index block pointer capacity exceeded
  if (requiredBlocks > config.indexBlockCapacity) {
    steps.push({
      id: 3,
      phase: 'Index Limit Exceeded',
      title: 'Allocation Failed: Single Index Block Pointer Capacity Exceeded',
      status: 'failed',
      whatHappened: `Allocation halted. File demands ${requiredBlocks} data blocks, but a single index block can store at most ${config.indexBlockCapacity} pointer addresses!`,
      whyItHappened: `In single-level indexed allocation, the pointer table size is strictly bounded by the physical sector/block capacity.`,
      whatChanged: `Transaction aborted. 0 blocks allocated.`,
      tradeOff: `To support files larger than ${config.indexBlockCapacity} blocks, real OSes must employ linked index blocks, two-level indexing, or hierarchical Inode trees (e.g. ext4 indirect blocks).`,
      technicalDetails: `Max direct pointers = ${config.indexBlockCapacity}. Requested: ${requiredBlocks}. Need multi-level indexing.`,
      highlightedBlockIds: [],
    });

    return {
      success: false,
      allocatedDataBlocks: [],
      failureCode: 'INDEX_LIMIT_EXCEEDED',
      errorMessage: `Index block capacity exceeded: File needs ${requiredBlocks} data blocks, but single index block holds maximum ${config.indexBlockCapacity} pointers.`,
      steps,
      startBlock: -1,
    };
  }

  // Check Failure: Insufficient free blocks (needs data blocks + index block)
  if (freeBlockIndices.length < totalBlocksNeeded) {
    steps.push({
      id: 3,
      phase: 'Space Check Failed',
      title: 'Allocation Failed: Insufficient Free Blocks (Data + Index Block)',
      status: 'failed',
      whatHappened: `Allocation halted. Disk has only ${freeBlockIndices.length} free block${freeBlockIndices.length === 1 ? '' : 's'}, but indexed allocation requires ${totalBlocksNeeded} (${requiredBlocks} data + 1 index block).`,
      whyItHappened: `The volume lacks enough physical capacity to hold both the file payload and its dedicated index table.`,
      whatChanged: `Transaction rolled back atomically. No blocks leaked.`,
      tradeOff: `Guarantees consistent disk state upon out-of-space conditions.`,
      technicalDetails: `Error: ENOSPC. Free: ${freeBlockIndices.length}, Required: ${totalBlocksNeeded}.`,
      highlightedBlockIds: [],
    });

    return {
      success: false,
      allocatedDataBlocks: [],
      failureCode: 'OUT_OF_SPACE',
      errorMessage: `Disk full: Only ${freeBlockIndices.length} free blocks available, but ${totalBlocksNeeded} required (${requiredBlocks} data + 1 index block).`,
      steps,
      startBlock: -1,
    };
  }

  // Step 3: Reserve Index Block
  const indexBlockId = freeBlockIndices[0];
  const remainingFree = freeBlockIndices.slice(1);

  steps.push({
    id: 3,
    phase: 'Index Block Reservation',
    title: `Reserved Physical Block #${indexBlockId} as Central Index Block`,
    status: 'completed',
    whatHappened: `OS allocated block #${indexBlockId} exclusively as the file's Index Block (pointer repository).`,
    whyItHappened: `The index block will store the array of physical disk block addresses where the actual file data will reside.`,
    whatChanged: `Block #${indexBlockId} transitioned to 'index' state. Initialized empty pointer array [0 .. ${config.indexBlockCapacity - 1}].`,
    tradeOff: `This block cannot store user data; it is consumed entirely by pointer metadata.`,
    technicalDetails: `Index block address: #${indexBlockId}. Size: ${config.blockSize} bytes.`,
    highlightedBlockIds: [indexBlockId],
  });

  // Step 4: Harvest Data Blocks
  const chosenDataBlocks = remainingFree.slice(0, requiredBlocks);

  steps.push({
    id: 4,
    phase: 'Data Block Harvesting',
    title: `Allocated ${requiredBlocks} Data Blocks Across Free Space Pool`,
    status: 'completed',
    whatHappened: `OS selected ${requiredBlocks} free blocks: [${chosenDataBlocks.join(', ')}] to store user payload bytes.`,
    whyItHappened: `Like linked allocation, indexed data blocks can be scattered anywhere across the disk without needing contiguous runs.`,
    whatChanged: `Reserved data blocks [${chosenDataBlocks.join(', ')}].`,
    tradeOff: `Completely immune to external fragmentation, with the added benefit of fast indexed address calculation.`,
    technicalDetails: `Physical data sector mapping: [${chosenDataBlocks.map((b, i) => `logical[${i}] -> physical[${b}]`).join(', ')}].`,
    highlightedBlockIds: chosenDataBlocks,
  });

  // Step 5: Populate Index Block Entries
  const pointerLines: Array<{ from: number; to: number }> = chosenDataBlocks.map((b) => ({
    from: indexBlockId,
    to: b,
  }));

  steps.push({
    id: 5,
    phase: 'Index Table Registration',
    title: 'Wrote Block Addresses to Index Table',
    status: 'completed',
    whatHappened: `Recorded pointer table in index block #${indexBlockId}: [${chosenDataBlocks.map((b, i) => `Index[${i}] = Block #${b}`).join(', ')}].`,
    whyItHappened: `To read logical block #k later, the OS performs a single lookup: physical_addr = IndexBlock[k]. No sequential search needed!`,
    whatChanged: `Index block #${indexBlockId} populated with ${chosenDataBlocks.length} entries. Unused entries set to NULL/0.`,
    tradeOff: `Direct access time is O(1) in terms of address calculation, requiring only 1 index block read + 1 data block read.`,
    technicalDetails: `Index block layout: { entries: [${chosenDataBlocks.join(', ')}], count: ${chosenDataBlocks.length} }.`,
    highlightedBlockIds: [indexBlockId, ...chosenDataBlocks],
    pointerLines,
  });

  // Step 6: Directory Registration
  steps.push({
    id: 6,
    phase: 'Directory Registration',
    title: 'Directory Table Metadata Entry Created',
    status: 'completed',
    whatHappened: `Directory table recorded: Name="${fileName}", Index Block=${indexBlockId}, Data Blocks=${requiredBlocks}.`,
    whyItHappened: `The directory table only needs to store a single pointer: the address of the Index Block! Everything else is resolved through that index.`,
    whatChanged: `Directory entry registered: { filename: "${fileName}", indexBlock: ${indexBlockId}, sizeBytes: ${fileSizeBytes} }.`,
    tradeOff: `Directory entries are uniform in size (constant-sized directory records).`,
    technicalDetails: `Directory record: name="${fileName}", index_block=${indexBlockId}.`,
    highlightedBlockIds: [indexBlockId],
  });

  // Step 7: VFS Completion
  steps.push({
    id: 7,
    phase: 'Complete',
    title: 'Indexed Allocation Finalized Successfully',
    status: 'completed',
    whatHappened: `Disk commit verified. File manager updated. Total physical blocks utilized: ${totalBlocksNeeded} (1 Index + ${requiredBlocks} Data).`,
    whyItHappened: `All transactions succeeded. Index and data sectors verified.`,
    whatChanged: `File "${fileName}" active. Disk map highlights Index block in amber/distinct pattern and data blocks in file color.`,
    tradeOff: `Optimal compromise between fast random access and zero external fragmentation, at the expense of 1 index block overhead.`,
    technicalDetails: `Transaction committed. Random seek lookup time: 2 disk I/O operations (1 index read + 1 target block read).`,
    highlightedBlockIds: [indexBlockId, ...chosenDataBlocks],
    pointerLines,
  });

  return {
    success: true,
    allocatedDataBlocks: chosenDataBlocks,
    indexBlockId,
    startBlock: indexBlockId,
    endBlock: chosenDataBlocks[chosenDataBlocks.length - 1],
    steps,
  };
}
