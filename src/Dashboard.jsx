import React from 'react';

const Dashboard = ({ products }) => {
  // Calculate statistics
  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
  const totalInventoryValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const lowStockCount = products.filter(product => product.quantity >= 1 && product.quantity <= (product.reorderPoint ?? 5)).length;
  const outOfStockCount = products.filter(product => product.quantity === 0).length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-stats">
        <div className="stat-card stat-products">
          <span className="stat-label">Total products</span>
          <p className="stat-value">{totalProducts}</p>
          <span className="stat-detail">Unique items in catalog</span>
        </div>
        <div className="stat-card stat-quantity">
          <span className="stat-label">Units in stock</span>
          <p className="stat-value">{totalQuantity}</p>
          <span className="stat-detail">Across all products</span>
        </div>
        <div className="stat-card stat-value-card">
          <span className="stat-label">Inventory value</span>
          <p className="stat-value"><span>₱</span>{totalInventoryValue.toLocaleString()}</p>
          <span className="stat-detail">Based on current quantity</span>
        </div>
        <div className="stat-card stat-low">
          <span className="stat-label">Low stock</span>
          <p className="stat-value">{lowStockCount}</p>
          <span className="stat-detail">At product reorder points</span>
        </div>
        <div className="stat-card stat-out">
          <span className="stat-label">Out of stock</span>
          <p className="stat-value">{outOfStockCount}</p>
          <span className="stat-detail">Needs replenishment</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;