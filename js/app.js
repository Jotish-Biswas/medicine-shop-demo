// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = 'https://forfciiqmuhvuowhzgrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvcmZjaWlxbXVodnVvd2h6Z3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzU3ODcsImV4cCI6MjA4MzExMTc4N30.dPmQC0zec0IVKTdbLXsg4evXPjrmkAIaciAmJ-QW3k0';

// =============================================
// AUTH CHECK - Redirect to login if not logged in
// =============================================
(function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.replace('login.html');
        return;
    }
})();

// Prevent back button after logout
window.addEventListener('pageshow', function(event) {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.replace('login.html');
    }
});

// Use existing supabase client or create new one
let supabaseClient;
if (typeof supabase !== 'undefined' && supabase.from) {
    supabaseClient = supabase;
} else {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// =============================================
// GLOBAL VARIABLES
// =============================================
let shops = [];
let medicines = [];
let transactions = [];
let isLoading = true;

// =============================================
// THEME TOGGLE
// =============================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

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

// =============================================
// LOGOUT
// =============================================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loggedInUser');
        // Use replace to prevent back button from returning
        window.location.replace('login.html');
    });
}

// =============================================
// LOAD DATA FROM SUPABASE
// =============================================
async function loadShops() {
    try {
        const { data, error } = await supabaseClient
            .from('shops')
            .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
            shops = data.map(s => ({ id: s.shop_id, name: s.name, dbId: s.id }));
        } else {
            // No shops in database, use defaults
            shops = [
                { id: 'main', name: 'Main Store' },
                { id: 'a', name: 'Shop A' },
                { id: 'b', name: 'Shop B' },
                { id: 'c', name: 'Shop C' },
                { id: 'd', name: 'Shop D' },
                { id: 'e', name: 'Shop E' }
            ];
        }
        console.log('✅ Shops loaded:', shops.length);
    } catch (err) {
        console.error('Error loading shops:', err);
        // Fallback to default shops
        shops = [
            { id: 'main', name: 'Main Store' },
            { id: 'a', name: 'Shop A' },
            { id: 'b', name: 'Shop B' },
            { id: 'c', name: 'Shop C' },
            { id: 'd', name: 'Shop D' },
            { id: 'e', name: 'Shop E' }
        ];
    }
}

async function loadMedicines() {
    try {
        const { data: medsData, error } = await supabaseClient
            .from('medicines')
            .select('*')
            .order('name');

        if (error) throw error;

        // Get stock for each medicine
        const { data: stockData } = await supabaseClient
            .from('stock')
            .select('*');

        medicines = medsData.map(med => {
            const stock = {};

            // IMPORTANT FIX: Initialize stock for ALL shops with 0
            // This ensures every product has entries for all shops
            shops.forEach(shop => {
                stock[shop.id] = 0;
            });

            // Then update with actual stock values from database
            if (stockData) {
                stockData
                    .filter(s => s.medicine_id === med.id)
                    .forEach(s => {
                        stock[s.shop_id] = s.quantity;
                    });
            }

            return {
                id: med.id,
                name: med.name,
                company: med.company,
                form: med.form,
                price: med.price,
                lowStockThreshold: med.low_stock_threshold,
                mfgDate: med.mfg_date,
                expDate: med.exp_date,
                stock: stock
            };
        });

        console.log('✅ Medicines loaded:', medicines.length);
    } catch (err) {
        console.error('Error loading medicines:', err);
        medicines = [];
    }
}

async function loadTransactions() {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        // Map DB rows to the local transaction shape used by the UI
        transactions = (data || []).map(row => {
            // Find medicine name from loaded medicines if available
            const med = medicines.find(m => m.id === row.medicine_id || m.id === parseInt(row.medicine_id));
            const medicineName = med ? med.name : (row.medicine_name || row.medicineName || 'Unknown');

            // Shop: prefer shop_id, fallback to shop
            const shop = row.shop_id || row.shop || row.shopId || 'all';

            return {
                id: row.id, // Store the database ID for deletion
                type: row.type,
                quantity: row.quantity,
                price: row.price,
                shop: shop,
                medicineName: medicineName,
                date: row.date || row.created_at || new Date().toISOString(),
                stockAfterTransaction: row.stock_after_transaction || null
            };
        });
        console.log('✅ Transactions loaded:', transactions.length);
    } catch (err) {
        console.error('Error loading transactions:', err);
        transactions = [];
    }
}

// =============================================
// SAVE DATA TO SUPABASE
// =============================================
async function addShopToDb(name) {
    const shopId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    try {
        const { data, error } = await supabaseClient
            .from('shops')
            .insert({ shop_id: shopId, name: name })
            .select()
            .single();

        if (error) throw error;
        
        shops.push({ id: shopId, name: name, dbId: data.id });
        return { success: true };
    } catch (err) {
        console.error('Error adding shop:', err);
        return { success: false, error: err.message };
    }
}

