import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const CHART_COLORS = ['#ff7540', '#ffc36b', '#ff7468', '#6ec8a0', '#78a8ff', '#c08cff'];

const InventoryInsights = ({ products, movements }) => {
  const valuesByCategory = products.reduce((totals, product) => {
    const current = totals.get(product.category) || 0;
    totals.set(product.category, current + product.price * product.quantity);
    return totals;
  }, new Map());
  const categoryData = [...valuesByCategory.entries()]
    .map(([category, value]) => ({ category, value }))
    .filter(item => item.value > 0)
    .sort((first, second) => second.value - first.value);

  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, day: date.toLocaleDateString(undefined, { weekday: 'short' }), net: 0 };
  });
  const dayValues = new Map(recentDays.map(day => [day.key, day]));
  movements.forEach(movement => {
    const dateKey = movement.timestamp?.slice(0, 10);
    const day = dayValues.get(dateKey);
    if (day) day.net += movement.quantityChange;
  });
  const movementData = recentDays.map(({ day, net }) => ({ day, net }));
  const hasRecentMovements = movementData.some(day => day.net !== 0);
  const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

  return (
    <section className="insights-section" aria-labelledby="insights-title">
      <div className="insights-heading">
        <div>
          <p className="eyebrow">INVENTORY_ANALYTICS</p>
          <h2 id="insights-title">Value and movement</h2>
        </div>
        <span className="insights-period">7-DAY MOVEMENT WINDOW</span>
      </div>
      <div className="insights-grid">
        <article className="insight-panel">
          <div className="insight-panel-heading">
            <h3>Value by category</h3>
            <span>Current stock value</span>
          </div>
          {categoryData.length === 0 ? (
            <p className="chart-empty">Inventory value will appear when products have stock.</p>
          ) : (
            <div className="chart-frame" role="img" aria-label="Current inventory value by category">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="category" innerRadius={62} outerRadius={94} paddingAngle={3} stroke="none">
                    {categoryData.map((item, index) => <Cell key={item.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => currency.format(value)} contentStyle={{ background: '#19191b', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6 }} itemStyle={{ color: '#f2eee9' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="category-value-list">
            {categoryData.map((item, index) => (
              <li key={item.category}>
                <span><i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />{item.category}</span>
                <strong>{currency.format(item.value)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="insight-panel">
          <div className="insight-panel-heading">
            <h3>Net stock movement</h3>
            <span>Received, sold, damaged, and adjusted units</span>
          </div>
          {!hasRecentMovements ? (
            <p className="chart-empty">Record stock movements to build a seven-day trend.</p>
          ) : (
            <div className="chart-frame" role="img" aria-label="Net stock movement over the last seven days">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={movementData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#a29a94', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8f8781', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#19191b', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6 }} itemStyle={{ color: '#ff9a68' }} />
                  <Bar dataKey="net" name="Net units" fill="#ff7540" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="chart-footnote">Negative values represent net stock leaving the inventory.</p>
        </article>
      </div>
    </section>
  );
};

export default InventoryInsights;