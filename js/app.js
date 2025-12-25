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

// Shop Management
let shops = JSON.parse(localStorage.getItem('shops')) || [
    { id: 'main', name: 'Main Store' },
    { id: 'a', name: 'Shop A' },
    { id: 'b', name: 'Shop B' },
    { id: 'c', name: 'Shop C' },
    { id: 'd', name: 'Shop D' },
    { id: 'e', name: 'Shop E' }
];

function saveShops() {
    localStorage.setItem('shops', JSON.stringify(shops));
}

function addShop(name) {
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    shops.push({ id, name });
    saveShops();
    renderTableHeaders();
    renderMedicines();
    renderShopTabs();
    renderShopInputs();
}

// Dummy Data for Medicines
let medicines = [
    { id: 1, name: 'Napa Extra', company: 'Beximco', form: 'Tablet', price: '2.50', stock: { main: 100, a: 20, b: 15, c: 15, d: 10, e: 5 }, lowStockThreshold: 20, mfgDate: '2024-06-15', expDate: '2026-06-15' },
    { id: 2, name: 'Seclo 20', company: 'Square', form: 'Capsule', price: '5.00', stock: { main: 50, a: 5, b: 5, c: 5, d: 2, e: 1 }, lowStockThreshold: 20, mfgDate: '2024-03-10', expDate: '2026-03-10' },
    { id: 3, name: 'Maxpro 20', company: 'Renata', form: 'Capsule', price: '7.00', stock: { main: 200, a: 50, b: 30, c: 20, d: 10, e: 10 }, lowStockThreshold: 30, mfgDate: '2024-08-20', expDate: '2026-08-20' },
    { id: 4, name: 'Alatrol', company: 'Square', form: 'Tablet', price: '3.00', stock: { main: 30, a: 2, b: 2, c: 1, d: 0, e: 0 }, lowStockThreshold: 10, mfgDate: '2024-01-05', expDate: '2026-01-05' },
    { id: 5, name: 'Bizoran', company: 'Incepta', form: 'Tablet', price: '12.00', stock: { main: 60, a: 15, b: 15, c: 15, d: 5, e: 5 }, lowStockThreshold: 15, mfgDate: '2024-05-12', expDate: '2026-05-12' },
    { id: 6, name: 'Napa Syrup', company: 'Beximco', form: 'Syrup', price: '35.00', stock: { main: 20, a: 3, b: 3, c: 2, d: 1, e: 1 }, lowStockThreshold: 10, mfgDate: '2024-09-01', expDate: '2025-09-01' },
    { id: 7, name: 'Tygacil', company: 'Beximco', form: 'Injection', price: '500.00', stock: { main: 10, a: 2, b: 0, c: 1, d: 0, e: 0 }, lowStockThreshold: 5, mfgDate: '2024-11-15', expDate: '2026-11-15' },
];

// Load medicines from localStorage if available, otherwise use dummy data
const savedMedicines = localStorage.getItem('medicines');
if (savedMedicines) {
    medicines = JSON.parse(savedMedicines);
    // Migration: Add mfgDate and expDate to existing medicines without them
    let needsSave = false;
    medicines.forEach(med => {
        if (!med.mfgDate) {
            // Generate a random manufacture date (6-18 months ago)
            const monthsAgo = Math.floor(Math.random() * 12) + 6;
            const mfgDate = new Date();
            mfgDate.setMonth(mfgDate.getMonth() - monthsAgo);
            med.mfgDate = mfgDate.toISOString().split('T')[0];
            needsSave = true;
        }
        if (!med.expDate) {
            // Generate expire date (18-36 months from mfgDate)
            const mfgDateObj = new Date(med.mfgDate);
            const monthsToAdd = Math.floor(Math.random() * 18) + 18;
            mfgDateObj.setMonth(mfgDateObj.getMonth() + monthsToAdd);
            med.expDate = mfgDateObj.toISOString().split('T')[0];
            needsSave = true;
        }
    });
    if (needsSave) {
        localStorage.setItem('medicines', JSON.stringify(medicines));
    }
}

// Transaction History (Simulated)
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

