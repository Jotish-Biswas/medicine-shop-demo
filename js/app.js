// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
}

themeToggleBtn.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});

// Dummy Data for Medicines
const medicines = [
    { id: 1, name: 'Napa Extra', company: 'Beximco', form: 'Tablet', price: '2.50', stock: { main: 100, g1: 20, g2: 15, g3: 15 }, lowStockThreshold: 20 },
    { id: 2, name: 'Seclo 20', company: 'Square', form: 'Capsule', price: '5.00', stock: { main: 50, g1: 5, g2: 5, g3: 5 }, lowStockThreshold: 20 },
    { id: 3, name: 'Maxpro 20', company: 'Renata', form: 'Capsule', price: '7.00', stock: { main: 200, g1: 50, g2: 30, g3: 20 }, lowStockThreshold: 30 },
    { id: 4, name: 'Alatrol', company: 'Square', form: 'Tablet', price: '3.00', stock: { main: 30, g1: 2, g2: 2, g3: 1 }, lowStockThreshold: 10 },
    { id: 5, name: 'Bizoran', company: 'Incepta', form: 'Tablet', price: '12.00', stock: { main: 60, g1: 15, g2: 15, g3: 15 }, lowStockThreshold: 15 },
    { id: 6, name: 'Napa Syrup', company: 'Beximco', form: 'Syrup', price: '35.00', stock: { main: 20, g1: 3, g2: 3, g3: 2 }, lowStockThreshold: 10 },
    { id: 7, name: 'Tygacil', company: 'Beximco', form: 'Injection', price: '500.00', stock: { main: 10, g1: 2, g2: 0, g3: 1 }, lowStockThreshold: 5 },
];

// Transaction History (Simulated)
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function logTransaction(type, quantity, price) {
    const transaction = {
        type: type, // 'in' or 'out'
        quantity: quantity,
        price: parseFloat(price),
        date: new Date().toISOString()
    };
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function getStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let dailyIn = 0, dailyOut = 0, monthlyIn = 0, monthlyOut = 0;
    let dailyPurchase = 0, dailySales = 0, monthlyPurchase = 0, monthlySales = 0;

    transactions.forEach(t => {
        const tDate = new Date(t.date);
        const tDateString = tDate.toISOString().split('T')[0];
        const value = t.quantity * (t.price || 0);
        
        // Daily Stats
        if (tDateString === today) {
            if (t.type === 'in') {
                dailyIn += t.quantity;
                dailyPurchase += value;
            }
            if (t.type === 'out') {
                dailyOut += t.quantity;
                dailySales += value;
            }
        }

        // Monthly Stats
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if (t.type === 'in') {
                monthlyIn += t.quantity;
                monthlyPurchase += value;
            }
            if (t.type === 'out') {
                monthlyOut += t.quantity;
                monthlySales += value;
            }
        }
    });

    return { 
        dailyIn, dailyOut, monthlyIn, monthlyOut,
        dailyPurchase: dailyPurchase.toFixed(2),
        dailySales: dailySales.toFixed(2),
        monthlyPurchase: monthlyPurchase.toFixed(2),
        monthlySales: monthlySales.toFixed(2)
    };
}

const medicineContainer = document.getElementById('medicine-list');
const groupBySelect = document.getElementById('group-by');
const searchBar = document.getElementById('search-bar');

// Modal Elements
const addItemBtn = document.getElementById('add-item-btn');
const addItemModal = document.getElementById('add-item-modal');
const cancelBtn = document.getElementById('cancel-btn');
const addItemForm = document.getElementById('add-item-form');

// Alert & Stats Elements
const alertBtn = document.getElementById('alert-btn');
const alertBadge = document.getElementById('alert-badge');
const alertsModal = document.getElementById('alerts-modal');
const alertsList = document.getElementById('alerts-list');
const closeAlertsBtn = document.getElementById('close-alerts-btn');

const statsBtn = document.getElementById('stats-btn');
const statsModal = document.getElementById('stats-modal');
const closeStatsBtn = document.getElementById('close-stats-btn');

