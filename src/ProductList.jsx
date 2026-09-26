import React from 'react';

const ProductList = ({ products, onEdit, onDelete, onAdjustStock, selectedIds, onToggleProduct, onToggleVisible }) => {
  // Handle empty state
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products in inventory</p>
      </div>
    );
  }

  const allVisibleSelected = products.length > 0 && products.every(product => selectedIds.has(String(product.id)));

  return (
    <div className="product-list-container">
      <table className="product-table">
        <thead>
          <tr>
            <th className="select-column">
              <input type="checkbox" aria-label="Select all visible products" checked={allVisibleSelected} onChange={() => onToggleVisible(products.map(product => product.id), allVisibleSelected)} />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Reorder</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td className="select-column">
                <input type="checkbox" aria-label={`Select ${product.name}`} checked={selectedIds.has(String(product.id))} onChange={() => onToggleProduct(product.id)} />
              </td>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.location}</td>
              <td>{product.sku || '—'}</td>
              <td>₱{product.price.toLocaleString()}</td>
              <td>{product.quantity}</td>
              <td>{product.reorderPoint}</td>
              <td>
                <span className={`status-badge status-${product.status.toLowerCase().replace(' ', '-')}`}>
                  {product.status}
                </span>
              </td>
              <td className="actions-cell">
                <button
                  className="btn-edit"
                  onClick={() => onEdit(product)}
                >
                  Edit
                </button>
                <button className="btn-stock" type="button" aria-label={`Adjust stock for ${product.name}`} onClick={() => onAdjustStock(product)}>
                  Stock
                </button>
                <button
                  className="btn-delete"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                      onDelete(product.id);
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;