function logTransaction(type, quantity, price, shop, medicineName) {
    const transaction = {
        type: type, // 'in' or 'out'
        quantity: quantity,
        price: parseFloat(price),
        shop: shop,
        medicineName: medicineName,
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

const medicineTableBody = document.getElementById('medicine-table-body');
const groupBy = document.getElementById('group-by');
const searchBar = document.getElementById('search-bar');
const shopTabsContainer = document.getElementById('shop-tabs');
const totalInventoryValueEl = document.getElementById('total-inventory-value');
const lowStockCountEl = document.getElementById('low-stock-count');

// Dashboard Elements
const quickAddBtn = document.getElementById('quick-add-btn');
const quickStatsBtn = document.getElementById('quick-stats-btn');
const addMedicineBtn = document.getElementById('add-medicine-btn');

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
    let total = 0;
    shops.forEach(shop => {
        total += (med.stock[shop.id] || 0);
    });
    return total;
}

function getMedicines() {
    return medicines;
}

function getShops() {
    return shops;
}

function renderTableHeaders() {
    const thead = document.getElementById('medicine-table-head');
    if (!thead) return;
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    const headers = ['#', 'Name', 'Company', 'Price', 'Total Stock'];
    const activeShop = document.querySelector('.shop-tab.active')?.dataset.shop || 'all';

    let headerHTML = headers.map(h => `<th>${h}</th>`).join('');
    
    if (activeShop === 'all') {
        const allShops = getShops();
        const shopHeaders = allShops.map(s => `<th>${s.name}</th>`).join('');
        headerHTML += shopHeaders;
    } else {
        headerHTML += '<th>Stock</th>';
    }
    
    // Add Mfg Date and Exp Date at the end
    headerHTML += '<th>Mfg Date</th><th>Exp Date</th>';
    
    tr.innerHTML = headerHTML;
    thead.appendChild(tr);
}

function createMedicineRow(medicine, index) {
    const tr = document.createElement('tr');
    const activeShop = document.querySelector('.shop-tab.active')?.dataset.shop || 'all';
    const allShops = getShops();
    const totalStock = getTotalStock(medicine);

    // Format dates
    const mfgDate = medicine.mfgDate ? new Date(medicine.mfgDate).toLocaleDateString() : '-';
    const expDate = medicine.expDate ? new Date(medicine.expDate).toLocaleDateString() : '-';
    
    // Check if expired or expiring soon
    const today = new Date();
    const expDateObj = medicine.expDate ? new Date(medicine.expDate) : null;
    const isExpired = expDateObj && expDateObj < today;
    const isExpiringSoon = expDateObj && !isExpired && (expDateObj - today) / (1000 * 60 * 60 * 24) <= 30;

    let cells = `
        <td>${index + 1}</td>
        <td>
            ${medicine.name}
            ${totalStock <= (medicine.lowStockThreshold || 10) ? '<span class="low-stock-dot"></span>' : ''}
        </td>
        <td>${medicine.company}</td>
        <td>
            <input type="number" class="price-input" data-id="${medicine.id}" value="${medicine.price}" step="0.01" min="0">
        </td>
        <td style="font-weight: bold; text-align: center;">${totalStock}</td>
    `;

    if (activeShop === 'all') {
        allShops.forEach(shop => {
            const stock = medicine.stock[shop.id] || 0;
            cells += `
                <td>
                    <div class="table-stock-control">
                        <input type="number" class="stock-input" data-id="${medicine.id}" data-shop="${shop.id}" value="${stock}" min="0">
                        <div class="stock-buttons">
                            <button class="stock-btn plus" data-id="${medicine.id}" data-shop="${shop.id}">+</button>
                            <button class="stock-btn minus" data-id="${medicine.id}" data-shop="${shop.id}">-</button>
                        </div>
                    </div>
                </td>
            `;
        });
    } else {
        const stock = medicine.stock[activeShop] || 0;
        cells += `
            <td>
                <div class="table-stock-control">
                    <input type="number" class="stock-input" data-id="${medicine.id}" data-shop="${activeShop}" value="${stock}" min="0">
                    <div class="stock-buttons">
                        <button class="stock-btn plus" data-id="${medicine.id}" data-shop="${activeShop}">+</button>
                        <button class="stock-btn minus" data-id="${medicine.id}" data-shop="${activeShop}">-</button>
                    </div>
                </div>
            </td>
        `;
    }

    // Add Mfg Date and Exp Date at the end (rightmost)
    cells += `
        <td>${mfgDate}</td>
        <td class="${isExpired ? 'expired-date' : isExpiringSoon ? 'expiring-soon' : ''}">${expDate}</td>
    `;
    
    tr.innerHTML = cells;

    if (totalStock <= (medicine.lowStockThreshold || 10)) {
        tr.classList.add('low-stock-row');
    }

    return tr;
}

function renderMedicines(filter = '', group = 'all') {
    const allMedicines = getMedicines();
    let filteredMedicines = allMedicines.filter(m => 
        m.name.toLowerCase().includes(filter.toLowerCase()) ||
        m.company.toLowerCase().includes(filter.toLowerCase())
    );

    // Sort medicines alphabetically by name
    filteredMedicines.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    if (!medicineTableBody) return;
    medicineTableBody.innerHTML = '';
    renderTableHeaders();

    if (group === 'company') {
        const groupedByCompany = filteredMedicines.reduce((acc, med) => {
            (acc[med.company] = acc[med.company] || []).push(med);
            return acc;
        }, {});

        Object.keys(groupedByCompany).sort().forEach(company => {
            const groupHeader = document.createElement('tr');
            groupHeader.innerHTML = `<td colspan="100%" style="background-color: var(--table-header-bg); font-weight: bold;">${company}</td>`;
            medicineTableBody.appendChild(groupHeader);
            groupedByCompany[company].forEach((med, index) => {
                medicineTableBody.appendChild(createMedicineRow(med, index));
            });
        });
    } else {
        filteredMedicines.forEach((med, index) => {
            medicineTableBody.appendChild(createMedicineRow(med, index));
        });
    }
    updateAlertBadge();
}

function updateAlertBadge() {
    const lowStockMeds = medicines.filter(m => getTotalStock(m) <= (m.lowStockThreshold || 10));
    if (alertBadge) {
        alertBadge.textContent = lowStockMeds.length;
    }
}

function renderDashboard() {
    // Dashboard cards removed - function kept for compatibility
}

// Initial Render
renderMedicines();

// Search Functionality
if (searchBar) {
    searchBar.addEventListener('input', () => {
        const filter = searchBar.value;
        const group = groupBy ? groupBy.value : 'all';
        renderMedicines(filter, group);
    });
}

// Group By Functionality
if (groupBy) {
    groupBy.addEventListener('change', () => {
        const filter = searchBar ? searchBar.value : '';
        const group = groupBy.value;
        renderMedicines(filter, group);
    });
}

// Stock Interaction (Delegation) - Input and Buttons
if (medicineTableBody) {
    medicineTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('stock-btn')) {
            const id = parseInt(e.target.dataset.id);
            const shop = e.target.dataset.shop || 'main';
            const med = medicines.find(m => m.id === id);
            
            if (med) {
                const amountStr = prompt("Enter amount to add/subtract:", "1");
                const amount = parseInt(amountStr);

                if (!isNaN(amount) && amount > 0) {
                    if (e.target.classList.contains('plus')) {
                        med.stock[shop] = (med.stock[shop] || 0) + amount;
                        logTransaction('in', amount, med.price, shop, med.name);
                    } else if (e.target.classList.contains('minus')) {
                        if (med.stock[shop] >= amount) {
                            med.stock[shop] -= amount;
                            logTransaction('out', amount, med.price, shop, med.name);
                        } else {
                            alert("Not enough stock to subtract.");
                        }
                    }
                    const filter = searchBar ? searchBar.value : '';
                    const group = groupBy ? groupBy.value : 'all';
                    renderMedicines(filter, group);
                } else if (amountStr !== null) {
                    alert("Please enter a valid positive number.");
                }
            }
        }
    });

    medicineTableBody.addEventListener('change', (e) => {
        // Handle Stock Change
        if (e.target.classList.contains('stock-input')) {
            const id = parseInt(e.target.dataset.id);
            const shop = e.target.dataset.shop;
            const med = medicines.find(m => m.id === id);
            const newStock = parseInt(e.target.value);

            if (med && shop && !isNaN(newStock) && newStock >= 0) {
                const oldStock = med.stock[shop] || 0;
                const diff = newStock - oldStock;
                if (diff > 0) {
                    logTransaction('in', diff, med.price, shop, med.name);
                } else if (diff < 0) {
                    logTransaction('out', Math.abs(diff), med.price, shop, med.name);
                }
                med.stock[shop] = newStock;
                // Update total stock display
                const totalStock = getTotalStock(med);
                const row = e.target.closest('tr');
                const totalStockCell = row.querySelector('td:nth-child(5)');
                if (totalStockCell) {
                    totalStockCell.textContent = totalStock;
                }
                updateAlertBadge();
            }
        }
        
        // Handle Price Change
        if (e.target.classList.contains('price-input')) {
            const id = parseInt(e.target.dataset.id);
            const med = medicines.find(m => m.id === id);
            const newPrice = parseFloat(e.target.value);
            
            if (med && !isNaN(newPrice) && newPrice >= 0) {
                med.price = newPrice.toFixed(2);
            }
        }
    });

    medicineTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('stock-input')) {
            const input = e.target;
            const value = input.value;
            const len = value.length || 1;
            const newWidth = 20 + (len * 14); 
            input.style.width = `${Math.max(120, newWidth)}px`;
        }
    });
} // End of medicineTableBody check

