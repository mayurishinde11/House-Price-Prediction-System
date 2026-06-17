/* =====================================================================
   budget.js — simple client-side EMI calculator for the Budget page.
   ===================================================================== */

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

document.getElementById('budget-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const price = parseFloat(document.getElementById('price').value) || 0;
  const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
  const annualRate = parseFloat(document.getElementById('rate').value) || 0;
  const years = parseFloat(document.getElementById('years').value) || 1;

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