async function deleteShopFromDb(shopId) {
    try {
        const { error } = await supabaseClient
            .from('shops')
            .delete()
            .eq('shop_id', shopId);

        if (error) throw error;
        
        shops = shops.filter(s => s.id !== shopId);
        return { success: true };
    } catch (err) {
        console.error('Error deleting shop:', err);
        return { success: false, error: err.message };
    }
}

async function addMedicineToDb(medicine) {
    try {
        const { data, error } = await supabaseClient
            .from('medicines')
            .insert({
                name: medicine.name,
                company: medicine.company,
                form: medicine.form,
                price: parseFloat(medicine.price),
                low_stock_threshold: parseInt(medicine.lowStockThreshold) || 20,
                mfg_date: medicine.mfgDate || null,
                exp_date: medicine.expDate || null
            })
            .select()
            .single();

        if (error) throw error;

        // Add stock entries
        if (medicine.stock) {
            const stockEntries = Object.entries(medicine.stock)
                .filter(([_, qty]) => qty > 0)
                .map(([shopId, qty]) => ({
                    medicine_id: data.id,
                    shop_id: shopId,
                    quantity: parseInt(qty)
                }));

            if (stockEntries.length > 0) {
                await supabaseClient.from('stock').insert(stockEntries);
            }
        }

        return { success: true, data };
    } catch (err) {
        console.error('Error adding medicine:', err);
        return { success: false, error: err.message };
    }
}

async function updateMedicineInDb(id, updates) {
    try {
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.company !== undefined) dbUpdates.company = updates.company;
        if (updates.form !== undefined) dbUpdates.form = updates.form;
        if (updates.price !== undefined) dbUpdates.price = parseFloat(updates.price);
        if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = parseInt(updates.lowStockThreshold);
        if (updates.mfgDate !== undefined) dbUpdates.mfg_date = updates.mfgDate;
        if (updates.expDate !== undefined) dbUpdates.exp_date = updates.expDate;

        const { error } = await supabaseClient
            .from('medicines')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error updating medicine:', err);
        return { success: false, error: err.message };
    }
}

async function deleteMedicineFromDb(id) {
    try {
        // Remove related transactions first to avoid foreign key constraint errors
        try {
            await supabaseClient
                .from('transactions')
                .delete()
                .eq('medicine_id', id);
        } catch (txErr) {
            console.warn('Could not delete related transactions (may not exist):', txErr.message || txErr);
        }

        // Remove related stock entries
        try {
            await supabaseClient
                .from('stock')
                .delete()
                .eq('medicine_id', id);
        } catch (stockErr) {
            console.warn('Could not delete related stock entries (may not exist):', stockErr.message || stockErr);
        }

        const { error } = await supabaseClient
            .from('medicines')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        console.error('Error deleting medicine:', err);
        return { success: false, error: err.message };
    }
}

async function updateStockInDb(medicineId, shopId, quantity) {
    try {
        // Check if stock entry exists
        const { data: existing } = await supabaseClient
            .from('stock')
            .select('id')
            .eq('medicine_id', medicineId)
            .eq('shop_id', shopId)
            .single();

        if (existing) {
            await supabaseClient
                .from('stock')
                .update({ quantity: parseInt(quantity) })
                .eq('medicine_id', medicineId)
                .eq('shop_id', shopId);
        } else {
            await supabaseClient
                .from('stock')
                .insert({
                    medicine_id: medicineId,
                    shop_id: shopId,
                    quantity: parseInt(quantity)
                });
        }

        return { success: true };
    } catch (err) {
        console.error('Error updating stock:', err);
        return { success: false, error: err.message };
    }
}

async function logTransactionToDb(type, quantity, price, shopId, medicineId, stockAfterTransaction) {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .insert({
                medicine_id: medicineId,
                shop_id: shopId,
                type: type,
                quantity: parseInt(quantity),
                price: parseFloat(price),
                stock_after_transaction: parseInt(stockAfterTransaction)
            })
            .select();

        if (error) throw error;

        console.log('✅ Transaction saved to DB:', {
            medicineId, shopId, type, quantity: parseInt(quantity), price: parseFloat(price), stockAfterTransaction, inserted: data && data.length ? data[0] : null
        });

        return { success: true, data };
    } catch (err) {
        console.error('Error logging transaction:', err);
        return { success: false, error: err.message };
    }
}

// =============================================
// LEGACY FUNCTIONS (Modified for Supabase)
// =============================================
function saveShops() {
    // No longer needed - data is in Supabase
}

function addShop(name) {
    addShopToDb(name).then(result => {
        if (result.success) {
            renderTableHeaders();
            renderMedicines();
            renderShopTabs();
            renderShopInputs();
        } else {
            alert('Failed to add shop: ' + result.error);
        }
    });
}

function saveMedicines() {
    // No longer needed - data is in Supabase
}

