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

// Windows Desktop & Storage Architecture Visual Components
import { WindowsDesktop } from './components/WindowsDesktop';
import { StorageEngineView } from './components/StorageEngineView';
import { WindowsContextMenu } from './components/WindowsContextMenu';
import { TutorCornerPopup } from './components/TutorCornerPopup';
import { WindowsNewFileDialog } from './components/WindowsNewFileDialog';
import { HoverChatWindow, type HoverChatData } from './components/HoverChatWindow';

// Modals & New Subsystems
import { ResizeFileDialog } from './components/ResizeFileDialog';
import { RenameFileDialog } from './components/RenameFileDialog';
import { RecycleBinModal } from './components/RecycleBinModal';
import { ScenariosModal } from './components/ScenariosModal';
import { ComparisonViewModal } from './components/ComparisonViewModal';
import { AboutModal } from './components/AboutModal';
import { WindowsStartMenu } from './components/WindowsStartMenu';
import { DiskPlatterArmVisualizer } from './components/DiskPlatterArmVisualizer';
import { DiskDefragmenterModal } from './components/DiskDefragmenterModal';
import { WindowsTerminal } from './components/WindowsTerminal';
import { MobileView } from './components/MobileView';

const STORAGE_KEY = 'os_alloc_simulator_state_v2';

const loadInitialStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.files && parsed.blocks && parsed.method) {
        return parsed;
      }
    }
  } catch {}
  return null;
};