// Quick Actions
if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
        if (addItemModal) addItemModal.classList.add('show');
    });
}

if (addMedicineBtn) {
    addMedicineBtn.addEventListener('click', () => {
        renderShopInputs();
        if (addItemModal) addItemModal.classList.add('show');
    });
}

if (quickStatsBtn) {
    quickStatsBtn.addEventListener('click', () => {
        if (statsBtn) statsBtn.click();
    });
}

// Modal Logic
if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
        if (addItemModal) addItemModal.classList.add('show');
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        if (addItemModal) addItemModal.classList.remove('show');
        if (addItemForm) addItemForm.reset();
    });
}

// Alert Modal Logic
if (alertBtn) {
    alertBtn.addEventListener('click', () => {
        const lowStockMeds = medicines.filter(m => getTotalStock(m) <= (m.lowStockThreshold || 10));
        if (alertsList) {
            alertsList.innerHTML = '';
            if (lowStockMeds.length === 0) {
                alertsList.innerHTML = '<p>No low stock items.</p>';
            } else {
                lowStockMeds.forEach(med => {
                    const div = document.createElement('div');
                    div.className = 'alert-item';
                    
                    // Create breakdown string
                    let breakdown = '';
                    shops.forEach(shop => {
                        const stock = med.stock[shop.id] || 0;
                        breakdown += `<span style="font-size: 0.8em; margin-left: 5px; color: var(--text-secondary);">[${shop.name}: ${stock}]</span>`;
                    });

                    div.innerHTML = `
                        <div style="display: flex; flex-direction: column; width: 100%;">
                            <div style="display: flex; justify-content: space-between; width: 100%;">
                                <span>${med.name} (${med.company})</span> 
                                <span>Total: ${getTotalStock(med)}</span>
                            </div>
                            <div style="margin-top: 4px;">
                                ${breakdown}
                            </div>
                        </div>
                    `;
                    alertsList.appendChild(div);
                });
            }
        }
        if (alertsModal) alertsModal.classList.add('show');
    });
}