function logTransaction(type, quantity, price, shop, medicineName, medicineId, stockAfterTransaction) {
    // Log to local array
    const transaction = {
        type: type,
        quantity: quantity,
        price: parseFloat(price),
        shop: shop,
        medicineName: medicineName,
        date: new Date().toISOString(),
        stockAfterTransaction: stockAfterTransaction
    };
    transactions.push(transaction);
    console.log('Local transaction pushed:', transaction, 'Total transactions (local):', transactions.length);

    // Also save to Supabase
    logTransactionToDb(type, quantity, price, shop, medicineId, stockAfterTransaction).then(res => {
        if (!res.success) console.error('Failed to save transaction to DB:', res.error);
    });
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

const productTableBody = document.getElementById('product-table-body');
const groupBy = document.getElementById('group-by');
const searchBar = document.getElementById('search-bar');
const shopTabsContainer = document.getElementById('shop-tabs');
const totalInventoryValueEl = document.getElementById('total-inventory-value');
const lowStockCountEl = document.getElementById('low-stock-count');

// Dashboard Elements
const quickAddBtn = document.getElementById('quick-add-btn');
const quickStatsBtn = document.getElementById('quick-stats-btn');
const addProductBtn = document.getElementById('add-product-btn');

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
    const thead = document.getElementById('product-table-head');
    if (!thead) return;
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    // MFG and EXP now come right after Total Stock (MM/YY format)
    const headers = ['#', 'Name', 'Company', 'Price', 'Total Stock', 'MFG', 'EXP'];
    const activeShop = document.querySelector('.shop-tab.active')?.dataset.shop || 'all';

    let headerHTML = headers.map(h => `<th>${h}</th>`).join('');
    
    if (activeShop === 'all') {
        const allShops = getShops();
        const shopHeaders = allShops.map(s => `<th>${s.name}</th>`).join('');
        headerHTML += shopHeaders;
    } else {
        headerHTML += '<th>Stock</th>';
    }
    
    tr.innerHTML = headerHTML;
    thead.appendChild(tr);
}

function createMedicineRow(medicine, index) {
    const tr = document.createElement('tr');
    const activeShop = document.querySelector('.shop-tab.active')?.dataset.shop || 'all';
    const allShops = getShops();
    const totalStock = getTotalStock(medicine);

    // Format dates as MM/YY
    const formatDateMMYY = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${month}/${year}`;
    };
    const mfgDate = formatDateMMYY(medicine.mfgDate);
    const expDate = formatDateMMYY(medicine.expDate);
    
    // Check if expired or expiring soon
    const today = new Date();
    const expDateObj = medicine.expDate ? new Date(medicine.expDate) : null;
    const isExpired = expDateObj && expDateObj < today;
    const isExpiringSoon = expDateObj && !isExpired && (expDateObj - today) / (1000 * 60 * 60 * 24) <= 30;

    // Mfg Date and Exp Date now come right after Total Stock
    let cells = `
        <td>${index + 1}</td>
        <td>
            <span class="editable-name" data-id="${medicine.id}" title="Click to edit">${medicine.name}</span>
            ${totalStock <= (medicine.lowStockThreshold || 10) ? '<span class="low-stock-dot"></span>' : ''}
        </td>
        <td>
            <span class="editable-company" data-id="${medicine.id}" title="Click to edit">${medicine.company}</span>
        </td>
        <td>
            <input type="number" class="price-input" data-id="${medicine.id}" value="${medicine.price}" step="0.01" min="0" style="width: ${Math.max(80, 20 + (String(medicine.price).length * 12))}px">
        </td>
        <td style="font-weight: bold; text-align: center;">${totalStock}</td>
        <td>${mfgDate}</td>
        <td class="${isExpired ? 'expired-date' : isExpiringSoon ? 'expiring-soon' : ''}">${expDate}</td>
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

    // Sort medicines with special handling for 'fr' numbers
    filteredMedicines.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        
        // Check if names end with number + 'fr' pattern (e.g., "18fr", "8fr")
        const frPatternA = nameA.match(/(\d+)fr$/i);
        const frPatternB = nameB.match(/(\d+)fr$/i);
        
        // Get base names without the fr part
        const baseNameA = frPatternA ? nameA.substring(0, nameA.length - frPatternA[0].length).trim() : nameA;
        const baseNameB = frPatternB ? nameB.substring(0, nameB.length - frPatternB[0].length).trim() : nameB;
        
        // If base names are the same (same product, different fr sizes)
        if (baseNameA === baseNameB) {
            // If both have fr numbers, sort numerically by fr value
            if (frPatternA && frPatternB) {
                return parseInt(frPatternA[1]) - parseInt(frPatternB[1]);
            }
            // If only one has fr, that comes after
            if (frPatternA) return 1;
            if (frPatternB) return -1;
        }
        
        // Otherwise, sort alphabetically
        return nameA.localeCompare(nameB);
    });

    if (!productTableBody) return;
    productTableBody.innerHTML = '';
    renderTableHeaders();

    if (group === 'company') {
        const groupedByCompany = filteredMedicines.reduce((acc, med) => {
            (acc[med.company] = acc[med.company] || []).push(med);
            return acc;
        }, {});

        Object.keys(groupedByCompany).sort().forEach(company => {
            const groupHeader = document.createElement('tr');
            groupHeader.innerHTML = `<td colspan="100%" style="background-color: var(--table-header-bg); font-weight: bold;">${company}</td>`;
            productTableBody.appendChild(groupHeader);
            groupedByCompany[company].forEach((med, index) => {
                productTableBody.appendChild(createMedicineRow(med, index));
            });
        });
    } else {
        filteredMedicines.forEach((med, index) => {
            productTableBody.appendChild(createMedicineRow(med, index));
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
// Amount Modal Elements
const amountModal = document.getElementById('amount-modal');
const amountForm = document.getElementById('amount-form');
const amountInput = document.getElementById('amount-input');
const amountCancelBtn = document.getElementById('amount-cancel-btn');
const amountModalTitle = document.getElementById('amount-modal-title');

let pendingStockAction = null; // Store pending action details

function showAmountModal(actionType, medId, shop, medName) {
    pendingStockAction = { actionType, medId, shop, medName };
    
    if (amountModalTitle) {
        const actionText = actionType === 'plus' ? 'Add Stock' : 'Remove Stock';
        amountModalTitle.textContent = `${actionText} - ${medName}`;
    }
    
    if (amountInput) {
        amountInput.value = 1;
        amountInput.focus();
    }
    
    if (amountModal) amountModal.classList.add('show');
}

if (amountForm) {
    amountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!pendingStockAction) return;
        
        const amount = parseInt(amountInput.value);
        const { actionType, medId, shop } = pendingStockAction;
        const med = medicines.find(m => m.id === medId);
        
        if (!med || isNaN(amount) || amount <= 0) {
            alert("Please enter a valid positive number.");
            return;
        }
        
        if (actionType === 'plus') {
            med.stock[shop] = (med.stock[shop] || 0) + amount;
            logTransaction('in', amount, med.price, shop, med.name, med.id, med.stock[shop]);
            updateStockInDb(med.id, shop, med.stock[shop]);
        } else if (actionType === 'minus') {
            if ((med.stock[shop] || 0) >= amount) {
                med.stock[shop] = (med.stock[shop] || 0) - amount;
                logTransaction('out', amount, med.price, shop, med.name, med.id, med.stock[shop]);
                updateStockInDb(med.id, shop, med.stock[shop]);
            } else {
                alert("Not enough stock to subtract.");
                return;
            }
        }
        
        const filter = searchBar ? searchBar.value : '';
        const group = groupBy ? groupBy.value : 'all';
        renderMedicines(filter, group);
        
        amountModal.classList.remove('show');
        pendingStockAction = null;
    });
}