function getTotalStock(med) {
    return med.stock.main + med.stock.g1 + med.stock.g2 + med.stock.g3;
}

function updateAlertBadge() {
    const lowStockCount = medicines.filter(m => getTotalStock(m) <= m.lowStockThreshold).length;
    alertBadge.textContent = lowStockCount;
    if (lowStockCount > 0) {
        alertBadge.style.display = 'flex';
    } else {
        alertBadge.style.display = 'none';
    }
}

function createMedicineCard(med) {
    const totalStock = getTotalStock(med);
    const isLowStock = totalStock <= med.lowStockThreshold;
    
    return `
        <div class="medicine-card ${isLowStock ? 'low-stock' : ''}">
            <div class="medicine-header">
                <span class="medicine-name">${med.name}</span>
                <span class="medicine-form">${med.form}</span>
            </div>
            <div class="medicine-company">${med.company}</div>
            <div class="medicine-details">
                <span class="price">৳${med.price}</span>
            </div>
            <div class="stock-controls-container">
                <div class="stock-row">
                    <span class="shop-label">Main Store</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="main">-</button>
                        <input type="number" class="stock-input" data-id="${med.id}" data-shop="main" value="${med.stock.main}" min="0">
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="main">+</button>
                    </div>
                </div>
                <div class="stock-row">
                    <span class="shop-label">G1</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="g1">-</button>
                        <input type="number" class="stock-input" data-id="${med.id}" data-shop="g1" value="${med.stock.g1}" min="0">
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="g1">+</button>
                    </div>
                </div>
                <div class="stock-row">
                    <span class="shop-label">G2</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="g2">-</button>
                        <input type="number" class="stock-input" data-id="${med.id}" data-shop="g2" value="${med.stock.g2}" min="0">
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="g2">+</button>
                    </div>
                </div>
                <div class="stock-row">
                    <span class="shop-label">G3</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="g3">-</button>
                        <input type="number" class="stock-input" data-id="${med.id}" data-shop="g3" value="${med.stock.g3}" min="0">
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="g3">+</button>
                    </div>
                </div>
            </div>
            <div class="total-stock">Total: ${totalStock}</div>
            <div class="low-stock-indicator" data-i18n="low_stock">Low Stock</div>
        </div>
    `;
}

function getFilteredMedicines() {
    const searchTerm = searchBar.value.toLowerCase();
    return medicines.filter(med => 
        med.name.toLowerCase().includes(searchTerm) || 
        med.company.toLowerCase().includes(searchTerm)
    );
}

function renderMedicines() {
    medicineContainer.innerHTML = '';
    const groupBy = groupBySelect.value;
    const meds = getFilteredMedicines();

    if (groupBy === 'none') {
        meds.forEach(med => {
            medicineContainer.innerHTML += createMedicineCard(med);
        });
    } else {
        // Grouping logic
        const groups = {};
        meds.forEach(med => {
            const key = med[groupBy]; // 'company' or 'form'
            if (!groups[key]) groups[key] = [];
            groups[key].push(med);
        });

        // Sort keys
        const sortedKeys = Object.keys(groups).sort();

        sortedKeys.forEach(key => {
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';
            groupSection.innerHTML = `<h2 class="group-title">${key}</h2><div class="group-grid"></div>`;
            
            const grid = groupSection.querySelector('.group-grid');
            groups[key].forEach(med => {
                grid.innerHTML += createMedicineCard(med);
            });
            
            medicineContainer.appendChild(groupSection);
        });
    }

    // Re-apply translations to new elements
    if (typeof updateText === 'function') {
        updateText();
    }
    updateAlertBadge();
}

// Initial Render
renderMedicines();

// Search Functionality
searchBar.addEventListener('input', () => {
    renderMedicines();
});

// Group By Functionality
groupBySelect.addEventListener('change', () => {
    renderMedicines();
});

