import React, { useState } from 'react';
import { useDialogAccessibility } from './hooks/useDialogAccessibility.js';

const CatalogManager = ({ categories, locations, suppliers, products, purchaseOrders, onAddCategory, onRemoveCategory, onAddLocation, onRemoveLocation, onAddSupplier, onRemoveSupplier }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [error, setError] = useState('');

  const addNamedEntry = (event) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) return setError('Enter a name first.');
    const currentValues = activeTab === 'categories' ? categories : locations;
    if (currentValues.some(item => item.toLowerCase() === value.toLowerCase())) return setError('That name already exists.');
    if (activeTab === 'categories') onAddCategory(value);
    else onAddLocation(value);
    setName('');
    setError('');
  };

  const addSupplier = (event) => {
    event.preventDefault();
    const supplierName = name.trim();
    if (!supplierName) return setError('Supplier name is required.');
    if (leadTimeDays !== '' && (!Number.isInteger(Number(leadTimeDays)) || Number(leadTimeDays) < 0)) return setError('Lead time must be a whole number of zero or more.');
    if (suppliers.some(supplier => supplier.name.toLowerCase() === supplierName.toLowerCase())) return setError('That supplier already exists.');
    onAddSupplier({
      id: `SUP-${Date.now()}`,
      name: supplierName,
      email: email.trim(),
      phone: phone.trim(),
      leadTimeDays: leadTimeDays === '' ? '' : Number(leadTimeDays)
    });
    setName('');
    setEmail('');
    setPhone('');
    setLeadTimeDays('');
    setError('');
  };

  const closeDialog = () => setIsOpen(false);
  const dialogRef = useDialogAccessibility(isOpen, closeDialog);

  const closeOnBackdrop = (event) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  return (
    <>
      <button className="btn-tool" type="button" onClick={() => setIsOpen(true)}>Manage catalog</button>
      {isOpen && (
        <div className="catalog-backdrop" onMouseDown={closeOnBackdrop}>
          <section className="catalog-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="catalog-title">
            <header className="history-heading">
              <div>
                <p className="eyebrow">CATALOG_CONFIGURATION</p>
                <h2 id="catalog-title">Catalog settings</h2>
              </div>
              <button className="btn-close" type="button" onClick={closeDialog} aria-label="Close catalog settings">×</button>
            </header>

            <div className="catalog-tabs" role="group" aria-label="Catalog settings sections">
              {['categories', 'locations', 'suppliers'].map(tab => (
                <button key={tab} aria-pressed={activeTab === tab} className={activeTab === tab ? 'record-tab active' : 'record-tab'} type="button" onClick={() => { setActiveTab(tab); setError(''); }}>
                  {tab[0].toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab !== 'suppliers' ? (
              <>
                <form className="catalog-add-form" onSubmit={addNamedEntry}>
                  <label className="sr-only" htmlFor="catalog-entry-name">New {activeTab === 'categories' ? 'category' : 'location'} name</label>
                  <input id="catalog-entry-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={`New ${activeTab === 'categories' ? 'category' : 'location'} name`} />
                  <button className="btn-submit" type="submit">Add {activeTab === 'categories' ? 'category' : 'location'}</button>
                </form>
                <ul className="catalog-list">
                  {(activeTab === 'categories' ? categories : locations).map(value => {
                    const usageCount = activeTab === 'categories'
                      ? products.filter(product => product.category === value).length
                      : products.filter(product => product.location === value).length;
                    const isDefaultLocation = activeTab === 'locations' && value === 'Main Warehouse';
                    return (
                      <li key={value}>
                        <span><strong>{value}</strong><small>{usageCount} products</small></span>
                        <button type="button" className="catalog-remove" disabled={usageCount > 0 || isDefaultLocation} onClick={() => activeTab === 'categories' ? onRemoveCategory(value) : onRemoveLocation(value)} aria-label={`Remove ${value}`}>
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <form className="supplier-form" onSubmit={addSupplier}>
                  <div className="form-group"><label htmlFor="supplier-name">Supplier name</label><input id="supplier-name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
                  <div className="form-group"><label htmlFor="supplier-email">Email</label><input id="supplier-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
                  <div className="form-group"><label htmlFor="supplier-phone">Phone</label><input id="supplier-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
                  <div className="form-group"><label htmlFor="supplier-lead-time">Lead time (days)</label><input id="supplier-lead-time" type="number" min="0" step="1" value={leadTimeDays} onChange={(event) => setLeadTimeDays(event.target.value)} /></div>
                  <button className="btn-submit" type="submit">Add supplier</button>
                </form>
                <ul className="catalog-list supplier-list">
                  {suppliers.map(supplier => {
                    const isUsed = products.some(product => product.supplierId === supplier.id) || purchaseOrders.some(order => order.supplierId === supplier.id);
                    return (
                      <li key={supplier.id}>
                        <span><strong>{supplier.name}</strong><small>{[supplier.email, supplier.phone, supplier.leadTimeDays !== '' ? `${supplier.leadTimeDays} day lead` : ''].filter(Boolean).join(' · ') || 'No contact details'}</small></span>
                        <button type="button" className="catalog-remove" disabled={isUsed} onClick={() => onRemoveSupplier(supplier.id)} aria-label={`Remove ${supplier.name}`}>Remove</button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {error && <p className="data-error" role="alert">{error}</p>}
          </section>
        </div>
      )}
    </>
  );
};

export default CatalogManager;