if (amountCancelBtn) {
    amountCancelBtn.addEventListener('click', () => {
        if (amountModal) amountModal.classList.remove('show');
        pendingStockAction = null;
    });
}

// Close amount modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === amountModal) {
        amountModal.classList.remove('show');
        pendingStockAction = null;
    }
});

if (productTableBody) {
    productTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('stock-btn')) {
            const id = parseInt(e.target.dataset.id);
            const shop = e.target.dataset.shop || 'main';
            const med = medicines.find(m => m.id === id);
            
            if (med) {
                const actionType = e.target.classList.contains('plus') ? 'plus' : 'minus';
                showAmountModal(actionType, id, shop, med.name);
            }
        }
        
        // Handle medicine name click to edit
        if (e.target.classList.contains('editable-name')) {
            const id = parseInt(e.target.dataset.id);
            const med = medicines.find(m => m.id === id);
            if (!med) return;
            
            const currentName = med.name;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'name-edit-input';
            input.style.cssText = 'width: 100%; padding: 0.3rem; border: 2px solid var(--primary-color); border-radius: 4px; font-size: inherit;';
            
            const span = e.target;
            span.replaceWith(input);
            input.focus();
            input.select();
            
            const saveEdit = async () => {
                const newName = input.value.trim();
                if (newName && newName !== currentName) {
                    med.name = newName;
                    await updateMedicineInDb(id, { name: newName });
                }
                const newSpan = document.createElement('span');
                newSpan.className = 'editable-name';
                newSpan.dataset.id = id;
                newSpan.title = 'Click to edit';
                newSpan.textContent = med.name;
                input.replaceWith(newSpan);
            };
            
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    input.blur();
                } else if (event.key === 'Escape') {
                    const newSpan = document.createElement('span');
                    newSpan.className = 'editable-name';
                    newSpan.dataset.id = id;
                    newSpan.title = 'Click to edit';
                    newSpan.textContent = currentName;
                    input.replaceWith(newSpan);
                }
            });
        }
        
        // Handle company name click to edit
        if (e.target.classList.contains('editable-company')) {
            const id = parseInt(e.target.dataset.id);
            const med = medicines.find(m => m.id === id);
            if (!med) return;
            
            const currentCompany = med.company;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentCompany;
            input.className = 'company-edit-input';
            input.style.cssText = 'width: 100%; padding: 0.3rem; border: 2px solid var(--primary-color); border-radius: 4px; font-size: inherit;';
            
            const span = e.target;
            span.replaceWith(input);
            input.focus();
            input.select();
            
            const saveEdit = async () => {
                const newCompany = input.value.trim();
                if (newCompany && newCompany !== currentCompany) {
                    med.company = newCompany;
                    await updateMedicineInDb(id, { company: newCompany });
                }
                const newSpan = document.createElement('span');
                newSpan.className = 'editable-company';
                newSpan.dataset.id = id;
                newSpan.title = 'Click to edit';
                newSpan.textContent = med.company;
                input.replaceWith(newSpan);
            };
            
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    input.blur();
                } else if (event.key === 'Escape') {
                    const newSpan = document.createElement('span');
                    newSpan.className = 'editable-company';
                    newSpan.dataset.id = id;
                    newSpan.title = 'Click to edit';
                    newSpan.textContent = currentCompany;
                    input.replaceWith(newSpan);
                }
            });
        }
    });

    productTableBody.addEventListener('change', (e) => {
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
                    logTransaction('in', diff, med.price, shop, med.name, med.id, newStock);
                } else if (diff < 0) {
                    logTransaction('out', Math.abs(diff), med.price, shop, med.name, med.id, newStock);
                }
                med.stock[shop] = newStock;
                // Update in Supabase
                updateStockInDb(med.id, shop, newStock);
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
                // Update in Supabase
                updateMedicineInDb(id, { price: newPrice });
            }
        }
    });

    productTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('stock-input')) {
            const input = e.target;
            const value = input.value;
            const len = value.length || 1;
            const newWidth = 20 + (len * 14); 
            input.style.width = `${Math.max(120, newWidth)}px`;
        }
        
        // Auto-expand price input based on digits
        if (e.target.classList.contains('price-input')) {
            const input = e.target;
            const value = input.value;
            const len = value.length || 1;
            const newWidth = 20 + (len * 12); 
            input.style.width = `${Math.max(80, newWidth)}px`;
        }
    });
} // End of productTableBody check

