/**
 * Preset Educational Scenarios for OS File Allocation Demonstrations
 * Operating System Principles - Jaijitesh Suryaprakash (25BIT0235)
 */

import type { AllocationMethod, DiskBlock, FileRecord, SimConfig } from '../types/simulator';
import { FILE_COLORS } from './simulatorEngine';

export interface ScenarioDefinition {
  id: string;
  title: string;
  category: 'Fragmentation' | 'Growth' | 'Overhead' | 'Comparison';
  subtitle: string;
  recommendedMethod: AllocationMethod;
  description: string;
  learningGoal: string;
  setup: (config: SimConfig) => {
    method: AllocationMethod;
    blocks: DiskBlock[];
    files: FileRecord[];
  };
}

export const EDUCATIONAL_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'external-frag',
    title: 'The Contiguous External Fragmentation Trap',
    category: 'Fragmentation',
    subtitle: 'Free space exists, but no contiguous run is large enough',
    recommendedMethod: 'contiguous',
    description:
      'Creates 4 alternating files, then deletes files in between. The disk will have 12 total free blocks, but the largest contiguous gap is only 3 blocks. When you attempt to create a 5-block file, Contiguous Allocation FAILS while Linked and Indexed would succeed effortlessly!',
    learningGoal:
      'Understand how dynamic file creation and deletion fragments storage, making contiguous space unavailable even when total free space is abundant.',
    setup: (config) => {
      const blocks: DiskBlock[] = [];
      for (let i = 0; i < config.totalBlocks; i++) {
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

      // We occupy blocks to create small gaps:
      // Gap 0..2 (3 blocks free)
      // File A: blocks 3..5 (3 blocks)
      // Gap 6..8 (3 blocks free)
      // File B: blocks 9..11 (3 blocks)
      // Gap 12..14 (3 blocks free)
      // File C: blocks 15..17 (3 blocks)
      // Gap 18..20 (3 blocks free)
      // Fill remaining blocks 21..63 with system files to constrain total free space to 12 blocks!
      
      const fileA: FileRecord = {
        id: 'file-doc-1',
        name: 'kernel_core.sys',
        type: 'BINARY',
        sizeBytes: 3 * 512,
        requiredBlocks: 3,
        totalBlocksAllocated: 3,
        allocatedBlocks: [3, 4, 5],
        startBlock: 3,
        length: 3,
        color: FILE_COLORS[0].bg,
        tag: 'F1',
        createdAt: Date.now() - 30000,
        updatedAt: Date.now() - 30000,
      };

      const fileB: FileRecord = {
        id: 'file-doc-2',
        name: 'database.db',
        type: 'BINARY',
        sizeBytes: 3 * 512,
        requiredBlocks: 3,
        totalBlocksAllocated: 3,
        allocatedBlocks: [9, 10, 11],
        startBlock: 9,
        length: 3,
        color: FILE_COLORS[1].bg,
        tag: 'F2',
        createdAt: Date.now() - 25000,
        updatedAt: Date.now() - 25000,
      };

      const fileC: FileRecord = {
        id: 'file-doc-3',
        name: 'user_profile.dat',
        type: 'PDF',
        sizeBytes: 3 * 512,
        requiredBlocks: 3,
        totalBlocksAllocated: 3,
        allocatedBlocks: [15, 16, 17],
        startBlock: 15,
        length: 3,
        color: FILE_COLORS[2].bg,
        tag: 'F3',
        createdAt: Date.now() - 20000,
        updatedAt: Date.now() - 20000,
      };

      const fileSys: FileRecord = {
        id: 'file-sys-reserved',
        name: 'swapfile.sys',
        type: 'BINARY',
        sizeBytes: (config.totalBlocks - 21) * 512,
        requiredBlocks: config.totalBlocks - 21,
        totalBlocksAllocated: config.totalBlocks - 21,
        allocatedBlocks: Array.from({ length: config.totalBlocks - 21 }, (_, i) => 21 + i),
        startBlock: 21,
        length: config.totalBlocks - 21,
        color: FILE_COLORS[3].bg,
        tag: 'F4',
        createdAt: Date.now() - 15000,
        updatedAt: Date.now() - 15000,
      };

      // Populate blocks
      for (const f of [fileA, fileB, fileC, fileSys]) {
        for (let i = 0; i < f.allocatedBlocks.length; i++) {
          const blkId = f.allocatedBlocks[i];
          blocks[blkId] = {
            ...blocks[blkId],
            state: 'data',
            fileId: f.id,
            fileName: f.name,
            fileColor: f.color,
            fileTag: f.tag,
            blockOffset: i,
            totalBlocksInFile: f.allocatedBlocks.length,
            bytesUsed: config.blockSize,
          };
        }
      }

      return {
        method: 'contiguous',
        blocks,
        files: [fileA, fileB, fileC, fileSys],
      };
    },
  },
  {
    id: 'linked-scatter',
    title: 'Linked Allocation: Scattering & Chain Traversal',
    category: 'Overhead',
    subtitle: 'Zero external fragmentation across scattered blocks',
    recommendedMethod: 'linked',
    description:
      'Demonstrates how linked allocation weaves through non-consecutive free blocks. Pointers are stored in each sector header, forming a linked list from start to end.',
    learningGoal:
      'Learn how forward pointers eliminate external fragmentation, but introduce sequential traversal overhead and pointer vulnerability.',
    setup: (config) => {
      const blocks: DiskBlock[] = [];
      for (let i = 0; i < config.totalBlocks; i++) {
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

      // Populate file 1 across scattered blocks: 4, 11, 19, 27, 34
      const chain1 = [4, 11, 19, 27, 34];
      const file1: FileRecord = {
        id: 'linked-f1',
        name: 'network_packet_log.txt',
        type: 'TXT',
        sizeBytes: 5 * 512,
        requiredBlocks: 5,
        totalBlocksAllocated: 5,
        allocatedBlocks: chain1,
        startBlock: 4,
        endBlock: 34,
        length: 5,
        color: FILE_COLORS[0].bg,
        tag: 'F1',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
      };

      for (let i = 0; i < chain1.length; i++) {
        const blkId = chain1[i];
        const nextId = i < chain1.length - 1 ? chain1[i + 1] : null;
        blocks[blkId] = {
          ...blocks[blkId],
          state: 'data',
          fileId: file1.id,
          fileName: file1.name,
          fileColor: file1.color,
          fileTag: file1.tag,
          blockOffset: i,
          totalBlocksInFile: 5,
          bytesUsed: config.blockSize,
          nextBlockId: nextId,
        };
      }

      return {
        method: 'linked',
        blocks,
        files: [file1],
      };
    },
  },
  {
    id: 'indexed-direct-access',
    title: 'Indexed Allocation: Direct Addressing & Index Block',
    category: 'Comparison',
    subtitle: 'Centralized index table with O(1) direct block access',
    recommendedMethod: 'indexed',
    description:
      'Demonstrates a dedicated Index Block that stores pointers to all the file data sectors. Reading any block requires only 1 index block lookup followed by direct data sector access.',
    learningGoal:
      'Observe the trade-off between index block space overhead and fast direct address calculation without pointer chains.',
    setup: (config) => {
      const blocks: DiskBlock[] = [];
      for (let i = 0; i < config.totalBlocks; i++) {
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

      // Index block at #2
      // Data blocks at: [6, 14, 22, 30]
      const indexBlockId = 2;
      const dataBlocks = [6, 14, 22, 30];

      const file1: FileRecord = {
        id: 'indexed-f1',
        name: 'os_presentation.pdf',
        type: 'PDF',
        sizeBytes: 4 * 512,
        requiredBlocks: 4,
        totalBlocksAllocated: 5, // 1 index + 4 data
        allocatedBlocks: dataBlocks,
        indexBlockId: 2,
        startBlock: 2,
        length: 4,
        color: FILE_COLORS[2].bg,
        tag: 'F1',
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      };

      // Set index block
      blocks[indexBlockId] = {
        ...blocks[indexBlockId],
        state: 'index',
        fileId: file1.id,
        fileName: file1.name,
        fileColor: file1.color,
        fileTag: file1.tag,
        blockOffset: null,
        totalBlocksInFile: 4,
        bytesUsed: config.blockSize,
        indexEntries: dataBlocks,
      };

      // Set data blocks
      for (let i = 0; i < dataBlocks.length; i++) {
        const blkId = dataBlocks[i];
        blocks[blkId] = {
          ...blocks[blkId],
          state: 'data',
          fileId: file1.id,
          fileName: file1.name,
          fileColor: file1.color,
          fileTag: file1.tag,
          blockOffset: i,
          totalBlocksInFile: 4,
          bytesUsed: config.blockSize,
          referencedByIndexBlock: indexBlockId,
        };
      }

      return {
        method: 'indexed',
        blocks,
        files: [file1],
      };
    },
  },
  {
    id: 'contiguous-growth-collision',
    title: 'Contiguous In-Place Growth Collision',
    category: 'Growth',
    subtitle: 'Dynamic growth blocked by neighboring files',
    recommendedMethod: 'contiguous',
    description:
      'Two files are placed right next to each other. File 1 occupies blocks 0..2 and File 2 occupies blocks 3..5. When File 1 tries to expand by 2 blocks, it collides with File 2!',
    learningGoal:
      'Understand why operating systems with contiguous allocation struggle with dynamic file growth and need file relocation or defragmentation.',
    setup: (config) => {
      const blocks: DiskBlock[] = [];
      for (let i = 0; i < config.totalBlocks; i++) {
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

      const fileA: FileRecord = {
        id: 'f-grow-1',
        name: 'notes.txt',
        type: 'TXT',
        sizeBytes: 3 * 512,
        requiredBlocks: 3,
        totalBlocksAllocated: 3,
        allocatedBlocks: [0, 1, 2],
        startBlock: 0,
        length: 3,
        color: FILE_COLORS[0].bg,
        tag: 'F1',
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
      };

      const fileB: FileRecord = {
        id: 'f-grow-2',
        name: 'photo.jpg',
        type: 'IMAGE',
        sizeBytes: 3 * 512,
        requiredBlocks: 3,
        totalBlocksAllocated: 3,
        allocatedBlocks: [3, 4, 5],
        startBlock: 3,
        length: 3,
        color: FILE_COLORS[1].bg,
        tag: 'F2',
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      };

      for (let i = 0; i < 3; i++) {
        blocks[i] = {
          ...blocks[i],
          state: 'data',
          fileId: fileA.id,
          fileName: fileA.name,
          fileColor: fileA.color,
          fileTag: fileA.tag,
          blockOffset: i,
          totalBlocksInFile: 3,
          bytesUsed: config.blockSize,
        };
      }

      for (let i = 3; i < 6; i++) {
        blocks[i] = {
          ...blocks[i],
          state: 'data',
          fileId: fileB.id,
          fileName: fileB.name,
          fileColor: fileB.color,
          fileTag: fileB.tag,
          blockOffset: i - 3,
          totalBlocksInFile: 3,
          bytesUsed: config.blockSize,
        };
      }

      return {
        method: 'contiguous',
        blocks,
        files: [fileA, fileB],
      };
    },
  },
];
