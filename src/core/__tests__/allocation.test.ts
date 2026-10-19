import { describe, it, expect } from 'vitest';
import { allocateContiguous, canExpandContiguous } from '../contiguous';
import { allocateLinked } from '../linked';
import { allocateIndexed } from '../indexed';
import type { DiskBlock, SimConfig } from '../../types/simulator';

function createMockDisk(totalBlocks = 32): DiskBlock[] {
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

const mockConfig: SimConfig = {
  totalBlocks: 32,
  blockSize: 512,
  indexBlockCapacity: 16,
  pointerOverheadBytes: 4,
  contiguousStrategy: 'first-fit',
};

describe('Contiguous Allocation Algorithm', () => {
  it('successfully allocates a small contiguous file', () => {
    const disk = createMockDisk(16);
    const result = allocateContiguous(disk, 'test.txt', 1000, 2, mockConfig);

    expect(result.success).toBe(true);
    expect(result.allocatedDataBlocks).toEqual([0, 1]);
    expect(result.startBlock).toBe(0);
    expect(result.endBlock).toBe(1);
    expect(result.steps.length).toBe(7);
  });

  it('fails when file exceeds total available disk space', () => {
    const disk = createMockDisk(4);
    const result = allocateContiguous(disk, 'huge.dat', 5000, 10, mockConfig);

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('OUT_OF_SPACE');
    expect(result.allocatedDataBlocks.length).toBe(0);
  });

  it('detects and fails on External Fragmentation when total free space exists but no contiguous run is large enough', () => {
    const disk = createMockDisk(10);
    // Occupy every alternate block so total free = 5, but max contiguous run = 1!
    // Block 0: free, Block 1: occupied, Block 2: free, Block 3: occupied, etc.
    disk[1].state = 'data';
    disk[1].fileId = 'f1';
    disk[3].state = 'data';
    disk[3].fileId = 'f1';
    disk[5].state = 'data';
    disk[5].fileId = 'f1';
    disk[7].state = 'data';
    disk[7].fileId = 'f1';
    disk[9].state = 'data';
    disk[9].fileId = 'f1';

    // Free blocks are 0, 2, 4, 6, 8 (total 5 free blocks).
    // Now request a file of 3 blocks!
    const result = allocateContiguous(disk, 'fragmented.bin', 1500, 3, mockConfig);

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('EXTERNAL_FRAGMENTATION');
    expect(result.errorMessage).toContain('External Fragmentation');
  });

  it('correctly checks if contiguous file can expand in-place or is blocked by adjacent allocation', () => {
    const disk = createMockDisk(10);
    // File 1 is at [2, 3]
    // Block 4 is occupied by File 2
    disk[4].state = 'data';
    disk[4].fileId = 'f2';
    disk[4].fileName = 'blocker.txt';

    const check = canExpandContiguous(disk, 2, 2, 2);
    expect(check.canExpand).toBe(false);
    expect(check.blockedAt).toBe(4);
    expect(check.blockingOwner).toBe('blocker.txt');

    // If block 4 and 5 were free, it could expand
    disk[4].state = 'free';
    disk[4].fileId = null;
    disk[4].fileName = null;
    const checkFree = canExpandContiguous(disk, 2, 2, 2);
    expect(checkFree.canExpand).toBe(true);
  });
});

describe('Linked Allocation Algorithm', () => {
  it('successfully allocates across non-consecutive free blocks and synthesizes pointers', () => {
    const disk = createMockDisk(10);
    // Occupy blocks 0, 1, 3, 5
    disk[0].state = 'data';
    disk[1].state = 'data';
    disk[3].state = 'data';
    disk[5].state = 'data';

    // Free blocks are 2, 4, 6, 7, 8, 9
    const result = allocateLinked(disk, 'linked.txt', 1500, 3, mockConfig);

    expect(result.success).toBe(true);
    // Should take the first 3 available free blocks: 2, 4, 6
    expect(result.allocatedDataBlocks).toEqual([2, 4, 6]);
    expect(result.startBlock).toBe(2);
    expect(result.endBlock).toBe(6);
    expect(result.pointerMap).toEqual({
      2: 4,
      4: 6,
      6: null, // EOF
    });
  });

  it('fails with OUT_OF_SPACE when total free blocks is less than required', () => {
    const disk = createMockDisk(3);
    const result = allocateLinked(disk, 'big.pdf', 3000, 6, mockConfig);

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('OUT_OF_SPACE');
  });
});

describe('Indexed Allocation Algorithm', () => {
  it('reserves 1 index block and allocates data blocks with index table entries', () => {
    const disk = createMockDisk(10);
    // Free blocks: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    // Needs 3 data blocks + 1 index block = 4 total blocks
    const result = allocateIndexed(disk, 'report.pdf', 1500, 3, mockConfig);

    expect(result.success).toBe(true);
    expect(result.indexBlockId).toBe(0);
    expect(result.allocatedDataBlocks).toEqual([1, 2, 3]);
    expect(result.startBlock).toBe(0); // Index block
    expect(result.steps.length).toBe(7);
  });

  it('fails when file requires more data blocks than single index block capacity', () => {
    const disk = createMockDisk(64);
    // config capacity is 16. Request 20 blocks.
    const result = allocateIndexed(disk, 'overflow.iso', 20 * 512, 20, mockConfig);

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('INDEX_LIMIT_EXCEEDED');
  });

  it('fails when total free blocks is less than data blocks + index block', () => {
    const disk = createMockDisk(4);
    // Needs 4 data blocks + 1 index block = 5 blocks, but only 4 exist!
    const result = allocateIndexed(disk, 'overflow.iso', 4 * 512, 4, mockConfig);

    expect(result.success).toBe(false);
    expect(result.failureCode).toBe('OUT_OF_SPACE');
  });
});
