// Party (Debtor/Creditor) Management with Payment History
let partyTransactions = JSON.parse(localStorage.getItem('partyTransactions')) || [];

// Migration: Convert old format to new format if needed
partyTransactions = partyTransactions.map(t => {
    if (!t.payments) {
        // Old format - convert to new
        const payments = [];
        if (t.paid > 0) {
            payments.push({
                id: Date.now(),
                amount: t.paid,
                type: t.type || 'Cash',
                date: t.date
            });
        }
        return {
            id: t.id,
            category: t.category,
            name: t.name,
            due: t.due,
            createdDate: t.date,
            payments: payments
        };
    }
    return t;
});
savePartyTransactions();

function savePartyTransactions() {
    localStorage.setItem('partyTransactions', JSON.stringify(partyTransactions));
}

// Get total paid for a party
function getTotalPaid(party) {
    return party.payments.reduce((sum, p) => sum + p.amount, 0);
}

// DOM Elements
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
const downloadPartyPdfBtn = document.getElementById('download-party-pdf-btn');

// Payment Modal Elements
const addPaymentModal = document.getElementById('add-payment-modal');
const addPaymentForm = document.getElementById('add-payment-form');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');

// History Modal Elements
const paymentHistoryModal = document.getElementById('payment-history-modal');
const closeHistoryBtn = document.getElementById('close-history-btn');

function downloadPartyPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const category = partyCategoryInput.value;
    const month = parseInt(partyMonthDropdown.value);
    const year = parseInt(partyYearDropdown.value);
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

    const title = `${category === 'debtor' ? 'Debtor' : 'Creditor'} List - ${monthName} ${year}`;
    doc.text(title, 14, 16);

    const filtered = partyTransactions.filter(t => {
        const tDate = new Date(t.createdDate);
        return t.category === category &&
               tDate.getMonth() + 1 === month &&
               tDate.getFullYear() === year;
    });

    const head = [['Name', 'Total Due', 'Paid', 'Present Due', 'Created Date']];
    const body = filtered.map(t => {
        const tDate = new Date(t.createdDate);
        const totalPaid = getTotalPaid(t);
        const presentDue = t.due - totalPaid;
        return [
            t.name,
            `৳${t.due.toFixed(2)}`,
            `৳${totalPaid.toFixed(2)}`,
            `৳${presentDue.toFixed(2)}`,
            tDate.toLocaleDateString()
        ];
    });

    let totalDue = filtered.reduce((sum, t) => sum + t.due, 0);
    let totalPaid = filtered.reduce((sum, t) => sum + getTotalPaid(t), 0);
    let totalPresentDue = totalDue - totalPaid;

    body.push([
        { content: 'Total', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `৳${totalDue.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `৳${totalPaid.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `৳${totalPresentDue.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        ''
    ]);

    doc.autoTable({
        head: head,
        body: body,
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [0, 137, 123] },
        didDrawPage: function (data) {
            doc.setFontSize(10);
            doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 10);
            doc.text(new Date().toLocaleDateString(), doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
        }
    });

    doc.save(`${category}_report_${year}_${month}.pdf`);
}

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
        const tDate = new Date(t.createdDate);
        return t.category === category &&
               tDate.getMonth() + 1 === month &&
               tDate.getFullYear() === year;
    });

    filtered.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

    if (filtered.length === 0) {
        partyListBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No parties found for this period.</div>';
        return;
    }

    filtered.forEach(t => {
        const item = document.createElement('div');
        item.className = 'party-item';
        const tDate = new Date(t.createdDate);
        const totalPaid = getTotalPaid(t);
        const presentDue = t.due - totalPaid;
        const isPaid = presentDue <= 0;
        
        item.innerHTML = `
            <span>${t.name} ${isPaid ? '<span class="paid-tick">✓</span>' : ''}</span>
            <span>৳${t.due.toFixed(2)}</span>
            <span>৳${totalPaid.toFixed(2)}</span>
            <span class="present-due ${presentDue > 0 ? 'due-pending' : 'due-paid'}">৳${presentDue.toFixed(2)}</span>
            <span>${tDate.toLocaleDateString()}</span>
            <span class="party-actions">
                ${presentDue > 0 ? `<button class="action-btn pay-btn add-payment-btn" data-id="${t.id}" data-i18n="btn_pay">Pay</button>` : ''}
                <button class="action-btn history-btn view-history-btn" data-id="${t.id}" data-i18n="btn_history">History</button>
            </span>
        `;
        partyListBody.appendChild(item);
    });

    // Add event listeners
    document.querySelectorAll('.add-payment-btn').forEach(btn => {
        btn.addEventListener('click', () => openPaymentModal(btn.dataset.id));
    });
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => openHistoryModal(btn.dataset.id));
    });
}

// Open Add Payment Modal
function openPaymentModal(partyId) {
    const party = partyTransactions.find(t => t.id == partyId);
    if (!party) return;

    const totalPaid = getTotalPaid(party);
    const presentDue = party.due - totalPaid;

    document.getElementById('payment-party-name').textContent = party.name;
    document.getElementById('payment-present-due').value = `৳${presentDue.toFixed(2)}`;
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-amount').max = presentDue;
    document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('payment-type').value = 'Cash';
    document.getElementById('payment-bill-number').value = '';
    document.getElementById('payment-party-id').value = partyId;

    addPaymentModal.classList.add('show');
}

// Open Payment History Modal
function openHistoryModal(partyId) {
    const party = partyTransactions.find(t => t.id == partyId);
    if (!party) return;

    const totalPaid = getTotalPaid(party);
    const presentDue = party.due - totalPaid;

    document.getElementById('history-party-name').textContent = party.name;
    document.getElementById('history-total-due').textContent = `৳${party.due.toFixed(2)}`;
    document.getElementById('history-total-paid').textContent = `৳${totalPaid.toFixed(2)}`;
    document.getElementById('history-present-due').textContent = `৳${presentDue.toFixed(2)}`;
    document.getElementById('history-present-due').className = presentDue > 0 ? 'due-pending' : 'due-paid';

    const historyBody = document.getElementById('payment-history-body');
    historyBody.innerHTML = '';

    if (party.payments.length === 0) {
        historyBody.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No payments yet.</div>';
    } else {
        // Sort by date descending
        const sortedPayments = [...party.payments].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedPayments.forEach(p => {
            const item = document.createElement('div');
            item.className = 'party-item';
            item.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
            const pDate = new Date(p.date);
            item.innerHTML = `
                <span>${pDate.toLocaleDateString()}</span>
                <span class="payment-amount">৳${p.amount.toFixed(2)}</span>
                <span>${p.type}</span>
                <span>${p.billNumber || '-'}</span>
            `;
            historyBody.appendChild(item);
        });
    }

    paymentHistoryModal.classList.add('show');
}

// Delete a payment
function deletePayment(partyId, paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    const party = partyTransactions.find(t => t.id == partyId);
    if (party) {
        party.payments = party.payments.filter(p => p.id != paymentId);
        savePartyTransactions();
        openHistoryModal(partyId); // Refresh history
        renderPartyTransactions(partyCategoryInput.value); // Refresh main list
    }
}

// Delete a party
function deleteParty(partyId) {
    if (!confirm('Are you sure you want to delete this party and all its payment history?')) return;

    partyTransactions = partyTransactions.filter(t => t.id != partyId);
    savePartyTransactions();
    renderPartyTransactions(partyCategoryInput.value);
}

// Event Listeners
debtorBtn.addEventListener('click', () => openPartyModal('debtor'));
creditorBtn.addEventListener('click', () => openPartyModal('creditor'));
closePartyModalBtn.addEventListener('click', () => partyModal.classList.remove('show'));

partyMonthDropdown.addEventListener('change', () => renderPartyTransactions(partyCategoryInput.value));
partyYearDropdown.addEventListener('change', () => renderPartyTransactions(partyCategoryInput.value));
downloadPartyPdfBtn.addEventListener('click', downloadPartyPDF);

// Add New Party
addPartyTransactionBtn.addEventListener('click', () => {
    addPartyTransactionForm.reset();
    document.getElementById('party-transaction-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('party-edit-id').value = '';
    document.getElementById('add-party-modal-title').textContent = 'Add New Party';
    addPartyTransactionModal.classList.add('show');
});

cancelAddPartyTransactionBtn.addEventListener('click', () => {
    addPartyTransactionModal.classList.remove('show');
});

addPartyTransactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newParty = {
        id: Date.now(),
        category: partyCategoryInput.value,
        name: document.getElementById('party-name').value,
        due: parseFloat(document.getElementById('party-due').value) || 0,
        createdDate: document.getElementById('party-transaction-date').value || new Date().toISOString().split('T')[0],
        payments: []
    };

    partyTransactions.push(newParty);
    savePartyTransactions();
    renderPartyTransactions(newParty.category);
    addPartyTransactionModal.classList.remove('show');
});

// Add Payment Form
cancelPaymentBtn.addEventListener('click', () => {
    addPaymentModal.classList.remove('show');
});

addPaymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const partyId = document.getElementById('payment-party-id').value;
    const party = partyTransactions.find(t => t.id == partyId);
    
    if (party) {
        const payment = {
            id: Date.now(),
            amount: parseFloat(document.getElementById('payment-amount').value) || 0,
            type: document.getElementById('payment-type').value,
            date: document.getElementById('payment-date').value,
            billNumber: document.getElementById('payment-bill-number').value || ''
        };
        
        party.payments.push(payment);
        savePartyTransactions();
        renderPartyTransactions(partyCategoryInput.value);
        addPaymentModal.classList.remove('show');
    }
});

// Close History Modal
closeHistoryBtn.addEventListener('click', () => {
    paymentHistoryModal.classList.remove('show');
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === partyModal) partyModal.classList.remove('show');
    if (e.target === addPartyTransactionModal) addPartyTransactionModal.classList.remove('show');
    if (e.target === addPaymentModal) addPaymentModal.classList.remove('show');
    if (e.target === paymentHistoryModal) paymentHistoryModal.classList.remove('show');
});