// Stock Interaction (Delegation)
medicineContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('stock-btn')) {
        const id = parseInt(e.target.dataset.id);
        const shop = e.target.dataset.shop; // 'main', 'g1', 'g2', 'g3'
        const med = medicines.find(m => m.id === id);
        
        if (med && shop) {
            if (e.target.classList.contains('plus')) {
                med.stock[shop]++;
                logTransaction('in', 1, med.price);
            } else if (e.target.classList.contains('minus')) {
                if (med.stock[shop] > 0) {
                    med.stock[shop]--;
                    logTransaction('out', 1, med.price);
                }
            }
            renderMedicines();
        }
    }
});

// Manual Stock Input
medicineContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('stock-input')) {
        const id = parseInt(e.target.dataset.id);
        const shop = e.target.dataset.shop;
        const med = medicines.find(m => m.id === id);
        const newStock = parseInt(e.target.value);

        if (med && shop && !isNaN(newStock) && newStock >= 0) {
            const diff = newStock - med.stock[shop];
            if (diff > 0) {
                logTransaction('in', diff, med.price);
            } else if (diff < 0) {
                logTransaction('out', Math.abs(diff), med.price);
            }
            med.stock[shop] = newStock;
            renderMedicines();
        }
    }
});

// Modal Logic
addItemBtn.addEventListener('click', () => {
    addItemModal.classList.add('show');
});

cancelBtn.addEventListener('click', () => {
    addItemModal.classList.remove('show');
    addItemForm.reset();
});

// Alert Modal Logic
alertBtn.addEventListener('click', () => {
    const lowStockMeds = medicines.filter(m => getTotalStock(m) <= m.lowStockThreshold);
    alertsList.innerHTML = '';
    if (lowStockMeds.length === 0) {
        alertsList.innerHTML = '<p>No low stock items.</p>';
    } else {
        lowStockMeds.forEach(med => {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerHTML = `<span>${med.name} (${med.company})</span> <span>Stock: ${getTotalStock(med)}</span>`;
            alertsList.appendChild(div);
        });
    }
    alertsModal.classList.add('show');
});

closeAlertsBtn.addEventListener('click', () => {
    alertsModal.classList.remove('show');
});

// Stats Modal Logic
statsBtn.addEventListener('click', () => {
    const stats = getStats();
    document.getElementById('stat-daily-in').textContent = stats.dailyIn;
    document.getElementById('stat-daily-out').textContent = stats.dailyOut;
    document.getElementById('stat-monthly-in').textContent = stats.monthlyIn;
    document.getElementById('stat-monthly-out').textContent = stats.monthlyOut;
    
    document.getElementById('stat-daily-purchase').textContent = stats.dailyPurchase;
    document.getElementById('stat-daily-sales').textContent = stats.dailySales;
    document.getElementById('stat-monthly-purchase').textContent = stats.monthlyPurchase;
    document.getElementById('stat-monthly-sales').textContent = stats.monthlySales;
    
    statsModal.classList.add('show');
});

closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addItemModal) addItemModal.classList.remove('show');
    if (e.target === alertsModal) alertsModal.classList.remove('show');
    if (e.target === statsModal) statsModal.classList.remove('show');
});

// Handle Form Submission
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('new-name').value;
    const company = document.getElementById('new-company').value;
    const type = document.getElementById('new-type').value;
    const price = parseFloat(document.getElementById('new-price').value).toFixed(2);
    const stockMain = parseInt(document.getElementById('new-stock-main').value) || 0;
    const stockG1 = parseInt(document.getElementById('new-stock-g1').value) || 0;
    const stockG2 = parseInt(document.getElementById('new-stock-g2').value) || 0;
    const stockG3 = parseInt(document.getElementById('new-stock-g3').value) || 0;

    const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;

    const newMedicine = {
        id: newId,
        name: name,
        company: company,
        form: type,
        price: price,
        stock: {
            main: stockMain,
            g1: stockG1,
            g2: stockG2,
            g3: stockG3
        },
        lowStockThreshold: 10 // Default threshold
    };

    medicines.push(newMedicine);
    
    // Log initial stock as 'in'
    const totalInitialStock = stockMain + stockG1 + stockG2 + stockG3;
    if (totalInitialStock > 0) {
        logTransaction('in', totalInitialStock, price);
    }

    renderMedicines();
    
    addItemModal.classList.remove('show');
    addItemForm.reset();
});
