import React, { useState } from 'react';

const BulkActions = ({ selectedProducts, categories, locations, onApply, onDelete, onClear }) => {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const change = quantityChange === '' ? null : Number(quantityChange);
    if (change !== null && !Number.isInteger(change)) {
      setError('Quantity change must be a whole number.');
      return;
    }
    if (reorderPoint !== '' && (!Number.isInteger(Number(reorderPoint)) || Number(reorderPoint) < 0)) {
      setError('Reorder point must be a whole number of zero or more.');
      return;
    }
    if (change < 0 && selectedProducts.some(product => product.quantity + change < 0)) {
      setError('That reduction would make at least one product quantity negative.');
      return;
    }

    const result = onApply({
      category: category || null,
      location: location || null,
      reorderPoint: reorderPoint === '' ? null : Number(reorderPoint),
      quantityChange: change
    });
    if (!result) return;
    setMessage(`Updated ${selectedProducts.length} products.`);
    setCategory('');
    setLocation('');
    setReorderPoint('');
    setQuantityChange('');
  };

  return (
    <form className="bulk-actions" onSubmit={handleSubmit} aria-label="Bulk product actions">
      <div className="bulk-heading">
        <strong>{selectedProducts.length} selected</strong>
        <button className="bulk-clear" type="button" onClick={onClear}>Clear selection</button>
      </div>
      <div className="bulk-controls">
        <select aria-label="Set selected products category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Keep category</option>
          {categories.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <select aria-label="Set selected products location" value={location} onChange={(event) => setLocation(event.target.value)}>
          <option value="">Keep location</option>
          {locations.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <input aria-label="Set selected products reorder point" type="number" min="0" step="1" placeholder="Reorder point" value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} />
        <input aria-label="Change selected quantities" type="number" step="1" placeholder="Qty change (+/-)" value={quantityChange} onChange={(event) => setQuantityChange(event.target.value)} />
        <button className="btn-submit" type="submit" disabled={!category && !location && reorderPoint === '' && quantityChange === ''}>Apply</button>
        <button className="btn-delete-selected" type="button" onClick={onDelete}>Delete selected</button>
      </div>
      {error && <p className="bulk-error" role="alert">{error}</p>}
      {message && <p className="bulk-message" role="status">{message}</p>}
    </form>
  );
};

export default BulkActions;