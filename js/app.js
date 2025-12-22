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

const medicineContainer = document.getElementById('medicine-list');
const groupBySelect = document.getElementById('group-by');
const searchBar = document.getElementById('search-bar');

// Modal Elements
const addItemBtn = document.getElementById('add-item-btn');
const addItemModal = document.getElementById('add-item-modal');
const cancelBtn = document.getElementById('cancel-btn');
const addItemForm = document.getElementById('add-item-form');

function getTotalStock(med) {
    return med.stock.main + med.stock.g1 + med.stock.g2 + med.stock.g3;
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
                        <span class="stock-count">${med.stock.main}</span>
                        <button class="stock-btn plus" data-id="${med.id}" data-shop="main">+</button>
                    </div>
                </div>
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
        const shop = e.target.dataset.shop; // 'main', 'g1', 'g2', 'g3'
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

// Modal Logic
addItemBtn.addEventListener('click', () => {
    addItemModal.classList.add('show');
});

cancelBtn.addEventListener('click', () => {
    addItemModal.classList.remove('show');
    addItemForm.reset();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addItemModal) {
        addItemModal.classList.remove('show');
        addItemForm.reset();
    }
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
    renderMedicines();
    
    addItemModal.classList.remove('show');
    addItemForm.reset();
});
