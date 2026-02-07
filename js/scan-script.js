// Barcode Scanner Implementation
let codeReader = null;
let videoElement = null;
let scannerActive = false;
let scannedProduct = null;

// Initialize Scanner
document.addEventListener('DOMContentLoaded', function() {
    setupScanner();
    setupEventListeners();
    setupSaleFormHandler(); // Add this
});

// Setup Sale Form Handler
function setupSaleFormHandler() {
    const form = document.getElementById('saleFormElement');
    const resetBtn = document.getElementById('resetSaleBtn');
    
    if (form) {
        // Remove any existing listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // Add submit event listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted!');
            handleSale(e);
        });
        
        console.log('Sale form handler attached successfully');
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            console.log('Reset button clicked');
            resetScan();
        });
    }
}

// Setup Scanner Elements
function setupScanner() {
    videoElement = document.getElementById('scanner');
    
    // Initialize ZXing Code Reader
    if (typeof ZXing !== 'undefined') {
        codeReader = new ZXing.BrowserMultiFormatReader();
        console.log('ZXing library loaded successfully');
    } else {
        console.error('ZXing library not loaded');
        showNotification('Error: Library barcode tidak dapat dimuat', 'error');
    }
}

// Setup Event Listeners (from script.js)
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
}

// Start Scanner
async function startScanner() {
    if (!codeReader) {
        showNotification('Error: Scanner tidak dapat diinisialisasi', 'error');
        return;
    }

    try {
        // Hide placeholder
        document.getElementById('scannerPlaceholder').style.display = 'none';
        
        // Show video and overlay
        videoElement.classList.add('active');
        document.getElementById('scannerOverlay').classList.add('active');
        
        // Update status
        updateStatus('active', 'Scanner aktif');
        
        // Get available video devices
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
            throw new Error('Tidak ada kamera yang terdeteksi');
        }

        // Use first available camera (or back camera on mobile)
        let selectedDeviceId = videoInputDevices[0].deviceId;
        
        // Try to find back camera on mobile
        const backCamera = videoInputDevices.find(device => 
            /back|rear|environment/gi.test(device.label)
        );
        if (backCamera) {
            selectedDeviceId = backCamera.deviceId;
        }

        // Start decoding from video device
        scannerActive = true;
        
        codeReader.decodeFromVideoDevice(selectedDeviceId, 'scanner', (result, err) => {
            if (result) {
                handleBarcodeDetected(result.text);
            }
            
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
            }
        });

        // Update button
        const startBtn = document.getElementById('startScanBtn');
        startBtn.innerHTML = '<span class="btn-icon">⏸️</span> Stop Scan';
        startBtn.onclick = stopScanner;
        
        updateStatus('scanning', 'Memindai...');
        
    } catch (error) {
        console.error('Error starting scanner:', error);
        showNotification('Error: ' + error.message, 'error');
        resetScanner();
    }
}

// Stop Scanner
function stopScanner() {
    if (codeReader) {
        codeReader.reset();
    }
    
    scannerActive = false;
    videoElement.classList.remove('active');
    document.getElementById('scannerOverlay').classList.remove('active');
    document.getElementById('scannerPlaceholder').style.display = 'flex';
    
    updateStatus('inactive', 'Belum aktif');
    
    const startBtn = document.getElementById('startScanBtn');
    startBtn.innerHTML = '<span class="btn-icon">📷</span> Mulai Scan';
    startBtn.onclick = startScanner;
}

// Handle Barcode Detected
function handleBarcodeDetected(barcode) {
    if (!scannerActive) return;
    
    // Update status
    updateStatus('scanning', 'Barcode terdeteksi!');
    
    // Play beep sound (optional)
    playBeep();
    
    // Search product in inventory
    const items = JSON.parse(localStorage.getItem('bawangGorenStoreItems') || '[]');
    const product = items.find(item => item.barcode === barcode);
    
    if (product) {
        // Product found
        scannedProduct = product;
        displayProductInfo(product);
        stopScanner();
        showNotification('Produk berhasil ditemukan!', 'success');
    } else {
        // Product not found
        showNotification('Produk dengan barcode "' + barcode + '" tidak ditemukan', 'error');
    }
}