// Quick Actions
if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
        if (addItemModal) addItemModal.classList.add('show');
    });
}

if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
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
    // Also filter out transactions without valid medicine name
    const filteredTransactions = transactions.filter(t => {
        // Skip if no medicine name or unknown
        if (!t.medicineName || t.medicineName === 'Unknown' || t.medicineName.trim() === '') {
            return false;
        }

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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No transactions found for this period.</td></tr>';
        return;
    }

    filteredTransactions.forEach((t, index) => {
        const row = document.createElement('tr');
        const tDate = new Date(t.date);
        const day = tDate.getDate(); // Just the day number

        // Get shop name from transaction's shop id
        const transactionShop = shops.find(s => s.id === t.shop);
        const shopName = transactionShop ? transactionShop.name : t.shop;

        // Use the stock value saved at the time of transaction
        // If stockAfterTransaction is null (old transactions), fall back to current stock
        let presentStock = '-';
        let lowStockWarning = '';

        if (t.stockAfterTransaction !== null && t.stockAfterTransaction !== undefined) {
            // Use saved stock value from transaction
            presentStock = t.stockAfterTransaction;
        } else {
            // Fallback for old transactions without saved stock
            const med = medicines.find(m => m.name === t.medicineName);
            if (med) {
                presentStock = med.stock[t.shop] || 0;
            }
        }

        // Check for low stock warning
        const med = medicines.find(m => m.name === t.medicineName);
        if (med && presentStock !== '-' && presentStock < (med.lowStockThreshold || 10)) {
            lowStockWarning = '<span title="Low Stock">⚠️</span>';
        }

        // Zebra striping
        if (index % 2 === 0) row.style.backgroundColor = 'var(--bg-color)';

        const added = t.type === 'in' ? `+${t.quantity}` : '-';
        const out = t.type === 'out' ? `-${t.quantity}` : '-';

        const addedStyle = t.type === 'in' ? 'color: var(--primary-color); font-weight: 500;' : 'color: var(--text-secondary); opacity: 0.3;';
        const outStyle = t.type === 'out' ? 'color: var(--danger-color); font-weight: 500;' : 'color: var(--text-secondary); opacity: 0.3;';

        row.innerHTML = `
            <td style="padding: 1rem; text-align: center; color: var(--text-secondary); font-weight: 500;">${day}</td>
            <td style="padding: 1rem; font-weight: 500;">${t.medicineName}</td>
            <td style="padding: 1rem; text-align: center; font-weight: 500; color: var(--primary-color);">${shopName}</td>
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

if (statsBtn) {
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
        if (statsModal) statsModal.classList.add('show');
    });
}

// Reset Monthly Sales Button
const resetMonthlySalesBtn = document.getElementById('reset-monthly-sales-btn');
if (resetMonthlySalesBtn) {
    resetMonthlySalesBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to reset monthly sales? This will delete all out transactions from this month.')) {
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter transactions to find current month's 'out' transactions with their IDs
        const transactionsToDelete = transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'out' &&
                   tDate.getMonth() === currentMonth &&
                   tDate.getFullYear() === currentYear &&
                   t.id; // Must have a database ID
        });

        console.log('Deleting', transactionsToDelete.length, 'transactions');

        // Delete from Supabase using IDs
        try {
            let deletedCount = 0;
            for (const trans of transactionsToDelete) {
                try {
                    const { error } = await supabaseClient
                        .from('transactions')
                        .delete()
                        .eq('id', trans.id);

                    if (error) {
                        console.warn(`Failed to delete transaction ${trans.id}:`, error);
                    } else {
                        deletedCount++;
                    }
                } catch (delErr) {
                    console.warn(`Error deleting transaction ${trans.id}:`, delErr);
                }
            }

            console.log(`Successfully deleted ${deletedCount} transactions`);

            // Remove from local array
            transactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return !(t.type === 'out' &&
                       tDate.getMonth() === currentMonth &&
                       tDate.getFullYear() === currentYear);
            });

            // Update display
            const stats = getStats();
            document.getElementById('stat-monthly-sales').textContent = `৳${stats.monthlySales}`;
            updateStats();

            alert(`Monthly sales reset successfully! Deleted ${deletedCount} transactions.`);
        } catch (err) {
            console.error('Error resetting monthly sales:', err);
            alert('Failed to reset monthly sales: ' + err.message);
        }
    });
}

// PDF Download Logic
const downloadPdfBtn = document.getElementById('download-pdf-btn');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        try {
            // Check if jsPDF is loaded
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("PDF library not loaded. Please check your internet connection and refresh the page.");
                console.error('jsPDF not loaded');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Get values with fallbacks
            const shopValue = statsShopSelect ? statsShopSelect.value : 'all';
            const shopName = statsShopSelect ? 
                (statsShopSelect.options[statsShopSelect.selectedIndex]?.text || 'All Shops') : 'All Shops';
            const monthName = statsMonthDropdown ? 
                (statsMonthDropdown.options[statsMonthDropdown.selectedIndex]?.text || '') : '';
            const monthNum = statsMonthDropdown ? statsMonthDropdown.value : (new Date().getMonth() + 1);
            const year = statsYearDropdown ? (statsYearDropdown.value || new Date().getFullYear()) : new Date().getFullYear();
            
            doc.setFontSize(18);
            doc.text(`Stock Movement Report`, 14, 22);
            
            doc.setFontSize(12);
            doc.text(`Period: ${monthName} ${year}`, 14, 32);
            
            let yPos = 45;
            
            // If "All Shops" is selected, create separate sections for each shop
            if (shopValue === 'all') {
                const allShops = getShops();
                
                allShops.forEach((shop, shopIndex) => {
                    // Filter transactions for this shop
                    const shopTransactions = transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return t.shop === shop.id &&
                               (tDate.getMonth() + 1) === parseInt(monthNum) &&
                               tDate.getFullYear() === parseInt(year);
                    });
                    
                    if (shopTransactions.length === 0) return;
                    
                    // Check if need new page
                    if (yPos > 240) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    // Shop Header
                    doc.setFillColor(0, 137, 123);
                    doc.rect(14, yPos - 5, 182, 10, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(shop.name, 16, yPos + 2);
                    yPos += 15;
                    
                    // Table Header
                    doc.setFillColor(240, 240, 240);
                    doc.rect(14, yPos - 4, 182, 8, 'F');
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(10);
                    doc.text('Day', 16, yPos + 1);
                    doc.text('Product', 35, yPos + 1);
                    doc.text('In', 110, yPos + 1);
                    doc.text('Out', 130, yPos + 1);
                    doc.text('Stock', 155, yPos + 1);
                    yPos += 10;
                    
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(9);
                    
                    // Sort by date
                    shopTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    shopTransactions.forEach(t => {
                        if (yPos > 270) {
                            doc.addPage();
                            yPos = 20;
                        }
                        
                        const tDate = new Date(t.date);
                        const day = tDate.getDate();
                        const medName = t.medicineName ? t.medicineName.substring(0, 35) : '-';
                        const inQty = t.type === 'in' ? `+${t.quantity}` : '-';
                        const outQty = t.type === 'out' ? `-${t.quantity}` : '-';

                        // Use saved stock value from transaction
                        let stockValue = '-';
                        if (t.stockAfterTransaction !== null && t.stockAfterTransaction !== undefined) {
                            stockValue = t.stockAfterTransaction;
                        } else {
                            // Fallback for old transactions
                            const med = medicines.find(m => m.name === t.medicineName);
                            stockValue = med ? (med.stock[shop.id] || 0) : '-';
                        }

                        doc.text(String(day), 16, yPos);
                        doc.text(medName, 35, yPos);
                        doc.setTextColor(0, 137, 123);
                        doc.text(inQty, 110, yPos);
                        doc.setTextColor(220, 38, 38);
                        doc.text(outQty, 130, yPos);
                        doc.setTextColor(0, 0, 0);
                        doc.text(String(stockValue), 155, yPos);
                        
                        yPos += 7;
                    });
                    
                    yPos += 10;
                });
            } else {
                // Single shop - use existing table
                doc.text(`Shop: ${shopName}`, 14, 38);
                
                const statsTable = document.getElementById('stats-table');
                if (!statsTable) {
                    alert("No data to export. Please view statistics first.");
                    return;
                }
                
                const rows = statsTable.querySelectorAll('tr');
                yPos = 50;
                const lineHeight = 8;
                const colWidths = [15, 50, 30, 20, 20, 25]; // Updated for 6 columns: Day, Product, Shop, Added, Out, Stock
                const startX = 14;
                
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('th, td');
                    let xPos = startX;
                    
                    if (rowIndex === 0) {
                        doc.setFillColor(0, 137, 123);
                        doc.rect(startX, yPos - 5, 160, lineHeight, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(10);
                    } else {
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(9);
                    }
                    
                    cells.forEach((cell, cellIndex) => {
                        const text = cell.textContent.trim().substring(0, 25);
                        doc.text(text, xPos, yPos);
                        xPos += colWidths[cellIndex] || 30;
                    });
                    
                    yPos += lineHeight;
                    
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                });
            }
            
            // Filename: ShopName_MonthName_Year.pdf
            const fileName = `Stock_${shopName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
            doc.save(fileName);
            console.log('PDF saved:', fileName);
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF: ' + err.message);
        }
    });
}

