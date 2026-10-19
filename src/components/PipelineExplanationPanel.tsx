import React, { useState, useEffect } from 'react';
import type { PipelineSession, PipelineStep } from '../types/simulator';
import {
  IconCpu,
  IconPlay,
  IconPause,
  IconSkipBack,
  IconSkipForward,
  IconChevronLeft,
  IconChevronRight,
  IconRotateCcw,
} from './Icons';

interface PipelineExplanationPanelProps {
  session: PipelineSession | null;
  onStepChange: (stepIndex: number) => void;
  onRestartPipeline: () => void;
}

export const PipelineExplanationPanel: React.FC<PipelineExplanationPanelProps> = ({
  session,
  onStepChange,
  onRestartPipeline,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed] = useState(1800); // 1.8 seconds per step

  const steps = session?.steps || [];
  const currentStepIndex = session ? Math.min(session.currentStepIndex, steps.length - 1) : 0;
  const currentStep: PipelineStep | undefined = steps[currentStepIndex];

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPlaying && session && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        onStepChange(currentStepIndex + 1);
      }, playbackSpeed);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, steps.length, session, onStepChange, playbackSpeed]);

  if (!session || steps.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <IconCpu size={40} className="text-muted" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Live OS Explanation Pipeline
        </h3>
        <p style={{ fontSize: '12px', maxWidth: '320px', lineHeight: 1.5 }}>
          Create and save a file, resize an existing file, or delete a file to observe the internal OS execution pipeline and block allocation transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="split-right-pane" role="region" aria-label="OS Execution Pipeline Explanation">
      {/* Pipeline Header */}
      <div className="pipeline-header">
        <div className="pipeline-header-top">
          <div className="pipeline-title">
            <IconCpu size={16} className="text-primary" />
            <span>OS Execution Pipeline — {session.fileName}</span>
            <span
              className="os-badge"
              style={{
                background: session.isSuccess ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: session.isSuccess ? 'var(--color-success)' : 'var(--color-danger)',
                borderColor: session.isSuccess ? 'var(--color-success-border)' : 'var(--color-danger-border)',
              }}
            >
              {session.isSuccess ? 'Transaction Succeeded' : 'Transaction Aborted'}
            </span>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Playback Controls & Scrubber */}
        <div className="pipeline-playback-bar">
          <div className="playback-controls">
            <button
              className="btn-ui"
              style={{ padding: '3px 6px' }}
              onClick={() => onStepChange(0)}
              disabled={currentStepIndex === 0}
              title="First step"
            >
              <IconSkipBack size={12} />
            </button>
            <button
              className="btn-ui"
              style={{ padding: '3px 6px' }}
              onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              title="Previous step"
            >
              <IconChevronLeft size={12} />
            </button>
            <button
              className={`btn-ui ${isPlaying ? 'active-toggle' : 'primary'}`}
              style={{ padding: '3px 8px' }}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause simulation' : 'Auto-play execution pipeline'}
            >
              {isPlaying ? <IconPause size={12} /> : <IconPlay size={12} />}
              <span style={{ fontSize: '11px' }}>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              className="btn-ui"
              style={{ padding: '3px 6px' }}
              onClick={() => onStepChange(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === steps.length - 1}
              title="Next step"
            >
              <IconChevronRight size={12} />
            </button>
            <button
              className="btn-ui"
              style={{ padding: '3px 6px' }}
              onClick={() => onStepChange(steps.length - 1)}
              disabled={currentStepIndex === steps.length - 1}
              title="Last step"
            >
              <IconSkipForward size={12} />
            </button>
            <button
              className="btn-ui"
              style={{ padding: '3px 6px' }}
              onClick={onRestartPipeline}
              title="Restart execution"
            >
              <IconRotateCcw size={12} />
            </button>
          </div>

          {/* Scrubber Pills */}
          <div className="step-scrubber-pills">
            {steps.map((st, idx) => {
              let pillClass = 'scrubber-pill';
              if (idx === currentStepIndex) pillClass += ' active';
              else if (st.status === 'failed') pillClass += ' failed';
              else if (idx < currentStepIndex) pillClass += ' completed';

              return (
                <button
                  key={st.id}
                  className={pillClass}
                  onClick={() => onStepChange(idx)}
                  title={`Step ${idx + 1}: ${st.title}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Step Detailed Breakdown Card */}
      {currentStep && (
        <div style={{ padding: '16px' }}>
          <div
            className={`step-card active-step ${currentStep.status === 'failed' ? 'failed-step' : ''}`}
          >
            <div className="step-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="step-phase-badge">{currentStep.phase}</span>
                <span className="step-title">
                  {currentStepIndex + 1}. {currentStep.title}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: currentStep.status === 'failed' ? 'var(--color-danger)' : 'var(--color-success)',
                }}
              >
                {currentStep.status === 'failed' ? '✕ FAILED' : '✓ COMPLETED'}
              </span>
            </div>

            <div className="step-card-body">
              {/* 4 Quadrants as requested */}
              <div className="explanation-quadrant">
                <div className="quadrant-box">
                  <div className="quadrant-label what">
                    <span>What Happened</span>
                  </div>
                  <div className="quadrant-text">{currentStep.whatHappened}</div>
                </div>

                <div className="quadrant-box">
                  <div className="quadrant-label why">
                    <span>Why It Happened</span>
                  </div>
                  <div className="quadrant-text">{currentStep.whyItHappened}</div>
                </div>

                <div className="quadrant-box">
                  <div className="quadrant-label changed">
                    <span>What Changed</span>
                  </div>
                  <div className="quadrant-text">{currentStep.whatChanged}</div>
                </div>

                <div className="quadrant-box">
                  <div className="quadrant-label tradeoff">
                    <span>Trade-Off</span>
                  </div>
                  <div className="quadrant-text">{currentStep.tradeOff}</div>
                </div>
              </div>

              {/* Technical Details Disclosure */}
              {currentStep.technicalDetails && (
                <details className="technical-disclosure">
                  <summary>View Kernel & VFS Engineering Details</summary>
                  <div className="technical-disclosure-content">
                    {currentStep.technicalDetails}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vertical Pipeline Steps Sequence */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            letterSpacing: '0.04em',
          }}
        >
          Complete Execution Pipeline Sequence
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={st.id}
                onClick={() => onStepChange(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isCurrent
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--border-light)',
                  background: isCurrent ? 'var(--color-primary-bg)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="font-mono"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isCurrent
                        ? 'var(--color-primary)'
                        : st.status === 'failed'
                        ? 'var(--color-danger)'
                        : 'var(--border-medium)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? 'var(--color-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {st.title}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: st.status === 'failed' ? 'var(--color-danger)' : 'var(--text-muted)',
                  }}
                >
                  {st.phase}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