if (closeAlertsBtn) {
    closeAlertsBtn.addEventListener('click', () => {
        if (alertsModal) alertsModal.classList.remove('show');
    });
}

// Stats Modal Logic
function getStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let dailySales = 0, monthlySales = 0;

    transactions.forEach(t => {
        const tDate = new Date(t.date);
        const tDateString = tDate.toISOString().split('T')[0];
        const value = t.quantity * (t.price || 0);
        
        // Only count 'out' transactions as sales
        if (t.type === 'out') {
            // Daily Stats
            if (tDateString === today) {
                dailySales += value;
            }

            // Monthly Stats
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                monthlySales += value;
            }
        }
    });

    return { 
        dailySales: dailySales.toFixed(2),
        monthlySales: monthlySales.toFixed(2)
    };
}

// Stock Movement Report Logic (Detailed Daily Track)
function renderStockMovementReport(shopFilter = 'all', month = null, year = null, dayFilter = 'all') {
    const tbody = document.getElementById('stats-table-body');
    tbody.innerHTML = '';
    
    // Default to current date if not provided
    const now = new Date();
    if (!month) month = now.getMonth() + 1;
    if (!year) year = now.getFullYear();

    // Filter transactions for the selected month/year and shop
    const filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        const isSameMonth = tDate.getFullYear() === parseInt(year) && (tDate.getMonth() + 1) === parseInt(month);
        const isSameShop = shopFilter === 'all' || t.shop === shopFilter;
        
        let isSameDay = true;
        if (dayFilter !== 'all') {
            isSameDay = tDate.getDate() === parseInt(dayFilter);
        }

        return isSameMonth && isSameShop && isSameDay;
    });

    // Sort by date descending
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No transactions found for this period.</td></tr>';
        return;
    }

    filteredTransactions.forEach((t, index) => {
        const row = document.createElement('tr');
        const tDate = new Date(t.date);
        const day = tDate.getDate(); // Just the day number
        
        // Find medicine to get current stock
        const med = medicines.find(m => m.name === t.medicineName);
        let presentStock = '-';
        let lowStockWarning = '';

        if (med) {
            if (shopFilter === 'all') {
                presentStock = med.stock.main + med.stock.a + med.stock.b + med.stock.c + med.stock.d + med.stock.e;
            } else {
                presentStock = med.stock[shopFilter] || 0;
            }
            if (presentStock < med.lowStockThreshold) {
                lowStockWarning = '<span title="Low Stock">⚠️</span>';
            }
        }

        // Zebra striping
        if (index % 2 === 0) row.style.backgroundColor = 'var(--bg-color)';

        const added = t.type === 'in' ? `+${t.quantity}` : '-';
        const out = t.type === 'out' ? `-${t.quantity}` : '-';
        
        const addedStyle = t.type === 'in' ? 'color: var(--primary-color); font-weight: 500;' : 'color: var(--text-secondary); opacity: 0.3;';
        const outStyle = t.type === 'out' ? 'color: var(--danger-color); font-weight: 500;' : 'color: var(--text-secondary); opacity: 0.3;';

        row.innerHTML = `
            <td style="padding: 1rem; text-align: center; color: var(--text-secondary); font-weight: 500;">${day}</td>
            <td style="padding: 1rem; font-weight: 500;">${t.medicineName || 'Unknown'}</td>
            <td style="padding: 1rem; text-align: center; ${addedStyle}">${added}</td>
            <td style="padding: 1rem; text-align: center; ${outStyle}">${out}</td>
            <td style="padding: 1rem; text-align: center; font-weight: bold;">${presentStock} ${lowStockWarning}</td>
        `;
        tbody.appendChild(row);
    });
}