if (closeStatsBtn) {
    closeStatsBtn.addEventListener('click', () => {
        if (statsModal) statsModal.classList.remove('show');
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (addItemModal && e.target === addItemModal) addItemModal.classList.remove('show');
    if (alertsModal && e.target === alertsModal) alertsModal.classList.remove('show');
    if (statsModal && e.target === statsModal) statsModal.classList.remove('show');
});

// Handle Form Submission
if (addItemForm) {
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('new-name').value;
        const company = document.getElementById('new-company').value;
        const price = parseFloat(document.getElementById('new-price').value).toFixed(2);
        
        // Get MM/YY values from select boxes and convert to date string
        const mfgMonth = document.getElementById('new-mfg-month').value;
        const mfgYear = document.getElementById('new-mfg-year').value;
        const expMonth = document.getElementById('new-exp-month').value;
        const expYear = document.getElementById('new-exp-year').value;
        
        const mfgDate = mfgMonth && mfgYear ? `${mfgYear}-${mfgMonth}-01` : null;
        const expDate = expMonth && expYear ? `${expYear}-${expMonth}-01` : null;
        
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
                
                // Update in Supabase
                await updateMedicineInDb(parseInt(editId), {
                    name: name,
                    company: company,
                    price: parseFloat(price),
                    mfgDate: mfgDate,
                expDate: expDate
            });
            
            shops.forEach(shop => {
                const newStock = stock[shop.id];
                const oldStock = med.stock[shop.id] || 0;
                const diff = newStock - oldStock;

                if (diff > 0) {
                    logTransaction('in', diff, price, shop.id, name, med.id, newStock);
                } else if (diff < 0) {
                    logTransaction('out', Math.abs(diff), price, shop.id, name, med.id, newStock);
                }
                med.stock[shop.id] = newStock;
                // Update stock in Supabase
                updateStockInDb(parseInt(editId), shop.id, newStock);
            });
        }
        delete addItemForm.dataset.editId; // Clear edit mode
    } else {
        const newMedicine = {
            name: name,
            company: company,
            form: '', // Type removed
            price: price,
            mfgDate: mfgDate,
            expDate: expDate,
            stock: stock,
            lowStockThreshold: 10 // Default threshold
        };

        // Save to Supabase
        const result = await addMedicineToDb(newMedicine);
        
        if (result.success) {
            newMedicine.id = result.data.id;
            medicines.push(newMedicine);
            
            // Log initial stock as 'in'
            shops.forEach(shop => {
                if (stock[shop.id] > 0) {
                    logTransaction('in', stock[shop.id], price, shop.id, name, result.data.id, stock[shop.id]);
                }
            });
        } else {
            alert('Failed to add medicine: ' + result.error);
            return;
        }
    }

    renderMedicines();
    
    addItemModal.classList.remove('show');
    addItemForm.reset();
    });
} // End of addItemForm check

