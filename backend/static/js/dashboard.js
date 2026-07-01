/* =====================================================================
   dashboard.js — fetches /api/metrics and renders model performance
   plus a feature importance bar chart.
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

function renderImportanceChart(features) {
  const chart = document.getElementById('importance-chart');
  if (!features || features.length === 0) {
    chart.innerHTML = '<div style="color: var(--text-muted); font-size: 13.5px;">No feature data available.</div>';
    return;
  }

  // Friendly display names
  const labels = {
    locality: "Locality",
    city: "City",
    state: "State",
    area: "Area (sq ft)",
    property: "Property type",
    furnishing: "Furnishing",
    floor: "Floor number",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    parking: "Parking",
    property_age: "Property age",
    total: "Total floors",
  };

  const max = features[0].importance;

  chart.innerHTML = features.map(({ feature, importance }) => {
    const pct = Math.round((importance / max) * 100);
    const displayName = labels[feature] || feature;
    const impPct = (importance * 100).toFixed(1);
    return `
      <div class="bar-row">
        <div class="bar-label">${displayName}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="bar-pct">${impPct}%</div>
      </div>
    `;
  }).join('');
}

async function loadMetrics() {
  try {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    const best = data.results[data.best_model];
    const { pct, verdict } = describeR2(best.R2);

    // Render stat cards
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
        <div class="stat-value">&#8377;${(best.MAE / 100000).toFixed(1)} lakh</div>
        <div class="stat-explainer">On average, a prediction is off by about this much — in either direction.</div>
      </div>
    `;

    // Render feature importance chart
    renderImportanceChart(data.feature_importance || []);

  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
}

loadMetrics();

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const history = await res.json();

    const section = document.getElementById('history-section');
    const list = document.getElementById('history-list');

    if (!history || history.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = history.map(h => `
      <div style="display:flex; justify-content:space-between; align-items:center;
                  padding: 14px 0; border-bottom: 1px solid var(--card-border);">
        <div>
          <div style="font-size:14px; font-weight:600; margin-bottom:4px;">
            ${h.bedrooms} BHK ${h.property_type} · ${h.locality}, ${h.city}
          </div>
          <div style="font-size:12.5px; color:var(--text-muted);">
            ${h.area_sqft} sq ft · ₹${h.price_per_sqft}/sq ft
            ${h.trend_label ? `· <span style="color:var(--accent-teal)">${h.trend_label}</span>` : ''}
          </div>
        </div>
        <div style="font-family:var(--font-display); font-size:18px; font-weight:600;
                    color:var(--text-primary); text-align:right;">
          ${formatINR(h.predicted_price)}
        </div>
      </div>
    `).join('');

    // Remove border from last item
    const items = list.querySelectorAll('div[style*="border-bottom"]');
    if (items.length > 0) {
      items[items.length - 1].style.borderBottom = 'none';
    }

  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

loadHistory();