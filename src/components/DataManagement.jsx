import React, { useState } from 'react';
import Papa from 'papaparse';
import { DEFAULT_LOCATION, DEFAULT_REORDER_POINT } from '../utils/inventoryUtils.js';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility.js';

const normalizeHeader = (header) => header.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

const downloadFile = (contents, fileName, mimeType) => {
  const fileUrl = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const downloadLink = document.createElement('a');
  downloadLink.href = fileUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
};

const DataManagement = ({ backupSnapshot, existingProducts, suppliers, onImportProducts, onRestoreBackup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const closeDialog = () => {
    setIsOpen(false);
    setImportRows([]);
    setError('');
  };
  const dialogRef = useDialogAccessibility(isOpen, closeDialog);

  const handleCsvFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setError('');
    setImportRows([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeHeader,
      complete: (result) => {
        const existingNames = new Set(existingProducts.map(product => product.name.trim().toLowerCase()));
        const existingSkus = new Set(existingProducts.map(product => product.sku?.trim().toLowerCase()).filter(Boolean));
        const knownSupplierIds = new Set(suppliers.map(supplier => String(supplier.id)));
        const rows = result.data.map((source, index) => {
          const name = String(source.name ?? '').trim();
          const category = String(source.category ?? '').trim();
          const sku = String(source.sku ?? '').trim();
          const rawPrice = String(source.price ?? '').trim();
          const rawQuantity = String(source.quantity ?? '').trim();
          const price = Number(rawPrice);
          const quantity = Number(rawQuantity);
          const rawReorderPoint = String(source['reorder point'] ?? '').trim();
          const reorderPoint = rawReorderPoint === '' ? DEFAULT_REORDER_POINT : Number(rawReorderPoint);
          const rawTargetStock = String(source['target stock'] ?? '').trim();
          const targetStock = rawTargetStock === '' ? Math.max(quantity, reorderPoint + 5) : Number(rawTargetStock);
          const supplierId = String(source['supplier id'] ?? '').trim();
          const nameKey = name.toLowerCase();
          const skuKey = sku.toLowerCase();
          const rowErrors = [];

          if (!name) rowErrors.push('Name is required');
          if (!category) rowErrors.push('Category is required');
          if (!rawPrice || !Number.isFinite(price) || price <= 0) rowErrors.push('Price must be greater than zero');
          if (!rawQuantity || !Number.isInteger(quantity) || quantity < 0) rowErrors.push('Quantity must be a whole number of zero or more');
          if (!Number.isInteger(reorderPoint) || reorderPoint < 0) rowErrors.push('Reorder point must be a whole number of zero or more');
          if (!Number.isInteger(targetStock) || targetStock <= reorderPoint) rowErrors.push('Target stock must be above the reorder point');
          if (nameKey && existingNames.has(nameKey)) rowErrors.push('Product name already exists');
          if (skuKey && existingSkus.has(skuKey)) rowErrors.push('SKU already exists');
          if (supplierId && !knownSupplierIds.has(supplierId)) rowErrors.push('Supplier ID does not match this catalog');

          if (nameKey) existingNames.add(nameKey);
          if (skuKey) existingSkus.add(skuKey);

          const product = {
            id: Date.now() + index,
            name,
            category,
            sku,
            price,
            quantity,
            reorderPoint,
            targetStock,
            location: String(source.location ?? '').trim() || DEFAULT_LOCATION,
            supplierId
          };

          return { rowNumber: index + 2, product, errors: rowErrors };
        });

        if (result.errors.length > 0) {
          setError(`CSV parser found ${result.errors.length} formatting issue${result.errors.length === 1 ? '' : 's'}. Review invalid rows below.`);
        }
        setImportRows(rows);
      },
      error: (parseError) => setError(parseError.message)
    });
  };

  const handleRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setError('');
    try {
      const backup = JSON.parse(await file.text());
      if (!Array.isArray(backup.products)) throw new Error('This file does not contain an inventory product list.');
      if (backup.schemaVersion && backup.schemaVersion > 1) throw new Error('This backup was created by a newer version of Stockroom.');
      if (!window.confirm('Restore this backup? It will replace the current inventory and saved records.')) return;
      onRestoreBackup(backup);
      setMessage('Backup restored successfully.');
      closeDialog();
    } catch (restoreError) {
      setError(restoreError.message || 'Could not read this backup file.');
    }
  };

  const validRows = importRows.filter(row => row.errors.length === 0);
  const invalidRows = importRows.filter(row => row.errors.length > 0);

  return (
    <>
      <button className="btn-tool" type="button" onClick={() => { setMessage(''); setIsOpen(true); }}>
        Data tools
      </button>
      {message && <span className="data-message" role="status">{message}</span>}
      {isOpen && (
        <div className="data-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
          <section className="data-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="data-dialog-title">
            <header className="data-dialog-heading">
              <div>
                <p className="eyebrow">DATA_MAINTENANCE</p>
                <h2 id="data-dialog-title">Import and backup</h2>
              </div>
              <button className="btn-close" type="button" onClick={closeDialog} aria-label="Close data tools">×</button>
            </header>

            <div className="data-tool-grid">
              <div className="data-tool-block">
                <div>
                  <strong>Import inventory CSV</strong>
                  <p>Preview rows, validate fields, and skip duplicate names or SKUs.</p>
                </div>
                <label className="file-control">
                  Choose CSV
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} aria-label="Choose inventory CSV" />
                </label>
              </div>

              <div className="data-tool-block">
                <div>
                  <strong>Full JSON backup</strong>
                  <p>Includes products, catalog, suppliers, movements, orders, and activity.</p>
                </div>
                <button className="btn-tool" type="button" onClick={() => downloadFile(JSON.stringify(backupSnapshot, null, 2), `stockroom-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')}>
                  Download backup
                </button>
              </div>

              <div className="data-tool-block">
                <div>
                  <strong>Restore from JSON</strong>
                  <p>Replaces the current inventory after confirmation.</p>
                </div>
                <label className="file-control">
                  Choose backup
                  <input type="file" accept=".json,application/json" onChange={handleRestoreFile} aria-label="Choose JSON backup" />
                </label>
              </div>
            </div>

            {error && <p className="data-error" role="alert">{error}</p>}
            {importRows.length > 0 && (
              <div className="import-preview">
                <div className="import-preview-heading">
                  <div>
                    <strong>Import preview</strong>
                    <span>{validRows.length} ready · {invalidRows.length} skipped</span>
                  </div>
                  <button className="btn-submit" type="button" disabled={validRows.length === 0} onClick={() => { onImportProducts(validRows.map(row => row.product)); closeDialog(); }}>
                    Import {validRows.length} products
                  </button>
                </div>
                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead><tr><th>Row</th><th>Product</th><th>Qty</th><th>Result</th></tr></thead>
                    <tbody>
                      {importRows.slice(0, 12).map(row => (
                        <tr className={row.errors.length ? 'import-row-invalid' : ''} key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          <td>{row.product.name || 'Unnamed row'}</td>
                          <td>{Number.isFinite(row.product.quantity) ? row.product.quantity : '—'}</td>
                          <td>{row.errors.length ? row.errors.join('; ') : 'Ready'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importRows.length > 12 && <p className="preview-more">Showing 12 of {importRows.length} rows.</p>}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default DataManagement;
