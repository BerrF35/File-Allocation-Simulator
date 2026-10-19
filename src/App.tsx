import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  AllocationMethod,
  DiskBlock,
  FileRecord,
  FileType,
  PipelineSession,
  SimConfig,
} from './types/simulator';
import {
  DEFAULT_CONFIG,
  FILE_COLORS,
  computeDiskStats,
  createInitialDisk,
  executeDeletePipeline,
  executeResizePipeline,
} from './core/simulatorEngine';
import { allocateContiguous } from './core/contiguous';
import { allocateLinked } from './core/linked';
import { allocateIndexed } from './core/indexed';
import type { ScenarioDefinition } from './core/scenarios';

// UI Components
import { SystemTopBar } from './components/SystemTopBar';
import { DesktopWorkspace } from './components/DesktopWorkspace';
import { FileManagerWindow } from './components/FileManagerWindow';
import { DiskGridView } from './components/DiskGridView';
import { DiskSummaryCard } from './components/DiskSummaryCard';
import { BlockInspectorDrawer } from './components/BlockInspectorDrawer';
import { PipelineExplanationPanel } from './components/PipelineExplanationPanel';
import { NewFileDialog } from './components/NewFileDialog';
import { ResizeFileDialog } from './components/ResizeFileDialog';
import { RenameFileDialog } from './components/RenameFileDialog';
import { RecycleBinModal } from './components/RecycleBinModal';
import { ScenariosModal } from './components/ScenariosModal';
import { ComparisonViewModal } from './components/ComparisonViewModal';
import { AboutModal } from './components/AboutModal';

const STORAGE_KEY = 'os_alloc_simulator_state_v1';

