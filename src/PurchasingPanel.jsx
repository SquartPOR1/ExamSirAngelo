import React from 'react';

const PurchasingPanel = ({ reorderProducts, purchaseOrders, suppliers, onCreateDrafts, onMarkOrdered, onReceive, onCancel }) => {
  const openOrderCount = purchaseOrders.filter(order => order.status === 'Draft' || order.status === 'Ordered').length;
  const supplierName = (supplierId) => suppliers.find(supplier => supplier.id === supplierId)?.name || 'Supplier not assigned';

  return (
    <section className="purchasing-section" aria-labelledby="purchasing-title">
      <div className="purchasing-heading">
        <div>
          <p className="eyebrow">REPLENISHMENT / {openOrderCount} OPEN</p>
          <h2 id="purchasing-title">Purchase orders</h2>
        </div>
        <button className="btn-tool" type="button" disabled={reorderProducts.length === 0} onClick={onCreateDrafts}>
          Create reorder drafts <span className="activity-count">{reorderProducts.length}</span>
        </button>
      </div>

      {reorderProducts.length > 0 && (
        <p className="reorder-summary">{reorderProducts.length} items are at or below their reorder point. Draft quantities will restore each item to its target stock.</p>
      )}

      {purchaseOrders.length === 0 ? (
        <p className="purchasing-empty">No purchase orders yet.</p>
      ) : (
        <div className="purchase-order-list">
          {purchaseOrders.slice(0, 8).map(order => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const estimatedTotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            return (
              <article className="purchase-order" key={order.id}>
                <div className="purchase-order-info">
                  <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
                  <strong>{order.id}</strong>
                  <span>{supplierName(order.supplierId)}</span>
                  <small>{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} products · {itemCount} units · ₱{estimatedTotal.toLocaleString()}</small>
                  <p>{order.items.map(item => `${item.productName} × ${item.quantity}`).join(' · ')}</p>
                </div>
                <div className="purchase-order-actions">
                  {order.status === 'Draft' && <button type="button" className="btn-tool" onClick={() => onMarkOrdered(order.id)}>Mark ordered</button>}
                  {order.status === 'Ordered' && <button type="button" className="btn-submit" onClick={() => onReceive(order.id)}>Receive stock</button>}
                  {(order.status === 'Draft' || order.status === 'Ordered') && <button type="button" className="btn-delete" onClick={() => onCancel(order.id)}>Cancel</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PurchasingPanel;