// Populate Year Dropdown
function populateYearDropdown() {
    const dropdown = document.getElementById('stats-year-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    const currentYear = new Date().getFullYear();
    
    // Generate range: 2020 to Current Year + 5
    for (let y = 2020; y <= currentYear + 5; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        dropdown.appendChild(option);
    }
}

// Populate Day Dropdown
function populateDayDropdown() {
    const dropdown = document.getElementById('stats-day-dropdown');
    if (!dropdown) return;
    
    // Keep "All Days" option
    dropdown.innerHTML = '<option value="all">All Days</option>';
    
    for (let d = 1; d <= 31; d++) {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        dropdown.appendChild(option);
    }
}

// Event Listeners
const statsShopSelect = document.getElementById('stats-shop-select');
const statsDayDropdown = document.getElementById('stats-day-dropdown');
const statsMonthDropdown = document.getElementById('stats-month-dropdown');
const statsYearDropdown = document.getElementById('stats-year-dropdown');
const statsManualDate = document.getElementById('stats-manual-date');
const statsShopTabsContainer = document.getElementById('shop-tabs-container');

function updateStats() {
    const shop = statsShopSelect ? statsShopSelect.value : 'all';
    const day = statsDayDropdown ? statsDayDropdown.value : 'all';
    const month = statsMonthDropdown ? statsMonthDropdown.value : null;
    const year = statsYearDropdown ? statsYearDropdown.value : null;
    renderStockMovementReport(shop, month, year, day);
}

// Handle Shop Tabs in Stats Modal
if (statsShopTabsContainer) {
    statsShopTabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('shop-tab')) {
            statsShopTabsContainer.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            
            const value = e.target.dataset.value;
            if (statsShopSelect) statsShopSelect.value = value;
            updateStats();
        }
    });
}