export const App: React.FC = () => {
  // Core Simulation State
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const [method, setMethod] = useState<AllocationMethod>('contiguous');
  const [blocks, setBlocks] = useState<DiskBlock[]>(() => createInitialDisk(DEFAULT_CONFIG.totalBlocks));
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [recycleBin, setRecycleBin] = useState<FileRecord[]>([]);

  // Selection & UI Focus
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);

  // Pipeline Execution State
  const [pipelineSession, setPipelineSession] = useState<PipelineSession | null>(null);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [firstSaveHappened, setFirstSaveHappened] = useState<boolean>(false);

  // Modals
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [resizeTargetFile, setResizeTargetFile] = useState<FileRecord | null>(null);
  const [renameTargetFile, setRenameTargetFile] = useState<FileRecord | null>(null);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.files && parsed.blocks && parsed.method) {
          setConfig(parsed.config || DEFAULT_CONFIG);
          setMethod(parsed.method);
          setBlocks(parsed.blocks);
          setFiles(parsed.files);
          setRecycleBin(parsed.recycleBin || []);
          setFirstSaveHappened(parsed.firstSaveHappened || false);
          setIsSplitView(parsed.isSplitView || false);
        }
      }
    } catch {
      // Fallback to fresh initial state
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          config,
          method,
          blocks,
          files,
          recycleBin,
          firstSaveHappened,
          isSplitView,
        })
      );
    } catch {
      // localStorage quota exceeded or unavailable
    }
  }, [config, method, blocks, files, recycleBin, firstSaveHappened, isSplitView]);

  // Derived Telemetry Stats
  const stats = useMemo(() => computeDiskStats(blocks, files, config), [blocks, files, config]);

  // Highlighted blocks for current pipeline step
  const highlightedBlockIds = useMemo(() => {
    if (!pipelineSession || pipelineSession.steps.length === 0) {
      if (selectedFileId) {
        const f = files.find((file) => file.id === selectedFileId);
        if (f) {
          const list = [...f.allocatedBlocks];
          if (f.indexBlockId !== undefined) list.unshift(f.indexBlockId);
          return list;
        }
      }
      return [];
    }
    const curStep = pipelineSession.steps[pipelineSession.currentStepIndex];
    return curStep ? curStep.highlightedBlockIds : [];
  }, [pipelineSession, selectedFileId, files]);

  // Handler: Create and Save a File
  const handleCreateFile = useCallback(
    ({
      name,
      type,
      sizeBytes,
      content,
    }: {
      name: string;
      type: FileType;
      sizeBytes: number;
      content?: string;
    }) => {
      const fileId = `file-${Date.now()}`;
      const colorIndex = files.length % FILE_COLORS.length;
      const fileColor = FILE_COLORS[colorIndex].bg;
      const fileTag = `F${files.length + 1}`;
      const requiredBlocks = Math.max(1, Math.ceil(sizeBytes / config.blockSize));

      let result;
      if (method === 'contiguous') {
        result = allocateContiguous(blocks, name, sizeBytes, requiredBlocks, config);
      } else if (method === 'linked') {
        result = allocateLinked(blocks, name, sizeBytes, requiredBlocks, config);
      } else {
        result = allocateIndexed(blocks, name, sizeBytes, requiredBlocks, config);
      }

      if (result.success) {
        // Commit allocated blocks to disk state
        const newBlocks = [...blocks];

        if (method === 'contiguous') {
          for (let i = 0; i < result.allocatedDataBlocks.length; i++) {
            const blkId = result.allocatedDataBlocks[i];
            newBlocks[blkId] = {
              ...newBlocks[blkId],
              state: 'data',
              fileId,
              fileName: name,
              fileColor,
              fileTag,
              blockOffset: i,
              totalBlocksInFile: result.allocatedDataBlocks.length,
              bytesUsed: config.blockSize,
              nextBlockId: null,
            };
          }

          const newFile: FileRecord = {
            id: fileId,
            name,
            type,
            sizeBytes,
            requiredBlocks,
            totalBlocksAllocated: result.allocatedDataBlocks.length,
            allocatedBlocks: result.allocatedDataBlocks,
            startBlock: result.startBlock,
            length: result.allocatedDataBlocks.length,
            color: fileColor,
            tag: fileTag,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setBlocks(newBlocks);
          setFiles((prev) => [...prev, newFile]);
          setSelectedFileId(fileId);
        } else if (method === 'linked') {
          for (let i = 0; i < result.allocatedDataBlocks.length; i++) {
            const blkId = result.allocatedDataBlocks[i];
            const nextId = result.pointerMap ? result.pointerMap[blkId] ?? null : null;
            newBlocks[blkId] = {
              ...newBlocks[blkId],
              state: 'data',
              fileId,
              fileName: name,
              fileColor,
              fileTag,
              blockOffset: i,
              totalBlocksInFile: result.allocatedDataBlocks.length,
              bytesUsed: config.blockSize,
              nextBlockId: nextId,
            };
          }

          const newFile: FileRecord = {
            id: fileId,
            name,
            type,
            sizeBytes,
            requiredBlocks,
            totalBlocksAllocated: result.allocatedDataBlocks.length,
            allocatedBlocks: result.allocatedDataBlocks,
            startBlock: result.startBlock,
            endBlock: result.endBlock,
            length: result.allocatedDataBlocks.length,
            color: fileColor,
            tag: fileTag,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setBlocks(newBlocks);
          setFiles((prev) => [...prev, newFile]);
          setSelectedFileId(fileId);
        } else {
          // Indexed
          const indexId = result.indexBlockId!;
          newBlocks[indexId] = {
            ...newBlocks[indexId],
            state: 'index',
            fileId,
            fileName: name,
            fileColor,
            fileTag,
            blockOffset: null,
            totalBlocksInFile: result.allocatedDataBlocks.length,
            bytesUsed: config.blockSize,
            indexEntries: result.allocatedDataBlocks,
          };

          for (let i = 0; i < result.allocatedDataBlocks.length; i++) {
            const blkId = result.allocatedDataBlocks[i];
            newBlocks[blkId] = {
              ...newBlocks[blkId],
              state: 'data',
              fileId,
              fileName: name,
              fileColor,
              fileTag,
              blockOffset: i,
              totalBlocksInFile: result.allocatedDataBlocks.length,
              bytesUsed: config.blockSize,
              referencedByIndexBlock: indexId,
            };
          }

          const newFile: FileRecord = {
            id: fileId,
            name,
            type,
            sizeBytes,
            requiredBlocks,
            totalBlocksAllocated: result.allocatedDataBlocks.length + 1,
            allocatedBlocks: result.allocatedDataBlocks,
            indexBlockId: indexId,
            startBlock: indexId,
            length: result.allocatedDataBlocks.length,
            color: fileColor,
            tag: fileTag,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setBlocks(newBlocks);
          setFiles((prev) => [...prev, newFile]);
          setSelectedFileId(fileId);
        }

        // Setup successful pipeline session & transition to split view
        setPipelineSession({
          operationType: 'save',
          fileName: name,
          method,
          steps: result.steps,
          currentStepIndex: result.steps.length - 1, // Start at completed step
          isSuccess: true,
          timestamp: Date.now(),
        });
      } else {
        // Allocation failed: zero blocks leaked, rollback verified
        setPipelineSession({
          operationType: 'save',
          fileName: name,
          method,
          steps: result.steps,
          currentStepIndex: result.steps.length - 1,
          isSuccess: false,
          errorReason: result.errorMessage,
          timestamp: Date.now(),
        });
      }

      // Smooth transition to primary split-screen learning interface
      setFirstSaveHappened(true);
      setIsSplitView(true);
    },
    [blocks, config, files, method]
  );

  // Handler: Resize File
  const handleResizeFile = useCallback(
    (fileId: string, newSizeBytes: number) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      const result = executeResizePipeline(file, newSizeBytes, blocks, method, config);

      if (result.success && result.newFile && result.updatedBlocks) {
        setBlocks(result.updatedBlocks);
        setFiles((prev) => prev.map((f) => (f.id === fileId ? result.newFile! : f)));
      }

      setPipelineSession({
        operationType: 'resize',
        fileName: file.name,
        method,
        steps: result.steps,
        currentStepIndex: result.steps.length - 1,
        isSuccess: result.success,
        errorReason: result.error,
        timestamp: Date.now(),
      });

      setIsSplitView(true);
    },
    [blocks, config, files, method]
  );

  // Handler: Rename File
  const handleRenameFile = useCallback((fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName, updatedAt: Date.now() } : f))
    );
    setBlocks((prev) =>
      prev.map((b) => (b.fileId === fileId ? { ...b, fileName: newName } : b))
    );
  }, []);

  // Handler: Delete File
  const handleDeleteFile = useCallback(
    (file: FileRecord) => {
      const steps = executeDeletePipeline(file, method, config);

      // Reclaim blocks
      const freedBlocks = [...file.allocatedBlocks];
      if (file.indexBlockId !== undefined) freedBlocks.unshift(file.indexBlockId);

      setBlocks((prev) =>
        prev.map((b) =>
          freedBlocks.includes(b.id)
            ? {
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
              }
            : b
        )
      );

      // Remove from active files & stage in recycle bin
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setRecycleBin((prev) => [...prev, file]);

      if (selectedFileId === file.id) setSelectedFileId(null);
      if (selectedBlockId !== null && freedBlocks.includes(selectedBlockId)) {
        setSelectedBlockId(null);
      }

      setPipelineSession({
        operationType: 'delete',
        fileName: file.name,
        method,
        steps,
        currentStepIndex: steps.length - 1,
        isSuccess: true,
        timestamp: Date.now(),
      });

      setIsSplitView(true);
    },
    [config, method, selectedBlockId, selectedFileId]
  );

  // Handler: Restore File from Recycle Bin
  const handleRestoreFile = useCallback(
    (file: FileRecord) => {
      setRecycleBin((prev) => prev.filter((f) => f.id !== file.id));
      handleCreateFile({
        name: file.name,
        type: file.type,
        sizeBytes: file.sizeBytes,
        content: file.content,
      });
      setIsRecycleBinOpen(false);
    },
    [handleCreateFile]
  );

  // Handler: Empty Recycle Bin
  const handleEmptyBin = useCallback(() => {
    setRecycleBin([]);
    setIsRecycleBinOpen(false);
  }, []);

  // Handler: Switch Allocation Method
  const handleSelectMethod = useCallback(
    (newMethod: AllocationMethod) => {
      if (newMethod === method) return;
      setMethod(newMethod);
      setSelectedBlockId(null);
      // Inform student that method changed
    },
    [method]
  );

  // Handler: Load Preset Educational Scenario
  const handleSelectScenario = useCallback(
    (scenario: ScenarioDefinition) => {
      const result = scenario.setup(config);
      setMethod(result.method);
      setBlocks(result.blocks);
      setFiles(result.files);
      setSelectedFileId(result.files[0]?.id || null);
      setSelectedBlockId(null);
      setFirstSaveHappened(true);
      setIsSplitView(true);

      // Generate initial informative pipeline step
      setPipelineSession({
        operationType: 'save',
        fileName: scenario.title,
        method: result.method,
        steps: [
          {
            id: 1,
            phase: 'Lab Scenario Loaded',
            title: scenario.title,
            status: 'completed',
            whatHappened: scenario.description,
            whyItHappened: `Operating system storage architecture lab scenario initialized under ${result.method.toUpperCase()} allocation mode.`,
            whatChanged: `Loaded ${result.files.length} simulated files on disk with deliberate block placements to demonstrate ${scenario.category.toLowerCase()}.`,
            tradeOff: scenario.learningGoal,
            technicalDetails: `Scenario ID: ${scenario.id}. Method: ${result.method}. Total blocks: ${config.totalBlocks}.`,
            highlightedBlockIds: result.files.flatMap((f) => f.allocatedBlocks),
          },
        ],
        currentStepIndex: 0,
        isSuccess: true,
        timestamp: Date.now(),
      });
    },
    [config]
  );

  // Handler: Update Disk Capacity
  const handleUpdateCapacity = useCallback(
    (newCapacity: number) => {
      const maxOccupiedIndex = blocks.reduce((max, b) => (b.state !== 'free' ? Math.max(max, b.id) : max), -1);

      if (newCapacity <= maxOccupiedIndex) {
        alert(
          `Cannot shrink disk to ${newCapacity} blocks because physical block #${maxOccupiedIndex} is currently occupied by a file. Delete or relocate the file first.`
        );
        return;
      }

      setConfig((prev) => ({ ...prev, totalBlocks: newCapacity }));
      setBlocks((prev) => {
        if (newCapacity > prev.length) {
          const additional: DiskBlock[] = [];
          for (let i = prev.length; i < newCapacity; i++) {
            additional.push({
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
          return [...prev, ...additional];
        } else {
          return prev.slice(0, newCapacity);
        }
      });
    },
    [blocks]
  );

  // Handler: Reset / Format Entire Disk
  const handleResetDisk = useCallback(() => {
    if (window.confirm('Reset and format simulated disk? All files and session state will be wiped.')) {
      localStorage.removeItem(STORAGE_KEY);
      setConfig(DEFAULT_CONFIG);
      setMethod('contiguous');
      setBlocks(createInitialDisk(DEFAULT_CONFIG.totalBlocks));
      setFiles([]);
      setRecycleBin([]);
      setSelectedFileId(null);
      setSelectedBlockId(null);
      setPipelineSession(null);
      setFirstSaveHappened(false);
      setIsSplitView(false);
    }
  }, []);

  // Selected block & file objects
  const selectedBlock = selectedBlockId !== null ? blocks[selectedBlockId] : null;
  const selectedBlockOwnerFile = selectedBlock?.fileId
    ? files.find((f) => f.id === selectedBlock.fileId) || null
    : null;

  return (
    <div className="app-container">
      {/* Top Application System Bar */}
      <SystemTopBar
        method={method}
        onSelectMethod={handleSelectMethod}
        stats={stats}
        isSplitView={isSplitView}
        onToggleView={() => setIsSplitView(!isSplitView)}
        onOpenNewFile={() => setIsNewFileOpen(true)}
        onOpenScenarios={() => setIsScenariosOpen(true)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onResetDisk={handleResetDisk}
        recycleBinCount={recycleBin.length}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
      />

      {/* Main Workspace: Desktop Mode vs Split-Screen Mode */}
      {!isSplitView ? (
        <DesktopWorkspace
          files={files}
          blocks={blocks}
          stats={stats}
          method={method}
          config={config}
          selectedFileId={selectedFileId}
          selectedBlockId={selectedBlockId}
          highlightedBlockIds={highlightedBlockIds}
          firstSaveHappened={firstSaveHappened}
          onSelectFile={setSelectedFileId}
          onSelectBlock={setSelectedBlockId}
          onOpenNewFile={() => setIsNewFileOpen(true)}
          onResizeFile={(f) => setResizeTargetFile(f)}
          onRenameFile={(f) => setRenameTargetFile(f)}
          onDeleteFile={handleDeleteFile}
          onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          onUpdateCapacity={handleUpdateCapacity}
          recycleBinCount={recycleBin.length}
        />
      ) : (
        <main className="split-workspace">
          {/* LEFT SIDE: The Simulated Computer */}
          <section className="split-left-pane" aria-label="Simulated Computer & Disk Architecture">
            {/* File Manager Window */}
            <FileManagerWindow
              files={files}
              selectedFileId={selectedFileId}
              onSelectFile={setSelectedFileId}
              onOpenNewFile={() => setIsNewFileOpen(true)}
              onResizeFile={(f) => setResizeTargetFile(f)}
              onRenameFile={(f) => setRenameTargetFile(f)}
              onDeleteFile={handleDeleteFile}
              method={method}
              config={config}
            />

            {/* Volume Telemetry */}
            <DiskSummaryCard
              stats={stats}
              method={method}
              config={config}
              onUpdateCapacity={handleUpdateCapacity}
            />

            {/* Disk Physical Block Grid */}
            <DiskGridView
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              highlightedBlockIds={highlightedBlockIds}
              activeMethod={method}
            />

            {/* Block Inspector Drawer */}
            <BlockInspectorDrawer
              block={selectedBlock}
              ownerFile={selectedBlockOwnerFile}
              method={method}
              onClose={() => setSelectedBlockId(null)}
              onSelectFile={(fId) => setSelectedFileId(fId)}
            />
          </section>

          {/* RIGHT SIDE: The Live OS Explanation Pipeline */}
          <PipelineExplanationPanel
            session={pipelineSession}
            onStepChange={(stepIdx) => {
              if (pipelineSession) {
                setPipelineSession({ ...pipelineSession, currentStepIndex: stepIdx });
              }
            }}
            onRestartPipeline={() => {
              if (pipelineSession) {
                setPipelineSession({ ...pipelineSession, currentStepIndex: 0 });
              }
            }}
          />
        </main>
      )}

      {/* Academic Footer */}
      <footer className="system-footer" role="contentinfo">
        <div className="footer-academic">
          <span>Student: <strong>Jaijitesh Suryaprakash</strong> (25BIT0235)</span>
          <span>•</span>
          <span>Course: <strong>Operating System Principles</strong></span>
          <span>•</span>
          <span>Mini-Project: Visual Simulator for File Allocation Techniques</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Block Size: 512B</span>
          <span>•</span>
          <button
            onClick={() => setIsAboutOpen(true)}
            style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
          >
            Documentation & Glossary
          </button>
        </div>
      </footer>

      {/* Accessible Modals */}
      <NewFileDialog
        isOpen={isNewFileOpen}
        onClose={() => setIsNewFileOpen(false)}
        onSubmit={handleCreateFile}
        method={method}
        config={config}
      />

      <ResizeFileDialog
        isOpen={Boolean(resizeTargetFile)}
        file={resizeTargetFile}
        onClose={() => setResizeTargetFile(null)}
        onSubmit={handleResizeFile}
        method={method}
        config={config}
      />

      <RenameFileDialog
        isOpen={Boolean(renameTargetFile)}
        file={renameTargetFile}
        onClose={() => setRenameTargetFile(null)}
        onSubmit={handleRenameFile}
      />

      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        recycledFiles={recycleBin}
        onRestoreFile={handleRestoreFile}
        onEmptyBin={handleEmptyBin}
      />

      <ScenariosModal
        isOpen={isScenariosOpen}
        onClose={() => setIsScenariosOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      <ComparisonViewModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        files={files}
        config={config}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
};

export default App;