// Display Product Information
function displayProductInfo(product) {
    const productInfo = document.getElementById('productInfo');
    const saleForm = document.getElementById('saleForm');
    
    // Get stock status
    let stockBadge = '';
    let stockClass = '';
    
    if (product.stock === 0) {
        stockBadge = '<span class="stock-badge stock-empty">Stok Habis</span>';
        stockClass = 'stock-empty';
    } else if (product.stock < 50) {
        stockBadge = '<span class="stock-badge stock-low">' + product.stock + ' unit</span>';
        stockClass = 'stock-low';
    } else {
        stockBadge = '<span class="stock-badge stock-available">' + product.stock + ' unit</span>';
        stockClass = 'stock-available';
    }
    
    // Format price
    const priceFormatted = product.price ? 'Rp ' + product.price.toLocaleString('id-ID') : 'Tidak tersedia';
    
    // Display product details
    productInfo.innerHTML = `
        <div class="product-details">
            <div class="product-header">
                <div class="product-icon">📦</div>
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <div class="product-barcode-display">${escapeHtml(product.barcode)}</div>
            </div>
            
            <ul class="product-info-list">
                <li class="info-item">
                    <span class="info-label">Nama Produk</span>
                    <span class="info-value">${escapeHtml(product.name)}</span>
                </li>
                <li class="info-item">
                    <span class="info-label">Barcode</span>
                    <span class="info-value">${escapeHtml(product.barcode)}</span>
                </li>
                <li class="info-item">
                    <span class="info-label">Harga</span>
                    <span class="info-value" style="color: #28a745; font-weight: 700;">${priceFormatted}</span>
                </li>
                <li class="info-item">
                    <span class="info-label">Deskripsi</span>
                    <span class="info-value">${escapeHtml(product.description || '-')}</span>
                </li>
                <li class="info-item">
                    <span class="info-label">Stok Tersedia</span>
                    <span class="info-value">${stockBadge}</span>
                </li>
            </ul>
        </div>
    `;
    
    // Show sale form if stock available
    if (product.stock > 0) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productBarcode').value = product.barcode;
        document.getElementById('productPrice').value = priceFormatted;
        document.getElementById('availableStock').value = product.stock + ' unit';
        document.getElementById('saleQty').value = '';
        document.getElementById('saleQty').max = product.stock;
        document.getElementById('transactionType').value = 'cash'; // Default to cash
        
        saleForm.style.display = 'block';
        
        // Re-attach event handlers after form is shown
        setTimeout(() => {
            setupSaleFormHandler();
        }, 100);
    } else {
        saleForm.style.display = 'none';
        showNotification('Stok produk habis, tidak dapat melakukan penjualan', 'error');
    }
}

