/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import React, { useState, useRef, useEffect } from 'react';
import type { AllocationMethod, DiskBlock, FileRecord, SimConfig } from '../types/simulator';
import { IconX } from './Icons';

interface WindowsTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileRecord[];
  blocks: DiskBlock[];
  config: SimConfig;
  onCreateFile: (params: { name: string; method?: AllocationMethod; sizeBytes: number; content?: string }) => void;
  onDeleteFile: (file: FileRecord) => void;
  onOpenDefrag: () => void;
  onOpenBenchmark: () => void;
  onOpenPlatter: () => void;
}

const getFileMethod = (file: FileRecord): AllocationMethod =>
  file.indexBlockId !== undefined ? 'indexed' : file.endBlock !== undefined ? 'linked' : 'contiguous';

interface CommandHistoryItem {
  command: string;
  output: React.ReactNode;
}

export const WindowsTerminal: React.FC<WindowsTerminalProps> = ({
  isOpen,
  onClose,
  files,
  blocks,
  config,
  onCreateFile,
  onDeleteFile,
  onOpenDefrag,
  onOpenBenchmark,
  onOpenPlatter,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      command: '',
      output: (
        <div style={{ color: '#94a3b8', marginBottom: '8px' }}>
          <div>Windows PowerShell [Version 10.0.22631.3007]</div>
          <div>(c) SimFS Kernel Corporation. All rights reserved.</div>
          <div style={{ marginTop: '6px', color: '#38bdf8' }}>
            Operating System File Allocation Subsystem Shell v2.4
          </div>
          <div style={{ color: '#64748b' }}>
            Type <strong style={{ color: '#34d399' }}>help</strong> or <strong style={{ color: '#34d399' }}>dir</strong> to view available kernel commands.
          </div>
        </div>
      ),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const commandListRef = useRef<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    commandListRef.current.push(cmd);
    setHistoryIndex(-1);

    const parts = cmd.split(/\s+/);
    const action = parts[0].toLowerCase();
    const args = parts.slice(1);

    let outputNode: React.ReactNode = null;

    switch (action) {
      case 'help':
      case '?':
        outputNode = (
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px 16px', color: '#cbd5e1' }}>
            <span style={{ color: '#38bdf8' }}>dir / ls</span>
            <span>List all files in the directory table</span>
            <span style={{ color: '#38bdf8' }}>cat &lt;file&gt;</span>
            <span>Display file contents and physical sector trace</span>
            <span style={{ color: '#38bdf8' }}>stat &lt;file&gt;</span>
            <span>Display Inode, LBA block map, and fragmentation stats</span>
            <span style={{ color: '#38bdf8' }}>touch &lt;name&gt; [bytes] [method]</span>
            <span>Allocate a new file (e.g. `touch doc.txt 1536 contiguous`)</span>
            <span style={{ color: '#38bdf8' }}>rm &lt;file&gt;</span>
            <span>Delete file and reclaim sectors into Recycle Bin</span>
            <span style={{ color: '#38bdf8' }}>defrag</span>
            <span>Open Drive Optimizer &amp; Disk Defragmenter GUI</span>
            <span style={{ color: '#38bdf8' }}>bench</span>
            <span>Open 3-Way Allocation Benchmark Matrix</span>
            <span style={{ color: '#38bdf8' }}>platter / seek</span>
            <span>Open Mechanical Hard Disk Head Seek Visualizer</span>
            <span style={{ color: '#38bdf8' }}>chs &lt;sectorId&gt;</span>
            <span>Translate Logical Block Address (LBA) to Cylinder/Head/Sector</span>
            <span style={{ color: '#38bdf8' }}>df / disk</span>
            <span>Show volume disk capacity and free space</span>
            <span style={{ color: '#38bdf8' }}>cls / clear</span>
            <span>Clear the terminal console screen</span>
            <span style={{ color: '#38bdf8' }}>exit</span>
            <span>Close terminal window</span>
          </div>
        );
        break;

      case 'df':
      case 'disk': {
        const usedBlocks = blocks.filter((b) => b.state !== 'free').length;
        const freeBlocks = blocks.length - usedBlocks;
        const usedBytes = usedBlocks * config.blockSize;
        const totalBytes = blocks.length * config.blockSize;
        outputNode = (
          <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
            <div style={{ color: '#38bdf8', marginBottom: '4px' }}>Filesystem Disk Space Usage:</div>
            <div>Volume: <strong style={{ color: '#f1f5f9' }}>C: (SimFS Partition)</strong></div>
            <div>Total Capacity: {totalBytes.toLocaleString()} bytes ({blocks.length} sectors @ {config.blockSize} B/sector)</div>
            <div>Used Space: <span style={{ color: '#38bdf8' }}>{usedBytes.toLocaleString()} bytes ({usedBlocks} sectors, {((usedBlocks / blocks.length) * 100).toFixed(1)}%)</span></div>
            <div>Free Space: <span style={{ color: '#34d399' }}>{(freeBlocks * config.blockSize).toLocaleString()} bytes ({freeBlocks} sectors, {((freeBlocks / blocks.length) * 100).toFixed(1)}%)</span></div>
          </div>
        );
        break;
      }

      case 'dir':
      case 'ls':
        if (files.length === 0) {
          outputNode = <div style={{ color: '#64748b' }}>Directory is empty. No files allocated on volume C:.</div>;
        } else {
          outputNode = (
            <div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>
                Directory of C:\Users\Student (SimFS Partition)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '3px 8px' }}>Filename</th>
                    <th style={{ padding: '3px 8px' }}>Size</th>
                    <th style={{ padding: '3px 8px' }}>Blocks</th>
                    <th style={{ padding: '3px 8px' }}>Method</th>
                    <th style={{ padding: '3px 8px' }}>Sector LBA Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => {
                    const fileMethod = getFileMethod(f);
                    return (
                      <tr key={f.id} style={{ color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '3px 8px', color: '#38bdf8', fontWeight: 600 }}>{f.name}</td>
                        <td style={{ padding: '3px 8px' }}>{f.sizeBytes.toLocaleString()} B</td>
                        <td style={{ padding: '3px 8px' }}>{f.requiredBlocks} blks</td>
                        <td style={{ padding: '3px 8px', textTransform: 'uppercase', color: fileMethod === 'contiguous' ? '#60a5fa' : fileMethod === 'linked' ? '#34d399' : '#fbbf24' }}>
                          {fileMethod}
                        </td>
                        <td style={{ padding: '3px 8px', color: '#94a3b8' }}>
                          {fileMethod === 'indexed' && f.indexBlockId !== undefined ? `[IDX:#${f.indexBlockId}] ➔ ` : ''}
                          [{f.allocatedBlocks.join(', ')}]
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                {files.length} File(s) · {blocks.filter((b) => b.state === 'free').length} Free Sectors ({blocks.filter((b) => b.state === 'free').length * config.blockSize} B free)
              </div>
            </div>
          );
        }
        break;

      case 'cat':
        if (!args[0]) {
          outputNode = <div style={{ color: '#f87171' }}>Error: Missing file operand. Usage: cat &lt;filename&gt;</div>;
        } else {
          const target = files.find((f) => f.name.toLowerCase() === args[0].toLowerCase());
          if (!target) {
            outputNode = <div style={{ color: '#f87171' }}>cat: {args[0]}: No such file on volume C:</div>;
          } else {
            outputNode = (
              <div>
                <div style={{ color: '#38bdf8', marginBottom: '4px' }}>
                  // Content of {target.name} ({target.sizeBytes} bytes, {target.requiredBlocks} sectors):
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', color: '#f1f5f9' }}>
                  {target.content || `[Simulated text binary content for ${target.name} - 0x00..0x${target.sizeBytes.toString(16)}]`}
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                  Physical Read Trace: Head accessed sectors [{target.allocatedBlocks.join(' ➔ ')}]
                </div>
              </div>
            );
          }
        }
        break;

      case 'stat':
        if (!args[0]) {
          outputNode = <div style={{ color: '#f87171' }}>Error: Missing file operand. Usage: stat &lt;filename&gt;</div>;
        } else {
          const target = files.find((f) => f.name.toLowerCase() === args[0].toLowerCase());
          if (!target) {
            outputNode = <div style={{ color: '#f87171' }}>stat: cannot stat &apos;{args[0]}&apos;: No such file</div>;
          } else {
            const targetMethod = getFileMethod(target);
            const slackBytes = target.requiredBlocks * config.blockSize - target.sizeBytes;
            const internalFragPercent = ((slackBytes / (target.requiredBlocks * config.blockSize)) * 100).toFixed(1);
            outputNode = (
              <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                <div>  File: <strong style={{ color: '#38bdf8' }}>{target.name}</strong></div>
                <div>  Size: {target.sizeBytes} B &nbsp;&nbsp; Blocks: {target.requiredBlocks} &nbsp;&nbsp; IO Block: {config.blockSize} B</div>
                <div>  Allocation Method: <strong style={{ color: '#34d399' }}>{targetMethod.toUpperCase()}</strong></div>
                <div>  Physical LBA Blocks: [{target.allocatedBlocks.join(', ')}]</div>
                {targetMethod === 'indexed' && (
                  <div>  Index Block Sector: <strong style={{ color: '#fbbf24' }}>#{target.indexBlockId}</strong></div>
                )}
                <div>  Internal Fragmentation: <span style={{ color: '#f59e0b' }}>{slackBytes} B slack space ({internalFragPercent}%)</span></div>
                <div>  Last Modified: {new Date(target.updatedAt).toLocaleString()}</div>
              </div>
            );
          }
        }
        break;

      case 'touch':
        if (!args[0]) {
          outputNode = <div style={{ color: '#f87171' }}>Usage: touch &lt;filename&gt; [sizeBytes] [contiguous|linked|indexed]</div>;
        } else {
          const name = args[0];
          const sizeBytes = parseInt(args[1], 10) || 1536;
          const targetMethod: AllocationMethod =
            args[2]?.toLowerCase() === 'linked'
              ? 'linked'
              : args[2]?.toLowerCase() === 'indexed'
              ? 'indexed'
              : 'contiguous';

          onCreateFile({
            name,
            sizeBytes,
            method: targetMethod,
            content: `Created via SimFS kernel CLI at ${new Date().toLocaleTimeString()}`,
          });

          outputNode = (
            <div style={{ color: '#10b981' }}>
              sys_creat(&quot;{name}&quot;, {sizeBytes} bytes, {targetMethod.toUpperCase()}): File allocation requested successfully.
            </div>
          );
        }
        break;

      case 'rm':
        if (!args[0]) {
          outputNode = <div style={{ color: '#f87171' }}>Usage: rm &lt;filename&gt;</div>;
        } else {
          const target = files.find((f) => f.name.toLowerCase() === args[0].toLowerCase());
          if (!target) {
            outputNode = <div style={{ color: '#f87171' }}>rm: cannot remove &apos;{args[0]}&apos;: No such file</div>;
          } else {
            onDeleteFile(target);
            outputNode = (
              <div style={{ color: '#10b981' }}>
                unlink(&quot;{target.name}&quot;): Sectors [{target.allocatedBlocks.join(', ')}] deallocated to Recycle Bin.
              </div>
            );
          }
        }
        break;

      case 'chs':
        const sectorId = parseInt(args[0], 10);
        if (isNaN(sectorId) || sectorId < 0 || sectorId >= config.totalBlocks) {
          outputNode = <div style={{ color: '#f87171' }}>Usage: chs &lt;sectorId 0..{config.totalBlocks - 1}&gt;</div>;
        } else {
          const cylinder = Math.floor(sectorId / 16);
          const head = 0;
          const sector = sectorId % 16;
          outputNode = (
            <div style={{ color: '#38bdf8' }}>
              LBA {sectorId} ➔ Cylinder: {cylinder}, Head: {head}, Sector: {sector} (Track {cylinder})
            </div>
          );
        }
        break;

      case 'defrag':
        onOpenDefrag();
        outputNode = <div style={{ color: '#38bdf8' }}>Launching Drive Optimizer (dfrgui.exe)...</div>;
        break;

      case 'bench':
        onOpenBenchmark();
        outputNode = <div style={{ color: '#38bdf8' }}>Launching 3-Way Benchmark Suite...</div>;
        break;

      case 'platter':
      case 'seek':
        onOpenPlatter();
        outputNode = <div style={{ color: '#38bdf8' }}>Opening Mechanical Hard Disk Platter &amp; Seek Arm Visualizer...</div>;
        break;

      case 'cls':
      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'exit':
        onClose();
        return;

      default:
        outputNode = (
          <div style={{ color: '#f87171' }}>
            &apos;{action}&apos; is not recognized as an internal or external command. Type &apos;help&apos; for a list of valid commands.
          </div>
        );
        break;
    }

    setHistory((prev) => [...prev, { command: cmd, output: outputNode }]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const list = commandListRef.current;
      if (list.length === 0) return;
      const nextIndex = historyIndex === -1 ? list.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(list[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const list = commandListRef.current;
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= list.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(list[nextIndex] || '');
      }
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-terminal">
      <div
        className="modal-dialog"
        style={{
          maxWidth: '820px',
          width: '92vw',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          background: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Windows Terminal Titlebar & Tabs */}
        <div
          style={{
            height: '36px',
            background: '#040711',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 8px',
            userSelect: 'none',
          }}
        >
          {/* Active Tab */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                height: '28px',
                padding: '0 12px',
                background: '#090d16',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#cbd5e1',
              }}
            >
              <span>💻</span>
              <span>PowerShell (SimFS Kernel)</span>
            </div>
          </div>

          {/* Window Close Button */}
          <button
            onClick={onClose}
            className="win-titlebar-btn close"
            style={{ width: '28px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close Terminal"
          >
            <IconX size={14} />
          </button>
        </div>

        {/* Terminal Body Screen */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12.5px',
            lineHeight: 1.55,
            color: '#f8fafc',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              {item.command && (
                <div style={{ display: 'flex', gap: '8px', color: '#94a3b8' }}>
                  <span style={{ color: '#38bdf8' }}>SimFS C:\Users\Student&gt;</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{item.command}</span>
                </div>
              )}
              {item.output && <div style={{ marginTop: '4px' }}>{item.output}</div>}
            </div>
          ))}

          {/* Active Command Prompt Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ color: '#38bdf8', whiteSpace: 'nowrap' }}>SimFS C:\Users\Student&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                padding: 0,
              }}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
