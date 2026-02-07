// Sales Report Implementation - Integrated with Barcode Scanner
let sales = [];
let allSales = []; // Store all sales for filtering
let exportHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadSales();
    loadExportHistory();
    renderSalesTable();
    updateStatistics();
    setupEventListeners();
    setDefaultDateFilter();
    
    // Auto-refresh untuk sinkronisasi dengan scanner
    setInterval(function() {
        const currentSales = localStorage.getItem('bawangGorenStoreSales');
        const storedSales = JSON.stringify(allSales);
        if (currentSales && currentSales !== storedSales) {
            loadSales();
            renderSalesTable();
            updateStatistics();
        }
    }, 2000); // Check every 2 seconds
});

// Setup Event Listeners
function setupEventListeners() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterSalesBySearch(e.target.value);
        });
    }
}

// Set Default Date Filter (current month)
function setDefaultDateFilter() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = today;
}

// Load Sales from localStorage
function loadSales() {
    const savedSales = localStorage.getItem('bawangGorenStoreSales');
    if (savedSales) {
        allSales = JSON.parse(savedSales);
        sales = [...allSales]; // Copy for filtering
    } else {
        allSales = [];
        sales = [];
    }
}

// Save Sales to localStorage
function saveSales() {
    localStorage.setItem('bawangGorenStoreSales', JSON.stringify(allSales));
}

// Load Export History
function loadExportHistory() {
    const savedHistory = localStorage.getItem('bawangGorenStoreExportHistory');
    if (savedHistory) {
        exportHistory = JSON.parse(savedHistory);
        renderExportHistory();
    }
}

// Save Export History
function saveExportHistory() {
    localStorage.setItem('bawangGorenStoreExportHistory', JSON.stringify(exportHistory));
}

// Render Sales Table
function renderSalesTable() {
    const tableBody = document.getElementById('salesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (sales.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        tableBody.innerHTML = sales.map((sale, index) => {
            const date = new Date(sale.date);
            const dateStr = formatDate(date);
            const timeStr = formatTime(date);
            const price = sale.price || 0;
            const total = sale.quantity * price;
            
            return `
                <tr style="animation: fadeIn 0.5s ease ${index * 0.05}s both">
                    <td>${index + 1}</td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td><strong>${escapeHtml(sale.productName)}</strong></td>
                    <td><code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${escapeHtml(sale.barcode)}</code></td>
                    <td style="text-align: center;"><strong>${sale.quantity}</strong></td>
                    <td class="price-cell">Rp ${formatCurrency(price)}</td>
                    <td class="total-cell">Rp ${formatCurrency(total)}</td>
                    <td>
                        <span class="transaction-badge ${sale.transactionType || 'cash'}">
                            ${getTransactionTypeLabel(sale.transactionType)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Update Statistics
function updateStatistics() {
    // Total Transactions
    document.getElementById('totalTransactions').textContent = sales.length;
    
    // Total Items Sold
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    document.getElementById('totalItemsSold').textContent = totalItems;
    
    // Total Revenue
    const totalRevenue = sales.reduce((sum, sale) => {
        return sum + (sale.quantity * (sale.price || 0));
    }, 0);
    document.getElementById('totalRevenue').textContent = 'Rp ' + formatCurrency(totalRevenue);
    
    // Available Items (from inventory)
    const items = JSON.parse(localStorage.getItem('bawangGorenStoreItems') || '[]');
    const availableItems = items.reduce((sum, item) => sum + item.stock, 0);
    document.getElementById('availableItems').textContent = availableItems;
}

// Apply Filter
function applyFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const transactionType = document.getElementById('transactionType').value;
    
    sales = allSales.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        
        const matchDate = (!start || start <= saleDate) && (!end || saleDate <= end);
        const matchType = !transactionType || sale.transactionType === transactionType;
        
        return matchDate && matchType;
    });
    
    renderSalesTable();
    updateStatistics();
    showNotification(`Filter diterapkan! Ditemukan ${sales.length} transaksi`, 'success');
}

// Filter Sales by Search
function filterSalesBySearch(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    if (!term) {
        // If search is empty, apply current date filter
        applyFilter();
        return;
    }
    
    sales = allSales.filter(sale => 
        sale.productName.toLowerCase().includes(term) ||
        sale.barcode.toLowerCase().includes(term)
    );
    
    renderSalesTable();
    updateStatistics();
}

// Export to Excel
function exportToExcel() {
    if (sales.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'error');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        // Prepare data for export
        const exportData = [];
        
        // Add header with company info
        exportData.push(['BAWANG GORENG STORE']);
        exportData.push(['Laporan Penjualan']);
        exportData.push(['Tanggal Export: ' + formatDate(new Date())]);
        exportData.push(['']); // Empty row
        
        // Add table headers
        exportData.push([
            'No',
            'Tanggal',
            'Waktu',
            'Nama Barang',
            'Barcode',
            'Jumlah',
            'Harga Satuan (Rp)',
            'Total (Rp)',
            'Tipe Transaksi'
        ]);
        
        // Add data rows
        sales.forEach((sale, index) => {
            const date = new Date(sale.date);
            const price = sale.price || 0;
            const total = sale.quantity * price;
            
            exportData.push([
                index + 1,
                formatDate(date),
                formatTime(date),
                sale.productName,
                sale.barcode,
                sale.quantity,
                price,
                total,
                getTransactionTypeLabel(sale.transactionType)
            ]);
        });
        
        // Add summary
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.quantity * (sale.price || 0)), 0);
        const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        
        exportData.push(['']); // Empty row
        exportData.push(['RINGKASAN']);
        exportData.push(['Total Transaksi', sales.length]);
        exportData.push(['Total Item Terjual', totalItems]);
        exportData.push(['Total Pendapatan (Rp)', totalRevenue]);
        
        // Create CSV content
        const csvContent = exportData.map(row => 
            row.map(cell => {
                // Handle values that might contain commas or quotes
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(',')
        ).join('\n');
        
        // Add BOM for Excel UTF-8 support
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = `Laporan_Penjualan_${formatDateForFilename(new Date())}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Save to export history
        exportHistory.unshift({
            filename: filename,
            date: new Date().toISOString(),
            totalTransactions: sales.length,
            totalRevenue: totalRevenue
        });
        
        // Keep only last 10 exports
        if (exportHistory.length > 10) {
            exportHistory = exportHistory.slice(0, 10);
        }
        
        saveExportHistory();
        renderExportHistory();
        
        hideLoading();
        showNotification('Data berhasil di-export ke Excel!', 'success');
    }, 500);
}

