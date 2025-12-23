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
const downloadPartyPdfBtn = document.getElementById('download-party-pdf-btn');

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
        const tDate = new Date(t.date);
        return t.category === category &&
               tDate.getMonth() + 1 === month &&
               tDate.getFullYear() === year;
    });

    const head = [['Date', 'Name', 'Type', 'Total Due', 'Paid', 'Present Due']];
    const body = filtered.map(t => {
        const tDate = new Date(t.date);
        const presentDue = t.due - t.paid;
        return [
            tDate.toLocaleDateString(),
            t.name,
            t.type,
            `৳${t.due.toFixed(2)}`,
            `৳${t.paid.toFixed(2)}`,
            `৳${presentDue.toFixed(2)}`
        ];
    });

    let totalDue = filtered.reduce((sum, t) => sum + t.due, 0);
    let totalPaid = filtered.reduce((sum, t) => sum + t.paid, 0);
    let totalPresentDue = totalDue - totalPaid;

    body.push([
        { content: 'Total', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `৳${totalDue.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `৳${totalPaid.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `৳${totalPresentDue.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);

    doc.autoTable({
        head: head,
        body: body,
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [0, 137, 123] }, // Teal header
        didDrawPage: function (data) {
            // Footer
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
downloadPartyPdfBtn.addEventListener('click', downloadPartyPDF);


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
        due: parseFloat(document.getElementById('party-due').value) || 0,
        paid: parseFloat(document.getElementById('party-paid').value) || 0,
        type: document.getElementById('party-transaction-type').value,
        date: document.getElementById('party-transaction-date').value || new Date().toISOString().split('T')[0]
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
