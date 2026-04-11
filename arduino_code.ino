// =====================================================
// Smart Fan IoT - Firebase REST (Super Ringan!)
// HANYA butuh library bawaan ESP32, TIDAK perlu install library tambahan apapun!
// Cukup install: DHT sensor library by Adafruit
// =====================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// --- KONFIGURASI WIFI ---
// Ganti dengan nama Hotspot HP atau WiFi kamu
#define WIFI_SSID     "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD "PASSWORD_WIFI_KAMU"

// --- KONFIGURASI FIREBASE (sudah diisi otomatis) ---
#define FIREBASE_HOST "https://smart-fan-ff0a0-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyDFLZu2goPcVIj5ZbsjyfqEEfVlqAMDZ4s"

// --- KONFIGURASI HARDWARE ---
#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;
bool isPowerOn = false;
bool manualOverride = false;
float currentTemp = 24.5;
float thresholdTemp = 32.0;
float hysteresis = 0.5;

unsigned long lastSensorRead = 0;
unsigned long lastFirebaseRead = 0;

// =====================================================
// FUNGSI FIREBASE REST API
// =====================================================

// PUT data ke Firebase (Tulis nilai)
void firebasePut(String path, String value) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(FIREBASE_HOST) + path + ".json?auth=" + FIREBASE_AUTH;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.PUT(value);
  http.end();
}

// GET data dari Firebase (Baca nilai), return sebagai String
String firebaseGet(String path) {
  if (WiFi.status() != WL_CONNECTED) return "null";
  HTTPClient http;
  String url = String(FIREBASE_HOST) + path + ".json?auth=" + FIREBASE_AUTH;
  http.begin(url);
  int code = http.GET();
  String result = "null";
  if (code == 200) {
    result = http.getString();
    result.trim();
  }
  http.end();
  return result;
}

// =====================================================
// LOGIKA KIPAS
// =====================================================
void setFan(bool state) {
  if (state != isPowerOn) {
    isPowerOn = state;
    if (isPowerOn) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW);   // Active Low: LOW = NYALA
    } else {
      pinMode(relayPin, INPUT);       // High-Impedance = MATI
    }
    // Sinkronisasi status ke Firebase
    firebasePut("/smartfan/power", isPowerOn ? "true" : "false");
    Serial.print("Fan: ");
    Serial.println(isPowerOn ? "ON" : "OFF");
  }
}

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  
  // Pastikan kipas MATI saat pertama nyala
  pinMode(relayPin, INPUT);
  isPowerOn = false;
  
  dht.begin();

  // Sambungkan WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Terhubung! IP: " + WiFi.localIP().toString());

  // Set nilai awal di Firebase
  firebasePut("/smartfan/power", "false");
  firebasePut("/smartfan/manualOverride", "false");
  
  // Baca threshold tersimpan dari Firebase (kalau ada)
  String savedThresh = firebaseGet("/smartfan/threshold");
  if (savedThresh != "null" && savedThresh.length() > 0) {
    thresholdTemp = savedThresh.toFloat();
  } else {
    firebasePut("/smartfan/threshold", String(thresholdTemp, 1));
  }
  
  Serial.println("Sistem Online! Threshold: " + String(thresholdTemp, 1) + "°C");
}

// =====================================================
// LOOP UTAMA
// =====================================================
void loop() {
  
  // 1. BACA SENSOR setiap 3 detik
  if (millis() - lastSensorRead > 3000) {
    lastSensorRead = millis();
    
    float temp = dht.readTemperature();
    if (!isnan(temp)) {
      currentTemp = temp;
      
      // Kirim suhu ke Firebase
      firebasePut("/smartfan/temperature", String(currentTemp, 1));
      
      // Logika Otomatis (hanya jika tidak di-override manual)
      if (!manualOverride) {
        if (currentTemp >= thresholdTemp && !isPowerOn) {
          setFan(true);
          // Catat ke riwayat Firebase
          String histEntry = "{\"type\":\"auto_on\",\"temp\":" + String(currentTemp,1) + ",\"ts\":" + String(millis()) + "}";
          firebasePut("/smartfan/history/" + String(millis()), histEntry);
        } else if (currentTemp < (thresholdTemp - hysteresis) && isPowerOn) {
          setFan(false);
          String histEntry = "{\"type\":\"auto_off\",\"temp\":" + String(currentTemp,1) + ",\"ts\":" + String(millis()) + "}";
          firebasePut("/smartfan/history/" + String(millis()), histEntry);
        }
      }
    }
  }

  // 2. BACA PERINTAH DARI DASHBOARD setiap 2 detik (Firebase polling)
  if (millis() - lastFirebaseRead > 2000) {
    lastFirebaseRead = millis();

    // Cek manualOverride
    String ovr = firebaseGet("/smartfan/manualOverride");
    bool webOverride = (ovr == "true");
    if (webOverride != manualOverride) {
      manualOverride = webOverride;
    }

    // Cek perintah power dari web
    String webPowerStr = firebaseGet("/smartfan/power");
    bool webPower = (webPowerStr == "true");
    if (webPower != isPowerOn) {
      isPowerOn = webPower; // Update dulu biar setFan() tidak skip
      isPowerOn = !webPower; // Reset state agar setFan() mau jalan
      setFan(webPower);
    }

    // Cek threshold dari web
    String webThreshStr = firebaseGet("/smartfan/threshold");
    if (webThreshStr != "null") {
      float webThresh = webThreshStr.toFloat();
      if (abs(webThresh - thresholdTemp) > 0.05) {
        thresholdTemp = webThresh;
        manualOverride = false; // Kembali ke mode otomatis
        Serial.println("Threshold baru: " + String(thresholdTemp, 1));
      }
    }
  }
}
