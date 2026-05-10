# Perancangan API, Integrasi, dan Sub-Sistem Smart Fan (Smarfan) — Laravel Edition

Dokumen ini merinci arsitektur sistem, desain API, dan strategi integrasi untuk proyek IoT Kipas Pintar yang telah dimigrasi ke framework **Laravel 13**.

---

## 1. Arsitektur Sub-Sistem

Sistem Smarfan dibagi menjadi lima sub-sistem utama:

### A. Hardware (ESP32)
- **Sensor**: DHT11 untuk mendeteksi suhu ruangan.
- **Aktuator**: Relay untuk mengontrol daya kipas (On/Off).
- **Logika**: Mengatur kipas secara otomatis berdasarkan threshold suhu atau menerima perintah manual.
- **Konektivitas**: WiFiManager untuk konfigurasi WiFi dinamis dan MQTT untuk komunikasi real-time.

### B. Backend & Database (Laravel + MySQL)
- **Framework**: Laravel 13 (MVC Architecture).
- **Penyimpanan Data**: MySQL yang dikelola via phpMyAdmin (XAMPP lokal).
- **Tabel Utama (Migrations)**:
  - `master_kipas`: Data identitas perangkat.
  - `activity_log`: Riwayat aktivitas kipas.
  - `error_log`: Catatan kesalahan sistem.
- **API**: REST API yang dikelola melalui `FanApiController`.

### C. Broker MQTT (HiveMQ)
- **Fungsi**: Jalur komunikasi dua arah antara Web Dashboard dan ESP32 dengan latensi sangat rendah (< 200ms).
- **Metode**: Publish/Subscribe via WebSocket Secure (`wss://broker.hivemq.com:8884/mqtt`).

### D. Frontend Dashboard (Blade & Vanilla JS)
- **Teknologi**: Laravel Blade, CSS3 (Premium Glassmorphism), dan JavaScript (ES Modules).
- **Asset Management**: File statis disimpan di folder `public/`.
- **Fungsi**: Visualisasi suhu real-time, kontrol manual, pengaturan threshold, dan tampilan riwayat aktivitas dari database.

### E. Infrastruktur & Deployment
- **XAMPP**: Web server lokal (Apache + MySQL).
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

### B. REST API Laravel (`/api/...`)

**Base URL**: `http://localhost/kipasangin/public/api`

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/master-kipas` | Ambil semua data perangkat |
| `GET` | `/activity-log` | Riwayat aktivitas (filter `?date=` opsional) |
| `GET` | `/error-log` | Log error (filter `?date=` opsional) |
| `POST` | `/activity-log` | Catat aksi baru (membutuhkan CSRF/API Token) |
| `POST` | `/error-log` | Catat error baru |
| `PUT` | `/master-kipas/{id}` | Update status/suhu perangkat |

---

## 3. Alur Integrasi

### Alur Kontrol Manual
1. User menekan tombol **Power** di Dashboard.
2. Dashboard melakukan `publish` ke topik `smartfan/cmd/power`.
3. ESP32 menerima pesan, mengubah status Relay, dan mengirim balik konfirmasi ke `smartfan/data/power`.
4. Dashboard mencatat aksi tersebut ke `activity_log` melalui endpoint API Laravel.

### Alur Kontrol Otomatis
1. Sensor DHT11 membaca suhu setiap 2 detik.
2. Jika Suhu >= Threshold, ESP32 menyalakan Relay.
3. ESP32 mengirim status terbaru ke MQTT.
4. Dashboard menerima update via MQTT, memperbarui UI secara instan, dan mencatat ke `activity_log`.

### Alur Monitoring Koneksi (Heartbeat)
1. Dashboard memantau aktivitas pesan MQTT.
2. Jika dalam 5 detik tidak ada pesan masuk dari ESP32, Dashboard otomatis menampilkan status **Offline** pada UI.
3. Kejadian disconnect dicatat ke `error_log` via API Laravel.

---

## 4. Struktur Folder (Laravel)

```
kipasangin/
├── app/
│   ├── Http/Controllers/
│   │   ├── DashboardController.php   # Render View
│   │   └── FanApiController.php      # Logika API
│   └── Models/                       # Eloquent Models
├── database/
│   └── migrations/                   # Skema Database
├── public/
│   ├── css/style.css                 # Aset CSS
│   ├── js/main.js                    # Aset JS (MQTT & API)
│   └── images/vidsunset.png          # Aset Gambar
├── resources/views/
│   └── dashboard.blade.php           # Template Blade Dashboard
├── routes/
│   ├── web.php                       # Routing Web
│   └── api.php                       # Routing API
└── arduino_code.ino                  # Firmware ESP32
```

---

## 5. Keamanan & Optimasi
- **CSRF Protection**: Dashboard menggunakan token CSRF untuk permintaan POST/PUT ke API.
- **Validation**: Laravel memvalidasi semua input data sebelum masuk ke database.
- **Modern Responsive Design**: Antarmuka dashboard dapat menyesuaikan diri dengan berbagai ukuran layar (Desktop, Tablet, dan Mobile).
