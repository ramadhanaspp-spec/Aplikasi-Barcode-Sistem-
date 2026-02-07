// Generator Barcode Script
let generatedBarcode = null;

// Initialize Generator Page
document.addEventListener('DOMContentLoaded', function() {
    // Set default production date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('productionDate').value = today;
    
    // Format price display on input
    const priceInput = document.getElementById('price');
    priceInput.addEventListener('input', function() {
        updatePriceDisplay(this.value);
    });
    
    // Initial price display
    updatePriceDisplay(priceInput.value);
});

// Update Price Display
function updatePriceDisplay(price) {
    const priceDisplay = document.getElementById('priceDisplay');
    const formattedPrice = formatCurrency(price);
    priceDisplay.textContent = formattedPrice;
    priceDisplay.style.animation = 'none';
    setTimeout(() => {
        priceDisplay.style.animation = 'priceUpdate 0.3s ease';
    }, 10);
}

// Format Currency
function formatCurrency(value) {
    if (!value || value === '') return 'Rp 0';
    const number = parseInt(value);
    return 'Rp ' + number.toLocaleString('id-ID');
}

// Format Date to Indonesian
function formatDateIndonesian(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Calculate Expiry Date
function calculateExpiryDate(productionDate, expiryDays) {
    const date = new Date(productionDate);
    date.setDate(date.getDate() + parseInt(expiryDays));
    return date.toISOString().split('T')[0];
}

// Generate Barcode Number
function generateBarcodeNumber(variant, weight, date) {
    // Format: VVWWWDDD
    // VV = Variant code (2 digits)
    // WWW = Weight (3 digits)
    // DDD = Date code (3 digits - day of year)
    
    const variantCodes = {
        'Original': '01',
        'Pedas': '02',
        'Balado': '03',
        'BBQ': '04',
        'Keju': '05'
    };
    
    const variantCode = variantCodes[variant] || '00';
    const weightCode = weight.toString().padStart(3, '0');
    
    // Calculate day of year
    const productionDate = new Date(date);
    const start = new Date(productionDate.getFullYear(), 0, 0);
    const diff = productionDate - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay).toString().padStart(3, '0');
    
    // Generate random suffix for uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return variantCode + weightCode + dayOfYear + randomSuffix;
}

// Handle Generate Barcode
function handleGenerateBarcode(event) {
    event.preventDefault();
    
    // Get form values
    const variant = document.getElementById('productVariant').value;
    const weight = document.getElementById('weight').value;
    const price = document.getElementById('price').value;
    const productionDate = document.getElementById('productionDate').value;
    const expiryDays = document.getElementById('expiryDays').value;
    const quantity = document.getElementById('quantity').value;
    
    // Validate
    if (!variant || !price || !productionDate || !quantity) {
        showNotification('Mohon lengkapi semua field yang wajib diisi!', 'error');
        return;
    }
    
    // Calculate expiry date
    const expiryDate = calculateExpiryDate(productionDate, expiryDays);
    
    // Generate barcode number
    const barcodeNumber = generateBarcodeNumber(variant, weight, productionDate);
    
    // Store generated data
    generatedBarcode = {
        variant: variant,
        weight: weight,
        price: price,
        productionDate: productionDate,
        expiryDate: expiryDate,
        quantity: quantity,
        barcodeNumber: barcodeNumber
    };
    
    // Update result display
    updateResultDisplay(generatedBarcode);
    
    // Generate barcode image
    generateBarcodeImage(barcodeNumber);
    
    // Show result card
    const resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'block';
    
    // Scroll to result
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    // Add to stock (update localStorage)
    addToStock(generatedBarcode);
    
    // Show success notification
    showNotification(`Barcode berhasil digenerate! ${quantity} produk ditambahkan ke stok.`, 'success');
}

// Update Result Display
function updateResultDisplay(data) {
    document.getElementById('resultProduct').textContent = `Bawang Goreng ${data.variant}`;
    document.getElementById('resultWeight').textContent = `${data.weight} gram`;
    document.getElementById('resultPrice').textContent = formatCurrency(data.price);
    document.getElementById('resultProductionDate').textContent = formatDateIndonesian(data.productionDate);
    document.getElementById('resultExpiryDate').textContent = formatDateIndonesian(data.expiryDate);
    document.getElementById('resultQuantity').textContent = `${data.quantity} unit`;
    document.getElementById('barcodeNumber').textContent = data.barcodeNumber;
}

