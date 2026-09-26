import React, { useState } from 'react';
import { useDialogAccessibility } from './hooks/useDialogAccessibility.js';

const ProductForm = ({ onSaveProduct, productToEdit, onCancel, categories = [], locations = [], suppliers = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || '',
    price: '',
    quantity: '',
    sku: '',
    reorderPoint: '5',
    targetStock: '10',
    location: locations[0] || 'Main Warehouse',
    supplierId: ''
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Initialize form with product data when editing
  React.useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        category: productToEdit.category || '',
        price: productToEdit.price || '',
        quantity: productToEdit.quantity ?? '',
        sku: productToEdit.sku || '',
        reorderPoint: productToEdit.reorderPoint ?? 5,
        targetStock: productToEdit.targetStock ?? 10,
        location: productToEdit.location || locations[0] || 'Main Warehouse',
        supplierId: productToEdit.supplierId || ''
      });
      setIsEditing(true);
      setIsOpen(true);
    } else {
      setFormData({
        name: '',
        category: categories[0] || '',
        price: '',
        quantity: '',
        sku: '',
        reorderPoint: '5',
        targetStock: '10',
        location: locations[0] || 'Main Warehouse',
        supplierId: ''
      });
      setIsEditing(false);
      setErrors({});
      setIsOpen(false);
    }
  }, [productToEdit, categories, locations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Price must be greater than 0';
      isValid = false;
    }

    const quantityNum = parseInt(formData.quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      newErrors.quantity = 'Quantity must not be negative';
      isValid = false;
    }

    const reorderPointNum = Number(formData.reorderPoint);
    if (!Number.isInteger(reorderPointNum) || reorderPointNum < 0) {
      newErrors.reorderPoint = 'Enter a whole number of 0 or more';
      isValid = false;
    }

    const targetStockNum = Number(formData.targetStock);
    if (!Number.isInteger(targetStockNum) || targetStockNum <= reorderPointNum) {
      newErrors.targetStock = 'Target must be above the reorder point';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const productData = {
        id: productToEdit ? productToEdit.id : Date.now(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        sku: formData.sku.trim(),
        reorderPoint: Number(formData.reorderPoint),
        targetStock: Number(formData.targetStock),
        location: formData.location,
        supplierId: formData.supplierId
      };

      onSaveProduct(productData, isEditing);

      // Reset form unless we want to keep editing the same product
      // For now, reset after save to return to add mode
      setFormData({
        name: '',
        category: categories[0] || '',
        price: '',
        quantity: '',
        sku: '',
        reorderPoint: '5',
        targetStock: '10',
        location: locations[0] || 'Main Warehouse',
        supplierId: ''
      });
      setIsEditing(false);
      setErrors({});
      setIsOpen(false);
    }
  };

  const closeForm = () => {
    setFormData({
      name: '', category: categories[0] || '', price: '', quantity: '', sku: '',
      reorderPoint: '5', targetStock: '10', location: locations[0] || 'Main Warehouse', supplierId: ''
    });
    setIsEditing(false);
    setErrors({});
    setIsOpen(false);
    onCancel?.();
  };

  const dialogRef = useDialogAccessibility(isOpen, closeForm);

  return (
    <>
      <button className="btn-add" type="button" aria-keyshortcuts="N" onClick={() => setIsOpen(true)}>
        <span aria-hidden="true">+</span> Add product
      </button>
      {isOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeForm()}>
          <section className="product-form-container" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">PRODUCT DETAILS</p>
                <h2 id="product-form-title">{isEditing ? 'Edit product' : 'Add a product'}</h2>
              </div>
              <button className="btn-close" type="button" onClick={closeForm} aria-label="Close dialog">×</button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label htmlFor="name">Product name</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'error' : ''} autoComplete="off" required />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="sku">SKU / barcode</label>
                <input id="sku" name="sku" value={formData.sku} onChange={handleChange} autoComplete="off" />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                  {categories.map(category => <option key={category} value={category}>{category}</option>)}
                  {categories.length === 0 && <option value="">Add a category first</option>}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Storage location</label>
                <select id="location" name="location" value={formData.location} onChange={handleChange} required>
                  {locations.map(location => <option key={location} value={location}>{location}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Unit price (₱)</label>
                <input id="price" name="price" type="number" value={formData.price} onChange={handleChange} className={errors.price ? 'error' : ''} min="0.01" step="0.01" required />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Current quantity</label>
                <input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} className={errors.quantity ? 'error' : ''} min="0" step="1" required />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="reorderPoint">Reorder when at or below</label>
                <input id="reorderPoint" name="reorderPoint" type="number" value={formData.reorderPoint} onChange={handleChange} className={errors.reorderPoint ? 'error' : ''} min="0" step="1" required />
                {errors.reorderPoint && <span className="error-message">{errors.reorderPoint}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="targetStock">Restock target</label>
                <input id="targetStock" name="targetStock" type="number" value={formData.targetStock} onChange={handleChange} className={errors.targetStock ? 'error' : ''} min="1" step="1" required />
                {errors.targetStock && <span className="error-message">{errors.targetStock}</span>}
              </div>

              <div className="form-group form-group-wide">
                <label htmlFor="supplierId">Preferred supplier</label>
                <select id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleChange}>
                  <option value="">No supplier assigned</option>
                  {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">{isEditing ? 'Update product' : 'Add product'}</button>
                <button type="button" className="btn-cancel" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
};

export default ProductForm;