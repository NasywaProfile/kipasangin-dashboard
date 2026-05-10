# Perancangan API, Integrasi, dan Sub-Sistem Smart Fan (Smarfan)

Dokumen ini merinci arsitektur sistem, desain API, dan strategi integrasi untuk proyek IoT Kipas Pintar.

---

## 1. Arsitektur Sub-Sistem

Sistem Smarfan dibagi menjadi lima sub-sistem utama:

### A. Hardware (ESP32)
- **Sensor**: DHT11 untuk mendeteksi suhu ruangan.
- **Aktuator**: Relay untuk mengontrol daya kipas (On/Off).
- **Logika**: Mengatur kipas secara otomatis berdasarkan threshold suhu atau menerima perintah manual.
- **Konektivitas**: WiFiManager untuk konfigurasi WiFi dinamis dan MQTT untuk komunikasi real-time.

### B. Backend & Database (XAMPP — MySQL / phpMyAdmin)
- **Penyimpanan Data**: MySQL yang dikelola via phpMyAdmin (XAMPP lokal).
- **Tabel Utama**:
  - `master_kipas`: Data identitas perangkat (Statis).
  - `activity_log`: Riwayat aktivitas kipas (Manual/Auto On/Off).
  - `error_log`: Catatan kesalahan sistem.
- **API**: REST API kustom melalui `api.php` (PHP + MySQLi).
- **Schema**: Tersedia di file `db_kipasangin.sql` — import via phpMyAdmin.

### C. Broker MQTT (HiveMQ)
- **Fungsi**: Jalur komunikasi dua arah antara Web Dashboard dan ESP32 dengan latensi sangat rendah (< 200ms).
- **Metode**: Publish/Subscribe via WebSocket Secure (`wss://broker.hivemq.com:8884/mqtt`).

### D. Frontend Dashboard (Web App)
- **Teknologi**: Vanilla HTML5, CSS3 (Premium Glassmorphism), dan JavaScript (ES Modules).
- **Fungsi**: Visualisasi suhu real-time, kontrol manual, pengaturan threshold, dan tampilan riwayat aktivitas.

### E. Infrastruktur & Deployment
- **XAMPP**: Web server lokal (Apache + MySQL) untuk menjalankan `api.php`.
- **GitHub**: Repositori kode sumber dan manajemen versi.

---

## 2. Desain API

### A. API MQTT (Komunikasi Real-Time)

| Topik | Arah | Payload | Deskripsi |
|-------|------|---------|-----------|
| `smartfan/data/temp` | ESP32 → Web | `Float` | Mengirimkan data suhu terbaru. |
| `smartfan/data/power` | ESP32 → Web | `ON` / `OFF` | Mengonfirmasi status relay saat ini. |
| `smartfan/data/threshold` | ESP32 → Web | `Float` | Mengirimkan nilai threshold yang aktif. |
| `smartfan/cmd/power` | Web → ESP32 | `ON` / `OFF` | Perintah manual daya kipas. |
| `smartfan/cmd/threshold` | Web → ESP32 | `Float` | Mengatur ambang batas suhu otomatis. |
| `smartfan/cmd/status` | Web → ESP32 | `request` | Meminta ESP32 mengirim ulang seluruh data. |

### B. REST API Lokal (`api.php`)

**Base URL**: `http://localhost/kipasangin/api.php`

| Method | Parameter | Fungsi |
|--------|-----------|--------|
| `GET` | `?table=master_kipas` | Ambil semua data perangkat |
| `GET` | `?table=activity_log&date=YYYY-MM-DD` | Riwayat aktivitas (opsional filter tanggal) |
| `GET` | `?table=error_log&date=YYYY-MM-DD` | Log error (opsional filter tanggal) |
| `POST` | `?table=activity_log` | Catat aksi baru (body JSON) |
| `POST` | `?table=error_log` | Catat error baru (body JSON) |
| `PUT` | `?table=master_kipas` | Update status/suhu perangkat |

---

## 3. Alur Integrasi

### Alur Kontrol Manual
1. User menekan tombol **Power** di Dashboard.
2. Dashboard melakukan `publish` ke topik `smartfan/cmd/power`.
3. ESP32 menerima pesan, mengubah status Relay, dan mengirim balik konfirmasi ke `smartfan/data/power`.
4. Dashboard mencatat aksi tersebut ke `activity_log` via `api.php`.

### Alur Kontrol Otomatis
1. Sensor DHT11 membaca suhu setiap 2 detik.
2. Jika Suhu >= Threshold, ESP32 menyalakan Relay.
3. ESP32 mengirim status terbaru ke MQTT.
4. Dashboard menerima update via MQTT, memperbarui UI secara instan, dan mencatat ke `activity_log`.

### Alur Monitoring Koneksi (Heartbeat)
1. Dashboard memantau aktivitas pesan MQTT.
2. Jika dalam 5 detik tidak ada pesan masuk dari ESP32, Dashboard otomatis menampilkan status **Offline** pada UI.
3. Kejadian disconnect dicatat ke `error_log` via `api.php`.

---

## 4. Struktur File Proyek

```
kipasangin/
├── index.html            # UI Dashboard utama
├── style.css             # Stylesheet (Glassmorphism)
├── main.js               # Logic: MQTT + API calls
├── api.php               # REST API backend (PHP + MySQL)
├── db_kipasangin.sql     # Schema database — import ke phpMyAdmin
├── arduino_code.ino      # Firmware ESP32
├── vidsunset.png         # Gambar background welcome screen
└── .gitignore
```

---

## 5. Keamanan & Optimasi
- **Non-Blocking Logic**: ESP32 menggunakan logika asinkron agar proses pengiriman data tidak mengganggu pembacaan suhu.
- **Hysteresis**: Penerapan jeda suhu (0.2°C) untuk mencegah kerusakan komponen relay akibat perubahan suhu yang fluktuatif di ambang batas.
- **Manual Override**: Mode manual mencegah otomasi menimpa perintah pengguna secara tidak sengaja.
- **Modern Responsive Design**: Antarmuka dashboard dapat menyesuaikan diri dengan berbagai ukuran layar (Desktop, Tablet, dan Mobile).
