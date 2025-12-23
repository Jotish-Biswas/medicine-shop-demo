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
const medicines = [
    { id: 1, name: 'Napa Extra', company: 'Beximco', form: 'Tablet', price: '2.50', stock: { main: 100, a: 20, b: 15, c: 15, d: 10, e: 5 }, lowStockThreshold: 20 },
    { id: 2, name: 'Seclo 20', company: 'Square', form: 'Capsule', price: '5.00', stock: { main: 50, a: 5, b: 5, c: 5, d: 2, e: 1 }, lowStockThreshold: 20 },
    { id: 3, name: 'Maxpro 20', company: 'Renata', form: 'Capsule', price: '7.00', stock: { main: 200, a: 50, b: 30, c: 20, d: 10, e: 10 }, lowStockThreshold: 30 },
    { id: 4, name: 'Alatrol', company: 'Square', form: 'Tablet', price: '3.00', stock: { main: 30, a: 2, b: 2, c: 1, d: 0, e: 0 }, lowStockThreshold: 10 },
    { id: 5, name: 'Bizoran', company: 'Incepta', form: 'Tablet', price: '12.00', stock: { main: 60, a: 15, b: 15, c: 15, d: 5, e: 5 }, lowStockThreshold: 15 },
    { id: 6, name: 'Napa Syrup', company: 'Beximco', form: 'Syrup', price: '35.00', stock: { main: 20, a: 3, b: 3, c: 2, d: 1, e: 1 }, lowStockThreshold: 10 },
    { id: 7, name: 'Tygacil', company: 'Beximco', form: 'Injection', price: '500.00', stock: { main: 10, a: 2, b: 0, c: 1, d: 0, e: 0 }, lowStockThreshold: 5 },
];

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
const groupBySelect = document.getElementById('group-by');
const searchBar = document.getElementById('search-bar');

// Dashboard Elements
const totalInventoryValueEl = document.getElementById('total-inventory-value');
const lowStockCountEl = document.getElementById('low-stock-count');
const quickAddBtn = document.getElementById('quick-add-btn');
const quickStatsBtn = document.getElementById('quick-stats-btn');

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

function renderTableHeaders() {
    const headerRow = document.getElementById('table-header-row');
    if (!headerRow) return;

    let headers = `
        <th data-i18n="table_name">Name</th>
        <th data-i18n="table_company">Company</th>
        <th data-i18n="table_price">Price (৳)</th>
        <th>Total Stock</th>
    `;

    shops.forEach(shop => {
        headers += `<th>${shop.name}</th>`;
    });

    // Removed Total Price column as requested
    headerRow.innerHTML = headers;
}

function createMedicineRow(medicine) {
    // Check for low stock
    const totalStock = getTotalStock(medicine);
    const isLowStock = totalStock < medicine.lowStockThreshold;
    const rowClass = isLowStock ? 'low-stock-row' : '';
    
    const createStockControl = (shopId) => {
        const stockValue = medicine.stock[shopId] || 0;
        return `
        <div class="stock-control-group">
            <button class="stock-btn plus" data-id="${medicine.id}" data-shop="${shopId}">▲</button>
            <input type="number" class="stock-input" data-id="${medicine.id}" data-shop="${shopId}" value="${stockValue}" min="0">
            <button class="stock-btn minus" data-id="${medicine.id}" data-shop="${shopId}">▼</button>
        </div>
    `};

    let shopCells = '';
    shops.forEach(shop => {
        shopCells += `<td>${createStockControl(shop.id)}</td>`;
    });

    return `
        <tr class="${rowClass}">
            <td>
                <div style="font-weight: 500;">${medicine.name}</div>
                <div style="font-size: 0.8em;">
                    <button class="action-btn edit-btn" onclick="editMedicine(${medicine.id})" style="padding: 2px 6px; font-size: 0.7rem;"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteMedicine(${medicine.id})" style="padding: 2px 6px; font-size: 0.7rem;"><i class="fas fa-trash"></i></button>
                </div>
            </td>
            <td>${medicine.company}</td>
            <td>
                <input type="number" class="price-input" data-id="${medicine.id}" value="${medicine.price}" step="0.01" style="width: 120px; padding: 4px; border: 1px solid var(--card-border); border-radius: 4px; text-align: center;">
            </td>
            <td style="font-weight: bold; text-align: center;">${totalStock}</td>
            ${shopCells}
        </tr>
    `;
}

function updateDashboardStats() {
    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter(m => getTotalStock(m) < m.lowStockThreshold).length;

    const totalMedicinesEl = document.getElementById('total-medicines-count');
    const lowStockCountEl = document.getElementById('low-stock-count');

    if (totalMedicinesEl) totalMedicinesEl.textContent = totalMedicines;
    if (lowStockCountEl) {
        lowStockCountEl.textContent = `${lowStockCount} Items`;
        if (lowStockCount > 0) {
            lowStockCountEl.classList.add('alert');
        } else {
            lowStockCountEl.classList.remove('alert');
        }
    }
}

