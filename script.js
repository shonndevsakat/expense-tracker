const form = document.getElementById('transaction-form');
const desc = document.getElementById('desc');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const date = document.getElementById('date');
const category = document.getElementById('category');
const recurring = document.getElementById('recurring');
const transactionsUl = document.getElementById('transactions');
const balanceEl = document.getElementById('balance');
const filterBtns = document.querySelectorAll('.filter-btn');
const budgetInput = document.getElementById('budget');
const setBudgetBtn = document.getElementById('set-budget');
const budgetStatus = document.getElementById('budget-status');
const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filter-category');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';
let budget = parseFloat(localStorage.getItem('budget')) || 0;

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('budget', budget);
}

function formatDate(d) {
  const dateObj = new Date(d);
  return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRupees(num) {
  return '₹' + Number(num).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function renderTransactions() {
  transactionsUl.innerHTML = '';
  let filtered = transactions;
  if (currentFilter !== 'all') {
    filtered = filtered.filter(t => t.type === currentFilter);
  }
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory.value);
  }
  if (searchInput.value.trim() !== '') {
    const q = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(t => t.desc.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)));
  }
  let balance = 0;
  filtered.forEach((t, idx) => {
    balance += t.type === 'income' ? t.amount : -t.amount;
    const li = document.createElement('li');
    li.className = t.type;
    li.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-desc">${t.desc}</span>
        <span class="transaction-date">${formatDate(t.date)}${t.recurring ? ' <span style=\"color:#f72585;font-size:0.9em;\">(Recurring)</span>' : ''}</span>
        <span class="transaction-category" style="font-size:0.95em; color:#888;">${t.category || 'General'}</span>
      </div>
      <span class="transaction-amount">${t.type === 'income' ? '+' : '-'}${formatRupees(Math.abs(t.amount))}</span>
      <button class="delete-btn" onclick="deleteTransaction(${idx})">&times;</button>
    `;
    transactionsUl.appendChild(li);
  });
  // Calculate total balance for all transactions
  let totalBalance = 0, totalExpense = 0;
  transactions.forEach(t => {
    totalBalance += t.type === 'income' ? t.amount : -t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });
  balanceEl.textContent = formatRupees(currentFilter === 'all' ? totalBalance : balance);
  // Budget status
  if (budget > 0) {
    if (totalExpense > budget) {
      budgetStatus.textContent = `Budget Exceeded! (${formatRupees(totalExpense)} / ${formatRupees(budget)})`;
      budgetStatus.style.color = '#e74c3c';
    } else {
      budgetStatus.textContent = `Within Budget (${formatRupees(totalExpense)} / ${formatRupees(budget)})`;
      budgetStatus.style.color = '#2ecc71';
    }
  } else {
    budgetStatus.textContent = '';
  }
}

function deleteTransaction(idx) {
  let filtered = transactions;
  if (currentFilter !== 'all') {
    filtered = filtered.filter(t => t.type === currentFilter);
  }
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory.value);
  }
  if (searchInput.value.trim() !== '') {
    const q = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(t => t.desc.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q)));
  }
  const t = filtered[idx];
  const realIdx = transactions.findIndex(tr => tr.desc === t.desc && tr.amount === t.amount && tr.date === t.date && tr.type === t.type && tr.category === t.category && !!tr.recurring === !!t.recurring);
  transactions.splice(realIdx, 1);
  updateLocalStorage();
  renderTransactions();
}

form.onsubmit = function(e) {
  e.preventDefault();
  const transaction = {
    desc: desc.value.trim(),
    amount: Math.abs(parseFloat(amount.value)),
    type: type.value,
    date: date.value || new Date().toISOString().slice(0,10),
    category: category.value,
    recurring: recurring.checked
  };
  transactions.push(transaction);
  // If recurring, auto-add for next 2 months as example
  if (recurring.checked) {
    let d = new Date(date.value || new Date());
    for (let i = 1; i <= 2; i++) {
      d.setMonth(d.getMonth() + 1);
      transactions.push({ ...transaction, date: d.toISOString().slice(0,10) });
    }
  }
  updateLocalStorage();
  renderTransactions();
  form.reset();
  date.value = '';
};
const themeBtn = document.getElementById('theme-toggle');
  function setTheme(dark) {
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      themeBtn.innerText = '☀️';
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      themeBtn.innerText = '🌙';
    }
  }
  themeBtn.onclick = function() {
    setTheme(!document.body.classList.contains('dark'));
  };

  setTheme(localStorage.getItem('theme') === 'dark');

setBudgetBtn.onclick = function() {
  budget = parseFloat(budgetInput.value) || 0;
  updateLocalStorage();
  renderTransactions();
};

searchInput.oninput = renderTransactions;
filterCategory.onchange = renderTransactions;

filterBtns.forEach(btn => {
  btn.onclick = function() {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTransactions();
  };
});

window.deleteTransaction = deleteTransaction;

renderTransactions();