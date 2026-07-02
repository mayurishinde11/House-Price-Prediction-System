/* =====================================================================
   predict.js — drives the State -> City -> Locality cascade and the
   /api/predict call on the Price Predictor page.
   ===================================================================== */

let LOCATIONS = {};

const stateSelect = document.getElementById('state-select');
const citySelect = document.getElementById('city-select');
const localitySelect = document.getElementById('locality-select');
const form = document.getElementById('predict-form');
const submitBtn = document.getElementById('submit-btn');
const showcase = document.getElementById('showcase-content');
const errorBanner = document.getElementById('error-banner');

function setSelectOptions(select, items, placeholder) {
  select.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = placeholder;
  opt0.disabled = true;
  opt0.selected = true;
  select.appendChild(opt0);

  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

async function loadLocations() {
  try {
    const res = await fetch('/api/locations');
    LOCATIONS = await res.json();

    const states = Object.keys(LOCATIONS).sort();
    setSelectOptions(stateSelect, states, 'Select state...');
    stateSelect.disabled = false;

    citySelect.disabled = true;
    localitySelect.disabled = true;
  } catch (err) {
    showError("Couldn't load locations. Check your connection and refresh.");
  }
}

stateSelect.addEventListener('change', () => {
  const state = stateSelect.value;
  const cities = state ? Object.keys(LOCATIONS[state] || {}).sort() : [];
  setSelectOptions(citySelect, cities, 'Select city...');
  citySelect.disabled = cities.length === 0;
  setSelectOptions(localitySelect, [], 'Select locality...');
  localitySelect.disabled = true;
});

citySelect.addEventListener('change', () => {
  const state = stateSelect.value;
  const city = citySelect.value;
  const localities = (state && city) ? [...(LOCATIONS[state][city] || [])].sort() : [];
  setSelectOptions(localitySelect, localities, 'Select locality...');
  localitySelect.disabled = localities.length === 0;
});

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.style.display = 'block';
}

function clearError() {
  errorBanner.style.display = 'none';
  errorBanner.textContent = '';
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function renderResult(data) {
  const { predicted_price, price_range, price_per_sqft, input } = data;

  const rangeSpan = price_range.high - price_range.low;
  const fillPct = rangeSpan > 0
    ? Math.min(100, Math.max(0, ((predicted_price - price_range.low) / rangeSpan) * 100))
    : 50;

  // Build property summary tags
  const bhk = `${input.bedrooms} BHK`;
  const area = `${input.area_sqft.toLocaleString('en-IN')} sq ft`;
  const type = input.property_type;
  const furnishing = input.furnishing;
  const age = input.property_age_years === 0
    ? 'New property'
    : `${input.property_age_years} yr old`;

  // Build trend badge
  let trendHTML = '';
  if (data.trend) {
    const colors = {
      positive: 'rgba(45,212,168,0.15)',
      neutral: 'rgba(99,102,241,0.15)',
      warning: 'rgba(251,191,36,0.15)',
    };
    const borderColors = {
      positive: 'rgba(45,212,168,0.4)',
      neutral: 'rgba(99,102,241,0.4)',
      warning: 'rgba(251,191,36,0.4)',
    };
    const textColors = {
      positive: '#2dd4a8',
      neutral: '#818cf8',
      warning: '#fbbf24',
    };
    const t = data.trend;
    trendHTML = `
      <div class="trend-badge" style="
        background: ${colors[t.type]};
        border: 1px solid ${borderColors[t.type]};
        color: ${textColors[t.type]};
      ">
        <span class="trend-label">${t.label}</span>
        <span class="trend-hint">${t.hint}</span>
      </div>
    `;
  }

  showcase.innerHTML = `
    <div class="result-wrap">
      <div class="result-summary">
        <span class="summary-tag">${bhk}</span>
        <span class="summary-tag">${type}</span>
        <span class="summary-tag">${area}</span>
        <span class="summary-tag">${furnishing}</span>
        <span class="summary-tag">${age}</span>
        <span class="summary-tag">${input.locality}, ${input.city}</span>
      </div>

      <div class="result-label" style="margin-top: 18px;">Estimated value</div>
      <div class="result-price">${formatINR(predicted_price)}</div>

      ${trendHTML}

      <div class="result-range-bar">
        <div class="result-range-fill" style="width: ${fillPct}%"></div>
      </div>

      <div class="result-meta">
        <div class="result-meta-item">Likely range
          <strong>${formatINR(price_range.low)} – ${formatINR(price_range.high)}</strong>
        </div>
        <div class="result-meta-item">Price / sq ft
          <strong>${formatINR(price_per_sqft)}</strong>
        </div>
        <div class="result-meta-item">State
          <strong>${input.state}</strong>
        </div>
      </div>

      <a href="/budget?price=${predicted_price}"
         class="btn btn-primary"
         style="margin-top: 20px; text-decoration: none;">
        Plan budget for this property →
      </a>
    </div>
  `;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.innerHTML = isLoading
    ? '<span class="spinner"></span> Predicting...'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg> Predict price';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const payload = {
    state: stateSelect.value,
    city: citySelect.value,
    locality: localitySelect.value,
    area_sqft: document.getElementById('area-input').value,
    bedrooms: document.getElementById('beds-input').value,
    bathrooms: document.getElementById('baths-input').value,
    parking: document.getElementById('parking-input').value,
    property_type: document.getElementById('type-select').value,
    furnishing: document.getElementById('furnishing-select').value,
    property_age_years: document.getElementById('age-input').value,
  };

  const invalidFields = [];
  if (!payload.state) invalidFields.push(stateSelect);
  if (!payload.city) invalidFields.push(citySelect);
  if (!payload.locality) invalidFields.push(localitySelect);

  document.querySelectorAll('.field-invalid').forEach((el) => el.classList.remove('field-invalid'));

  if (invalidFields.length > 0) {
    invalidFields.forEach((el) => el.classList.add('field-invalid'));
    showError('Pick a state, city, and locality first.');
    invalidFields[0].focus();
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Something went wrong. Try again.');
      return;
    }
    renderResult(data);
  } catch (err) {
    showError("Couldn't reach the prediction service. Check your connection.");
  } finally {
    setLoading(false);
  }
});

loadLocations();
