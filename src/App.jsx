import React, { lazy, Suspense, useState, useEffect } from 'react';
import ProductList from './ProductList.jsx';
import ProductForm from './ProductForm.jsx';
import SearchBar from './SearchBar.jsx';
import FilterBar from './FilterBar.jsx';
import Dashboard from './Dashboard.jsx';
import ActivityHistory from './ActivityHistory.jsx';
import DataManagement from './DataManagement.jsx';
import StockMovementDialog from './StockMovementDialog.jsx';
import BulkActions from './BulkActions.jsx';
import CatalogManager from './CatalogManager.jsx';
import PurchasingPanel from './PurchasingPanel.jsx';

const InventoryInsights = lazy(() => import('./InventoryInsights.jsx'));
import {
  buildInventoryCsv,
  DEFAULT_LOCATION,
  getLowStockProducts,
  getOutOfStockProducts,
  getStatus,
  normalizeProduct,
  normalizeProducts
} from './utils/inventoryUtils.js';

function readStoredArray(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    if (!savedValue) return fallback;
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return fallback;
  }
}

const getDefaultProducts = () => [
  {
    id: 1,
    name: "Laptop",
    category: "Electronics",
    price: 25000,
    quantity: 10,
    status: "In Stock"
  },
  {
    id: 2,
    name: "Keyboard",
    category: "Accessories",
    price: 1500,
    quantity: 25,
    status: "In Stock"
  },
  {
    id: 3,
    name: "Mouse",
    category: "Accessories",
    price: 800,
    quantity: 5,
    status: "Low Stock"
  },
  {
    id: 4,
    name: "Monitor",
    category: "Electronics",
    price: 12000,
    quantity: 0,
    status: "Out of Stock"
  },
  {
    id: 5,
    name: "USB Cable",
    category: "Accessories",
    price: 200,
    quantity: 50,
    status: "In Stock"
  }
];