// Handle Shop Dropdown
if (statsShopSelect) {
    statsShopSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (statsShopTabsContainer) {
            statsShopTabsContainer.querySelectorAll('.shop-tab').forEach(tab => {
                if (tab.dataset.value === value) tab.classList.add('active');
                else tab.classList.remove('active');
            });
        }
        updateStats();
    });
}

if (statsDayDropdown) {
    statsDayDropdown.addEventListener('change', () => {
        updateStats();
    });
}

// Handle Month/Year Dropdowns
if (statsMonthDropdown) {
    statsMonthDropdown.addEventListener('change', () => {
        // Update manual input to reflect dropdowns
        if (statsManualDate && statsYearDropdown) {
            const m = statsMonthDropdown.value.padStart(2, '0');
            const y = statsYearDropdown.value;
            // We don't know the day, so we can just show MM/YYYY or leave it blank/partial
            // User asked: "manually ami j date bosabo box a pashe sei date ta pasher dropdown box a show korbe"
            // This implies Manual -> Dropdown sync. 
            // Does Dropdown -> Manual sync make sense? Maybe just MM/YYYY.
            statsManualDate.value = `${m}/${y}`; 
        }
        updateStats();
    });
}

if (statsYearDropdown) {
    statsYearDropdown.addEventListener('change', () => {
        if (statsManualDate && statsMonthDropdown) {
            const m = statsMonthDropdown.value.padStart(2, '0');
            const y = statsYearDropdown.value;
            statsManualDate.value = `${m}/${y}`;
        }
        updateStats();
    });
}

// Handle Manual Date Input
if (statsManualDate) {
    statsManualDate.addEventListener('input', (e) => {
        const val = e.target.value;
        // Try to parse DD/MM/YYYY or MM/YYYY
        // Regex for D/M/YYYY or DD/MM/YYYY
        const dateMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const monthYearMatch = val.match(/^(\d{1,2})\/(\d{4})$/);

        if (dateMatch) {
            // DD/MM/YYYY
            const m = parseInt(dateMatch[2]);
            const y = parseInt(dateMatch[3]);
            if (statsMonthDropdown) statsMonthDropdown.value = m;
            if (statsYearDropdown) statsYearDropdown.value = y;
            updateStats();
        } else if (monthYearMatch) {
            // MM/YYYY
            const m = parseInt(monthYearMatch[1]);
            const y = parseInt(monthYearMatch[2]);
            if (statsMonthDropdown) statsMonthDropdown.value = m;
            if (statsYearDropdown) statsYearDropdown.value = y;
            updateStats();
        }
    });
}

statsBtn.addEventListener('click', () => {
    const stats = getStats();
    document.getElementById('stat-daily-sales').textContent = `৳${stats.dailySales}`;
    document.getElementById('stat-monthly-sales').textContent = `৳${stats.monthlySales}`;

    populateYearDropdown();
    populateDayDropdown();
    
    // Set current month/year in dropdowns
    const now = new Date();
    if (statsMonthDropdown) statsMonthDropdown.value = now.getMonth() + 1;
    if (statsYearDropdown) statsYearDropdown.value = now.getFullYear();
    if (statsDayDropdown) statsDayDropdown.value = 'all';
    if (statsManualDate) statsManualDate.value = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    updateStats();
    statsModal.classList.add('show');
});

