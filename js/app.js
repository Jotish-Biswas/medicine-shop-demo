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
    { id: 1, name: 'Napa Extra', company: 'Beximco', form: 'Tablet', price: '2.50', stock: 50, lowStockThreshold: 20 },
    { id: 2, name: 'Seclo 20', company: 'Square', form: 'Capsule', price: '5.00', stock: 15, lowStockThreshold: 20 },
    { id: 3, name: 'Maxpro 20', company: 'Renata', form: 'Capsule', price: '7.00', stock: 100, lowStockThreshold: 30 },
    { id: 4, name: 'Alatrol', company: 'Square', form: 'Tablet', price: '3.00', stock: 5, lowStockThreshold: 10 },
    { id: 5, name: 'Bizoran', company: 'Incepta', form: 'Tablet', price: '12.00', stock: 45, lowStockThreshold: 15 },
    { id: 6, name: 'Napa Syrup', company: 'Beximco', form: 'Syrup', price: '35.00', stock: 8, lowStockThreshold: 10 },
];

const medicineContainer = document.getElementById('medicine-list');

function renderMedicines(meds) {
    medicineContainer.innerHTML = '';
    meds.forEach(med => {
        const card = document.createElement('div');
        card.className = `medicine-card ${med.stock <= med.lowStockThreshold ? 'low-stock' : ''}`;
        card.innerHTML = `
            <div class="medicine-header">
                <span class="medicine-name">${med.name}</span>
                <span class="medicine-form">${med.form}</span>
            </div>
            <div class="medicine-company">${med.company}</div>
            <div class="medicine-details">
                <span class="price">৳${med.price}</span>
                <div class="stock-control">
                    <button class="stock-btn minus" data-id="${med.id}">-</button>
                    <span class="stock-count">${med.stock}</span>
                    <button class="stock-btn plus" data-id="${med.id}">+</button>
                </div>
            </div>
            <div class="low-stock-indicator" data-i18n="low_stock">Low Stock</div>
        `;
        medicineContainer.appendChild(card);
    });
    // Re-apply translations to new elements
    if (typeof updateText === 'function') {
        updateText();
    }
}

// Initial Render
renderMedicines(medicines);

// Search Functionality
const searchBar = document.getElementById('search-bar');
searchBar.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredMedicines = medicines.filter(med => 
        med.name.toLowerCase().includes(searchTerm) || 
        med.company.toLowerCase().includes(searchTerm)
    );
    renderMedicines(filteredMedicines);
});

// Stock Interaction (Delegation)
medicineContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('stock-btn')) {
        const id = parseInt(e.target.dataset.id);
        const med = medicines.find(m => m.id === id);
        
        if (e.target.classList.contains('plus')) {
            med.stock++;
        } else if (e.target.classList.contains('minus')) {
            if (med.stock > 0) med.stock--;
        }
        
        renderMedicines(medicines);
    }
});