// Generate Barcode Image using JsBarcode
function generateBarcodeImage(barcodeNumber) {
    try {
        // Generate for display
        JsBarcode("#barcodeCanvas", barcodeNumber, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: false,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000"
        });
        
        // Generate for print area
        JsBarcode("#printBarcodeCanvas", barcodeNumber, {
            format: "CODE128",
            width: 2,
            height: 100,
            displayValue: false,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000"
        });
    } catch (e) {
        console.error('Error generating barcode:', e);
        showNotification('Gagal membuat barcode!', 'error');
    }
}

// Print Barcode
function printBarcode() {
    if (!generatedBarcode) {
        showNotification('Belum ada barcode yang digenerate!', 'error');
        return;
    }
    
    // Update print area with current data
    document.getElementById('printProductName').textContent = `Bawang Goreng ${generatedBarcode.variant} ${generatedBarcode.weight}g`;
    document.getElementById('printWeight').textContent = `${generatedBarcode.weight} gram`;
    document.getElementById('printPrice').textContent = formatCurrency(generatedBarcode.price);
    document.getElementById('printProductionDate').textContent = formatDateIndonesian(generatedBarcode.productionDate);
    document.getElementById('printExpiryDate').textContent = formatDateIndonesian(generatedBarcode.expiryDate);
    document.getElementById('printBarcodeNumber').textContent = generatedBarcode.barcodeNumber;
    
    // Trigger print dialog
    setTimeout(() => {
        window.print();
    }, 100);
}

// Add to Stock (save to localStorage)
function addToStock(data) {
    // Get existing items
    let items = [];
    const savedItems = localStorage.getItem('bawangGorenStoreItems');
    if (savedItems) {
        items = JSON.parse(savedItems);
    }
    
    // Create product name based on variant and weight
    const productName = `Bawang Goreng ${data.variant} ${data.weight}g`;
    
    // Find existing item with same variant and weight
    const existingItemIndex = items.findIndex(item => {
        const itemNamePattern = `Bawang Goreng ${data.variant} ${data.weight}g`;
        return item.name === itemNamePattern || item.name.includes(`${data.variant} ${data.weight}g`);
    });
    
    if (existingItemIndex !== -1) {
        // Update existing item stock
        items[existingItemIndex].stock += parseInt(data.quantity);
        
        // Update barcode if new
        items[existingItemIndex].barcode = data.barcodeNumber;
        
        // Update description with latest info
        items[existingItemIndex].description = `Harga: ${formatCurrency(data.price)} | Produksi: ${formatDateIndonesian(data.productionDate)} | Exp: ${formatDateIndonesian(data.expiryDate)}`;
        
        console.log(`Stock updated: ${productName} - Added ${data.quantity} units, New total: ${items[existingItemIndex].stock}`);
    } else {
        // Add new item
        const newItem = {
            name: productName,
            barcode: data.barcodeNumber,
            description: `Harga: ${formatCurrency(data.price)} | Produksi: ${formatDateIndonesian(data.productionDate)} | Exp: ${formatDateIndonesian(data.expiryDate)}`,
            stock: parseInt(data.quantity)
        };
        items.push(newItem);
        
        console.log(`New product added: ${productName} - ${data.quantity} units`);
    }
    
    // Save back to localStorage
    localStorage.setItem('bawangGorenStoreItems', JSON.stringify(items));
    
    // Trigger storage event for real-time update on dashboard (if open in another tab)
    window.dispatchEvent(new Event('storage'));
}

