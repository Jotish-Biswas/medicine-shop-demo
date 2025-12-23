// Party (Debtor/Creditor) Management
let partyTransactions = JSON.parse(localStorage.getItem('partyTransactions')) || [];

function savePartyTransactions() {
    localStorage.setItem('partyTransactions', JSON.stringify(partyTransactions));
}

const debtorBtn = document.getElementById('debtor-btn');
const creditorBtn = document.getElementById('creditor-btn');
const partyModal = document.getElementById('party-modal');
const partyModalTitle = document.getElementById('party-modal-title');
const partyListBody = document.getElementById('party-list-body');
const closePartyModalBtn = document.getElementById('close-party-modal-btn');
const addPartyTransactionBtn = document.getElementById('add-party-transaction-btn');

const addPartyTransactionModal = document.getElementById('add-party-transaction-modal');
const addPartyTransactionForm = document.getElementById('add-party-transaction-form');
const cancelAddPartyTransactionBtn = document.getElementById('cancel-add-party-transaction-btn');
const partyCategoryInput = document.getElementById('party-category');

const partyMonthDropdown = document.getElementById('party-month-dropdown');
const partyYearDropdown = document.getElementById('party-year-dropdown');

function populatePartyYearDropdown() {
    partyYearDropdown.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let y = 2020; y <= currentYear + 5; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        partyYearDropdown.appendChild(option);
    }
}

function openPartyModal(category) {
    partyModalTitle.textContent = category === 'debtor' ? 'Debtors' : 'Creditors';
    partyCategoryInput.value = category;

    // Set current month and year
    const now = new Date();
    partyMonthDropdown.value = now.getMonth() + 1;
    populatePartyYearDropdown();
    partyYearDropdown.value = now.getFullYear();

    renderPartyTransactions(category);
    partyModal.classList.add('show');
}

function renderPartyTransactions(category) {
    partyListBody.innerHTML = '';
    
    const month = parseInt(partyMonthDropdown.value);
    const year = parseInt(partyYearDropdown.value);

    const filtered = partyTransactions.filter(t => {
        const tDate = new Date(t.date);
        return t.category === category &&
               tDate.getMonth() + 1 === month &&
               tDate.getFullYear() === year;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        partyListBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No transactions found for this period.</div>';
        return;
    }

    filtered.forEach(t => {
        const item = document.createElement('div');
        item.className = 'party-item';
        const tDate = new Date(t.date);
        const presentDue = t.due - t.paid;
        item.innerHTML = `
            <span>${t.name}</span>
            <span>৳${t.due.toFixed(2)}</span>
            <span>৳${t.paid.toFixed(2)}</span>
            <span style="font-weight: bold;">৳${presentDue.toFixed(2)}</span>
            <span>${t.type}</span>
            <span>${tDate.toLocaleDateString()}</span>
        `;
        partyListBody.appendChild(item);
    });
}

debtorBtn.addEventListener('click', () => openPartyModal('debtor'));
creditorBtn.addEventListener('click', () => openPartyModal('creditor'));
closePartyModalBtn.addEventListener('click', () => partyModal.classList.remove('show'));

partyMonthDropdown.addEventListener('change', () => renderPartyTransactions(partyCategoryInput.value));
partyYearDropdown.addEventListener('change', () => renderPartyTransactions(partyCategoryInput.value));


addPartyTransactionBtn.addEventListener('click', () => {
    addPartyTransactionForm.reset();
    addPartyTransactionModal.classList.add('show');
});

cancelAddPartyTransactionBtn.addEventListener('click', () => {
    addPartyTransactionModal.classList.remove('show');
});

addPartyTransactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTransaction = {
        id: Date.now(),
        category: partyCategoryInput.value,
        name: document.getElementById('party-name').value,
        due: parseFloat(document.getElementById('party-due').value),
        paid: parseFloat(document.getElementById('party-paid').value),
        type: document.getElementById('party-type').value,
        date: new Date().toISOString()
    };

    partyTransactions.push(newTransaction);
    savePartyTransactions();
    renderPartyTransactions(newTransaction.category);
    addPartyTransactionModal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === partyModal) partyModal.classList.remove('show');
    if (e.target === addPartyTransactionModal) addPartyTransactionModal.classList.remove('show');
});
