# 📦 Sistem Manajemen Barcode - Bawang Goreng Store

## 🎯 Cara Kerja Sistem Terintegrasi

### 1️⃣ GENERATOR BARCODE (generator.html)
**Fungsi:** Membuat produk baru dan generate barcode unik

**Langkah-langkah:**
1. Pilih **Varian Produk** (Original/Pedas/Balado/BBQ/Keju)
2. Pilih **Berat** (50g - 1000g)
3. Masukkan **Harga** produk
4. Pilih **Tanggal Produksi**
5. Pilih **Masa Kadaluarsa** (30-180 hari)
6. Masukkan **Jumlah Produk** (akan ditambahkan ke stok)
7. Klik **Generate Barcode**

**Hasil:**
✅ Barcode unik ter-generate (format: BG + kode varian + kode berat + timestamp)
✅ Produk tersimpan di inventory dengan data lengkap
✅ Stok otomatis bertambah
✅ Barcode bisa di-print atau di-download

---

### 2️⃣ SCANNER BARCODE (scan-barcode.html)
**Fungsi:** Scan barcode untuk melakukan penjualan

**Langkah-langkah:**
1. Klik **Mulai Scan**
2. Izinkan akses kamera saat diminta browser
3. Arahkan kamera ke barcode yang sudah di-generate
4. Sistem otomatis mendeteksi dan menampilkan info produk:
   - Nama Produk
   - Barcode
   - **Harga**
   - Deskripsi
   - Stok Tersedia
5. Masukkan **Jumlah Penjualan**
6. Pilih **Tipe Transaksi** (Cash/Transfer/QRIS)
7. Klik **Proses Penjualan**

**Hasil:**
✅ Stok berkurang otomatis
✅ Data penjualan tersimpan dengan lengkap (nama, barcode, qty, harga, tipe, tanggal)
✅ Transaksi masuk ke Laporan Penjualan

---

### 3️⃣ LAPORAN PENJUALAN (penjualan.html)
**Fungsi:** Melihat semua transaksi dan statistik penjualan

**Fitur:**

**A. Statistik Real-time:**
- Total Transaksi
- Total Item Terjual
- **Total Pendapatan** (calculated from qty × price)
- Item Tersedia (stok inventory)

**B. Filter Data:**
- Filter by **Tanggal** (mulai - akhir)
- Filter by **Tipe Transaksi** (Cash/Transfer/QRIS)
- **Search** by nama produk atau barcode

**C. Tabel Transaksi:**
Menampilkan semua penjualan dengan detail:
- No urut
- Tanggal & Waktu
- Nama Barang
- Barcode
- Jumlah
- **Harga Satuan**
- **Total** (Jumlah × Harga)
- Tipe Transaksi

**D. Export to Excel:**
- Export data ke file CSV (bisa dibuka di Excel)
- Include header perusahaan
- Include ringkasan (total transaksi, item, pendapatan)
- Nama file: `Laporan_Penjualan_YYYYMMDD_HHMM.csv`

**E. Reset Data:**
- Hapus semua transaksi
- **Auto-export** sebelum reset (laporan tersimpan)
- Modal konfirmasi untuk keamanan

---

## 🔄 Flow Data Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    1. GENERATOR BARCODE                     │
│                                                             │
│  Input Data → Generate Barcode → Save to localStorage      │
│  • Variant, Weight, Price                                  │
│  • Production Date, Expiry                                  │
│  • Quantity (stock)                                        │
│                                                             │
│  💾 Saved to: 'bawangGorenStoreItems'                      │
│  Format: [{name, barcode, price, stock, ...}]              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    2. SCANNER BARCODE                       │
│                                                             │
│  Scan Barcode → Find in Inventory → Display Info           │
│  • Camera access                                           │
│  • ZXing barcode detection                                 │
│  • Show: name, barcode, PRICE, stock                       │
│                                                             │
│  Input: Qty + Transaction Type → Process Sale              │
│  • Validate stock                                          │
│  • Update stock (decrease)                                 │
│  • Save transaction                                        │
│                                                             │
│  💾 Saved to: 'bawangGorenStoreSales'                      │
│  Format: [{productName, barcode, qty, PRICE, type, date}]  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  3. LAPORAN PENJUALAN                       │
│                                                             │
│  Load from localStorage → Display Table                     │
│  • Read: 'bawangGorenStoreSales'                           │
│  • Calculate statistics                                     │
│  • Show: qty, price, TOTAL (qty × price)                   │
│                                                             │
│  Features:                                                  │
│  • Filter by date, type                                    │
│  • Search by name, barcode                                 │
│  • Export to Excel                                         │
│  • Reset data (with auto-export)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structure