// Download Barcode
function downloadBarcode() {
    if (!generatedBarcode) {
        showNotification('Belum ada barcode yang digenerate!', 'error');
        return;
    }
    
    try {
        // Get the SVG element
        const svg = document.getElementById('barcodeCanvas');
        const svgData = new XMLSerializer().serializeToString(svg);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 400;
        canvas.height = 250;
        
        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw barcode
            const imgWidth = 350;
            const imgHeight = 120;
            const x = (canvas.width - imgWidth) / 2;
            const y = 30;
            ctx.drawImage(img, x, y, imgWidth, imgHeight);
            
            // Add product info text
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Bawang Goreng ${generatedBarcode.variant} - ${generatedBarcode.weight}g`, canvas.width / 2, 170);
            
            ctx.font = '12px Arial';
            ctx.fillText(formatCurrency(generatedBarcode.price), canvas.width / 2, 190);
            
            ctx.font = '10px Arial';
            ctx.fillText(generatedBarcode.barcodeNumber, canvas.width / 2, 210);
            
            // Download
            const downloadLink = document.createElement('a');
            downloadLink.download = `barcode_${generatedBarcode.barcodeNumber}.png`;
            downloadLink.href = canvas.toDataURL('image/png');
            downloadLink.click();
            
            URL.revokeObjectURL(url);
            showNotification('Barcode berhasil didownload!', 'success');
        };
        
        img.src = url;
        
    } catch (e) {
        console.error('Error downloading barcode:', e);
        showNotification('Gagal mendownload barcode!', 'error');
    }
}

// Reset Form
function resetForm() {
    document.getElementById('generatorForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('productionDate').value = today;
    document.getElementById('price').value = '10000';
    updatePriceDisplay('10000');
    
    // Hide result card
    document.getElementById('resultCard').style.display = 'none';
    generatedBarcode = null;
    
    showNotification('Form berhasil direset!', 'success');
}

// Show notification (same function from script.js but included for standalone use)
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
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Handle logout (if not already defined in script.js)
if (typeof handleLogout === 'undefined') {
    function handleLogout(event) {
        event.preventDefault();
        openLogoutModal();
    }
    
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
                        <span class="btn-icon">✖️</span>
                        Tidak
                    </button>
                    <button class="btn-logout-yes" onclick="confirmLogout()">
                        <span class="btn-icon">✓</span>
                        Ya, Logout
                    </button>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .logout-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease}.logout-modal.active{display:flex;opacity:1}.logout-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);animation:fadeIn .3s ease}.logout-content{position:relative;background:#fff;border-radius:24px;padding:40px 35px;width:90%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:slideUp .4s cubic-bezier(.34,1.56,.64,1);text-align:center}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(40px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}.logout-icon{margin-bottom:25px}.icon-circle{width:90px;height:90px;margin:0 auto;background:linear-gradient(135deg,#ff6b6b 0%,#ff5252 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:bounceIn .6s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 24px rgba(255,107,107,.3)}.icon-circle span{font-size:45px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))}@keyframes bounceIn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}.logout-title{font-size:26px;font-weight:700;color:#2c3e50;margin-bottom:12px;animation:fadeInDown .5s ease .2s both}@keyframes fadeInDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.logout-message{font-size:16px;color:#7f8c8d;margin-bottom:30px;line-height:1.6;animation:fadeInDown .5s ease .3s both}.logout-actions{display:flex;gap:12px;animation:fadeInUp .5s ease .4s both}@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.btn-logout-no,.btn-logout-yes{flex:1;padding:14px 24px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s ease;display:flex;align-items:center;justify-content:center;gap:8px}.btn-logout-no{background:#ecf0f1;color:#2c3e50}.btn-logout-no:hover{background:#d5dbdc;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.btn-logout-yes{background:linear-gradient(135deg,#ff6b6b 0%,#ff5252 100%);color:#fff;box-shadow:0 4px 15px rgba(255,107,107,.3)}.btn-logout-yes:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,107,107,.4)}.btn-logout-no:active,.btn-logout-yes:active{transform:translateY(0)}@media (max-width:480px){.logout-content{padding:35px 25px}.icon-circle{width:75px;height:75px}.icon-circle span{font-size:38px}.logout-title{font-size:22px}.logout-message{font-size:14px}.logout-actions{flex-direction:column}.btn-logout-no,.btn-logout-yes{width:100%}}
        `;
        document.head.appendChild(style);
        return modal;
    }
    
    function closeLogoutModal() {
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    function confirmLogout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        showNotification('Logout berhasil! Mengalihkan ke halaman login...', 'success');
        closeLogoutModal();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}