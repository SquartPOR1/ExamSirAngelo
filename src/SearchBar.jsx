import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange }) => {
  const handleChange = (e) => {
    const term = e.target.value;
    onSearchChange(term);
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Search products by name or category..."
        aria-label="Search products by name or category"
        aria-keyshortcuts="/"
        id="inventory-search"
        value={searchTerm}
        onChange={handleChange}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;