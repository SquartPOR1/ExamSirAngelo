import React, { useState } from 'react';
import { useDialogAccessibility } from './hooks/useDialogAccessibility.js';

const StockMovementDialog = ({ product, onClose, onSubmit }) => {
  const [type, setType] = useState('Received');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const isAdjustment = type === 'Adjustment';
  const dialogRef = useDialogAccessibility(true, onClose);

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount < 0 || (!isAdjustment && amount === 0)) {
      setError(isAdjustment ? 'Enter a whole quantity of zero or more.' : 'Enter a whole quantity above zero.');
      return;
    }
    if ((type === 'Sold' || type === 'Damaged') && amount > product.quantity) {
      setError(`Only ${product.quantity} units are currently available.`);
      return;
    }

    const updated = onSubmit({ type, quantity: amount, note: note.trim() });
    if (updated) onClose();
  };

  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={closeOnBackdrop}>
      <section className="product-form-container movement-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="movement-title">
        <header className="modal-heading">
          <div>
            <p className="eyebrow">STOCK_LEDGER / {product.sku || `ITEM_${product.id}`}</p>
            <h2 id="movement-title">Adjust {product.name}</h2>
            <p className="movement-current">Available now: <strong>{product.quantity}</strong></p>
          </div>
          <button className="btn-close" type="button" onClick={onClose} aria-label="Close stock adjustment">×</button>
        </header>
        <form className="movement-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="movement-type">Movement</label>
            <select id="movement-type" value={type} onChange={(event) => { setType(event.target.value); setError(''); }}>
              <option>Received</option>
              <option>Sold</option>
              <option>Damaged</option>
              <option>Adjustment</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="movement-quantity">{isAdjustment ? 'New quantity' : 'Units'}</label>
            <input id="movement-quantity" type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} autoFocus required />
          </div>
          <div className="form-group movement-note">
            <label htmlFor="movement-note">Note</label>
            <input id="movement-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional reason or reference" />
          </div>
          {error && <p className="movement-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="btn-submit" type="submit">Save movement</button>
            <button className="btn-cancel" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default StockMovementDialog;