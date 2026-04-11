#include <DHT.h> // Memanggil pustaka untuk sensor suhu dan kelembaban DHT

#define DHTPIN 33     // Mendefinisikan pin 33 pada mikrokontroler terhubung ke pin data DHT
#define DHTTYPE DHT11 // Menentukan tipe sensor yang digunakan yaitu DHT11
DHT dht(DHTPIN, DHTTYPE); // Membuat objek 'dht' untuk mulai berinteraksi dengan sensor

const int relayPin = 18;  // Menentukan pin 18 untuk mengendalikan modul relay (kipas)
bool fanState = false;    // Variabel untuk menyimpan status kipas saat ini (menyala/mati)

// Variabel Logika Cerdas
bool manualOverride = false; // Penanda apakah user sedang mengontrol kipas secara manual via dashboard
bool lastAutoState = false;  // Menyimpan status memori suhu sebelumnya (panas atau dingin)

// Fungsi khusus untuk menyalakan/mematikan kipas
void setFan(bool state) {
  // Hanya jalankan jika perintah status baru berbeda dengan status kipas saat ini
  if (state != fanState) {
    fanState = state; // Perbarui status kipas
    
    // Logika untuk modul relay Active-LOW
    if (fanState) {
      pinMode(relayPin, OUTPUT);  // Jadikan pin sebagai output
      digitalWrite(relayPin, LOW); // Beri sinyal LOW untuk menyalakan relay/kipas
    } else {
      pinMode(relayPin, INPUT); // Jadikan pin sebagai input (High-Impedance) untuk memutus arus dan mematikan relay
    }
    
    // Mengirimkan data ke dashboard setiap kali ada perubahan status kipas
    Serial.print("S:");
    Serial.println(fanState ? "1" : "0"); // Kirim "S:1" jika nyala, "S:0" jika mati
  }
}

void setup() {
  Serial.begin(115200);      // Memulai komunikasi Serial (untuk dashboard) dengan kecepatan 115200 bps
  dht.begin();               // Memulai pembacaan sensor DHT
  pinMode(relayPin, INPUT);  // Pastikan kipas mati saat alat pertama kali dihidupkan
  fanState = false;          // Set status awal ke mati
  
  // Inisialisasi status awal lingkungan saat alat dinyalakan
  float t = dht.readTemperature();
  lastAutoState = (!isnan(t) && t >= 32); // Jika suhu awal >= 32°C, anggap lingkungan sedang "panas" (true)
}

void loop() {
  // ========================================================
  // 1. Baca Perintah dari Dashboard (Interaksi User / Manual)
  // ========================================================
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n'); // Baca teks dari dashboard sampai enter
    input.trim(); 
    
    if (input == "ON") {
      manualOverride = true; // Aktifkan mode manual
      setFan(true);          // Paksa kipas menyala
    } 
    else if (input == "OFF") {
      manualOverride = true; // Aktifkan mode manual
      setFan(false);         // Paksa kipas mati
    }
  }

  // ========================================================
  // 2. Logika Sensor & Sinkronisasi (Mode Otomatis)
  // ========================================================
  static unsigned long lastSensorRead = 0; // Menyimpan waktu terakhir sensor dibaca
  
  // Gunakan millis() untuk jeda 2 detik tanpa menghentikan sistem (non-blocking)
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis(); // Perbarui waktu pembacaan
    
    float temperature = dht.readTemperature(); // Baca suhu saat ini
    
    // Pastikan sensor berhasil membaca angka (bukan NaN / Not a Number)
    if (!isnan(temperature)) {
      // Kirim Suhu terbaru ke Dashboard secara berkala
      Serial.print("T:");
      Serial.println(temperature, 1); // Kirim dengan 1 angka di belakang koma (misal T:32.5)
      
      bool currentAutoState = (temperature >= 32); // Kipas harusnya nyala jika suhu >= 32°C

      // JIKA terjadi perubahan drastis(contoh: dari 33°C turun ke 30°C)
      if (currentAutoState != lastAutoState) {
        manualOverride = false; // Matikan mode manual, biarkan sistem otomatis mengambil alih lagi
        lastAutoState = currentAutoState; // Simpan memori suhu terbaru
        Serial.println("System: Auto-logic reset due to temperature event.");
      }

      // Jika user TIDAK sedang menekan tombol manual, jalankan kipas sesuai suhu otomatis
      if (!manualOverride) {
        setFan(currentAutoState);
      }
    }
  }
}
