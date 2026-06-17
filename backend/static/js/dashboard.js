/* =====================================================================
   dashboard.js — fetches /api/metrics and renders model performance.
   ===================================================================== */

async function loadMetrics() {
  try {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    const best = data.results[data.best_model];

    const grid = document.getElementById('stat-grid');
    grid.innerHTML = `
      <div class="card stat-card">
        <div class="stat-label">Best model</div>
        <div class="stat-value">${data.best_model}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">R² score</div>
        <div class="stat-value">${best.R2}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Mean absolute error</div>
        <div class="stat-value">₹${Math.round(best.MAE).toLocaleString('en-IN')}</div>
      </div>
    `;
  } catch (err) {
    // leave placeholders if metrics can't be loaded
  }
}

loadMetrics();