// PDF Download Logic
const downloadPdfBtn = document.getElementById('download-pdf-btn');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        if (!window.jspdf) {
            alert("PDF library not loaded. Please check your internet connection.");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const shopName = statsShopSelect.options[statsShopSelect.selectedIndex].text;
        const monthName = statsMonthDropdown.options[statsMonthDropdown.selectedIndex].text;
        const year = statsYearDropdown.value;
        
        doc.setFontSize(18);
        doc.text(`Stock Movement Report`, 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Shop: ${shopName}`, 14, 32);
        doc.text(`Period: ${monthName} ${year}`, 14, 38);
        
        doc.autoTable({
            html: '#stats-table',
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [0, 137, 123] }, // Match primary color
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20 }, // Day
                1: { cellWidth: 'auto' }, // Name
                2: { cellWidth: 25, halign: 'center' }, // Added
                3: { cellWidth: 25, halign: 'center' }, // Out
                4: { cellWidth: 30, halign: 'center' }  // Stock
            }
        });
        
        doc.save(`stock_report_${shopName}_${monthName}_${year}.pdf`);
    });
}

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
    const price = parseFloat(document.getElementById('new-price').value).toFixed(2);
    const mfgDate = document.getElementById('new-mfg-date').value;
    const expDate = document.getElementById('new-exp-date').value;
    
    const stock = {};
    shops.forEach(shop => {
        const input = document.getElementById(`new-stock-${shop.id}`);
        stock[shop.id] = input ? (parseInt(input.value) || 0) : 0;
    });

    // Check if editing
    const editId = addItemForm.dataset.editId;
    
    if (editId) {
        const med = medicines.find(m => m.id === parseInt(editId));
        if (med) {
            med.name = name;
            med.company = company;
            med.price = price;
            med.mfgDate = mfgDate;
            med.expDate = expDate;
            
            shops.forEach(shop => {
                const newStock = stock[shop.id];
                const oldStock = med.stock[shop.id] || 0;
                const diff = newStock - oldStock;
                
                if (diff > 0) {
                    logTransaction('in', diff, price, shop.id, name);
                } else if (diff < 0) {
                    logTransaction('out', Math.abs(diff), price, shop.id, name);
                }
                med.stock[shop.id] = newStock;
            });
        }
        delete addItemForm.dataset.editId; // Clear edit mode
    } else {
        const newId = medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1;

        const newMedicine = {
            id: newId,
            name: name,
            company: company,
            form: '', // Type removed
            price: price,
            mfgDate: mfgDate,
            expDate: expDate,
            stock: stock,
            lowStockThreshold: 10 // Default threshold
        };

        medicines.push(newMedicine);
        
        // Log initial stock as 'in'
        shops.forEach(shop => {
            if (stock[shop.id] > 0) {
                logTransaction('in', stock[shop.id], price, shop.id, name);
            }
        });
    }

    renderMedicines();
    
    addItemModal.classList.remove('show');
    addItemForm.reset();
});

// Render Shop Inputs in Add Modal
function renderShopInputs() {
    const container = document.getElementById('shop-stock-inputs-container');
    if (!container) return;
    
    container.innerHTML = '';
    shops.forEach(shop => {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label for="new-stock-${shop.id}">${shop.name}</label>
            <input type="number" id="new-stock-${shop.id}" value="0" min="0">
        `;
        container.appendChild(div);
    });
}

// Render Shop Tabs in Stats
function renderShopTabs() {
    const container = document.getElementById('shop-tabs-container');
    if (!container) return;
    
    container.innerHTML = '<button class="shop-tab active" data-value="all">All Shops</button>';
    shops.forEach(shop => {
        const btn = document.createElement('button');
        btn.className = 'shop-tab';
        btn.dataset.value = shop.id;
        btn.textContent = shop.name;
        container.appendChild(btn);
    });
}

// Render Shop Dropdown in Stats
function renderShopDropdown() {
    const select = document.getElementById('stats-shop-select');
    if (!select) return;
    
    select.innerHTML = '<option value="all">All Shops</option>';
    shops.forEach(shop => {
        const option = document.createElement('option');
        option.value = shop.id;
        option.textContent = shop.name;
        select.appendChild(option);
    });
}

// Add Shop Button Logic
const addShopBtn = document.getElementById('add-shop-btn');
if (addShopBtn) {
    addShopBtn.addEventListener('click', () => {
        const shopName = prompt("Enter new shop name:");
        if (shopName && shopName.trim() !== "") {
            addShop(shopName.trim());
        }
    });
}