// Render Export History
function renderExportHistory() {
    const exportHistoryList = document.getElementById('exportHistoryList');
    const exportHistoryCard = document.getElementById('exportHistoryCard');
    
    if (exportHistory.length === 0) {
        exportHistoryCard.style.display = 'none';
        return;
    }
    
    exportHistoryCard.style.display = 'block';
    
    exportHistoryList.innerHTML = exportHistory.map((item, index) => {
        const date = new Date(item.date);
        
        return `
            <div class="export-item" style="animation-delay: ${index * 0.1}s">
                <div class="export-info">
                    <div class="export-icon">📊</div>
                    <div class="export-details">
                        <div class="export-filename">${escapeHtml(item.filename)}</div>
                        <div class="export-meta">
                            ${formatDate(date)} • ${formatTime(date)}
                        </div>
                    </div>
                </div>
                <div class="export-stats">
                    <div class="export-stat">
                        <span class="export-stat-label">Transaksi</span>
                        <span class="export-stat-value">${item.totalTransactions}</span>
                    </div>
                    <div class="export-stat">
                        <span class="export-stat-label">Pendapatan</span>
                        <span class="export-stat-value" style="font-size: 14px;">Rp ${formatCurrency(item.totalRevenue)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Open Reset Modal
function openResetModal() {
    const modal = document.getElementById('resetModal');
    modal.classList.add('active');
}

// Close Reset Modal
function closeResetModal() {
    const modal = document.getElementById('resetModal');
    modal.classList.remove('active');
}

// Confirm Reset
function confirmReset() {
    // Auto-export before reset
    if (allSales.length > 0) {
        // Reset filter to show all data for export
        sales = [...allSales];
        exportToExcel();
    }
    
    // Clear all sales
    allSales = [];
    sales = [];
    saveSales();
    
    renderSalesTable();
    updateStatistics();
    closeResetModal();
    
    showNotification('Data penjualan berhasil direset! Laporan telah di-export.', 'success');
}

// Show Loading Overlay
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.id = 'loadingOverlay';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
}

// Hide Loading Overlay
function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.remove();
    }
}

// Format Date
function formatDate(date) {
    const options = { 
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
}

// Format Time
function formatTime(date) {
    const options = { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    return date.toLocaleTimeString('id-ID', options);
}

// Format Date for Filename
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}`;
}

// Format Currency
function formatCurrency(amount) {
    return amount.toLocaleString('id-ID');
}

// Get Transaction Type Label
function getTransactionTypeLabel(type) {
    const labels = {
        'cash': 'Cash',
        'transfer': 'Transfer',
        'qris': 'QRIS'
    };
    return labels[type] || 'Cash';
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
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
                    <span>✔</span> Ya, Logout
                </button>
            </div>
        </div>
    `;
    
    const logoutStyle = document.createElement('style');
    logoutStyle.id = 'logoutModalStyles';
    logoutStyle.textContent = `
        .logout-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:10002;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}.logout-modal.active{display:flex;opacity:1}.logout-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);animation:fadeIn .3s}.logout-content{position:relative;background:#fff;border-radius:24px;padding:40px 35px;width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:slideUpModal .4s cubic-bezier(.34,1.56,.64,1);text-align:center}@keyframes slideUpModal{from{opacity:0;transform:translateY(40px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}.logout-icon{margin-bottom:25px}.icon-circle{width:90px;height:90px;margin:0 auto;background:linear-gradient(135deg,#ff6b6b,#ff5252);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:bounceIn .6s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 24px rgba(255,107,107,.3)}.icon-circle span{font-size:45px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))}@keyframes bounceIn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}.logout-title{font-size:26px;font-weight:700;color:#2c3e50;margin-bottom:12px;animation:fadeInDown .5s ease .2s both}.logout-message{font-size:16px;color:#7f8c8d;margin-bottom:30px;line-height:1.6;animation:fadeInDown .5s ease .3s both}.logout-actions{display:flex;gap:12px;animation:fadeInUp .5s ease .4s both}.btn-logout-no,.btn-logout-yes{flex:1;padding:14px 24px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;display:flex;align-items:center;justify-content:center;gap:8px}.btn-logout-no{background:#ecf0f1;color:#2c3e50}.btn-logout-no:hover{background:#d5dbdc;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.btn-logout-yes{background:linear-gradient(135deg,#ff6b6b,#ff5252);color:#fff;box-shadow:0 4px 15px rgba(255,107,107,.3)}.btn-logout-yes:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,107,107,.4)}.btn-logout-no:active,.btn-logout-yes:active{transform:translateY(0)}@keyframes fadeInDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@media (max-width:480px){.logout-content{padding:35px 25px}.icon-circle{width:75px;height:75px}.icon-circle span{font-size:38px}.logout-title{font-size:22px}.logout-message{font-size:14px}.logout-actions{flex-direction:column}.btn-logout-no,.btn-logout-yes{width:100%}}
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

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLogoutModal();
        closeResetModal();
    }
});