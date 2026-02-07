// Data Storage (akan menggunakan localStorage)
let items = [];
let editingIndex = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    renderTable();
    setupEventListeners();
    
    // Auto-refresh untuk sinkronisasi dengan generator (interval check)
    setInterval(function() {
        const currentItems = localStorage.getItem('bawangGorenStoreItems');
        const storedItems = JSON.stringify(items);
        if (currentItems && currentItems !== storedItems) {
            loadItems();
            renderTable();
        }
    }, 2000); // Check every 2 seconds
});

// Setup Event Listeners
function setupEventListeners() {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
    
    // Close sidebar when clicking nav item on mobile
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
}

// Load items from localStorage
function loadItems() {
    const savedItems = localStorage.getItem('bawangGorenStoreItems');
    if (savedItems) {
        items = JSON.parse(savedItems);
    } else {
        // Data dummy untuk demo
        items = [
            {
                name: 'Bawang Goreng Original',
                barcode: 'BG001',
                description: 'Bawang goreng kualitas premium',
                stock: 150
            },
            {
                name: 'Bawang Goreng Pedas',
                barcode: 'BG002',
                description: 'Bawang goreng dengan rasa pedas',
                stock: 85
            },
            {
                name: 'Bawang Goreng Balado',
                barcode: 'BG003',
                description: 'Bawang goreng rasa balado',
                stock: 120
            }
        ];
        saveItems();
    }
}

// Save items to localStorage
function saveItems() {
    localStorage.setItem('bawangGorenStoreItems', JSON.stringify(items));
}

// Render table
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (items.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        tableBody.innerHTML = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.barcode)}</td>
                <td>${escapeHtml(item.description || '-')}</td>
                <td><strong>${item.stock}</strong></td>
                <td>
                    <button class="btn-action btn-edit" onclick="editItem(${index})">Edit</button>
                    <button class="btn-action btn-delete" onclick="deleteItem(${index})">Hapus</button>
                </td>
            </tr>
        `).join('');
    }
}

// Open modal for adding item
function openAddModal() {
    editingIndex = null;
    document.getElementById('modalTitle').textContent = 'Tambah Barang';
    document.getElementById('itemForm').reset();
    openModal();
}

// Open modal
function openModal() {
    const modal = document.getElementById('itemModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('itemModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('itemForm').reset();
    editingIndex = null;
}

// Edit item
function editItem(index) {
    editingIndex = index;
    const item = items[index];
    
    document.getElementById('modalTitle').textContent = 'Edit Barang';
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemBarcode').value = item.barcode;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemStock').value = item.stock;
    
    openModal();
}

// Delete item
function deleteItem(index) {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
        items.splice(index, 1);
        saveItems();
        renderTable();
        showNotification('Barang berhasil dihapus!', 'success');
    }
}

// Handle form submit
function handleSubmit(event) {
    event.preventDefault();
    
    const itemData = {
        name: document.getElementById('itemName').value,
        barcode: document.getElementById('itemBarcode').value,
        description: document.getElementById('itemDescription').value,
        stock: parseInt(document.getElementById('itemStock').value)
    };
    
    if (editingIndex !== null) {
        // Update existing item
        items[editingIndex] = itemData;
        showNotification('Barang berhasil diupdate!', 'success');
    } else {
        // Add new item
        items.push(itemData);
        showNotification('Barang berhasil ditambahkan!', 'success');
    }
    
    saveItems();
    renderTable();
    closeModal();
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});


// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeLogoutModal();
    }
});

// Handle logout
function handleLogout(event) {
    event.preventDefault();
    openLogoutModal();
}

// Open Logout Modal
function openLogoutModal() {
    let modal = document.getElementById('logoutModal');
    if (!modal) {
        modal = createLogoutModal();
        document.body.appendChild(modal);
    }
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

// Create Logout Modal
function createLogoutModal() {
    const modal = document.createElement('div');
    modal.id = 'logoutModal';
    modal.className = 'logout-modal';
    modal.innerHTML = `
        <div class="logout-overlay" onclick="closeLogoutModal()"></div>
        <div class="logout-content">
            <div class="logout-icon">
                <div class="icon-circle">
                    <span>🚪</span>
                </div>
            </div>
            <h2 class="logout-title">Konfirmasi Logout</h2>
            <p class="logout-message">Apakah Anda yakin ingin keluar dari sistem?</p>
            <div class="logout-actions">
                <button class="btn-logout-no" onclick="closeLogoutModal()">
                    <span>✖️</span> Tidak
                </button>
                <button class="btn-logout-yes" onclick="confirmLogout()">
                    <span>✓</span> Ya, Logout
                </button>
            </div>
        </div>
    `;
    
    const logoutStyle = document.createElement('style');
    logoutStyle.id = 'logoutModalStyles';
    logoutStyle.textContent = `
        .logout-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}.logout-modal.active{display:flex;opacity:1}.logout-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);animation:fadeIn .3s}.logout-content{position:relative;background:#fff;border-radius:24px;padding:40px 35px;width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:slideUpModal .4s cubic-bezier(.34,1.56,.64,1);text-align:center}@keyframes slideUpModal{from{opacity:0;transform:translateY(40px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}.logout-icon{margin-bottom:25px}.icon-circle{width:90px;height:90px;margin:0 auto;background:linear-gradient(135deg,#ff6b6b,#ff5252);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:bounceIn .6s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 24px rgba(255,107,107,.3)}.icon-circle span{font-size:45px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))}@keyframes bounceIn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}.logout-title{font-size:26px;font-weight:700;color:#2c3e50;margin-bottom:12px;animation:fadeInDown .5s ease .2s both}.logout-message{font-size:16px;color:#7f8c8d;margin-bottom:30px;line-height:1.6;animation:fadeInDown .5s ease .3s both}.logout-actions{display:flex;gap:12px;animation:fadeInUp .5s ease .4s both}.btn-logout-no,.btn-logout-yes{flex:1;padding:14px 24px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;display:flex;align-items:center;justify-content:center;gap:8px}.btn-logout-no{background:#ecf0f1;color:#2c3e50}.btn-logout-no:hover{background:#d5dbdc;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.btn-logout-yes{background:linear-gradient(135deg,#ff6b6b,#ff5252);color:#fff;box-shadow:0 4px 15px rgba(255,107,107,.3)}.btn-logout-yes:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,107,107,.4)}.btn-logout-no:active,.btn-logout-yes:active{transform:translateY(0)}@media (max-width:480px){.logout-content{padding:35px 25px}.icon-circle{width:75px;height:75px}.icon-circle span{font-size:38px}.logout-title{font-size:22px}.logout-message{font-size:14px}.logout-actions{flex-direction:column}.btn-logout-no,.btn-logout-yes{width:100%}}
    `;
    
    if (!document.getElementById('logoutModalStyles')) {
        document.head.appendChild(logoutStyle);
    }
    return modal;
}

// Close Logout Modal
function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Confirm Logout
function confirmLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    showNotification('Logout berhasil! Mengalihkan ke halaman login...', 'success');
    closeLogoutModal();
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}