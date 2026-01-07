// Party (Debtor/Creditor) Management with Supabase Integration
let partyTransactions = [];
let lastSearchTerm = ''; // Track search term for filtering

// Load parties from Supabase
async function loadPartiesFromDb() {
    try {
        const { data, error } = await supabaseClient
            .from('parties')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get payments for each party
        for (let party of data) {
            const { data: payments } = await supabaseClient
                .from('party_payments')
                .select('*')
                .eq('party_id', party.id)
                .order('date', { ascending: false });

            party.payments = payments || [];
        }

        // Convert to local format
        partyTransactions = data.map(p => ({
            id: p.id,
            category: p.type,
            name: p.name,
            due: p.total_due,
            createdDate: p.created_at,
            payments: p.payments.map(pay => ({
                id: pay.id,
                amount: pay.amount,
                type: pay.payment_type || 'Cash',
                date: pay.date,
                billNumber: pay.bill_number || ''
            }))
        }));

        console.log('✅ Parties loaded from Supabase:', partyTransactions.length);
        return partyTransactions;
    } catch (err) {
        console.error('Failed to load parties:', err);
        // Fallback to localStorage
        partyTransactions = JSON.parse(localStorage.getItem('partyTransactions')) || [];
        return partyTransactions;
    }
}

// Save party to Supabase
async function savePartyToDb(party) {
    try {
        const { data, error } = await supabaseClient
            .from('parties')
            .insert({
                name: party.name,
                type: party.category,
                total_due: party.due,
                created_at: party.createdDate
            })
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Party saved to Supabase:', data.id);
        return { success: true, data };
    } catch (err) {
        console.error('Failed to save party:', err);
        return { success: false, error: err.message };
    }
}

// Add payment to Supabase
async function savePaymentToDb(partyId, payment) {
    try {
        const { data, error } = await supabaseClient
            .from('party_payments')
            .insert({
                party_id: partyId,
                amount: payment.amount,
                payment_type: payment.type,
                date: payment.date,
                bill_number: payment.billNumber || null
            })
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Payment saved to Supabase:', data.id);
        return { success: true, data };
    } catch (err) {
        console.error('Failed to save payment:', err);
        return { success: false, error: err.message };
    }
}

// Delete party from Supabase
async function deletePartyFromDb(partyId) {
    try {
        // First delete all payments
        await supabaseClient
            .from('party_payments')
            .delete()
            .eq('party_id', partyId);

        // Then delete party
        const { error } = await supabaseClient
            .from('parties')
            .delete()
            .eq('id', partyId);

        if (error) throw error;
        console.log('✅ Party deleted from Supabase:', partyId);
        return { success: true };
    } catch (err) {
        console.error('Failed to delete party:', err);
        return { success: false, error: err.message };
    }
}

// Delete payment from Supabase
async function deletePaymentFromDb(paymentId) {
    try {
        const { error } = await supabaseClient
            .from('party_payments')
            .delete()
            .eq('id', paymentId);

        if (error) throw error;
        console.log('✅ Payment deleted from Supabase:', paymentId);
        return { success: true };
    } catch (err) {
        console.error('Failed to delete payment:', err);
        return { success: false, error: err.message };
    }
}

