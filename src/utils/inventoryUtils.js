// Utility functions for inventory calculations

export const DEFAULT_REORDER_POINT = 5;
export const DEFAULT_LOCATION = 'Main Warehouse';

export function normalizeProduct(product = {}, index = 0) {
  const quantityValue = Number(product.quantity);
  const quantity = Number.isInteger(quantityValue) ? Math.max(0, quantityValue) : 0;
  const reorderValue = Number(product.reorderPoint);
  const reorderPoint = Number.isInteger(reorderValue) && reorderValue >= 0
    ? reorderValue
    : DEFAULT_REORDER_POINT;
  const targetValue = Number(product.targetStock);
  const targetStock = Number.isInteger(targetValue) && targetValue > reorderPoint
    ? targetValue
    : Math.max(quantity, reorderPoint + 5);
  const priceValue = Number(product.price);

  return {
    ...product,
    id: product.id ?? Date.now() + index,
    name: String(product.name ?? '').trim(),
    category: String(product.category ?? 'Uncategorized').trim() || 'Uncategorized',
    sku: String(product.sku ?? '').trim(),
    price: Number.isFinite(priceValue) ? Math.max(0, priceValue) : 0,
    quantity,
    reorderPoint,
    targetStock,
    location: String(product.location ?? DEFAULT_LOCATION).trim() || DEFAULT_LOCATION,
    supplierId: String(product.supplierId ?? ''),
    status: getStatus(quantity, reorderPoint)
  };
}

export function normalizeProducts(products) {
  return Array.isArray(products)
    ? products.map((product, index) => normalizeProduct(product, index))
    : [];
}

/**
 * Get stock status based on quantity
 * @param {number} quantity - The quantity of the product
 * @returns {string} Stock status ("In Stock", "Low Stock", or "Out of Stock")
 */
export function getStatus(quantity, reorderPoint = DEFAULT_REORDER_POINT) {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= reorderPoint) return "Low Stock";
  return "In Stock";
}

/**
 * Calculate total quantity of all products
 * @param {Array} products - Array of product objects
 * @returns {number} Total quantity
 */
export function calculateTotalQuantity(products) {
  return products.reduce((sum, product) => sum + product.quantity, 0);
}

/**
 * Calculate total inventory value (price × quantity for all products)
 * @param {Array} products - Array of product objects
 * @returns {number} Total inventory value
 */
export function calculateInventoryValue(products) {
  return products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
}

/**
 * Get products with low stock (quantity 1-5)
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of low stock products
 */
export function getLowStockProducts(products) {
  return products.filter(product => product.quantity >= 1 && product.quantity <= (product.reorderPoint ?? DEFAULT_REORDER_POINT));
}

/**
 * Get products with out of stock (quantity 0)
 * @param {Array} products - Array of product objects
 * @returns {Array} Array of out of stock products
 */
export function getOutOfStockProducts(products) {
  return products.filter(product => product.quantity === 0);
}

/**
 * Build a spreadsheet-friendly CSV representation of inventory products.
 * @param {Array} products - Array of product objects
 * @returns {string} CSV text with escaped fields
 */
export function buildInventoryCsv(products) {
  const columns = [
    { label: 'ID', value: product => product.id },
    { label: 'Name', value: product => product.name },
    { label: 'Category', value: product => product.category },
    { label: 'SKU', value: product => product.sku ?? '' },
    { label: 'Price', value: product => product.price },
    { label: 'Quantity', value: product => product.quantity },
    { label: 'Reorder Point', value: product => product.reorderPoint ?? DEFAULT_REORDER_POINT },
    { label: 'Target Stock', value: product => product.targetStock ?? '' },
    { label: 'Location', value: product => product.location ?? DEFAULT_LOCATION },
    { label: 'Supplier ID', value: product => product.supplierId ?? '' },
    { label: 'Status', value: product => getStatus(product.quantity, product.reorderPoint ?? DEFAULT_REORDER_POINT) }
  ];
  const escapeCsvField = value => {
    const text = String(value ?? '');
    const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  };
  const header = columns.map(column => escapeCsvField(column.label)).join(',');
  const rows = products.map(product => columns
    .map(column => escapeCsvField(column.value(product)))
    .join(','));

  return [header, ...rows].join('\r\n');
}