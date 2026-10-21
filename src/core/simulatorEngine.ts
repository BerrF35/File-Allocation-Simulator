/**
 * Master Simulation Engine & State Machine
 * Operating System Principles - Jaijitesh Suryaprakash (25BIT0235)
 */

import type {
  AllocationMethod,
  DiskBlock,
  DiskStats,
  FileRecord,
  PipelineStep,
  SimConfig,
} from '../types/simulator';
import { allocateContiguous, canExpandContiguous, findFreeRuns } from './contiguous';
import { allocateLinked } from './linked';
import { allocateIndexed } from './indexed';

export const FILE_COLORS = [
  { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff', light: '#dbeafe', name: 'Blue' },
  { bg: '#059669', border: '#047857', text: '#ffffff', light: '#d1fae5', name: 'Emerald' },
  { bg: '#d97706', border: '#b45309', text: '#ffffff', light: '#fef3c7', name: 'Amber' },
  { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff', light: '#ede9fe', name: 'Violet' },
  { bg: '#db2777', border: '#be185d', text: '#ffffff', light: '#fce7f3', name: 'Pink' },
  { bg: '#0891b2', border: '#0e7490', text: '#ffffff', light: '#cffafe', name: 'Cyan' },
  { bg: '#ea580c', border: '#c2410c', text: '#ffffff', light: '#ffedd5', name: 'Orange' },
  { bg: '#4f46e5', border: '#4338ca', text: '#ffffff', light: '#e0e7ff', name: 'Indigo' },
];

export const DEFAULT_CONFIG: SimConfig = {
  totalBlocks: 64,
  blockSize: 512, // 512 Bytes per block
  indexBlockCapacity: 16, // max 16 direct pointers per index block
  pointerOverheadBytes: 4, // 4 bytes for next_ptr
  contiguousStrategy: 'first-fit',
};

export function createInitialDisk(totalBlocks: number): DiskBlock[] {
  const blocks: DiskBlock[] = [];
  for (let i = 0; i < totalBlocks; i++) {
    blocks.push({
      id: i,
      state: 'free',
      fileId: null,
      fileName: null,
      fileColor: null,
      fileTag: null,
      blockOffset: null,
      totalBlocksInFile: null,
      bytesUsed: 0,
      nextBlockId: null,
    });
  }
  return blocks;
}

export function computeDiskStats(blocks: DiskBlock[], files: FileRecord[], config: SimConfig): DiskStats {
  const totalBlocks = blocks.length;
  const occupiedBlocks = blocks.filter((b) => b.state !== 'free').length;
  const freeBlocks = totalBlocks - occupiedBlocks;
  const utilizationPercent = totalBlocks > 0 ? Math.round((occupiedBlocks / totalBlocks) * 100) : 0;
  
  const totalDataBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalCapacityBytes = totalBlocks * config.blockSize;

  let internalFragmentationBytes = 0;
  for (const f of files) {
    const dataBlocksCount = f.requiredBlocks;
    const allocatedBytes = dataBlocksCount * config.blockSize;
    if (allocatedBytes > f.sizeBytes) {
      internalFragmentationBytes += allocatedBytes - f.sizeBytes;
    }
  }

  const freeRuns = findFreeRuns(blocks);
  const maxContiguousRun = freeRuns.length > 0 ? Math.max(...freeRuns.map((r) => r.length)) : 0;
  const hasFragmentation = freeBlocks > maxContiguousRun && freeRuns.length > 1;

  return {
    totalBlocks,
    occupiedBlocks,
    freeBlocks,
    utilizationPercent,
    fileCount: files.length,
    totalDataBytes,
    totalCapacityBytes,
    internalFragmentationBytes,
    externalFragmentationMetric: {
      hasFragmentation,
      freeBlocksAvailable: freeBlocks,
      maxContiguousRun,
    },
  };
}

/**
 * Executes a simulated delete and generates OS pipeline steps
 */
export function executeDeletePipeline(
  file: FileRecord,
  method: AllocationMethod,
  config: SimConfig
): PipelineStep[] {
  const steps: PipelineStep[] = [];
  const freedBlocks = [...file.allocatedBlocks];
  if (file.indexBlockId !== undefined) {
    freedBlocks.unshift(file.indexBlockId);
  }

  // Step 1: Syscall sys_unlink
  steps.push({
    id: 1,
    phase: 'Syscall',
    title: 'sys_unlink() / sys_remove() Dispatched',
    status: 'completed',
    whatHappened: `User requested deletion of file "${file.name}". Process dispatched sys_unlink("${file.name}").`,
    whyItHappened: `File deletion requires kernel supervision to dereference directory entries and reclaim hardware blocks.`,
    whatChanged: `Kernel acquired file system lock on parent directory. Inode link count decremented.`,
    tradeOff: `Synchronous unlinking prevents concurrent access collisions, but requires metadata locks.`,
    technicalDetails: `VFS path lookup resolved inode #${file.id}. Link count reached 0 -> block reclamation scheduled.`,
    highlightedBlockIds: freedBlocks,
  });

  // Step 2: Directory Table Deregistration
  steps.push({
    id: 2,
    phase: 'Directory Removal',
    title: 'Directory Table Entry Removed',
    status: 'completed',
    whatHappened: `Directory entry for "${file.name}" was unlinked and removed from the active file list.`,
    whyItHappened: `Once unlinked from the directory table, the file is no longer visible to user space applications.`,
    whatChanged: `Directory table slot reclaimed. Starting block reference cleared.`,
    tradeOff: `Directory lookup time improves as directory file size shrinks.`,
    technicalDetails: `Entry removed: { name: "${file.name}", blocks: [${file.allocatedBlocks.join(', ')}] }.`,
    highlightedBlockIds: freedBlocks,
  });

  // Step 3: Block Reclamation
  const methodSpecificDetails =
    method === 'contiguous'
      ? `Released consecutive blocks [${file.startBlock} .. ${file.startBlock + file.length - 1}]. Creates a new contiguous free-run of ${file.length} blocks.`
      : method === 'linked'
      ? `Traversed linked chain from block #${file.startBlock} to #${file.endBlock}, severing forward pointers and returning ${file.allocatedBlocks.length} blocks to free pool.`
      : `Reclaimed Index Block #${file.indexBlockId} and all ${file.allocatedBlocks.length} data blocks referenced in its index table.`;

  steps.push({
    id: 3,
    phase: 'Block Deallocation',
    title: `Reclaimed ${freedBlocks.length} Physical Block${freedBlocks.length > 1 ? 's' : ''} to Free Space Pool`,
    status: 'completed',
    whatHappened: `Operating system marked blocks [${freedBlocks.join(', ')}] as FREE in the allocation bitmap.`,
    whyItHappened: `Storage blocks must be returned to the OS free-list so subsequent files can reuse the physical capacity.`,
    whatChanged: `Blocks transitioned from OCCUPIED to FREE. ${methodSpecificDetails}`,
    tradeOff: `Fast block reclamation in contiguous mode (O(1) range clear) vs chain traversal in linked mode.`,
    technicalDetails: `Bitmap bits [${freedBlocks.join(', ')}] toggled to 0 (free). Available free space increased by ${freedBlocks.length * config.blockSize} bytes.`,
    highlightedBlockIds: freedBlocks,
  });

  // Step 4: Metadata & Cache Flush
  steps.push({
    id: 4,
    phase: 'Complete',
    title: 'Deletion Finalized & Disk Cache Flushed',
    status: 'completed',
    whatHappened: `File deletion verified. File manager view refreshed. Storage blocks are now fully available for new allocations.`,
    whyItHappened: `Ensures file system metadata consistency. Blocks are immediately recyclable.`,
    whatChanged: `File manager removed "${file.name}". Disk grid shows blocks [${freedBlocks.join(', ')}] in pale grey (FREE).`,
    tradeOff: `Under contiguous allocation, deleting this file might resolve a previous external fragmentation gap.`,
    technicalDetails: `Metadata flushed. Transaction committed successfully. Leaked blocks: 0.`,
    highlightedBlockIds: [],
  });

  return steps;
}

/**
 * Resizes an existing file and generates detailed OS pipeline steps
 */
export function executeResizePipeline(
  file: FileRecord,
  newSizeBytes: number,
  blocks: DiskBlock[],
  method: AllocationMethod,
  config: SimConfig
): {
  success: boolean;
  newFile?: FileRecord;
  updatedBlocks?: DiskBlock[];
  steps: PipelineStep[];
  error?: string;
} {
  const steps: PipelineStep[] = [];
  const oldSizeBytes = file.sizeBytes;
  const oldBlocksCount = file.requiredBlocks;
  const newBlocksCount = Math.max(1, Math.ceil(newSizeBytes / config.blockSize));
  const diff = newBlocksCount - oldBlocksCount;

  // Step 1: Syscall sys_truncate / sys_ftruncate
  steps.push({
    id: 1,
    phase: 'Syscall',
    title: 'sys_ftruncate() / sys_resize() Dispatched',
    status: 'completed',
    whatHappened: `Process requested to resize "${file.name}" from ${oldSizeBytes.toLocaleString()} bytes (${oldBlocksCount} blocks) to ${newSizeBytes.toLocaleString()} bytes (${newBlocksCount} blocks).`,
    whyItHappened: `Dynamic file growth or shrinkage requires the OS to modify disk block allocations without corrupting existing data.`,
    whatChanged: `Kernel verified file permissions and calculated block delta: ${diff >= 0 ? `+${diff}` : `${diff}`} blocks.`,
    tradeOff: `File resizing behavior varies drastically depending on the allocation method used by the OS.`,
    technicalDetails: `Syscall: ftruncate(fd, ${newSizeBytes}). Delta blocks: ${diff}.`,
    highlightedBlockIds: [...file.allocatedBlocks],
  });

  if (diff === 0) {
    // Only internal fragmentation changed
    const newFile: FileRecord = {
      ...file,
      sizeBytes: newSizeBytes,
      updatedAt: Date.now(),
    };
    steps.push({
      id: 2,
      phase: 'Complete',
      title: 'In-Block Payload Adjusted (No Disk Block Delta)',
      status: 'completed',
      whatHappened: `The new size fits inside the existing allocated block count (${newBlocksCount} blocks). Only internal bytes changed.`,
      whyItHappened: `Since ⌈${newSizeBytes} / ${config.blockSize}⌉ == ${oldBlocksCount}, no new physical blocks are required.`,
      whatChanged: `Internal fragmentation adjusted to ${(newBlocksCount * config.blockSize) - newSizeBytes} bytes.`,
      tradeOff: `Zero disk allocation overhead or relocation required.`,
      technicalDetails: `Existing block mapping retained. File inode size updated.`,
      highlightedBlockIds: [...file.allocatedBlocks],
    });
    return { success: true, newFile, updatedBlocks: blocks, steps };
  }

  if (diff < 0) {
    // Shrinking the file
    const blocksToKeep = newBlocksCount;
    const blocksToRemove = file.allocatedBlocks.slice(blocksToKeep);
    const keptBlocks = file.allocatedBlocks.slice(0, blocksToKeep);

    steps.push({
      id: 2,
      phase: 'Shrink',
      title: `Releasing ${blocksToRemove.length} Trailing Disk Blocks`,
      status: 'completed',
      whatHappened: `File size decreased. Operating system released trailing blocks [${blocksToRemove.join(', ')}] back to the free pool.`,
      whyItHappened: `Truncating a file immediately reclaims excess physical sectors so other applications can use them.`,
      whatChanged: `Blocks [${blocksToRemove.join(', ')}] marked as FREE. File retained blocks [${keptBlocks.join(', ')}].`,
      tradeOff: `Truncation is simple and fast across all allocation methods.`,
      technicalDetails: `Reclaimed blocks: [${blocksToRemove.join(', ')}]. File length updated from ${oldBlocksCount} to ${newBlocksCount}.`,
      highlightedBlockIds: blocksToRemove,
    });

    const newBlocks = blocks.map((b) => {
      if (blocksToRemove.includes(b.id)) {
        return {
          ...b,
          state: 'free' as const,
          fileId: null,
          fileName: null,
          fileColor: null,
          fileTag: null,
          blockOffset: null,
          totalBlocksInFile: null,
          bytesUsed: 0,
          nextBlockId: null,
          indexEntries: undefined,
          referencedByIndexBlock: undefined,
        };
      }
      if (keptBlocks.includes(b.id)) {
        const offset = keptBlocks.indexOf(b.id);
        const isLast = offset === keptBlocks.length - 1;
        return {
          ...b,
          totalBlocksInFile: newBlocksCount,
          nextBlockId: isLast ? null : b.nextBlockId,
        };
      }
      return b;
    });

    const newFile: FileRecord = {
      ...file,
      sizeBytes: newSizeBytes,
      requiredBlocks: newBlocksCount,
      totalBlocksAllocated: method === 'indexed' ? newBlocksCount + 1 : newBlocksCount,
      allocatedBlocks: keptBlocks,
      length: newBlocksCount,
      endBlock: keptBlocks[keptBlocks.length - 1],
      updatedAt: Date.now(),
    };

    steps.push({
      id: 3,
      phase: 'Complete',
      title: 'File Truncation Finalized',
      status: 'completed',
      whatHappened: `File metadata updated. File manager reflects truncated size of ${newSizeBytes.toLocaleString()} bytes.`,
      whyItHappened: `Verification complete; no orphaned blocks remaining.`,
      whatChanged: `File updated with ${newBlocksCount} blocks.`,
      tradeOff: `Data beyond offset ${newSizeBytes} is permanently deallocated.`,
      technicalDetails: `Inode truncated. Disk blocks synced.`,
      highlightedBlockIds: keptBlocks,
    });

    return { success: true, newFile, updatedBlocks: newBlocks, steps };
  }

  // Expanding the file (diff > 0)
  const additionalBlocksNeeded = diff;

  if (method === 'contiguous') {
    // In contiguous: must check if adjacent blocks are free
    const check = canExpandContiguous(blocks, file.startBlock, file.length, additionalBlocksNeeded);
    
    if (!check.canExpand) {
      steps.push({
        id: 2,
        phase: 'Collision Check',
        title: 'Contiguous In-Place Expansion BLOCKED (Collision / Fragmentation)',
        status: 'failed',
        whatHappened: `Contiguous expansion failed! Block #${check.blockedAt} immediately following the file is already occupied by "${check.blockingOwner}".`,
        whyItHappened: `Contiguous allocation strictly requires consecutive physical blocks. Because the adjacent block is occupied, the file cannot grow in place.`,
        whatChanged: `Resize rejected. Original file blocks [${file.allocatedBlocks.join(', ')}] remain unchanged.`,
        tradeOff: `Major drawback of Contiguous Allocation: dynamic file growth frequently collides with adjacent files, forcing either failure, costly file relocation, or external fragmentation.`,
        technicalDetails: `Target expansion range: [${file.startBlock + file.length} .. ${file.startBlock + file.length + additionalBlocksNeeded - 1}]. Collision at #${check.blockedAt}.`,
        highlightedBlockIds: [file.startBlock + file.length - 1, check.blockedAt!],
      });

      return {
        success: false,
        steps,
        error: `Cannot expand contiguous file in-place: Block #${check.blockedAt} is occupied by ${check.blockingOwner}.`,
      };
    }

    // Expansion in place succeeds!
    const newAllocatedBlocks: number[] = [...file.allocatedBlocks];
    for (let i = 0; i < additionalBlocksNeeded; i++) {
      newAllocatedBlocks.push(file.startBlock + file.length + i);
    }

    steps.push({
      id: 2,
      phase: 'Expansion',
      title: `Expanded In-Place by ${additionalBlocksNeeded} Adjacent Contiguous Blocks`,
      status: 'completed',
      whatHappened: `Adjacent blocks [${newAllocatedBlocks.slice(file.length).join(', ')}] were free and successfully appended to "${file.name}".`,
      whyItHappened: `Sufficient consecutive free space existed immediately following the file's current end block.`,
      whatChanged: `File length increased from ${file.length} to ${newBlocksCount}. Start block remains #${file.startBlock}.`,
      tradeOff: `In-place growth succeeded without relocation because adjacent blocks happened to be unallocated.`,
      technicalDetails: `Allocated contiguous span: [${newAllocatedBlocks.join(', ')}].`,
      highlightedBlockIds: newAllocatedBlocks,
    });

    const newBlocks = [...blocks];
    for (let i = 0; i < additionalBlocksNeeded; i++) {
      const blkId = file.startBlock + file.length + i;
      newBlocks[blkId] = {
        ...newBlocks[blkId],
        state: 'data',
        fileId: file.id,
        fileName: file.name,
        fileColor: file.color,
        fileTag: file.tag,
        blockOffset: file.length + i,
        totalBlocksInFile: newBlocksCount,
        bytesUsed: config.blockSize,
        nextBlockId: null,
      };
    }
    // Update total blocks count on previous blocks
    for (const blkId of file.allocatedBlocks) {
      newBlocks[blkId] = {
        ...newBlocks[blkId],
        totalBlocksInFile: newBlocksCount,
      };
    }

    const newFile: FileRecord = {
      ...file,
      sizeBytes: newSizeBytes,
      requiredBlocks: newBlocksCount,
      totalBlocksAllocated: newBlocksCount,
      allocatedBlocks: newAllocatedBlocks,
      length: newBlocksCount,
      endBlock: newAllocatedBlocks[newAllocatedBlocks.length - 1],
      updatedAt: Date.now(),
    };

    steps.push({
      id: 3,
      phase: 'Complete',
      title: 'Contiguous Expansion Completed',
      status: 'completed',
      whatHappened: `Directory table entry updated: Start=${file.startBlock}, Length=${newBlocksCount}.`,
      whyItHappened: `All blocks committed. File manager refreshed.`,
      whatChanged: `File "${file.name}" now spans ${newBlocksCount} blocks.`,
      tradeOff: `High read performance maintained with zero pointer overhead.`,
      technicalDetails: `Contiguous file extended smoothly.`,
      highlightedBlockIds: newAllocatedBlocks,
    });

    return { success: true, newFile, updatedBlocks: newBlocks, steps };
  }

  if (method === 'linked') {
    // Linked allocation: can take ANY free blocks
    const freeBlockIds = blocks.filter((b) => b.state === 'free').map((b) => b.id);
    if (freeBlockIds.length < additionalBlocksNeeded) {
      steps.push({
        id: 2,
        phase: 'Space Check',
        title: 'Expansion Failed: Out of Free Disk Blocks',
        status: 'failed',
        whatHappened: `Disk has only ${freeBlockIds.length} free blocks, but expansion requires ${additionalBlocksNeeded}.`,
        whyItHappened: `Physical volume storage ceiling reached.`,
        whatChanged: `Resize aborted; existing file blocks untouched.`,
        tradeOff: `Protects existing file integrity.`,
        technicalDetails: `ENOSPC. Free: ${freeBlockIds.length}, Required: ${additionalBlocksNeeded}.`,
        highlightedBlockIds: [],
      });
      return { success: false, steps, error: 'Not enough free disk blocks to expand.' };
    }

    const newBlocksHarvested = freeBlockIds.slice(0, additionalBlocksNeeded);
    const lastOldBlock = file.allocatedBlocks[file.allocatedBlocks.length - 1];

    steps.push({
      id: 2,
      phase: 'Linked Expansion',
      title: `Linked ${additionalBlocksNeeded} New Blocks to Chain`,
      status: 'completed',
      whatHappened: `OS claimed free blocks [${newBlocksHarvested.join(', ')}] and linked them to the end of the existing chain (Block #${lastOldBlock} ➔ #${newBlocksHarvested[0]}).`,
      whyItHappened: `Linked files can grow effortlessly across any free blocks on disk without needing contiguous space!`,
      whatChanged: `Chain extended: #${lastOldBlock} now points to #${newBlocksHarvested[0]}. Final block #${newBlocksHarvested[newBlocksHarvested.length - 1]} points to EOF (NULL).`,
      tradeOff: `Huge dynamic growth advantage: files grow on-demand as long as any free block exists on the disk volume.`,
      technicalDetails: `Previous end block #${lastOldBlock} next_ptr updated. New end block = #${newBlocksHarvested[newBlocksHarvested.length - 1]}.`,
      highlightedBlockIds: [lastOldBlock, ...newBlocksHarvested],
    });

    const newAllocatedBlocks = [...file.allocatedBlocks, ...newBlocksHarvested];
    const newBlocks = [...blocks];

    // Link previous last block to first new block
    newBlocks[lastOldBlock] = {
      ...newBlocks[lastOldBlock],
      nextBlockId: newBlocksHarvested[0],
      totalBlocksInFile: newBlocksCount,
    };

    // Update old blocks total count
    for (const blkId of file.allocatedBlocks) {
      newBlocks[blkId] = {
        ...newBlocks[blkId],
        totalBlocksInFile: newBlocksCount,
      };
    }

    // Set new blocks
    for (let i = 0; i < newBlocksHarvested.length; i++) {
      const blkId = newBlocksHarvested[i];
      const isLast = i === newBlocksHarvested.length - 1;
      const nextId = isLast ? null : newBlocksHarvested[i + 1];
      newBlocks[blkId] = {
        ...newBlocks[blkId],
        state: 'data',
        fileId: file.id,
        fileName: file.name,
        fileColor: file.color,
        fileTag: file.tag,
        blockOffset: file.allocatedBlocks.length + i,
        totalBlocksInFile: newBlocksCount,
        bytesUsed: config.blockSize,
        nextBlockId: nextId,
      };
    }

    const newFile: FileRecord = {
      ...file,
      sizeBytes: newSizeBytes,
      requiredBlocks: newBlocksCount,
      totalBlocksAllocated: newBlocksCount,
      allocatedBlocks: newAllocatedBlocks,
      length: newBlocksCount,
      endBlock: newBlocksHarvested[newBlocksHarvested.length - 1],
      updatedAt: Date.now(),
    };

    steps.push({
      id: 3,
      phase: 'Complete',
      title: 'Linked File Growth Finalized',
      status: 'completed',
      whatHappened: `Directory entry updated with new end block #${newFile.endBlock}. Total blocks: ${newBlocksCount}.`,
      whyItHappened: `Transaction verified; no circular pointers detected.`,
      whatChanged: `File updated with expanded linked chain.`,
      tradeOff: `Reading the new appended blocks will require traversing through the entire preceding chain.`,
      technicalDetails: `End-of-chain appended in O(1) time thanks to directory endBlock pointer.`,
      highlightedBlockIds: newAllocatedBlocks,
    });

    return { success: true, newFile, updatedBlocks: newBlocks, steps };
  }

  // Indexed allocation
  if (method === 'indexed') {
    if (newBlocksCount > config.indexBlockCapacity) {
      steps.push({
        id: 2,
        phase: 'Index Check',
        title: 'Expansion Failed: Index Block Capacity Exceeded',
        status: 'failed',
        whatHappened: `File requires ${newBlocksCount} blocks, but index block #${file.indexBlockId} holds at most ${config.indexBlockCapacity} pointers.`,
        whyItHappened: `In single-level indexed allocation, index tables cannot hold more addresses than their fixed block size allows.`,
        whatChanged: `Resize rejected; existing blocks unchanged.`,
        tradeOff: `Highlights the limitation of single-level index blocks; requires multi-level or linked index blocks in real systems.`,
        technicalDetails: `Index limit: ${config.indexBlockCapacity}. Requested: ${newBlocksCount}.`,
        highlightedBlockIds: [file.indexBlockId!],
      });
      return {
        success: false,
        steps,
        error: `Cannot expand: File needs ${newBlocksCount} blocks, exceeding index capacity (${config.indexBlockCapacity}).`,
      };
    }

    const freeBlockIds = blocks.filter((b) => b.state === 'free').map((b) => b.id);
    if (freeBlockIds.length < additionalBlocksNeeded) {
      steps.push({
        id: 2,
        phase: 'Space Check',
        title: 'Expansion Failed: Out of Free Disk Blocks',
        status: 'failed',
        whatHappened: `Disk has only ${freeBlockIds.length} free blocks, but expansion demands ${additionalBlocksNeeded}.`,
        whyItHappened: `Insufficient physical disk blocks.`,
        whatChanged: `Resize aborted.`,
        tradeOff: `Rollback maintains consistency.`,
        technicalDetails: `ENOSPC. Free: ${freeBlockIds.length}, Required: ${additionalBlocksNeeded}.`,
        highlightedBlockIds: [],
      });
      return { success: false, steps, error: 'Not enough free disk blocks to expand.' };
    }

    const newBlocksHarvested = freeBlockIds.slice(0, additionalBlocksNeeded);
    const newAllocatedBlocks = [...file.allocatedBlocks, ...newBlocksHarvested];
    const indexBlockId = file.indexBlockId!;

    steps.push({
      id: 2,
      phase: 'Index Update',
      title: `Appended ${additionalBlocksNeeded} Block Pointers into Index Block #${indexBlockId}`,
      status: 'completed',
      whatHappened: `OS allocated free blocks [${newBlocksHarvested.join(', ')}] and appended their addresses into the index table of block #${indexBlockId}.`,
      whyItHappened: `Indexed allocation can expand into any free blocks on disk while maintaining direct random access!`,
      whatChanged: `Index table now holds ${newBlocksCount} pointers: [${newAllocatedBlocks.join(', ')}].`,
      tradeOff: `Direct access speed is preserved for all blocks (1 index read + 1 data read).`,
      technicalDetails: `Index entries appended: index[${file.allocatedBlocks.length}..${newBlocksCount - 1}] = [${newBlocksHarvested.join(', ')}].`,
      highlightedBlockIds: [indexBlockId, ...newBlocksHarvested],
    });

    const newBlocks = [...blocks];
    // Update index block entries
    newBlocks[indexBlockId] = {
      ...newBlocks[indexBlockId],
      indexEntries: newAllocatedBlocks,
    };

    // Update old blocks total count
    for (const blkId of file.allocatedBlocks) {
      newBlocks[blkId] = {
        ...newBlocks[blkId],
        totalBlocksInFile: newBlocksCount,
      };
    }

    // Set new blocks
    for (let i = 0; i < newBlocksHarvested.length; i++) {
      const blkId = newBlocksHarvested[i];
      newBlocks[blkId] = {
        ...newBlocks[blkId],
        state: 'data',
        fileId: file.id,
        fileName: file.name,
        fileColor: file.color,
        fileTag: file.tag,
        blockOffset: file.allocatedBlocks.length + i,
        totalBlocksInFile: newBlocksCount,
        bytesUsed: config.blockSize,
        referencedByIndexBlock: indexBlockId,
      };
    }

    const newFile: FileRecord = {
      ...file,
      sizeBytes: newSizeBytes,
      requiredBlocks: newBlocksCount,
      totalBlocksAllocated: newBlocksCount + 1,
      allocatedBlocks: newAllocatedBlocks,
      length: newBlocksCount,
      endBlock: newAllocatedBlocks[newAllocatedBlocks.length - 1],
      updatedAt: Date.now(),
    };

    steps.push({
      id: 3,
      phase: 'Complete',
      title: 'Indexed File Growth Finalized',
      status: 'completed',
      whatHappened: `File metadata updated. File now spans ${newBlocksCount} data blocks + 1 index block.`,
      whyItHappened: `All pointer updates committed to disk sector #${indexBlockId}.`,
      whatChanged: `File updated in file manager.`,
      tradeOff: `No chain traversal overhead; all new blocks immediately accessible in O(1) address lookup time.`,
      technicalDetails: `Index block entries synchronized.`,
      highlightedBlockIds: [indexBlockId, ...newAllocatedBlocks],
    });

    return { success: true, newFile, updatedBlocks: newBlocks, steps };
  }

  return { success: false, steps, error: 'Unknown allocation method.' };
}

/**
 * Runs a comparative analysis of the exact same set of files on 3 isolated simulated disk states.
 */
export function runComparativeSimulation(files: FileRecord[], config: SimConfig) {
  const methods: AllocationMethod[] = ['contiguous', 'linked', 'indexed'];

  const results = methods.map((method) => {
    let disk = createInitialDisk(config.totalBlocks);
    const methodFiles: FileRecord[] = [];
    const executionLogs: Array<{ fileName: string; success: boolean; reason?: string }> = [];

    for (const f of files) {
      let allocResult;
      if (method === 'contiguous') {
        allocResult = allocateContiguous(disk, f.name, f.sizeBytes, f.requiredBlocks, config);
      } else if (method === 'linked') {
        allocResult = allocateLinked(disk, f.name, f.sizeBytes, f.requiredBlocks, config);
      } else {
        allocResult = allocateIndexed(disk, f.name, f.sizeBytes, f.requiredBlocks, config);
      }

      if (allocResult.success) {
        // Commit to isolated disk
        if (method === 'contiguous') {
          for (let i = 0; i < allocResult.allocatedDataBlocks.length; i++) {
            const blkId = allocResult.allocatedDataBlocks[i];
            disk[blkId] = {
              ...disk[blkId],
              state: 'data',
              fileId: f.id,
              fileName: f.name,
              fileColor: f.color,
              fileTag: f.tag,
              blockOffset: i,
              totalBlocksInFile: allocResult.allocatedDataBlocks.length,
              bytesUsed: config.blockSize,
            };
          }
          methodFiles.push({
            ...f,
            allocatedBlocks: allocResult.allocatedDataBlocks,
            startBlock: allocResult.startBlock,
            length: allocResult.allocatedDataBlocks.length,
            totalBlocksAllocated: allocResult.allocatedDataBlocks.length,
          });
        } else if (method === 'linked') {
          for (let i = 0; i < allocResult.allocatedDataBlocks.length; i++) {
            const blkId = allocResult.allocatedDataBlocks[i];
            const nextId = allocResult.pointerMap ? allocResult.pointerMap[blkId] ?? null : null;
            disk[blkId] = {
              ...disk[blkId],
              state: 'data',
              fileId: f.id,
              fileName: f.name,
              fileColor: f.color,
              fileTag: f.tag,
              blockOffset: i,
              totalBlocksInFile: allocResult.allocatedDataBlocks.length,
              bytesUsed: config.blockSize,
              nextBlockId: nextId,
            };
          }
          methodFiles.push({
            ...f,
            allocatedBlocks: allocResult.allocatedDataBlocks,
            startBlock: allocResult.startBlock,
            endBlock: allocResult.endBlock,
            length: allocResult.allocatedDataBlocks.length,
            totalBlocksAllocated: allocResult.allocatedDataBlocks.length,
          });
        } else {
          // Indexed
          const indexId = allocResult.indexBlockId!;
          disk[indexId] = {
            ...disk[indexId],
            state: 'index',
            fileId: f.id,
            fileName: f.name,
            fileColor: f.color,
            fileTag: f.tag,
            blockOffset: null,
            totalBlocksInFile: allocResult.allocatedDataBlocks.length,
            bytesUsed: config.blockSize,
            indexEntries: allocResult.allocatedDataBlocks,
          };
          for (let i = 0; i < allocResult.allocatedDataBlocks.length; i++) {
            const blkId = allocResult.allocatedDataBlocks[i];
            disk[blkId] = {
              ...disk[blkId],
              state: 'data',
              fileId: f.id,
              fileName: f.name,
              fileColor: f.color,
              fileTag: f.tag,
              blockOffset: i,
              totalBlocksInFile: allocResult.allocatedDataBlocks.length,
              bytesUsed: config.blockSize,
              referencedByIndexBlock: indexId,
            };
          }
          methodFiles.push({
            ...f,
            allocatedBlocks: allocResult.allocatedDataBlocks,
            indexBlockId: indexId,
            startBlock: indexId,
            length: allocResult.allocatedDataBlocks.length,
            totalBlocksAllocated: allocResult.allocatedDataBlocks.length + 1,
          });
        }
        executionLogs.push({ fileName: f.name, success: true });
      } else {
        executionLogs.push({ fileName: f.name, success: false, reason: allocResult.errorMessage });
      }
    }

    const stats = computeDiskStats(disk, methodFiles, config);
    return {
      method,
      disk,
      files: methodFiles,
      stats,
      executionLogs,
    };
  });

  return results;
}

/**
 * Dynamically migrates all active files to a new allocation method and returns the reconstructed disk and updated file records.
 */
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
} {
  const steps: PipelineStep[] = [];
  const newDisk = createInitialDisk(config.totalBlocks);
  const newFiles: FileRecord[] = [];

  const tradeOffMap: Record<AllocationMethod, string> = {
    contiguous:
      'Contiguous allocation guarantees sequential sector runs for maximum read throughput, but is vulnerable to external fragmentation as files grow or are deleted.',
    linked:
      'Linked allocation allows data blocks to be scattered anywhere across the physical volume (zero external fragmentation), but random access requires sequential pointer traversal.',
    indexed:
      'Indexed allocation stores block pointers in a centralized index block, delivering O(1) random access without external fragmentation, at the cost of 1 index block metadata overhead per file.',
  };

  steps.push({
    id: 1,
    phase: 'Driver Switch',
    title: `Kernel Storage Driver Switched: ${oldMethod.toUpperCase()} ➔ ${newMethod.toUpperCase()}`,
    status: 'completed',
    whatHappened: `Operating system unloaded alloc_${oldMethod}.sys and initialized alloc_${newMethod}.sys as the primary volume allocation controller.`,
    whyItHappened: `User switched the secondary storage allocation method. All file data structures and physical disk block maps must be reorganized to conform to ${newMethod.toUpperCase()} architecture.`,
    whatChanged: `Volume C: allocation policy changed from ${oldMethod} to ${newMethod}. Free space bitmap reset and re-scanned.`,
    tradeOff: tradeOffMap[newMethod],
    technicalDetails: `Driver transition: ${oldMethod} -> ${newMethod}. Volume: C: (SimFS). Block size: ${config.blockSize}B.`,
    highlightedBlockIds: [],
  });

  if (files.length === 0) {
    return {
      success: true,
      disk: newDisk,
      files: [],
      steps,
    };
  }

  let allSuccess = true;
  let firstError: string | undefined;

  for (const f of files) {
    let result;
    if (newMethod === 'contiguous') {
      result = allocateContiguous(newDisk, f.name, f.sizeBytes, f.requiredBlocks, config);
    } else if (newMethod === 'linked') {
      result = allocateLinked(newDisk, f.name, f.sizeBytes, f.requiredBlocks, config);
    } else {
      result = allocateIndexed(newDisk, f.name, f.sizeBytes, f.requiredBlocks, config);
    }

    if (result.success) {
      if (newMethod === 'contiguous') {
        for (let i = 0; i < result.allocatedDataBlocks.length; i++) {
          const blkId = result.allocatedDataBlocks[i];
          newDisk[blkId] = {
            ...newDisk[blkId],
            state: 'data',
            fileId: f.id,
            fileName: f.name,
            fileColor: f.color,
            fileTag: f.tag,
            blockOffset: i,
            totalBlocksInFile: result.allocatedDataBlocks.length,
            bytesUsed: config.blockSize,
            nextBlockId: null,
            indexEntries: undefined,
            referencedByIndexBlock: undefined,
          };
        }
        newFiles.push({
          ...f,
          allocatedBlocks: result.allocatedDataBlocks,
          startBlock: result.startBlock,
          length: result.allocatedDataBlocks.length,
          totalBlocksAllocated: result.allocatedDataBlocks.length,
          indexBlockId: undefined,
          endBlock: undefined,
          updatedAt: Date.now(),
        });
      } else if (newMethod === 'linked') {
        for (let i = 0; i < result.allocatedDataBlocks.length; i++) {
          const blkId = result.allocatedDataBlocks[i];
          const nextId = result.pointerMap ? result.pointerMap[blkId] ?? null : null;
          newDisk[blkId] = {
            ...newDisk[blkId],
            state: 'data',
            fileId: f.id,
            fileName: f.name,
            fileColor: f.color,
            fileTag: f.tag,
            blockOffset: i,
            totalBlocksInFile: result.allocatedDataBlocks.length,
            bytesUsed: config.blockSize,
            nextBlockId: nextId,
            indexEntries: undefined,
            referencedByIndexBlock: undefined,
          };
        }
        newFiles.push({
          ...f,
          allocatedBlocks: result.allocatedDataBlocks,
          startBlock: result.startBlock,
          endBlock: result.endBlock,
          length: result.allocatedDataBlocks.length,
          totalBlocksAllocated: result.allocatedDataBlocks.length,
          indexBlockId: undefined,
          updatedAt: Date.now(),
        });
      } else {
        // Indexed
        const indexId = result.indexBlockId!;
        newDisk[indexId] = {
          ...newDisk[indexId],
          state: 'index',
          fileId: f.id,
          fileName: f.name,
          fileColor: f.color,
          fileTag: `${f.name.slice(0, 4)}:IDX`,
          blockOffset: null,
          totalBlocksInFile: result.allocatedDataBlocks.length,
          bytesUsed: config.blockSize,
          indexEntries: result.allocatedDataBlocks,
          nextBlockId: null,
          referencedByIndexBlock: undefined,
        };
        for (let i = 0; i < result.allocatedDataBlocks.length; i++) {
          const blkId = result.allocatedDataBlocks[i];
          newDisk[blkId] = {
            ...newDisk[blkId],
            state: 'data',
            fileId: f.id,
            fileName: f.name,
            fileColor: f.color,
            fileTag: f.tag,
            blockOffset: i,
            totalBlocksInFile: result.allocatedDataBlocks.length,
            bytesUsed: config.blockSize,
            referencedByIndexBlock: indexId,
            nextBlockId: null,
            indexEntries: undefined,
          };
        }
        newFiles.push({
          ...f,
          allocatedBlocks: result.allocatedDataBlocks,
          indexBlockId: indexId,
          startBlock: indexId,
          length: result.allocatedDataBlocks.length,
          totalBlocksAllocated: result.allocatedDataBlocks.length + 1,
          endBlock: undefined,
          updatedAt: Date.now(),
        });
      }
    } else {
      allSuccess = false;
      if (!firstError) firstError = result.errorMessage;
    }
  }

  const allAllocatedBlockIds = newFiles.flatMap((f) =>
    f.indexBlockId !== undefined ? [f.indexBlockId, ...f.allocatedBlocks] : f.allocatedBlocks
  );

  steps.push({
    id: 2,
    phase: 'Physical Reorganization',
    title: `Physical Disk Sectors Reorganized under ${newMethod.toUpperCase()} Architecture`,
    status: allSuccess ? 'completed' : 'failed',
    whatHappened:
      newMethod === 'contiguous'
        ? `Consolidated all files into sequential contiguous sector extents. Start blocks recorded in root directory.`
        : newMethod === 'linked'
        ? `Embedded forward link pointers into each sector header. Files now terminate at EOF marker.`
        : `Allocated dedicated yellow Index Blocks (IDX) storing direct block pointer tables.`,
    whyItHappened: `Reflects the true hardware layout of ${newMethod.toUpperCase()} allocation on disk.`,
    whatChanged: `Total active files: ${newFiles.length}/${files.length} successfully migrated. Allocated sectors: [${allAllocatedBlockIds.join(', ')}].`,
    tradeOff: tradeOffMap[newMethod],
    technicalDetails: `Active sector map: [${allAllocatedBlockIds.join(', ')}].`,
    highlightedBlockIds: allAllocatedBlockIds,
  });

  return {
    success: allSuccess,
    disk: newDisk,
    files: newFiles,
    steps,
    error: firstError,
  };
}