// Delete Shop Button Logic
const deleteShopBtn = document.getElementById('delete-shop-btn');
const deleteShopModal = document.getElementById('delete-shop-modal');
const deleteShopSelect = document.getElementById('delete-shop-select-dropdown');
const confirmDeleteShopBtn = document.getElementById('confirm-delete-shop-btn');
const cancelDeleteShopBtn = document.getElementById('cancel-delete-shop-btn');

if (deleteShopBtn) {
    deleteShopBtn.addEventListener('click', () => {
        if (shops.length <= 1) {
            alert("You cannot delete the last shop.");
            return;
        }

        // Populate dropdown
        deleteShopSelect.innerHTML = '';
        shops.forEach(shop => {
            const option = document.createElement('option');
            option.value = shop.id;
            option.textContent = shop.name;
            deleteShopSelect.appendChild(option);
        });

        deleteShopModal.classList.add('show');
    });
}

if (cancelDeleteShopBtn) {
    cancelDeleteShopBtn.addEventListener('click', () => {
        deleteShopModal.classList.remove('show');
    });
}

if (confirmDeleteShopBtn) {
    confirmDeleteShopBtn.addEventListener('click', () => {
        const shopId = deleteShopSelect.value;
        if (!shopId) return;

        const shopIndex = shops.findIndex(s => s.id === shopId);
        if (shopIndex > -1) {
            const shopName = shops[shopIndex].name;
            
            // Remove shop from list
            shops.splice(shopIndex, 1);
            saveShops();

            // Remove stock data for this shop from all medicines
            medicines.forEach(med => {
                if (med.stock && med.stock[shopId] !== undefined) {
                    delete med.stock[shopId];
                }
            });
            
            // Re-render everything
            renderTableHeaders();
            renderMedicines();
            renderShopTabs();
            renderShopInputs();
            renderShopDropdown();
            
            deleteShopModal.classList.remove('show');
            // alert(`Shop "${shopName}" deleted successfully.`);
        }
    });
}

// Delete Medicine Logic
const deleteMedBtn = document.getElementById('delete-medicine-btn');
const deleteMedModal = document.getElementById('delete-medicine-modal');
const deleteMedSelect = document.getElementById('delete-med-select');
const confirmDeleteMedBtn = document.getElementById('confirm-delete-med-btn');
const cancelDeleteMedBtn = document.getElementById('cancel-delete-med-btn');

if (deleteMedBtn) {
    deleteMedBtn.addEventListener('click', () => {
        // Populate dropdown with Name - Company
        deleteMedSelect.innerHTML = '';
        
        // Sort medicines alphabetically by name for easier finding
        const sortedMeds = [...medicines].sort((a, b) => a.name.localeCompare(b.name));
        
        if (sortedMeds.length === 0) {
            const option = document.createElement('option');
            option.textContent = "No medicines available";
            deleteMedSelect.appendChild(option);
            confirmDeleteMedBtn.disabled = true;
        } else {
            confirmDeleteMedBtn.disabled = false;
            sortedMeds.forEach(med => {
                const option = document.createElement('option');
                option.value = med.id;
                option.textContent = `${med.name} - ${med.company}`;
                deleteMedSelect.appendChild(option);
            });
        }

        deleteMedModal.classList.add('show');
    });
}

if (cancelDeleteMedBtn) {
    cancelDeleteMedBtn.addEventListener('click', () => {
        deleteMedModal.classList.remove('show');
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === deleteMedModal) {
        deleteMedModal.classList.remove('show');
    }
});

if (confirmDeleteMedBtn) {
    confirmDeleteMedBtn.addEventListener('click', () => {
        const medId = parseInt(deleteMedSelect.value);
        if (!medId) return;

        const medIndex = medicines.findIndex(m => m.id === medId);
        if (medIndex > -1) {
            // Remove medicine
            medicines.splice(medIndex, 1);
            
            // Re-render
            renderMedicines();
            
            deleteMedModal.classList.remove('show');
        }
    });
}

// Initial Render Calls
renderShopInputs();
renderShopTabs();
renderShopDropdown();
renderMedicines(); // This calls renderTableHeaders

