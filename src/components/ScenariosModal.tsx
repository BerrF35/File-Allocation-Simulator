import React from 'react';
import { EDUCATIONAL_SCENARIOS } from '../core/scenarios';
import type { ScenarioDefinition } from '../core/scenarios';
import { IconX } from './Icons';

interface ScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
}

export const ScenariosModal: React.FC<ScenariosModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title-scenarios">
      <div className="modal-dialog wide">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title-scenarios">
            Educational Scenarios (OS Lab Experiments)
          </h2>
          <button onClick={onClose} className="btn-ui subtle" style={{ padding: '2px 4px' }} title="Close">
            <IconX size={15} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-muted">
            These pre-configured experiments demonstrate fundamental operating system secondary storage behaviors:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {EDUCATIONAL_SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {sc.title}
                    </strong>
                    <span className="font-mono text-xs text-muted">
                      ({sc.recommendedMethod.toUpperCase()})
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '6px' }}>
                    {sc.description}
                  </p>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <strong>Goal:</strong> {sc.learningGoal}
                  </div>
                </div>

                <button
                  className="btn-ui primary"
                  style={{ whiteSpace: 'nowrap', marginTop: '2px' }}
                  onClick={() => {
                    onSelectScenario(sc);
                    onClose();
                  }}
                >
                  Load Scenario
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ui subtle" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