function App() {
  // Initialize products from localStorage or use default products
  const [products, setProducts] = useState(() => {
    return normalizeProducts(readStoredArray('inventoryProducts', getDefaultProducts()));
  });

  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categories, setCategories] = useState(() => [...new Set(
    readStoredArray('inventoryCategories', products.map(product => product.category))
  )].sort());
  const [locations, setLocations] = useState(() => [...new Set([
    ...readStoredArray('inventoryLocations', [DEFAULT_LOCATION]),
    ...products.map(product => product.location || DEFAULT_LOCATION)
  ])].sort());
  const [suppliers, setSuppliers] = useState(() => readStoredArray('inventorySuppliers', []));
  const [movements, setMovements] = useState(() => readStoredArray('inventoryMovements', []));
  const [purchaseOrders, setPurchaseOrders] = useState(() => readStoredArray('inventoryPurchaseOrders', []));
  const [activity, setActivity] = useState(() => {
    const savedActivity = localStorage.getItem('inventoryActivity');
    if (!savedActivity) return [];
    try {
      const parsedActivity = JSON.parse(savedActivity);
      return Array.isArray(parsedActivity) ? parsedActivity : [];
    } catch (error) {
      console.error('Failed to parse saved activity:', error);
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set());

  useEffect(() => {
    const handleKeyboardShortcut = (event) => {
      if (event.key === 'Escape') {
        setIsHistoryOpen(false);
        setStockProduct(null);
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || isHistoryOpen || stockProduct) return;
      if (event.target instanceof HTMLElement && event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('inventory-search')?.focus();
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        document.querySelector('.inventory-actions .btn-add')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [isHistoryOpen, stockProduct]);

  // Save products to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('inventoryProducts', JSON.stringify(products));
    } catch (error) {
      console.error('Failed to save products to localStorage:', error);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('inventoryActivity', JSON.stringify(activity));
    } catch (error) {
      console.error('Failed to save inventory activity:', error);
    }
  }, [activity]);

  useEffect(() => {
    localStorage.setItem('inventoryCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('inventoryLocations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('inventorySuppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('inventoryMovements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('inventoryPurchaseOrders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  const recordActivity = (action, product, details) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action,
      productName: product.name,
      details,
      timestamp: new Date().toISOString()
    };
    setActivity(previousActivity => [entry, ...previousActivity].slice(0, 50));
  };

  const recordMovement = (product, type, quantityChange, note = '') => {
    if (quantityChange === 0) return;
    const movement = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      productId: product.id,
      productName: product.name,
      type,
      quantityChange,
      note,
      location: product.location || DEFAULT_LOCATION,
      timestamp: new Date().toISOString()
    };
    setMovements(previousMovements => [movement, ...previousMovements].slice(0, 500));
  };

  const handleAddProduct = (newProduct) => {
    // Calculate status for the new product
    const productWithStatus = normalizeProduct(newProduct);

    // Add the new product to the state
    setProducts(prevProducts => [...prevProducts, productWithStatus]);
    setCategories(previousCategories => [...new Set([...previousCategories, productWithStatus.category])].sort());
    setLocations(previousLocations => [...new Set([...previousLocations, productWithStatus.location])].sort());
    recordActivity('Added', productWithStatus, `${productWithStatus.quantity} units at ₱${productWithStatus.price.toLocaleString()}`);
    recordMovement(productWithStatus, 'Received', productWithStatus.quantity, 'Opening stock');
  };

  const handleEditProduct = (productToEdit) => {
    // Set the editId to the product being edited
    setEditId(productToEdit.id);
    // ProductForm will receive productToEdit prop and populate the form
  };

  const handleUpdateProduct = (updatedProduct, isEditing) => {
    if (!isEditing) return; // Should not happen in normal flow

    const previousProduct = products.find(product => product.id === editId);
    if (!previousProduct) return;

    // Calculate status for the updated product
    const productWithStatus = normalizeProduct(updatedProduct);

    // Update the product in the state
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === editId
          ? productWithStatus
          : product
      )
    );
    setCategories(previousCategories => [...new Set([...previousCategories, productWithStatus.category])].sort());
    setLocations(previousLocations => [...new Set([...previousLocations, productWithStatus.location])].sort());
    recordMovement(productWithStatus, 'Adjustment', productWithStatus.quantity - previousProduct.quantity, 'Quantity changed in product editor');
    recordActivity(
      'Updated',
      productWithStatus,
      `Quantity ${previousProduct.quantity} -> ${productWithStatus.quantity}; price ₱${previousProduct.price.toLocaleString()} -> ₱${productWithStatus.price.toLocaleString()}`
    );

    // Reset editId to return to add mode
    setEditId(null);
  };

  const handleDeleteProduct = (id) => {
    const deletedProduct = products.find(product => product.id === id);
    if (!deletedProduct) return;

    // Remove the product with the given id
    setProducts(prevProducts =>
      prevProducts.filter(product => product.id !== id)
    );
    recordActivity('Deleted', deletedProduct, `Removed ${deletedProduct.quantity} units from inventory`);
    recordMovement(deletedProduct, 'Removed', -deletedProduct.quantity, 'Product deleted');
  };

  const handleStockMovement = (productId, movement) => {
    const currentProduct = products.find(product => product.id === productId);
    if (!currentProduct) return false;
    const quantityChange = movement.type === 'Received'
      ? movement.quantity
      : movement.type === 'Adjustment'
        ? movement.quantity - currentProduct.quantity
        : -movement.quantity;
    const updatedQuantity = currentProduct.quantity + quantityChange;
    if (updatedQuantity < 0) return false;

    const updatedProduct = normalizeProduct({ ...currentProduct, quantity: updatedQuantity });
    setProducts(previousProducts => previousProducts.map(product => product.id === productId ? updatedProduct : product));
    recordMovement(updatedProduct, movement.type, quantityChange, movement.note);
    recordActivity(movement.type, updatedProduct, `${quantityChange > 0 ? '+' : ''}${quantityChange} units${movement.note ? ` · ${movement.note}` : ''}`);
    return true;
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(previousIds => {
      const nextIds = new Set(previousIds);
      const id = String(productId);
      if (nextIds.has(id)) nextIds.delete(id);
      else nextIds.add(id);
      return nextIds;
    });
  };

  const toggleVisibleSelection = (productIds, areAllSelected) => {
    setSelectedProductIds(previousIds => {
      const nextIds = new Set(previousIds);
      productIds.forEach(productId => areAllSelected ? nextIds.delete(String(productId)) : nextIds.add(String(productId)));
      return nextIds;
    });
  };

  const handleBulkUpdate = (changes) => {
    const selectedProducts = products.filter(product => selectedProductIds.has(String(product.id)));
    if (selectedProducts.length === 0) return false;
    if (changes.quantityChange < 0 && selectedProducts.some(product => product.quantity + changes.quantityChange < 0)) return false;

    const updatedProducts = selectedProducts.map(product => normalizeProduct({
      ...product,
      category: changes.category || product.category,
      location: changes.location || product.location,
      reorderPoint: changes.reorderPoint ?? product.reorderPoint,
      quantity: changes.quantityChange === null ? product.quantity : product.quantity + changes.quantityChange
    }));
    const updatedById = new Map(updatedProducts.map(product => [String(product.id), product]));
    setProducts(previousProducts => previousProducts.map(product => updatedById.get(String(product.id)) || product));
    if (changes.category) setCategories(previousCategories => [...new Set([...previousCategories, changes.category])].sort());
    if (changes.location) setLocations(previousLocations => [...new Set([...previousLocations, changes.location])].sort());
    updatedProducts.forEach((product, index) => {
      const previousProduct = selectedProducts[index];
      const quantityChange = product.quantity - previousProduct.quantity;
      if (quantityChange !== 0) recordMovement(product, 'Adjustment', quantityChange, 'Bulk quantity update');
      recordActivity('Bulk update', product, 'Category, location, reorder point, or quantity updated');
    });
    setSelectedProductIds(new Set());
    return true;
  };

  const handleDeleteSelected = () => {
    const selectedProducts = products.filter(product => selectedProductIds.has(String(product.id)));
    if (selectedProducts.length === 0 || !window.confirm(`Delete ${selectedProducts.length} selected products?`)) return;
    selectedProducts.forEach(product => handleDeleteProduct(product.id));
    setSelectedProductIds(new Set());
  };

  const handleSearchChange = (term) => {
    setSelectedProductIds(new Set());
    setSearchTerm(term);
  };

  const handleCategoryChange = (category) => {
    setSelectedProductIds(new Set());
    setCategoryFilter(category);
  };

  const handleLocationChange = (location) => {
    setSelectedProductIds(new Set());
    setLocationFilter(location);
  };

  const handleAddCategory = (category) => {
    setCategories(previousCategories => [...new Set([...previousCategories, category])].sort());
  };

  const handleRemoveCategory = (category) => {
    if (products.some(product => product.category === category)) return;
    setCategories(previousCategories => previousCategories.filter(item => item !== category));
    if (categoryFilter === category) setCategoryFilter('all');
  };

  const handleAddLocation = (location) => {
    setLocations(previousLocations => [...new Set([...previousLocations, location])].sort());
  };

  const handleRemoveLocation = (location) => {
    if (location === DEFAULT_LOCATION || products.some(product => product.location === location)) return;
    setLocations(previousLocations => previousLocations.filter(item => item !== location));
    if (locationFilter === location) setLocationFilter('all');
  };

  const handleAddSupplier = (supplier) => {
    setSuppliers(previousSuppliers => [...previousSuppliers, supplier]);
  };

  const handleRemoveSupplier = (supplierId) => {
    const supplierInUse = products.some(product => product.supplierId === supplierId) || purchaseOrders.some(order => order.supplierId === supplierId);
    if (!supplierInUse) setSuppliers(previousSuppliers => previousSuppliers.filter(supplier => supplier.id !== supplierId));
  };

  const handleStatusChange = (status) => {
    setSelectedProductIds(new Set());
    setStatusFilter(status);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const showStockStatus = (status) => {
    setSelectedProductIds(new Set());
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter(status);
  };

  // Determine the product to edit (if any) for pre-filling the form
  const productToEdit = editId !== null ? products.find(p => p.id === editId) : null;
  const isEditing = editId !== null;

  // Recalculate status for all products based on quantity
  const productsWithStatus = products.map(product => normalizeProduct(product));

  // Filter products based on search term, category, and status (ALL conditions must match)
  const filteredProducts = productsWithStatus.filter(product => {
    // Search filter (case-insensitive, partial match on name or category)
    const searchMatch = searchTerm
      ? (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      : true; // If search term is empty, include all products

    // Category filter
    const categoryMatch =
      categoryFilter === 'all' ||
      product.category === categoryFilter;

    // Status filter
    const statusMatch =
      statusFilter === 'all' ||
      product.status === statusFilter;

    const locationMatch = locationFilter === 'all' || product.location === locationFilter;

    // All filters must match (AND logic)
    return searchMatch && categoryMatch && statusMatch && locationMatch;
  });

  // Sort the filtered products (using a copy to avoid mutating original array)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'quantity-asc':
        return a.quantity - b.quantity;
      case 'quantity-desc':
        return b.quantity - a.quantity;
      default:
        return 0;
    }
  });
  const selectedProducts = productsWithStatus.filter(product => selectedProductIds.has(String(product.id)));

  // Get unique categories for the filter dropdown (excluding duplicates)
  const uniqueCategories = [...new Set([...categories, ...productsWithStatus.map(product => product.category)])].sort();
  const lowStockProducts = getLowStockProducts(productsWithStatus);
  const outOfStockProducts = getOutOfStockProducts(productsWithStatus);

  // Filter status options
  const statusOptions = ['all', 'In Stock', 'Low Stock', 'Out of Stock'];

  // Sort options
  const sortOptions = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'price-asc', label: 'Price Low-High' },
    { value: 'price-desc', label: 'Price High-Low' },
    { value: 'quantity-asc', label: 'Quantity Low-High' },
    { value: 'quantity-desc', label: 'Quantity High-Low' }
  ];

  const pendingOrderProductIds = new Set(purchaseOrders
    .filter(order => order.status === 'Draft' || order.status === 'Ordered')
    .flatMap(order => order.items.map(item => String(item.productId))));
  const reorderProducts = productsWithStatus.filter(product =>
    product.quantity <= product.reorderPoint && product.targetStock > product.quantity && !pendingOrderProductIds.has(String(product.id))
  );

  const handleCreatePurchaseOrders = () => {
    const productsBySupplier = new Map();
    reorderProducts.forEach(product => {
      const supplierId = product.supplierId || '';
      if (!productsBySupplier.has(supplierId)) productsBySupplier.set(supplierId, []);
      productsBySupplier.get(supplierId).push({
        productId: product.id,
        productName: product.name,
        quantity: product.targetStock - product.quantity,
        unitPrice: product.price,
        location: product.location
      });
    });
    const createdAt = new Date().toISOString();
    const newOrders = [...productsBySupplier.entries()].map(([supplierId, items], index) => ({
      id: `PO-${Date.now()}-${index + 1}`,
      supplierId,
      items,
      status: 'Draft',
      createdAt
    }));
    setPurchaseOrders(previousOrders => [...newOrders, ...previousOrders]);
    newOrders.forEach(order => recordActivity('Order created', { name: order.id }, `${order.items.length} products · ${order.items.reduce((sum, item) => sum + item.quantity, 0)} units`));
  };

  const handleMarkOrderOrdered = (orderId) => {
    setPurchaseOrders(previousOrders => previousOrders.map(order => order.id === orderId ? { ...order, status: 'Ordered' } : order));
    recordActivity('Order placed', { name: orderId }, 'Purchase order marked as ordered');
  };

  const handleCancelOrder = (orderId) => {
    if (!window.confirm(`Cancel purchase order ${orderId}?`)) return;
    setPurchaseOrders(previousOrders => previousOrders.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order));
    recordActivity('Order cancelled', { name: orderId }, 'Purchase order cancelled');
  };

  const handleReceiveOrder = (orderId) => {
    const order = purchaseOrders.find(item => item.id === orderId);
    if (!order || order.status !== 'Ordered') return;
    const receivedItems = order.items
      .map(item => ({ item, product: products.find(product => product.id === item.productId) }))
      .filter(entry => entry.product);
    const quantityById = new Map(receivedItems.map(({ item }) => [String(item.productId), item.quantity]));
    setProducts(previousProducts => previousProducts.map(product => {
      const receivedQuantity = quantityById.get(String(product.id));
      return receivedQuantity ? normalizeProduct({ ...product, quantity: product.quantity + receivedQuantity }) : product;
    }));
    receivedItems.forEach(({ item, product }) => {
      const updatedProduct = normalizeProduct({ ...product, quantity: product.quantity + item.quantity });
      recordMovement(updatedProduct, 'Received', item.quantity, `Purchase order ${order.id}`);
    });
    setPurchaseOrders(previousOrders => previousOrders.map(item => item.id === orderId ? { ...item, status: 'Received', receivedAt: new Date().toISOString() } : item));
    recordActivity('Order received', { name: order.id }, `${receivedItems.length} products received into stock`);
  };

  const handleExportCsv = () => {
    const csv = buildInventoryCsv(sortedProducts);
    const fileUrl = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.download = `stockroom-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
  };

  const handleImportProducts = (importedProducts) => {
    const usedIds = new Set(products.map(product => String(product.id)));
    let nextId = Date.now();
    const normalizedProducts = importedProducts.map((product, index) => {
      let id = nextId + index;
      while (usedIds.has(String(id))) id += 1;
      usedIds.add(String(id));
      return normalizeProduct({ ...product, id }, index);
    });

    setProducts(previousProducts => [...previousProducts, ...normalizedProducts]);
    setCategories(previousCategories => [...new Set([
      ...previousCategories,
      ...normalizedProducts.map(product => product.category)
    ])].sort());
    setLocations(previousLocations => [...new Set([
      ...previousLocations,
      ...normalizedProducts.map(product => product.location)
    ])].sort());
    normalizedProducts.forEach(product => {
      recordActivity('Imported', product, `${product.quantity} units from CSV`);
      recordMovement(product, 'Received', product.quantity, 'CSV import');
    });
  };

  const handleRestoreBackup = (backup) => {
    const restoredProducts = normalizeProducts(backup.products);
    const restoredCategories = Array.isArray(backup.categories)
      ? [...new Set(backup.categories.map(category => String(category).trim()).filter(Boolean))].sort()
      : [...new Set(restoredProducts.map(product => product.category))].sort();
    const restoredLocations = Array.isArray(backup.locations)
      ? [...new Set([DEFAULT_LOCATION, ...backup.locations.map(location => String(location).trim()).filter(Boolean)])].sort()
      : [...new Set([DEFAULT_LOCATION, ...restoredProducts.map(product => product.location)])].sort();

    setProducts(restoredProducts);
    setCategories(restoredCategories);
    setLocations(restoredLocations);
    setSuppliers(Array.isArray(backup.suppliers) ? backup.suppliers : []);
    setMovements(Array.isArray(backup.movements) ? backup.movements.slice(0, 500) : []);
    setPurchaseOrders(Array.isArray(backup.purchaseOrders) ? backup.purchaseOrders : []);
    setActivity(Array.isArray(backup.activity) ? backup.activity.slice(0, 50) : []);
    setSearchTerm('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
  };

  const backupSnapshot = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    products: productsWithStatus,
    categories,
    locations,
    suppliers,
    movements,
    purchaseOrders,
    activity
  };

  return (
    <div className="App">
      <a className="skip-link" href="#main-content">Skip to inventory content</a>
      <header className="app-header">
        <a className="brand" href="#main-content" aria-label="Stockroom home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>stockroom</span>
        </a>
        <div className="header-context">
          <span className="header-kicker">SYSTEM / INVENTORY</span>
          <span className="header-divider" aria-hidden="true" />
          <span>Control surface</span>
        </div>
        <div
          className="sidebar-identity"
          role="note"
          aria-label="Ian F. Espiritu. Copyright 2026. All rights reserved."
          title="Ian F. Espiritu. Copyright 2026. All rights reserved."
        >
          <span className="sidebar-owner-mark" aria-hidden="true">IF</span>
          <strong className="sidebar-owner-name">Ian F. Espiritu</strong>
          <small className="sidebar-copyright">© 2026 Ian F. Espiritu.<br />All rights reserved.</small>
        </div>
        <div className="header-status"><span /> Live inventory</div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="page-intro">
          <div>
            <p className="eyebrow">SYSTEMS / INVENTORY_CONTROL</p>
            <h1>Inventory <span className="title-accent">overview</span></h1>
            <p className="intro-copy">A clear view of your products, stock levels, and inventory value.</p>
          </div>
          <div className="intro-note"><span className="intro-note-dot" /> Changes save automatically</div>
        </section>

        <section className="dashboard-section" aria-label="Inventory summary">
          <Dashboard products={productsWithStatus} />
        </section>

        <Suspense fallback={<section className="insights-loading" aria-label="Loading inventory analytics">Loading analytics...</section>}>
          <InventoryInsights products={productsWithStatus} movements={movements} />
        </Suspense>

        <section className="stock-alerts" aria-labelledby="stock-alerts-title">
          <div className="stock-alerts-heading">
            <div>
              <p className="eyebrow">ATTENTION_REQUIRED</p>
              <h2 id="stock-alerts-title">Stock alerts</h2>
            </div>
            <span className="alert-total">{lowStockProducts.length + outOfStockProducts.length} items</span>
          </div>
          <div className="stock-alert-list">
            {lowStockProducts.length > 0 && (
              <button className="stock-alert low-alert" type="button" onClick={() => showStockStatus('Low Stock')}>
                <span className="alert-indicator" aria-hidden="true" />
                <span className="alert-copy">
                  <strong>{lowStockProducts.length} low stock</strong>
                  <span>{lowStockProducts.slice(0, 3).map(product => product.name).join(', ')}{lowStockProducts.length > 3 ? ` + ${lowStockProducts.length - 3} more` : ''}</span>
                </span>
                <span className="alert-action">Review</span>
              </button>
            )}
            {outOfStockProducts.length > 0 && (
              <button className="stock-alert out-alert" type="button" onClick={() => showStockStatus('Out of Stock')}>
                <span className="alert-indicator" aria-hidden="true" />
                <span className="alert-copy">
                  <strong>{outOfStockProducts.length} out of stock</strong>
                  <span>{outOfStockProducts.slice(0, 3).map(product => product.name).join(', ')}{outOfStockProducts.length > 3 ? ` + ${outOfStockProducts.length - 3} more` : ''}</span>
                </span>
                <span className="alert-action">Review</span>
              </button>
            )}
            {productsWithStatus.length === 0 && <p className="alerts-empty">Add products to begin monitoring stock levels.</p>}
            {productsWithStatus.length > 0 && lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
              <p className="alerts-empty">All products are above the low-stock threshold.</p>
            )}
          </div>
        </section>

        <PurchasingPanel
          reorderProducts={reorderProducts}
          purchaseOrders={purchaseOrders}
          suppliers={suppliers}
          onCreateDrafts={handleCreatePurchaseOrders}
          onMarkOrdered={handleMarkOrderOrdered}
          onReceive={handleReceiveOrder}
          onCancel={handleCancelOrder}
        />

        <section className="inventory-section">
          <div className="inventory-heading">
            <div>
              <p className="eyebrow">STOCK_REGISTRY</p>
              <h2>Products <span className="product-count">{sortedProducts.length}</span></h2>
            </div>
            <div className="inventory-actions">
              <button className="btn-tool" type="button" onClick={handleExportCsv}>
                <span aria-hidden="true">↓</span> Export CSV
              </button>
              <button className="btn-tool history-trigger" type="button" onClick={() => setIsHistoryOpen(true)}>
                Activity <span className="activity-count">{activity.length}</span>
              </button>
              <DataManagement
                backupSnapshot={backupSnapshot}
                existingProducts={productsWithStatus}
                suppliers={suppliers}
                onImportProducts={handleImportProducts}
                onRestoreBackup={handleRestoreBackup}
              />
              <CatalogManager
                categories={uniqueCategories}
                locations={locations}
                suppliers={suppliers}
                products={productsWithStatus}
                purchaseOrders={purchaseOrders}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onAddLocation={handleAddLocation}
                onRemoveLocation={handleRemoveLocation}
                onAddSupplier={handleAddSupplier}
                onRemoveSupplier={handleRemoveSupplier}
              />
              <ProductForm
                onSaveProduct={isEditing ? handleUpdateProduct : handleAddProduct}
                productToEdit={productToEdit}
                onCancel={() => setEditId(null)}
                categories={uniqueCategories}
                locations={locations}
                suppliers={suppliers}
              />
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <BulkActions
              selectedProducts={selectedProducts}
              categories={uniqueCategories}
              locations={locations}
              onApply={handleBulkUpdate}
              onDelete={handleDeleteSelected}
              onClear={() => setSelectedProductIds(new Set())}
            />
          )}

          <div className="search-section">
            <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
          </div>

          <div className="filters-actions-section">
            <FilterBar
              categories={uniqueCategories}
              selectedCategory={categoryFilter}
              onCategoryChange={handleCategoryChange}
              locations={locations}
              selectedLocation={locationFilter}
              onLocationChange={handleLocationChange}
              statuses={statusOptions}
              selectedStatus={statusFilter}
              onStatusChange={handleStatusChange}
              sortOptions={sortOptions}
              selectedSort={sortOption}
              onSortChange={handleSortChange}
            />
          </div>

          <div className="product-list-section">
            <ProductList
              products={sortedProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onAdjustStock={setStockProduct}
              selectedIds={selectedProductIds}
              onToggleProduct={toggleProductSelection}
              onToggleVisible={toggleVisibleSelection}
            />
          </div>
        </section>
      </main>
      {isHistoryOpen && <ActivityHistory activity={activity} movements={movements} onClose={() => setIsHistoryOpen(false)} />}
      {stockProduct && <StockMovementDialog product={stockProduct} onClose={() => setStockProduct(null)} onSubmit={(movement) => handleStockMovement(stockProduct.id, movement)} />}
    </div>
  );
}

export default App;