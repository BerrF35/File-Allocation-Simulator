import React, { useState, useEffect } from 'react';
import type { PipelineSession } from '../types/simulator';
import {
  IconPlay,
  IconPause,
  IconChevronLeft,
  IconChevronRight,
  IconRotateCcw,
  IconCheck,
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
  const [playbackSpeed] = useState(1900);

  const steps = session?.steps || [];
  const currentStepIndex = session ? Math.min(session.currentStepIndex, steps.length - 1) : 0;

  const effectiveIsPlaying = isPlaying && currentStepIndex < steps.length - 1;

  // Auto-play timer
  useEffect(() => {
    if (!effectiveIsPlaying || !session) return;
    const timer = setTimeout(() => {
      onStepChange(currentStepIndex + 1);
    }, playbackSpeed);
    return () => clearTimeout(timer);
  }, [effectiveIsPlaying, currentStepIndex, session, onStepChange, playbackSpeed]);

  if (!session || steps.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          OS Execution Timeline
        </p>
        <p style={{ fontSize: '12.5px', maxWidth: '320px', lineHeight: 1.5 }}>
          Create and save a file, resize an existing file, or delete a file to inspect how the operating system translates requests into disk sector allocations.
        </p>
      </div>
    );
  }

  return (
    <div className="pipeline-container" role="region" aria-label="OS Execution Pipeline">
      {/* Clean Top Navigation Bar */}
      <div className="pipeline-top-header">
        <div className="pipeline-title-row">
          <div>
            <div className="pipeline-op-name">
              {session.operationType === 'save'
                ? `Saving "${session.fileName}"`
                : session.operationType === 'resize'
                ? `Resizing "${session.fileName}"`
                : `Deleting "${session.fileName}"`}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Step {currentStepIndex + 1} of {steps.length} · {session.method.toUpperCase()} Allocation
            </div>
          </div>

          <div className="pipeline-nav-controls">
            <button
              className="btn-ui subtle"
              style={{ padding: '4px 8px' }}
              onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              title="Previous step"
            >
              <IconChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              className="btn-ui"
              style={{ padding: '4px 10px' }}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play timeline automatically'}
            >
              {isPlaying ? <IconPause size={13} /> : <IconPlay size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              className="btn-ui subtle"
              style={{ padding: '4px 8px' }}
              onClick={() => onStepChange(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === steps.length - 1}
              title="Next step"
            >
              <span>Next</span>
              <IconChevronRight size={14} />
            </button>

            <button
              className="btn-ui subtle"
              style={{ padding: '4px 6px' }}
              onClick={onRestartPipeline}
              title="Restart from step 1"
            >
              <IconRotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Unified Timeline Sequence */}
      <div className="timeline-scroll-area">
        <div className="timeline-list">
          {steps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex && step.status !== 'failed';
            const isFailed = step.status === 'failed';

            let itemClass = 'timeline-item';
            if (isActive) itemClass += ' active';
            if (isCompleted) itemClass += ' completed';
            if (isFailed) itemClass += ' failed';

            return (
              <div
                key={step.id}
                className={itemClass}
                onClick={() => onStepChange(idx)}
              >
                {/* Timeline Step Marker */}
                <div className="timeline-marker">
                  {isFailed ? '✕' : isCompleted ? <IconCheck size={12} /> : idx + 1}
                </div>

                {/* Timeline Step Content */}
                <div className="timeline-content">
                  <div className="timeline-step-header">
                    <span className="timeline-step-title">{step.title}</span>
                    <span className="timeline-step-phase">{step.phase}</span>
                  </div>

                  {/* Active Step Detailed Explanation (Only for current step) */}
                  {isActive && (
                    <div className="timeline-explanation-body">
                      {/* What Happened */}
                      <div className="explanation-row">
                        <span className="explanation-heading">What Happened</span>
                        <p className="explanation-paragraph">{step.whatHappened}</p>
                      </div>

                      {/* Why It Happened */}
                      <div className="explanation-row">
                        <span className="explanation-heading">Why It Happened</span>
                        <p className="explanation-paragraph">{step.whyItHappened}</p>
                      </div>

                      {/* What Changed */}
                      <div className="explanation-row">
                        <span className="explanation-heading">What Changed</span>
                        <p className="explanation-paragraph">{step.whatChanged}</p>
                      </div>

                      {/* Trade-Off */}
                      <div className="explanation-row">
                        <span className="explanation-heading">Trade-Off</span>
                        <p className="explanation-paragraph">{step.tradeOff}</p>
                      </div>

                      {/* Optional Expandable Technical Details */}
                      {step.technicalDetails && (
                        <details className="technical-disclosure">
                          <summary>Technical details</summary>
                          <div className="technical-disclosure-text">
                            {step.technicalDetails}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
