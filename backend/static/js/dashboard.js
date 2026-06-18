/* =====================================================================
   dashboard.js — fetches /api/metrics and renders model performance
   in plain, friendly language.
   ===================================================================== */

function describeR2(r2) {
  const pct = Math.round(r2 * 100);
  let verdict;
  if (r2 >= 0.9) verdict = "Excellent — the model captures almost all of the price pattern.";
  else if (r2 >= 0.75) verdict = "Good — the model captures most of the price pattern.";
  else if (r2 >= 0.5) verdict = "Fair — there's room to improve.";
  else verdict = "Weak — predictions should be used with caution.";
  return { pct, verdict };
}

async function loadMetrics() {
  try {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    const best = data.results[data.best_model];
    const { pct, verdict } = describeR2(best.R2);

    const grid = document.getElementById('stat-grid');
    grid.innerHTML = `
      <div class="card stat-card">
        <div class="stat-label">Best model</div>
        <div class="stat-value">${data.best_model}</div>
        <div class="stat-explainer">The algorithm that gave the most accurate predictions, out of 3 tested.</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Accuracy</div>
        <div class="stat-value">${pct}%</div>
        <div class="stat-explainer">${verdict}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Typical margin of error</div>
        <div class="stat-value">\u20B9${(best.MAE / 100000).toFixed(1)} lakh</div>
        <div class="stat-explainer">On average, a prediction is off by about this much &mdash; in either direction.</div>
      </div>
    `;
  } catch (err) {
    // leave placeholders if metrics can't be loaded
  }
}

loadMetrics();