/* =====================================================================
   budget.js — EMI calculator with input validation.
   ===================================================================== */

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

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

  // Validation checks
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

// Trigger once on load with default values
document.getElementById('budget-form').dispatchEvent(new Event('submit'));