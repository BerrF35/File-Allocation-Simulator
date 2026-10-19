import React from 'react';
import { EDUCATIONAL_SCENARIOS } from '../core/scenarios';
import type { ScenarioDefinition } from '../core/scenarios';
import { IconLayers, IconX } from './Icons';

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
      <div className="modal-card wide">
        <div className="modal-header">
          <div className="modal-title" id="modal-title-scenarios">
            <IconLayers size={16} className="text-primary" />
            <span>Curated Educational Scenarios (OS Lab Experiments)</span>
          </div>
          <button onClick={onClose} title="Close" style={{ color: 'var(--text-muted)' }}>
            <IconX size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            These pre-configured experiments demonstrate classical Operating System storage behaviors that are difficult to reproduce manually. Load any scenario to explore its trade-offs.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {EDUCATIONAL_SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                style={{
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="os-badge" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                      {sc.category}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                      }}
                    >
                      {sc.recommendedMethod.toUpperCase()}
                    </span>
                  </div>

                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                    {sc.title}
                  </strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginBottom: '6px' }}>
                    {sc.subtitle}
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '6px' }}>
                    {sc.description}
                  </p>

                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      borderLeft: '2px solid var(--color-primary)',
                    }}
                  >
                    <strong>Learning Goal:</strong> {sc.learningGoal}
                  </div>
                </div>

                <button
                  className="btn-ui primary"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={() => {
                    onSelectScenario(sc);
                    onClose();
                  }}
                >
                  Load This Scenario
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ui" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