// Local save for backup
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
    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("PDF library not loaded. Please refresh the page.");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const category = partyCategoryInput.value;
        const month = parseInt(partyMonthDropdown.value);
        const year = parseInt(partyYearDropdown.value);
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

        const categoryName = category === 'debtor' ? 'Debtor' : 'Creditor';
        const title = `${categoryName} Report - ${monthName} ${year}`;
        
        doc.setFontSize(18);
        doc.text(title, 14, 16);

        const filtered = partyTransactions.filter(t => {
            const tDate = new Date(t.createdDate);
            return t.category === category &&
                   tDate.getMonth() + 1 === month &&
                   tDate.getFullYear() === year;
        });

        if (filtered.length === 0) {
            alert("No data found for the selected period.");
            return;
        }

        let yPos = 30;
        let grandTotalDue = 0;
        let grandTotalPaid = 0;

        // Loop through each party and show their transactions
        filtered.forEach((party, index) => {
            const totalPaid = getTotalPaid(party);
            const presentDue = party.due - totalPaid;
            
            grandTotalDue += party.due;
            grandTotalPaid += totalPaid;

            // Check if need new page
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            // Party Name Header
            doc.setFillColor(0, 137, 123);
            doc.rect(14, yPos - 5, 182, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`${index + 1}. ${party.name}`, 16, yPos + 2);
            doc.text(`Total Due: Tk ${party.due.toFixed(2)}`, 120, yPos + 2);
            
            yPos += 12;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);

            // Created Date
            const createdDate = new Date(party.createdDate).toLocaleDateString();
            doc.text(`Created: ${createdDate}`, 16, yPos);
            doc.text(`Present Due: Tk ${presentDue.toFixed(2)}`, 120, yPos);
            yPos += 8;

            // Payment History Header
            if (party.payments && party.payments.length > 0) {
                doc.setFillColor(240, 240, 240);
                doc.rect(14, yPos - 3, 182, 7, 'F');
                doc.setFont(undefined, 'bold');
                doc.text('Date', 16, yPos + 2);
                doc.text('Amount', 60, yPos + 2);
                doc.text('Type', 100, yPos + 2);
                doc.text('Bill No.', 140, yPos + 2);
                yPos += 10;
                doc.setFont(undefined, 'normal');

                // Payment rows
                party.payments.forEach(payment => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    const payDate = new Date(payment.date).toLocaleDateString();
                    doc.text(payDate, 16, yPos);
                    doc.text(`Tk ${payment.amount.toFixed(2)}`, 60, yPos);
                    doc.text(payment.type || 'Cash', 100, yPos);
                    doc.text(payment.billNumber || '-', 140, yPos);
                    yPos += 7;
                });

                // Subtotal for this party
                doc.setFont(undefined, 'bold');
                doc.text(`Total Paid: Tk ${totalPaid.toFixed(2)}`, 60, yPos);
                yPos += 5;
            } else {
                doc.setTextColor(150, 150, 150);
                doc.text('No payments recorded', 16, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 5;
            }

            // Separator line
            doc.setDrawColor(200, 200, 200);
            doc.line(14, yPos, 196, yPos);
            yPos += 10;
        });

        // Grand Total at the end
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFillColor(0, 100, 80);
        doc.rect(14, yPos - 3, 182, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('GRAND TOTAL', 16, yPos + 5);
        doc.text(`Due: Tk ${grandTotalDue.toFixed(2)}`, 70, yPos + 5);
        doc.text(`Paid: Tk ${grandTotalPaid.toFixed(2)}`, 120, yPos + 5);
        doc.text(`Balance: Tk ${(grandTotalDue - grandTotalPaid).toFixed(2)}`, 160, yPos + 5);

        // Save with proper filename
        const fileName = `${categoryName}_${monthName}_${year}.pdf`;
        doc.save(fileName);
        console.log('PDF saved:', fileName);
        console.log('✅ Party PDF downloaded successfully');
    } catch (err) {
        console.error('Party PDF error:', err);
        alert('Failed to generate PDF: ' + err.message);
    }
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

async function openPartyModal(category) {
    partyModalTitle.textContent = category === 'debtor' ? 'Debtors' : 'Creditors';
    partyCategoryInput.value = category;
    
    // Clear search input when opening modal
    lastSearchTerm = '';
    if (partySearchInput) {
        partySearchInput.value = '';
    }

    const now = new Date();
    partyMonthDropdown.value = now.getMonth() + 1;
    populatePartyYearDropdown();
    partyYearDropdown.value = now.getFullYear();

    // Load fresh data from database
    await loadPartiesFromDb();
    
    renderPartyTransactions(category);
    partyModal.classList.add('show');
}

function renderPartyTransactions(category) {
    partyListBody.innerHTML = '';
    
    const month = parseInt(partyMonthDropdown.value);
    const year = parseInt(partyYearDropdown.value);

    const filtered = partyTransactions.filter(t => {
        const tDate = new Date(t.createdDate);
        const matchesDate = t.category === category &&
               tDate.getMonth() + 1 === month &&
               tDate.getFullYear() === year;
        
        // Add search filter
        const matchesSearch = t.name.toLowerCase().includes(lastSearchTerm.toLowerCase());
        
        return matchesDate && matchesSearch;
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
                <button class="action-btn delete-btn delete-party-btn" data-id="${t.id}" title="Delete">🗑️</button>
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
    document.querySelectorAll('.delete-party-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteParty(btn.dataset.id));
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
            item.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 0.5fr';
            const pDate = new Date(p.date);
            item.innerHTML = `
                <span>${pDate.toLocaleDateString()}</span>
                <span class="payment-amount">৳${p.amount.toFixed(2)}</span>
                <span>${p.type}</span>
                <span>${p.billNumber || '-'}</span>
                <button class="action-btn delete-btn delete-payment-btn" data-party-id="${party.id}" data-payment-id="${p.id}" title="Delete">🗑️</button>
            `;
            historyBody.appendChild(item);
        });

        // Add delete payment listeners
        document.querySelectorAll('.delete-payment-btn').forEach(btn => {
            btn.addEventListener('click', () => deletePayment(btn.dataset.partyId, btn.dataset.paymentId));
        });
    }

    paymentHistoryModal.classList.add('show');
}