// Populate Year Dropdowns for MFG and EXP dates
function populateYearDropdowns() {
    const mfgYearSelect = document.getElementById('new-mfg-year');
    const expYearSelect = document.getElementById('new-exp-year');
    
    if (!mfgYearSelect || !expYearSelect) return;
    
    const currentYear = new Date().getFullYear();
    // MFG years: 5 years back to current year
    // EXP years: current year to 10 years ahead
    
    // Clear existing options except first placeholder
    mfgYearSelect.innerHTML = '<option value="">Year</option>';
    expYearSelect.innerHTML = '<option value="">Year</option>';
    
    // MFG: 2010 to 3000
    for (let y = 2010; y <= 3000; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        mfgYearSelect.appendChild(option);
    }
    
    // EXP: 2025 to 3000
    for (let y = 2025; y <= 3000; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        expYearSelect.appendChild(option);
    }
}

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
    confirmDeleteShopBtn.addEventListener('click', async () => {
        const shopId = deleteShopSelect.value;
        if (!shopId) return;

        const shopIndex = shops.findIndex(s => s.id === shopId);
        if (shopIndex > -1) {
            const shopName = shops[shopIndex].name;
            
            // Delete from Supabase
            const result = await deleteShopFromDb(shopId);
            
            if (result.success) {
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
            } else {
                alert('Failed to delete shop: ' + result.error);
            }
        }
    });
}

