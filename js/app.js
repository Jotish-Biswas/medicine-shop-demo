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
    { id: 1, name: 'Napa Extra', company: 'Beximco', form: 'Tablet', price: '2.50', stock: { g1: 20, g2: 15, g3: 15 }, lowStockThreshold: 20 },
    { id: 2, name: 'Seclo 20', company: 'Square', form: 'Capsule', price: '5.00', stock: { g1: 5, g2: 5, g3: 5 }, lowStockThreshold: 20 },
    { id: 3, name: 'Maxpro 20', company: 'Renata', form: 'Capsule', price: '7.00', stock: { g1: 50, g2: 30, g3: 20 }, lowStockThreshold: 30 },
    { id: 4, name: 'Alatrol', company: 'Square', form: 'Tablet', price: '3.00', stock: { g1: 2, g2: 2, g3: 1 }, lowStockThreshold: 10 },
    { id: 5, name: 'Bizoran', company: 'Incepta', form: 'Tablet', price: '12.00', stock: { g1: 15, g2: 15, g3: 15 }, lowStockThreshold: 15 },
    { id: 6, name: 'Napa Syrup', company: 'Beximco', form: 'Syrup', price: '35.00', stock: { g1: 3, g2: 3, g3: 2 }, lowStockThreshold: 10 },
    { id: 7, name: 'Tygacil', company: 'Beximco', form: 'Injection', price: '500.00', stock: { g1: 2, g2: 0, g3: 1 }, lowStockThreshold: 5 },
];

const medicineContainer = document.getElementById('medicine-list');
const groupBySelect = document.getElementById('group-by');
const searchBar = document.getElementById('search-bar');

function getTotalStock(med) {
    return med.stock.g1 + med.stock.g2 + med.stock.g3;
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
                    <span class="shop-label">G1</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="g1">-</button>
                        <span class="stock-count">${med.stock.g1}</span>
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="g1">+</button>
                    </div>
                </div>
                <div class="stock-row">
                    <span class="shop-label">G2</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="g2">-</button>
                        <span class="stock-count">${med.stock.g2}</span>
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="g2">+</button>
                    </div>
                </div>
                <div class="stock-row">
                    <span class="shop-label">G3</span>
                    <div class="stock-control">
                        <button class="stock-btn minus" data-id="${med.id}" data-shop="g3">-</button>
                        <span class="stock-count">${med.stock.g3}</span>
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
        const shop = e.target.dataset.shop; // 'g1', 'g2', 'g3'
        const med = medicines.find(m => m.id === id);
        
        if (med && shop) {
            if (e.target.classList.contains('plus')) {
                med.stock[shop]++;
            } else if (e.target.classList.contains('minus')) {
                if (med.stock[shop] > 0) med.stock[shop]--;
            }
            renderMedicines();
        }
    }
});
