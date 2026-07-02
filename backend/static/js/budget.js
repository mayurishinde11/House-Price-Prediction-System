/* =====================================================================
   budget.js — EMI calculator + Find home by budget feature.
   ===================================================================== */

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------
// EMI Calculator
// ---------------------------------------------------------------------
function showBudgetError(message) {
  let banner = document.getElementById('budget-error');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'budget-error';
    banner.style.cssText = `
      margin-top: 12px; padding: 12px 14px; border-radius: 8px;
      background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.35);
      color: #fca5a5; font-size: 13.5px;
    `;
    document.getElementById('budget-form').appendChild(banner);
  }
  banner.textContent = message;
  banner.style.display = 'block';
}

function clearBudgetError() {
  const banner = document.getElementById('budget-error');
  if (banner) banner.style.display = 'none';
}

function clearOutputs() {
  document.getElementById('emi-output').textContent = '₹0';
  document.getElementById('loan-amount-output').textContent = '₹0';
  document.getElementById('total-interest-output').textContent = '₹0';
  document.getElementById('total-repayment-output').textContent = '₹0';
}

document.getElementById('budget-form').addEventListener('submit', (e) => {
  e.preventDefault();
  clearBudgetError();

  const price = parseFloat(document.getElementById('price').value) || 0;
  const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
  const annualRate = parseFloat(document.getElementById('rate').value) || 0;
  const years = parseFloat(document.getElementById('years').value) || 1;

  if (price <= 0) {
    showBudgetError('Please enter a valid property price greater than ₹0.');
    clearOutputs();
    return;
  }
  if (downPayment < 0) {
    showBudgetError('Down payment cannot be negative.');
    clearOutputs();
    return;
  }
  if (downPayment >= price) {
    showBudgetError('Down payment cannot be equal to or greater than the property price. You would not need a loan!');
    clearOutputs();
    return;
  }
  if (annualRate <= 0) {
    showBudgetError('Please enter a valid interest rate greater than 0%.');
    clearOutputs();
    return;
  }
  if (annualRate > 30) {
    showBudgetError('Interest rate seems too high. Please enter a realistic rate (e.g. 7–12% for home loans).');
    clearOutputs();
    return;
  }
  if (years < 1 || years > 30) {
    showBudgetError('Loan term must be between 1 and 30 years.');
    clearOutputs();
    return;
  }

  const loanAmount = Math.max(price - downPayment, 0);
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  let emi = 0;
  if (monthlyRate === 0) {
    emi = loanAmount / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (loanAmount * monthlyRate * factor) / (factor - 1);
  }

  const totalRepayment = emi * months;
  const totalInterest = totalRepayment - loanAmount;

  document.getElementById('emi-output').textContent = formatINR(emi);
  document.getElementById('loan-amount-output').textContent = formatINR(loanAmount);
  document.getElementById('total-interest-output').textContent = formatINR(totalInterest);
  document.getElementById('total-repayment-output').textContent = formatINR(totalRepayment);
});

// Trigger EMI calculator on load with default values
document.getElementById('budget-form').dispatchEvent(new Event('submit'));

// ---------------------------------------------------------------------
// Populate state dropdown from /api/locations
// ---------------------------------------------------------------------
async function loadStates() {
  try {
    const res = await fetch('/api/locations');
    const locations = await res.json();
    const stateSelect = document.getElementById('search-state');
    Object.keys(locations).sort().forEach((state) => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      stateSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load states:', err);
  }
}

loadStates();

// ---------------------------------------------------------------------
// Search by budget
// ---------------------------------------------------------------------
async function searchByBudget() {
  const budget = parseFloat(document.getElementById('search-budget').value) || 0;
  const state = document.getElementById('search-state').value;
  const bedrooms = document.getElementById('search-beds').value;
  const propertyType = document.getElementById('search-type').value;
  const resultsDiv = document.getElementById('search-results');
  const btn = document.getElementById('search-btn');

  if (budget <= 0) {
    resultsDiv.innerHTML = `
      <div class="no-results">
        Please enter a valid budget amount.
      </div>`;
    return;
  }

  btn.textContent = 'Searching...';
  btn.disabled = true;
  resultsDiv.innerHTML = '';

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget,
        state: state || null,
        bedrooms: parseInt(bedrooms),
        property_type: propertyType,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      resultsDiv.innerHTML = `<div class="no-results">${data.error || 'Something went wrong.'}</div>`;
      return;
    }

    if (data.length === 0) {
      resultsDiv.innerHTML = `
        <div class="no-results">
          No properties found within ₹${budget.toLocaleString('en-IN')} budget.<br>
          Try increasing your budget or selecting a different state.
        </div>`;
      return;
    }

    resultsDiv.innerHTML = data.map((r, i) => `
      <div class="card result-card">
        <div class="result-location">${r.locality}</div>
        <div class="result-city">${r.city}, ${r.state}</div>
        <div class="result-stats">
          <div>
            <div class="result-stat-label">You can afford</div>
            <div class="result-stat-value">${r.affordable_sqft.toLocaleString('en-IN')} sq ft</div>
          </div>
          <div>
            <div class="result-stat-label">Price per sq ft</div>
            <div class="result-stat-value">${formatINR(r.avg_price_per_sqft)}</div>
          </div>
          <div>
            <div class="result-stat-label">Estimated price</div>
            <div class="result-stat-value">${formatINR(r.estimated_price)}</div>
          </div>
          <div>
            <div class="result-stat-label">Within budget</div>
            <div class="result-stat-value" style="color: var(--accent-teal);">✓ Yes</div>
          </div>
        </div>
        ${i === 0 ? '<div class="value-badge">🏆 Best value</div>' : ''}
        ${i === 1 ? '<div class="value-badge">⭐ Runner up</div>' : ''}
      </div>
    `).join('');

  } catch (err) {
    resultsDiv.innerHTML = `<div class="no-results">Couldn't reach the server. Check your connection.</div>`;
  } finally {
    btn.textContent = 'Find homes';
    btn.disabled = false;
  }
}