// Delete Product Modal Logic with Search
const deleteProdSearch = document.getElementById('delete-prod-search');
const deleteProdBtn = document.getElementById('delete-product-btn');
const deleteProdModal = document.getElementById('delete-product-modal');
const deleteProdSelect = document.getElementById('delete-prod-select');
const confirmDeleteProdBtn = document.getElementById('confirm-delete-prod-btn');
const cancelDeleteProdBtn = document.getElementById('cancel-delete-prod-btn');

function renderDeleteProdOptions(filter = '') {
    if (!deleteProdSelect) return;
    deleteProdSelect.innerHTML = '';
    const filtered = medicines
        .filter(med =>
            med.name.toLowerCase().includes(filter.toLowerCase()) ||
            med.company.toLowerCase().includes(filter.toLowerCase())
        );
    if (filtered.length === 0) {
        const option = document.createElement('option');
        option.textContent = "No products found";
        deleteProdSelect.appendChild(option);
        confirmDeleteProdBtn.disabled = true;
    } else {
        confirmDeleteProdBtn.disabled = false;
        filtered.forEach(med => {
            const option = document.createElement('option');
            option.value = med.id;
            option.textContent = `${med.name} - ${med.company}`;
            deleteProdSelect.appendChild(option);
        });
    }
}

if (deleteProdBtn) {
    deleteProdBtn.addEventListener('click', () => {
        if (!deleteProdModal) return;
        renderDeleteProdOptions();
        if (deleteProdSearch) deleteProdSearch.value = '';
        deleteProdModal.classList.add('show');
    });
}

if (deleteProdSearch) {
    deleteProdSearch.addEventListener('input', (e) => {
        renderDeleteProdOptions(e.target.value);
    });
}

if (cancelDeleteProdBtn) {
    cancelDeleteProdBtn.addEventListener('click', () => {
        if (deleteProdModal) deleteProdModal.classList.remove('show');
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === deleteProdModal) {
        deleteProdModal.classList.remove('show');
    }
});

if (confirmDeleteProdBtn) {
    confirmDeleteProdBtn.addEventListener('click', async () => {
        const medId = parseInt(deleteProdSelect.value);
        if (!medId) return;

        const medIndex = medicines.findIndex(m => m.id === medId);
        if (medIndex > -1) {
            // Delete from Supabase
            const result = await deleteMedicineFromDb(medId);

            if (result.success) {
                // Remove product from local array
                medicines.splice(medIndex, 1);

                // Re-render
                renderMedicines();

                deleteProdModal.classList.remove('show');
            } else {
                alert('Failed to delete product: ' + result.error);
            }
        }
    });
}

// Initial Render Calls
async function initApp() {
    console.log('🚀 Initializing app...');
    
    // Load data from Supabase
    await loadShops();
    await loadMedicines();
    await loadTransactions();
    
    console.log('📦 Data loaded - Shops:', shops.length, 'Medicines:', medicines.length);
    
    // Now render UI
    populateYearDropdowns();
    renderShopInputs();
    renderShopTabs();
    renderShopDropdown();
    renderTableHeaders();
    renderMedicines();
    // Update CSS vars for sticky heights
    updateStickyHeights();
    
    console.log('✅ App initialized!');
}

// Start the app
initApp();

// Update CSS variables for header and quick actions heights so sticky tops don't overlap
function updateStickyHeights() {
    try {
        const headerEl = document.querySelector('header');
        const quickEl = document.querySelector('.quick-actions-bar');
        const root = document.documentElement;
        if (headerEl) {
            const h = headerEl.getBoundingClientRect().height;
            root.style.setProperty('--header-height', `${Math.ceil(h)}px`);
        }
        if (quickEl) {
            const q = quickEl.getBoundingClientRect().height;
            root.style.setProperty('--quick-actions-height', `${Math.ceil(q)}px`);
        }
    } catch (err) {
        console.warn('Could not update sticky heights:', err);
    }
}

window.addEventListener('resize', () => {
    updateStickyHeights();
});

// Run once after DOM content fully loaded (in case images/fonts changed sizes)
window.addEventListener('load', () => {
    setTimeout(updateStickyHeights, 50);
});
