import React, { useState } from 'react';
import { useDialogAccessibility } from './hooks/useDialogAccessibility.js';

const ActivityHistory = ({ activity, movements, onClose }) => {
  const [activeTab, setActiveTab] = useState('activity');
  const dialogRef = useDialogAccessibility(true, onClose);
  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="history-backdrop" onMouseDown={closeOnBackdrop}>
      <section className="history-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header className="history-heading">
          <div>
            <p className="eyebrow">INVENTORY_RECORDS / LAST 500 MOVEMENTS</p>
            <h2 id="history-title">Inventory records</h2>
          </div>
          <button className="btn-close" type="button" onClick={onClose} aria-label="Close inventory records">×</button>
        </header>

        <div className="record-tabs" role="group" aria-label="Inventory records">
          <button type="button" aria-pressed={activeTab === 'activity'} className={activeTab === 'activity' ? 'record-tab active' : 'record-tab'} onClick={() => setActiveTab('activity')}>Activity ({activity.length})</button>
          <button type="button" aria-pressed={activeTab === 'movements'} className={activeTab === 'movements' ? 'record-tab active' : 'record-tab'} onClick={() => setActiveTab('movements')}>Stock movements ({movements.length})</button>
        </div>

        {activeTab === 'activity' && (activity.length === 0 ? (
          <p className="history-empty">Product changes will appear here.</p>
        ) : (
          <ol className="activity-list">
            {activity.map(entry => (
              <li className="activity-entry" key={entry.id}>
                <span className={`activity-marker activity-${entry.action.toLowerCase()}`} aria-hidden="true" />
                <div className="activity-entry-copy">
                  <div className="activity-entry-title">
                    <strong>{entry.action} {entry.productName}</strong>
                    <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
                  </div>
                  <p>{entry.details}</p>
                </div>
              </li>
            ))}
          </ol>
        ))}

        {activeTab === 'movements' && (movements.length === 0 ? (
          <p className="history-empty">Receipts, sales, damage, and adjustments will appear here.</p>
        ) : (
          <ol className="activity-list movement-list">
            {movements.map(movement => (
              <li className="activity-entry" key={movement.id}>
                <span className={`activity-marker movement-${movement.type.toLowerCase()}`} aria-hidden="true" />
                <div className="activity-entry-copy">
                  <div className="activity-entry-title">
                    <strong>{movement.type}: {movement.productName}</strong>
                    <time dateTime={movement.timestamp}>{new Date(movement.timestamp).toLocaleString()}</time>
                  </div>
                  <p><span className={movement.quantityChange > 0 ? 'movement-positive' : 'movement-negative'}>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</span> units · {movement.location || 'Main Warehouse'}{movement.note ? ` · ${movement.note}` : ''}</p>
                </div>
              </li>
            ))}
          </ol>
        ))}
      </section>
    </div>
  );
};

export default ActivityHistory;