export const App: React.FC = () => {
  const [initialData] = useState(loadInitialStorage);

  // Core Simulation State
  const [config, setConfig] = useState<SimConfig>(() => initialData?.config || DEFAULT_CONFIG);
  const [method, setMethod] = useState<AllocationMethod>(() => initialData?.method || 'contiguous');
  const [blocks, setBlocks] = useState<DiskBlock[]>(() => initialData?.blocks || createInitialDisk(DEFAULT_CONFIG.totalBlocks));
  const [files, setFiles] = useState<FileRecord[]>(() => initialData?.files || []);
  const [recycleBin, setRecycleBin] = useState<FileRecord[]>(() => initialData?.recycleBin || []);

  // Selection & UI Focus
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);

  // Cinematic Split View & First Save State
  const [isSplitView, setIsSplitView] = useState<boolean>(() => initialData?.isSplitView || false);
  const [firstSaveHappened, setFirstSaveHappened] = useState<boolean>(() => initialData?.firstSaveHappened || false);

  // Pipeline Execution State
  const [pipelineSession, setPipelineSession] = useState<PipelineSession | null>(null);

  // Hover Chat State
  const [hoverChatData, setHoverChatData] = useState<HoverChatData | null>(null);

  // Context Menus
  const [desktopContextMenu, setDesktopContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [fileContextMenu, setFileContextMenu] = useState<{ x: number; y: number; file: FileRecord } | null>(null);
  const [binContextMenu, setBinContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Modals & New Subsystems
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [resizeTargetFile, setResizeTargetFile] = useState<FileRecord | null>(null);
  const [renameTargetFile, setRenameTargetFile] = useState<FileRecord | null>(null);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isPlatterOpen, setIsPlatterOpen] = useState(false);
  const [isDefragOpen, setIsDefragOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const [forceDesktopMode, setForceDesktopMode] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      // Ignore quota issues
    }
  }, [config, method, blocks, files, recycleBin, firstSaveHappened, isSplitView]);

  // Derived Telemetry Stats
  const stats = useMemo(() => computeDiskStats(blocks, files, config), [blocks, files, config]);

  // Highlighted blocks for current pipeline step or selected file
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

  // Handler: Create and Save a File (Triggers the Cinematic Split!)
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

        setPipelineSession({
          operationType: 'save',
          fileName: name,
          method,
          steps: result.steps,
          currentStepIndex: result.steps.length - 1,
          isSuccess: true,
          timestamp: Date.now(),
        });
      } else {
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

      // Smooth cinematic split transition
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
      setIsScenariosOpen(false);
    },
    [config]
  );

  // Handler: Reset / Format Entire Disk
  const handleResetDisk = useCallback(() => {
    if (window.confirm('Format disk partition? All allocated sectors and files will be erased.')) {
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

  // Global click dismiss for context menus and start menu
  const handleGlobalClick = () => {
    if (desktopContextMenu) setDesktopContextMenu(null);
    if (fileContextMenu) setFileContextMenu(null);
    if (binContextMenu) setBinContextMenu(null);
    if (isStartMenuOpen) setIsStartMenuOpen(false);
  };

  const renderSharedModals = () => (
    <>
      {/* Windows Notepad / File Allocation Dialog */}
      <WindowsNewFileDialog
        isOpen={isNewFileOpen}
        onClose={() => setIsNewFileOpen(false)}
        onSubmit={handleCreateFile}
        activeMethod={method}
        onSelectMethod={handleSelectMethod}
        config={config}
      />

      {/* Auxiliary Modals */}
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

      {/* Windows 11 Start Menu Panel */}
      <WindowsStartMenu
        isOpen={isStartMenuOpen}
        onClose={() => setIsStartMenuOpen(false)}
        onOpenNewFile={() => setIsNewFileOpen(true)}
        onOpenDefrag={() => setIsDefragOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenPlatter={() => setIsPlatterOpen(true)}
        onOpenBenchmark={() => setIsComparisonOpen(true)}
        onOpenScenarios={() => setIsScenariosOpen(true)}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        onResetDisk={handleResetDisk}
      />

      {/* Mechanical Hard Disk Platter & Actuator Seek Arm Visualizer */}
      <DiskPlatterArmVisualizer
        isOpen={isPlatterOpen}
        onClose={() => setIsPlatterOpen(false)}
        blocks={blocks}
        files={files}
        config={config}
        selectedFileId={selectedFileId}
        onSelectFile={setSelectedFileId}
        onSelectBlock={setSelectedBlockId}
      />

      {/* Drive Optimizer & Live Disk Defragmenter (Compaction) */}
      <DiskDefragmenterModal
        isOpen={isDefragOpen}
        onClose={() => setIsDefragOpen(false)}
        blocks={blocks}
        files={files}
        config={config}
        onApplyDefrag={(newBlocks, newFiles) => {
          setBlocks(newBlocks);
          setFiles(newFiles);
          setPipelineSession({
            operationType: 'save',
            fileName: 'Drive C: (Compacted)',
            method,
            steps: [
              {
                id: 1,
                phase: 'compaction',
                title: 'Drive Defragmentation & Compaction Finished',
                status: 'completed',
                whatHappened: 'Relocated all active files into continuous sequential LBA sectors starting from block 0.',
                whyItHappened: 'Compaction eliminates external fragmentation by shifting all allocated blocks together, leaving one single consolidated free block segment.',
                whatChanged: 'External fragmentation reduced to 0%. All allocated files are now contiguous.',
                tradeOff: 'High computational and disk I/O overhead during reorganization, but delivers optimal sequential read performance thereafter.',
                highlightedBlockIds: newFiles.flatMap((f) => f.allocatedBlocks),
              },
            ],
            currentStepIndex: 0,
            isSuccess: true,
            timestamp: Date.now(),
          });
        }}
      />

      {/* Interactive OS Kernel PowerShell Terminal */}
      <WindowsTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        files={files}
        blocks={blocks}
        config={config}
        onCreateFile={(params) => {
          if (params.method && params.method !== method) {
            setMethod(params.method);
          }
          handleCreateFile({
            name: params.name,
            type: 'TXT',
            sizeBytes: params.sizeBytes,
            content: params.content,
          });
        }}
        onDeleteFile={handleDeleteFile}
        onOpenDefrag={() => setIsDefragOpen(true)}
        onOpenBenchmark={() => setIsComparisonOpen(true)}
        onOpenPlatter={() => setIsPlatterOpen(true)}
      />
    </>
  );

  // Dedicated Phone / Mobile Viewport
  if (isMobileViewport && !forceDesktopMode) {
    return (
      <div className="os-mobile-wrapper">
        <MobileView
          method={method}
          onSelectMethod={handleSelectMethod}
          blocks={blocks}
          files={files}
          stats={stats}
          config={config}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          highlightedBlockIds={highlightedBlockIds}
          pipelineSession={pipelineSession}
          onOpenNewFile={() => setIsNewFileOpen(true)}
          onOpenFile={(file) => setSelectedFileId(file.id)}
          onDeleteFile={handleDeleteFile}
          onResizeFile={(file) => setResizeTargetFile(file)}
          onRenameFile={(file) => setRenameTargetFile(file)}
          onOpenPlatter={() => setIsPlatterOpen(true)}
          onOpenDefrag={() => setIsDefragOpen(true)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          onOpenComparison={() => setIsComparisonOpen(true)}
          onOpenScenarios={() => setIsScenariosOpen(true)}
          onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
          onResetDisk={handleResetDisk}
          onSwitchToDesktop={() => setForceDesktopMode(true)}
        />
        {renderSharedModals()}
      </div>
    );
  }

  return (
    <div className="os-app-root" onClick={handleGlobalClick}>
      {/* If testing desktop simulation on mobile screen, provide floating return button */}
      {isMobileViewport && forceDesktopMode && (
        <button
          type="button"
          onClick={() => setForceDesktopMode(false)}
          style={{
            position: 'fixed',
            bottom: '56px',
            right: '16px',
            zIndex: 99999,
            background: '#0284c7',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            fontSize: '12px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>📱 Return to Mobile View</span>
        </button>
      )}

      {/* Cinematic Split Layout Container */}
      <div className={`cinematic-split-layout ${isSplitView ? 'split-active' : 'desktop-only'}`}>
        {/* Left Side: The Authentic Windows Desktop Replica */}
        <section
          className="cinematic-split-left"
          aria-label="Operating System Desktop"
        >
          <WindowsDesktop
            files={files}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
            onContextMenu={(e) => {
              e.preventDefault();
              setFileContextMenu(null);
              setBinContextMenu(null);
              setIsStartMenuOpen(false);
              setDesktopContextMenu({ x: e.clientX, y: e.clientY });
            }}
            onFileContextMenu={(e, file) => {
              e.preventDefault();
              setDesktopContextMenu(null);
              setBinContextMenu(null);
              setIsStartMenuOpen(false);
              setFileContextMenu({ x: e.clientX, y: e.clientY, file });
            }}
            onBinContextMenu={(e) => {
              e.preventDefault();
              setDesktopContextMenu(null);
              setFileContextMenu(null);
              setIsStartMenuOpen(false);
              setBinContextMenu({ x: e.clientX, y: e.clientY });
            }}
            onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
            onOpenNewFile={() => setIsNewFileOpen(true)}
            isSplitView={isSplitView}
            onToggleSplitView={() => setIsSplitView(!isSplitView)}
            recycleBinCount={recycleBin.length}
            onHoverChat={setHoverChatData}
            onOpenScenarios={() => setIsScenariosOpen(true)}
            onOpenComparison={() => setIsComparisonOpen(true)}
            onOpenStartMenu={() => setIsStartMenuOpen((prev) => !prev)}
            onOpenDefrag={() => setIsDefragOpen(true)}
            onOpenTerminal={() => setIsTerminalOpen(true)}
            onOpenPlatter={() => setIsPlatterOpen(true)}
          />
        </section>

        {/* Right Side: Under-The-Hood OS Storage Engine & Animated Pipes */}
        {isSplitView && (
          <section
            className="cinematic-split-right"
            aria-label="Storage Subsystem Engine and Animated Data Bus"
          >
            <StorageEngineView
              method={method}
              onSelectMethod={handleSelectMethod}
              blocks={blocks}
              files={files}
              stats={stats}
              config={config}
              selectedFileId={selectedFileId}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              highlightedBlockIds={highlightedBlockIds}
              onHoverChat={setHoverChatData}
              onOpenComparison={() => setIsComparisonOpen(true)}
              onOpenScenarios={() => setIsScenariosOpen(true)}
              onResetDisk={handleResetDisk}
              onOpenPlatter={() => setIsPlatterOpen(true)}
              onOpenDefrag={() => setIsDefragOpen(true)}
              onOpenTerminal={() => setIsTerminalOpen(true)}
            />
          </section>
        )}
      </div>

      {/* Smooth Corner Chat Tutor (Guides user to right-click and create file) */}
      <TutorCornerPopup
        isVisible={!isSplitView || files.length === 0}
        onOpenNewFile={() => setIsNewFileOpen(true)}
      />

      {/* Floating Hover Chat Window (Explains each hovered section in conversational detail) */}
      <HoverChatWindow data={hoverChatData} />

      {/* Windows 11 Right-Click Context Menu on Desktop Wallpaper */}
      {desktopContextMenu && (
        <WindowsContextMenu
          x={desktopContextMenu.x}
          y={desktopContextMenu.y}
          onClose={() => setDesktopContextMenu(null)}
          onNewFile={() => {
            setDesktopContextMenu(null);
            setIsNewFileOpen(true);
          }}
          onRefresh={() => {
            // Visual feedback
          }}
        />
      )}

      {/* File Context Menu on Right-Clicking a Created File */}
      {fileContextMenu && (
        <div
          className="win-context-menu"
          style={{ left: `${fileContextMenu.x}px`, top: `${fileContextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="win-context-item"
            onClick={() => {
              setSelectedFileId(fileContextMenu.file.id);
              setIsSplitView(true);
              setFileContextMenu(null);
            }}
          >
            <span className="win-context-icon">🔍</span>
            <span className="win-context-text" style={{ fontWeight: 600 }}>
              Inspect Sectors in Engine
            </span>
          </div>

          <div
            className="win-context-item"
            onClick={() => {
              setResizeTargetFile(fileContextMenu.file);
              setFileContextMenu(null);
            }}
          >
            <span className="win-context-icon">📐</span>
            <span className="win-context-text">Resize File...</span>
          </div>

          <div
            className="win-context-item"
            onClick={() => {
              setRenameTargetFile(fileContextMenu.file);
              setFileContextMenu(null);
            }}
          >
            <span className="win-context-icon">✏️</span>
            <span className="win-context-text">Rename...</span>
          </div>

          <div className="win-context-divider" />

          <div
            className="win-context-item danger"
            onClick={() => {
              handleDeleteFile(fileContextMenu.file);
              setFileContextMenu(null);
            }}
          >
            <span className="win-context-icon">🗑️</span>
            <span className="win-context-text" style={{ color: '#ef4444' }}>
              Delete to Recycle Bin
            </span>
          </div>
        </div>
      )}

      {/* Recycle Bin Context Menu */}
      {binContextMenu && (
        <div
          className="win-context-menu"
          style={{ left: `${binContextMenu.x}px`, top: `${binContextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="win-context-item"
            onClick={() => {
              setIsRecycleBinOpen(true);
              setBinContextMenu(null);
            }}
          >
            <span className="win-context-icon">📂</span>
            <span className="win-context-text" style={{ fontWeight: 600 }}>
              Open Recycle Bin
            </span>
          </div>
          <div
            className="win-context-item danger"
            onClick={() => {
              handleEmptyBin();
              setBinContextMenu(null);
            }}
          >
            <span className="win-context-icon">🗑️</span>
            <span className="win-context-text" style={{ color: '#ef4444' }}>
              Empty Recycle Bin ({recycleBin.length})
            </span>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      {renderSharedModals()}
    </div>
  );
};

export default App;