// Handle Sale
function handleSale(event) {
    event.preventDefault();
    
    console.log('=== HANDLE SALE TRIGGERED ===');
    console.log('Scanned Product:', scannedProduct);
    
    if (!scannedProduct) {
        console.error('No scanned product!');
        showNotification('Tidak ada produk yang dipilih', 'error');
        return;
    }
    
    const qty = parseInt(document.getElementById('saleQty').value);
    const transactionType = document.getElementById('transactionType').value;
    
    console.log('Sale Details:', {
        qty: qty,
        transactionType: transactionType,
        availableStock: scannedProduct.stock,
        price: scannedProduct.price
    });
    
    if (!qty || qty <= 0) {
        console.error('Invalid quantity:', qty);
        showNotification('Jumlah penjualan harus lebih dari 0', 'error');
        return;
    }
    
    if (qty > scannedProduct.stock) {
        console.error('Quantity exceeds stock:', qty, '>', scannedProduct.stock);
        showNotification('Jumlah penjualan melebihi stok tersedia', 'error');
        return;
    }
    
    console.log('Validation passed, processing sale...');
    
    // Update stock in inventory
    const items = JSON.parse(localStorage.getItem('bawangGorenStoreItems') || '[]');
    const itemIndex = items.findIndex(item => item.barcode === scannedProduct.barcode);
    
    if (itemIndex !== -1) {
        items[itemIndex].stock -= qty;
        localStorage.setItem('bawangGorenStoreItems', JSON.stringify(items));
        console.log('Stock updated:', items[itemIndex]);
    }
    
    // Prepare sale record with complete data
    const saleRecord = {
        productName: scannedProduct.name,
        barcode: scannedProduct.barcode,
        quantity: qty,
        price: scannedProduct.price || 0,
        transactionType: transactionType,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    console.log('Sale Record:', saleRecord);
    
    // Save to sales report
    saveSaleRecord(saleRecord);
    
    // Calculate total
    const total = qty * (scannedProduct.price || 0);
    
    console.log('Sale processed successfully!');
    
    // Show success message with details
    showSaleSuccessWithDetails(scannedProduct.name, qty, scannedProduct.price, total, transactionType);
    
    // Reset after 2.5 seconds
    setTimeout(() => {
        console.log('Resetting scan...');
        resetScan();
    }, 2500);
}

// Show Sale Success with Details
function showSaleSuccessWithDetails(productName, qty, price, total, type) {
    const successDiv = document.createElement('div');
    successDiv.className = 'scan-success';
    successDiv.innerHTML = `
        <div class="success-icon">✅</div>
        <p class="success-text">Penjualan Berhasil!</p>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px dashed #e0e0e0;">
            <p class="success-subtext" style="font-size: 16px; margin-bottom: 8px;"><strong>${escapeHtml(productName)}</strong></p>
            <p class="success-subtext">Jumlah: ${qty} unit × Rp ${price.toLocaleString('id-ID')}</p>
            <p class="success-subtext" style="color: #28a745; font-weight: 700; font-size: 18px; margin-top: 8px;">Total: Rp ${total.toLocaleString('id-ID')}</p>
            <p class="success-subtext" style="margin-top: 8px; font-size: 13px;">Tipe: ${getTransactionTypeLabel(type)}</p>
        </div>
    `;
    
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 35px 40px;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        text-align: center;
        min-width: 350px;
        animation: scaleIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, 2000);
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

// Save Sale Record
function saveSaleRecord(sale) {
    let sales = JSON.parse(localStorage.getItem('bawangGorenStoreSales') || '[]');
    sales.unshift(sale); // Add to beginning of array
    localStorage.setItem('bawangGorenStoreSales', JSON.stringify(sales));
    
    // Log untuk debugging
    console.log('Sale saved:', sale);
    console.log('Total sales now:', sales.length);
}

// Show Sale Success Animation
function showSaleSuccess(productName, qty) {
    const successDiv = document.createElement('div');
    successDiv.className = 'scan-success';
    successDiv.innerHTML = `
        <div class="success-icon">✅</div>
        <p class="success-text">Penjualan Berhasil!</p>
        <p class="success-subtext">${qty} unit ${escapeHtml(productName)}</p>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, 1500);
}

// Reset Scan
function resetScan() {
    scannedProduct = null;
    
    const productInfo = document.getElementById('productInfo');
    productInfo.innerHTML = `
        <div class="empty-product-info">
            <div class="empty-icon">🔍</div>
            <p class="empty-text">Scan barcode untuk melihat informasi produk</p>
        </div>
    `;
    
    document.getElementById('saleForm').style.display = 'none';
    document.getElementById('saleQty').value = '';
}

// Update Status Indicator
function updateStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = indicator.querySelector('.status-text');
    
    indicator.className = 'status-indicator ' + status;
    statusText.textContent = text;
}

// Play Beep Sound
function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Reset Scanner
function resetScanner() {
    stopScanner();
    resetScan();
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
        z-index: 3000;
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

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (codeReader) {
        codeReader.reset();
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

// Create Logout Modal (copied from script.js)
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
    // Stop scanner before logout
    if (scannerActive) {
        stopScanner();
    }
    
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
    }
});