window.editMedicine = function(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    
    // Pre-fill the add item modal for editing
    document.getElementById('new-name').value = med.name;
    document.getElementById('new-company').value = med.company;
    document.getElementById('new-price').value = med.price;
    
    // Populate stock inputs
    shops.forEach(shop => {
        const input = document.getElementById(`new-stock-${shop.id}`);
        if (input) {
            input.value = med.stock[shop.id] || 0;
        }
    });
    
    // Store the ID being edited in the form dataset
    const form = document.getElementById('add-item-form');
    form.dataset.editId = id;
    
    // Open modal
    document.getElementById('add-item-modal').classList.add('show');
}

window.deleteMedicine = function(id) {
    if(confirm('Are you sure you want to delete this medicine?')) {
        const index = medicines.findIndex(m => m.id === id);
        if (index > -1) {
            medicines.splice(index, 1);
            renderMedicines();
        }
    }
}

function getFilteredMedicines() {
    const searchTerm = searchBar.value.toLowerCase();
    return medicines.filter(med => 
        med.name.toLowerCase().includes(searchTerm) || 
        med.company.toLowerCase().includes(searchTerm)
    );
}

function renderMedicines() {
    renderTableHeaders(); // Ensure headers are up to date
    medicineTableBody.innerHTML = '';
    let meds = getFilteredMedicines();
    
    // Handle Grouping (Sorting)
    const groupBy = groupBySelect ? groupBySelect.value : 'none';
    if (groupBy === 'company') {
        meds.sort((a, b) => a.company.localeCompare(b.company));
    }

    meds.forEach(med => {
        medicineTableBody.innerHTML += createMedicineRow(med);
    });

    // Re-apply translations to new elements
    if (typeof updateText === 'function') {
        updateText();
    }
    updateDashboardStats();
}

// Initial Render
renderMedicines();

// Search Functionality
searchBar.addEventListener('input', () => {
    renderMedicines();
});

// Group By Functionality - Currently just re-renders, table doesn't support visual grouping yet
groupBySelect.addEventListener('change', () => {
    renderMedicines();
});

// Stock Interaction (Delegation) - Input and Buttons
medicineTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('stock-btn')) {
        const id = parseInt(e.target.dataset.id);
        const shop = e.target.dataset.shop;
        const med = medicines.find(m => m.id === id);
        
        if (med && shop) {
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
                renderMedicines();
            } else if (amountStr !== null) { // Don't alert if user cancelled prompt
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
            const diff = newStock - med.stock[shop];
            if (diff > 0) {
                logTransaction('in', diff, med.price, shop, med.name);
            } else if (diff < 0) {
                logTransaction('out', Math.abs(diff), med.price, shop, med.name);
            }
            med.stock[shop] = newStock;
            renderMedicines();
        }
    }
    
    // Handle Price Change
    if (e.target.classList.contains('price-input')) {
        const id = parseInt(e.target.dataset.id);
        const med = medicines.find(m => m.id === id);
        const newPrice = parseFloat(e.target.value);
        
        if (med && !isNaN(newPrice) && newPrice >= 0) {
            med.price = newPrice.toFixed(2);
            // No need to re-render entire table, just update value if needed or leave as is
            // But re-rendering ensures consistency
            // renderMedicines(); // Optional, might lose focus
        }
    }
});

medicineTableBody.addEventListener('input', (e) => {
    if (e.target.classList.contains('stock-input')) {
        const input = e.target;
        const value = input.value;
        const len = value.length || 1;
        
        // Base width + width per character
        // Using 14px per character, adjust as needed for your font
        const newWidth = 20 + (len * 14); 
        
        // Apply width, but don't let it get smaller than a minimum
        input.style.width = `${Math.max(120, newWidth)}px`;
    }
});

// Quick Actions
quickAddBtn.addEventListener('click', () => {
    addItemModal.classList.add('show');
});

quickStatsBtn.addEventListener('click', () => {
    statsBtn.click();
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
    alertsModal.classList.add('show');
});

closeAlertsBtn.addEventListener('click', () => {
    alertsModal.classList.remove('show');
});

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
const shopTabsContainer = document.getElementById('shop-tabs-container');

function updateStats() {
    const shop = statsShopSelect ? statsShopSelect.value : 'all';
    const day = statsDayDropdown ? statsDayDropdown.value : 'all';
    const month = statsMonthDropdown ? statsMonthDropdown.value : null;
    const year = statsYearDropdown ? statsYearDropdown.value : null;
    renderStockMovementReport(shop, month, year, day);
}

// Handle Shop Tabs
if (shopTabsContainer) {
    shopTabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('shop-tab')) {
            document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));
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
        document.querySelectorAll('.shop-tab').forEach(tab => {
            if (tab.dataset.value === value) tab.classList.add('active');
            else tab.classList.remove('active');
        });
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

