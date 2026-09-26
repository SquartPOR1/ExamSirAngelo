import React, { useState } from 'react';

const FilterBar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  locations,
  selectedLocation,
  onLocationChange,
  statuses,
  selectedStatus,
  onStatusChange,
  sortOptions,
  selectedSort,
  onSortChange
}) => {
  return (
    <div className="filter-bar-container">
      <div className="filter-group">
        <label htmlFor="category-filter">Category:</label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="location-filter">Location:</label>
        <select
          id="location-filter"
          value={selectedLocation}
          onChange={(e) => onLocationChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All locations</option>
          {locations.map(location => <option key={location} value={location}>{location}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Status:</label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="filter-select"
        >
          {statuses.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort-filter">Sort:</label>
        <select
          id="sort-filter"
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="filter-select"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;