// Delete a payment
async function deletePayment(partyId, paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    // Delete from Supabase
    const result = await deletePaymentFromDb(paymentId);
    
    if (result.success) {
        const party = partyTransactions.find(t => t.id == partyId);
        if (party) {
            party.payments = party.payments.filter(p => p.id != paymentId);
            savePartyTransactions(); // Backup to localStorage
        }
        openHistoryModal(partyId); // Refresh history
        renderPartyTransactions(partyCategoryInput.value); // Refresh main list
    } else {
        alert('Failed to delete payment: ' + result.error);
    }
}

// Delete a party
async function deleteParty(partyId) {
    if (!confirm('Are you sure you want to delete this party and all its payment history?')) return;

    // Delete from Supabase
    const result = await deletePartyFromDb(partyId);
    
    if (result.success) {
        partyTransactions = partyTransactions.filter(t => t.id != partyId);
        savePartyTransactions(); // Backup to localStorage
        renderPartyTransactions(partyCategoryInput.value);
    } else {
        alert('Failed to delete party: ' + result.error);
    }
}

// Event Listeners
if (debtorBtn) debtorBtn.addEventListener('click', () => openPartyModal('debtor'));
if (creditorBtn) creditorBtn.addEventListener('click', () => openPartyModal('creditor'));
if (closePartyModalBtn) closePartyModalBtn.addEventListener('click', () => partyModal.classList.remove('show'));

if (partyMonthDropdown) partyMonthDropdown.addEventListener('change', () => renderPartyTransactions(partyCategoryInput.value));
if (partyYearDropdown) partyYearDropdown.addEventListener('change', () => renderPartyTransactions(partyCategoryInput.value));

// Search functionality
const partySearchInput = document.getElementById('party-search-input');
if (partySearchInput) {
    partySearchInput.addEventListener('input', (e) => {
        lastSearchTerm = e.target.value;
        renderPartyTransactions(partyCategoryInput.value);
    });
}

if (downloadPartyPdfBtn) downloadPartyPdfBtn.addEventListener('click', downloadPartyPDF);

// Add New Party
if (addPartyTransactionBtn) {
    addPartyTransactionBtn.addEventListener('click', () => {
        addPartyTransactionForm.reset();
        document.getElementById('party-transaction-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('party-edit-id').value = '';
        document.getElementById('add-party-modal-title').textContent = 'Add New Party';
        addPartyTransactionModal.classList.add('show');
    });
}

if (cancelAddPartyTransactionBtn) {
    cancelAddPartyTransactionBtn.addEventListener('click', () => {
        addPartyTransactionModal.classList.remove('show');
    });
}

if (addPartyTransactionForm) {
    addPartyTransactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newParty = {
            category: partyCategoryInput.value,
            name: document.getElementById('party-name').value,
            due: parseFloat(document.getElementById('party-due').value) || 0,
            createdDate: document.getElementById('party-transaction-date').value || new Date().toISOString().split('T')[0],
            payments: []
        };

        // Save to Supabase
        const result = await savePartyToDb(newParty);
        
        if (result.success) {
            newParty.id = result.data.id;
            partyTransactions.push(newParty);
            savePartyTransactions(); // Backup to localStorage
            renderPartyTransactions(newParty.category);
            addPartyTransactionModal.classList.remove('show');
        } else {
            alert('Failed to save party: ' + result.error);
        }
    });
}

// Add Payment Form
if (cancelPaymentBtn) {
    cancelPaymentBtn.addEventListener('click', () => {
        addPaymentModal.classList.remove('show');
    });
}

if (addPaymentForm) {
    addPaymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const partyId = document.getElementById('payment-party-id').value;
        const party = partyTransactions.find(t => t.id == partyId);
        
        if (party) {
            const payment = {
                amount: parseFloat(document.getElementById('payment-amount').value) || 0,
                type: document.getElementById('payment-type').value,
                date: document.getElementById('payment-date').value,
                billNumber: document.getElementById('payment-bill-number').value || ''
            };
            
            // Save to Supabase
            const result = await savePaymentToDb(partyId, payment);
            
            if (result.success) {
                payment.id = result.data.id;
                party.payments.push(payment);
                savePartyTransactions(); // Backup to localStorage
                renderPartyTransactions(partyCategoryInput.value);
                addPaymentModal.classList.remove('show');
            } else {
                alert('Failed to save payment: ' + result.error);
            }
        }
    });
}

// Close History Modal
if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
        paymentHistoryModal.classList.remove('show');
    });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === partyModal) partyModal.classList.remove('show');
    if (e.target === addPartyTransactionModal) addPartyTransactionModal.classList.remove('show');
    if (e.target === addPaymentModal) addPaymentModal.classList.remove('show');
    if (e.target === paymentHistoryModal) paymentHistoryModal.classList.remove('show');
});

// Initial load
loadPartiesFromDb();
