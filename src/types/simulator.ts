/**
 * Visual Simulator for File Allocation Techniques in Operating Systems
 * Course: Operating System Principles
 * Student: Jaijitesh Suryaprakash (25BIT0235)
 */

export type AllocationMethod = 'contiguous' | 'linked' | 'indexed';

export type FileType = 'TXT' | 'PDF' | 'IMAGE' | 'BINARY' | 'CODE';

export interface FileRecord {
  id: string;
  name: string;
  type: FileType;
  sizeBytes: number;
  requiredBlocks: number; // Data blocks needed
  totalBlocksAllocated: number; // Includes metadata/index block if any
  allocatedBlocks: number[]; // In logical order
  indexBlockId?: number; // Only for indexed allocation
  startBlock: number; // Starting block (-1 if empty or none)
  endBlock?: number; // For linked allocation
  length: number; // Number of contiguous blocks (or data blocks)
  color: string;
  tag: string; // e.g. "F1", "F2", "F3"
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export type BlockState = 'free' | 'data' | 'index';

export interface DiskBlock {
  id: number;
  state: BlockState;
  fileId: string | null;
  fileName: string | null;
  fileColor: string | null;
  fileTag: string | null;
  blockOffset: number | null; // e.g. 0, 1, 2 (which block of file)
  totalBlocksInFile: number | null;
  bytesUsed: number;
  nextBlockId: number | null; // For linked allocation: next pointer, or null for EOF
  indexEntries?: number[]; // For index block: array of referenced data block IDs
  referencedByIndexBlock?: number; // For data block in indexed: owner index block ID
}

export interface PipelineStep {
  id: number;
  phase: string;
  title: string;
  status: 'completed' | 'active' | 'failed' | 'pending';
  whatHappened: string;
  whyItHappened: string;
  whatChanged: string;
  tradeOff: string;
  technicalDetails?: string;
  highlightedBlockIds: number[];
  pointerLines?: Array<{ from: number; to: number }>;
}

export interface PipelineSession {
  operationType: 'save' | 'resize' | 'delete' | 'read';
  fileName: string;
  method: AllocationMethod;
  steps: PipelineStep[];
  currentStepIndex: number;
  isSuccess: boolean;
  errorReason?: string;
  timestamp: number;
}

export type AllocationFailureCode =
  | 'OUT_OF_SPACE'
  | 'EXTERNAL_FRAGMENTATION'
  | 'INDEX_LIMIT_EXCEEDED'
  | 'CONTIGUOUS_GROWTH_BLOCKED'
  | 'INVALID_SIZE';

export interface AllocationResult {
  success: boolean;
  allocatedDataBlocks: number[];
  indexBlockId?: number;
  pointerMap?: Record<number, number | null>; // blockId -> nextBlockId
  failureCode?: AllocationFailureCode;
  errorMessage?: string;
  steps: PipelineStep[];
  startBlock: number;
  endBlock?: number;
}

export interface SimConfig {
  totalBlocks: number;
  blockSize: number; // in bytes, default 512
  indexBlockCapacity: number; // max pointers per index block, e.g. 16
  pointerOverheadBytes: number; // e.g. 4 bytes
  contiguousStrategy: 'first-fit' | 'best-fit' | 'worst-fit';
}

export interface DiskStats {
  totalBlocks: number;
  occupiedBlocks: number;
  freeBlocks: number;
  utilizationPercent: number;
  fileCount: number;
  totalDataBytes: number;
  totalCapacityBytes: number;
  internalFragmentationBytes: number;
  externalFragmentationMetric: {
    hasFragmentation: boolean;
    freeBlocksAvailable: number;
    maxContiguousRun: number;
  };
}

export interface EducationalScenario {
  id: string;
  title: string;
  subtitle: string;
  method: AllocationMethod;
  description: string;
  actionExplanation: string;
  apply: () => void;
}