### A. Inventory (bawangGorenStoreItems)
```javascript
[
  {
    name: "Bawang Goreng Original 250g",
    barcode: "BG001350123456",      // Unique barcode
    variant: "Original",
    weight: "250",
    price: 25000,                    // Harga satuan
    description: "Bawang Goreng Original - 250 gram",
    stock: 100,                      // Current stock
    productionDate: "2025-02-06",
    expiryDate: "2025-04-07",
    createdAt: "2025-02-06T10:30:00.000Z"
  }
]
```

### B. Sales (bawangGorenStoreSales)
```javascript
[
  {
    productName: "Bawang Goreng Original 250g",
    barcode: "BG001350123456",
    quantity: 5,                     // Qty sold
    price: 25000,                    // Price per unit
    transactionType: "cash",         // cash/transfer/qris
    date: "2025-02-06T14:20:00.000Z",
    timestamp: 1738850400000
  }
]
```

---

## 🔧 Troubleshooting

### ❌ Barcode tidak terdeteksi di scanner?
**Solusi:**
1. Pastikan barcode di-print dengan jelas (tidak blur)
2. Pastikan pencahayaan cukup
3. Arahkan kamera dengan jarak 10-20cm
4. Pastikan barcode ter-generate dari Generator (ada di inventory)

### ❌ Data tidak muncul di Laporan Penjualan?
**Solusi:**
1. Buka Console browser (F12) dan cek error
2. Pastikan file JavaScript ter-load: `scan-barcode.js` dan `penjualan-script.js`
3. Cek localStorage: 
   ```javascript
   console.log(localStorage.getItem('bawangGorenStoreSales'));
   ```
4. Pastikan transaksi berhasil (ada notifikasi "Penjualan Berhasil")

### ❌ Harga tidak muncul?
**Solusi:**
1. Pastikan saat generate barcode, harga sudah diisi
2. Cek data di localStorage:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('bawangGorenStoreItems')));
   ```
3. Pastikan field `price` ada dan terisi

### ❌ Stok tidak berkurang?
**Solusi:**
1. Cek console untuk error
2. Pastikan barcode yang discan sama dengan yang ada di inventory
3. Refresh halaman dashboard untuk melihat update stok

---

## 📱 Browser Support

✅ **Recommended:**
- Chrome 90+ (Desktop & Mobile)
- Edge 90+
- Firefox 88+
- Safari 14+ (iOS)

⚠️ **Camera Access:**
- Requires HTTPS or localhost
- User must grant camera permission

---

## 🚀 Tips & Best Practices

1. **Generate Barcode:**
   - Selalu isi harga dengan benar
   - Print barcode dengan kualitas baik
   - Simpan file barcode hasil download

2. **Scanning:**
   - Gunakan lighting yang cukup
   - Pastikan kamera fokus
   - Verifikasi data sebelum proses penjualan

3. **Laporan:**
   - Export data secara berkala
   - Gunakan filter untuk analisis
   - Reset data hanya setelah export

---

## 💾 File Structure

```
project/
├── index.html              # Dashboard Stok Barang
├── scan-barcode.html       # Scanner Barcode
├── generator.html          # Generator Barcode
├── penjualan.html         # Laporan Penjualan
├── style.css              # Global styles
├── script.js              # Global scripts
├── scan-barcode.css       # Scanner styles
├── scan-barcode.js        # Scanner logic ⭐
├── generator-script.js    # Generator logic ⭐
├── penjualan-style.css    # Report styles
└── penjualan-script.js    # Report logic ⭐
```

⭐ = Files dengan integrasi data penting

---

## ✅ Checklist Testing

- [ ] Generate barcode dengan harga
- [ ] Print/Download barcode
- [ ] Scan barcode dengan kamera
- [ ] Data produk muncul dengan harga
- [ ] Input qty dan pilih tipe transaksi
- [ ] Proses penjualan berhasil
- [ ] Cek stok berkurang di dashboard
- [ ] Cek transaksi muncul di Laporan Penjualan
- [ ] Verifikasi harga dan total di laporan
- [ ] Test filter by date
- [ ] Test filter by transaction type
- [ ] Test search function
- [ ] Export to Excel
- [ ] Reset data (dengan auto-export)

---

## 📞 Support

Jika ada masalah atau pertanyaan, periksa:
1. Browser Console (F12) untuk error messages
2. localStorage data untuk verifikasi
3. File permissions (camera access)

Happy selling! 🎉
