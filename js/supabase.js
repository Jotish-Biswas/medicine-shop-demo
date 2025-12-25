// =============================================
// SUPABASE CONFIGURATION
// =============================================
const SUPABASE_URL = 'https://pmassayjacceepanxbkt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXNzYXlqYWNjZWVwYW54Ymt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTU2MTMsImV4cCI6MjA4MjIzMTYxM30.-TjfMNsXU7exNsLKBxb3SbNF4uFK5o8NghA43V8m4b0';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// ACCOUNTS FUNCTIONS
// =============================================

// Login user
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('password', password)
            .single();

        if (error || !data) {
            return { success: false, error: 'Invalid email or password' };
        }

        return { success: true, user: data };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: err.message };
    }
}

// Check if email exists
async function checkEmailExists(email) {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('id, email, name')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !data) {
            return { exists: false };
        }

        return { exists: true, user: data };
    } catch (err) {
        return { exists: false };
    }
}

// Update password
async function updatePassword(email, newPassword) {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .update({ password: newPassword })
            .eq('email', email.toLowerCase());

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// =============================================
// MEDICINES FUNCTIONS
// =============================================

// Get all medicines with stock
async function getMedicines() {
    try {
        const { data: medicines, error } = await supabase
            .from('medicines')
            .select('*')
            .order('name');

        if (error) throw error;

        // Get stock for each medicine
        for (let med of medicines) {
            const { data: stockData } = await supabase
                .from('stock')
                .select('shop_id, quantity')
                .eq('medicine_id', med.id);

            med.stock = {};
            if (stockData) {
                stockData.forEach(s => {
                    med.stock[s.shop_id] = s.quantity;
                });
            }
        }

        return { success: true, data: medicines };
    } catch (err) {
        console.error('Get medicines error:', err);
        return { success: false, error: err.message };
    }
}

// Add new medicine
async function addMedicine(medicine) {
    try {
        const { data, error } = await supabase
            .from('medicines')
            .insert({
                name: medicine.name,
                company: medicine.company,
                form: medicine.form,
                price: medicine.price,
                low_stock_threshold: medicine.lowStockThreshold || 20,
                mfg_date: medicine.mfgDate,
                exp_date: medicine.expDate
            })
            .select()
            .single();

        if (error) throw error;

        // Add stock entries for each shop
        if (medicine.stock) {
            const stockEntries = Object.entries(medicine.stock).map(([shopId, qty]) => ({
                medicine_id: data.id,
                shop_id: shopId,
                quantity: qty
            }));

            await supabase.from('stock').insert(stockEntries);
        }

        return { success: true, data };
    } catch (err) {
        console.error('Add medicine error:', err);
        return { success: false, error: err.message };
    }
}

// Update medicine
async function updateMedicine(id, updates) {
    try {
        const { error } = await supabase
            .from('medicines')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Delete medicine
async function deleteMedicine(id) {
    try {
        const { error } = await supabase
            .from('medicines')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Update stock
async function updateStock(medicineId, shopId, quantity) {
    try {
        // Try to update existing
        const { data: existing } = await supabase
            .from('stock')
            .select('id')
            .eq('medicine_id', medicineId)
            .eq('shop_id', shopId)
            .single();

        if (existing) {
            await supabase
                .from('stock')
                .update({ quantity })
                .eq('medicine_id', medicineId)
                .eq('shop_id', shopId);
        } else {
            await supabase
                .from('stock')
                .insert({ medicine_id: medicineId, shop_id: shopId, quantity });
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// =============================================
// SHOPS FUNCTIONS
// =============================================

// Get all shops
async function getShops() {
    try {
        const { data, error } = await supabase
            .from('shops')
            .select('*')
            .order('created_at');

        if (error) throw error;

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Add shop
async function addShop(shopId, name) {
    try {
        const { data, error } = await supabase
            .from('shops')
            .insert({ shop_id: shopId, name })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Delete shop
async function deleteShop(shopId) {
    try {
        const { error } = await supabase
            .from('shops')
            .delete()
            .eq('shop_id', shopId);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// =============================================
// TRANSACTIONS FUNCTIONS
// =============================================

// Log transaction
async function logTransaction(medicineId, shopId, type, quantity, price) {
    try {
        const { error } = await supabase
            .from('transactions')
            .insert({
                medicine_id: medicineId,
                shop_id: shopId,
                type,
                quantity,
                price
            });

        if (error) throw error;

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Get transactions
async function getTransactions(filters = {}) {
    try {
        let query = supabase.from('transactions').select('*');

        if (filters.startDate) {
            query = query.gte('date', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('date', filters.endDate);
        }
        if (filters.shopId) {
            query = query.eq('shop_id', filters.shopId);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// =============================================
// PARTIES (DEBTORS/CREDITORS) FUNCTIONS
// =============================================

// Get all parties
async function getParties(type = null) {
    try {
        let query = supabase.from('parties').select('*');

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Get payments for each party
        for (let party of data) {
            const { data: payments } = await supabase
                .from('party_payments')
                .select('*')
                .eq('party_id', party.id)
                .order('date', { ascending: false });

            party.payments = payments || [];
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Add party
async function addParty(name, type, totalDue) {
    try {
        const { data, error } = await supabase
            .from('parties')
            .insert({ name, type, total_due: totalDue })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Add payment to party
async function addPartyPayment(partyId, amount, paymentType, billNumber) {
    try {
        const { error } = await supabase
            .from('party_payments')
            .insert({
                party_id: partyId,
                amount,
                payment_type: paymentType,
                bill_number: billNumber
            });

        if (error) throw error;

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Update party total due
async function updatePartyDue(partyId, totalDue) {
    try {
        const { error } = await supabase
            .from('parties')
            .update({ total_due: totalDue })
            .eq('id', partyId);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// =============================================
// EXPORT FUNCTIONS
// =============================================
window.db = {
    // Auth
    loginUser,
    checkEmailExists,
    updatePassword,
    
    // Medicines
    getMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    updateStock,
    
    // Shops
    getShops,
    addShop,
    deleteShop,
    
    // Transactions
    logTransaction,
    getTransactions,
    
    // Parties
    getParties,
    addParty,
    addPartyPayment,
    updatePartyDue
};

console.log('✅ Supabase connected successfully!');
