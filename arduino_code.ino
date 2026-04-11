// =====================================================
// Smart Fan IoT - Firebase REST (Super Ringan!)
// HANYA butuh library bawaan ESP32, TIDAK perlu install library tambahan apapun!
// Cukup install: DHT sensor library by Adafruit
// Polling interval: 500ms (respons cepat ~0.5 detik)
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
  http.setTimeout(1500);           // Timeout 1.5 detik agar tidak hang lama
  http.setConnectTimeout(1500);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "keep-alive"); // Reuse koneksi = lebih cepat
  http.PUT(value);
  http.end();
}

// GET data dari Firebase (Baca nilai), return sebagai String
String firebaseGet(String path) {
  if (WiFi.status() != WL_CONNECTED) return "null";
  HTTPClient http;
  String url = String(FIREBASE_HOST) + path + ".json?auth=" + FIREBASE_AUTH;
  http.begin(url);
  http.setTimeout(1500);
  http.setConnectTimeout(1500);
  http.addHeader("Connection", "keep-alive");
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
// LOGIKA KIPAS - RELAY NYALA INSTAN, HTTP MENYUSUL
// =====================================================
bool pendingStatusUpdate = false; // Flag: perlu update Firebase setelah relay switch

void setFan(bool state) {
  if (state != isPowerOn) {
    isPowerOn = state;
    
    // 🔴 RELAY SWITCH INSTAN — Tidak ada HTTP di sini!
    if (isPowerOn) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW);   // Active Low: LOW = NYALA
    } else {
      pinMode(relayPin, INPUT);      // High-Impedance = MATI
    }
    
    // Tandai untuk update Firebase (dilakukan setelah relay nyala)
    pendingStatusUpdate = true;
    
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
      firebasePut("/smartfan/temperature", String(currentTemp, 1));
      
      if (!manualOverride) {
        if (currentTemp >= thresholdTemp && !isPowerOn) {
          setFan(true);
          firebasePut("/smartfan/history/" + String(millis()),
            "{\"type\":\"auto_on\",\"temp\":" + String(currentTemp,1) + "}");
        } else if (currentTemp < (thresholdTemp - hysteresis) && isPowerOn) {
          setFan(false);
          firebasePut("/smartfan/history/" + String(millis()),
            "{\"type\":\"auto_off\",\"temp\":" + String(currentTemp,1) + "}");
        }
      }
    }
  }

  // 1.5 KIRIM UPDATE STATUS KE FIREBASE (setelah relay switch, non-blocking)
  if (pendingStatusUpdate) {
    pendingStatusUpdate = false; // Reset flag dulu
    firebasePut("/smartfan/power", isPowerOn ? "true" : "false");
  }

  // 2. BACA SEMUA PERINTAH DASHBOARD SEKALIGUS (1 Request = Lebih Cepat!)
  // Polling setiap 200ms agar respons sangat cepat
  if (millis() - lastFirebaseRead > 200) {
    lastFirebaseRead = millis();

    // Baca seluruh node /smartfan sekaligus dalam 1 HTTP request
    String payload = firebaseGet("/smartfan");
    
    if (payload != "null" && payload.length() > 10) {
      
      // --- Parse manualOverride ---
      bool webOverride = (payload.indexOf("\"manualOverride\":true") >= 0);
      if (webOverride != manualOverride) {
        manualOverride = webOverride;
      }

      // --- Parse power ON/OFF ---
      bool webPower = (payload.indexOf("\"power\":true") >= 0);
      if (webPower != isPowerOn) {
        // Reset state agar setFan() bisa jalan
        bool prevState = isPowerOn;
        isPowerOn = !webPower;
        setFan(webPower);
      }

      // --- Parse threshold ---
      int tIdx = payload.indexOf("\"threshold\":");
      if (tIdx >= 0) {
        String tStr = payload.substring(tIdx + 12);
        tStr = tStr.substring(0, tStr.indexOf(",") > 0 ? tStr.indexOf(",") : tStr.indexOf("}"));
        tStr.trim();
        float webThresh = tStr.toFloat();
        if (webThresh > 0 && abs(webThresh - thresholdTemp) > 0.05) {
          thresholdTemp = webThresh;
          manualOverride = false;
          Serial.println("Threshold: " + String(thresholdTemp, 1));
        }
      }
    }
  }
}

