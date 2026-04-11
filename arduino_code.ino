// --- Smart Fan IoT - FIREBASE LITE (Super Ringan) ---
// PERLU DI-INSTALL DI LIBRARY MANAGER:
// 1. Firebase Arduino Client Library for ESP8266 and ESP32 by Mobizt
// 2. DHT sensor library by Adafruit

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <DHT.h>

// --- KONFIGURASI WIFI (Hotspot HP / WiFi Rumah) ---
// Tulis nama WiFi dan Password di sini agar memori sangat ringan
#define WIFI_SSID "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD "PASSWORD_WIFI_KAMU"

// --- KONFIGURASI RELAY ---
const int relayPin = 18;
// TIPE RELAY: ACTIVE LOW
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// --- KONFIGURASI SENSOR ---
#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// --- FIREBASE CREDENTIALS ---
#define API_KEY "AIzaSyDFLZu2goPcVIj5ZbsjyfqEEfVlqAMDZ4s"
#define DATABASE_URL "smart-fan-ff0a0-default-rtdb.firebaseio.com"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// State Variables
bool isPowerOn = false;
bool manualOverride = false;
float currentTemp = 24.5;
float thresholdTemp = 32.0;
float hysteresis = 0.5;
unsigned long lastSensorRead = 0;
unsigned long lastFirebaseSync = 0;

void setFan(bool state) {
  isPowerOn = state;
  if(isPowerOn) {
    digitalWrite(relayPin, RELAY_ON);
  } else {
    digitalWrite(relayPin, RELAY_OFF);
  }
  
  // Update status ke Firebase
  Firebase.RTDB.setBool(&fbdo, "smartfan/power", isPowerOn);
  Serial.print("Fan State: ");
  Serial.println(isPowerOn ? "ON" : "OFF");
}

void setup() {
  Serial.begin(115200);
  
  // PASTIKAN KIPAS MATI SAAT BARU DICOLOK
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, RELAY_OFF); 
  isPowerOn = false;
  
  dht.begin();

  // 1. WiFi Singkat (Tanpa WiFiManager, Hemat 400KB+ Memori!)
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Tersambung! IP Address: ");
  Serial.println(WiFi.localIP());

  // 2. Firebase Configuration
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Auth Berhasil");
  } else {
    Serial.println("Firebase Auth Gagal");
  }
  
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // 3. Ambil data terakhir dari Firebase (atau setel bawaan)
  if(Firebase.RTDB.getFloat(&fbdo, "smartfan/threshold")) {
      thresholdTemp = fbdo.floatData();
  } else {
      Firebase.RTDB.setFloat(&fbdo, "smartfan/threshold", thresholdTemp);
  }
  
  // Paksa laporan ke web bahwa kipas posisi OFF dan otomatis pas awal nyala
  Firebase.RTDB.setBool(&fbdo, "smartfan/power", false);
  Firebase.RTDB.setBool(&fbdo, "smartfan/manualOverride", false);

  Serial.println("Sistem Berjalan Online! Kipas Siaga (OFF).");
}

void loop() {
  // 1. Baca Sensor dan Logika Threshold setiap 2 detik
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temp = dht.readTemperature();
    if (!isnan(temp)) {
      currentTemp = temp;
      
      // Laporkan Suhu ke Dashboard tiap 5 detik
      if (millis() - lastFirebaseSync > 5000) {
         Firebase.RTDB.setFloat(&fbdo, "smartfan/temperature", currentTemp);
         lastFirebaseSync = millis();
      }

      // JALANKAN OTOMATIS JIKA TIDAK ADA KUNCIAN MANUAL
      if (!manualOverride) {
        if (currentTemp >= thresholdTemp && !isPowerOn) {
          setFan(true);
        } else if (currentTemp < (thresholdTemp - hysteresis) && isPowerOn) {
          setFan(false);
        }
      }
    }
  }

  // 2. Baca perintah dari Dashboard
  if (Firebase.ready()) {
    if (Firebase.RTDB.getBool(&fbdo, "smartfan/manualOverride")) {
       bool userOverride = fbdo.boolData();
       if(userOverride != manualOverride) {
          manualOverride = userOverride;
          Serial.print("Mode Otomatis: ");
          Serial.println(manualOverride ? "DIMATIKAN" : "AKTIF");
       }
    }

    if (Firebase.RTDB.getBool(&fbdo, "smartfan/power")) {
       bool webPower = fbdo.boolData();
       if (webPower != isPowerOn) {
         setFan(webPower); 
       }
    }

    if (Firebase.RTDB.getFloat(&fbdo, "smartfan/threshold")) {
       float webThresh = fbdo.floatData();
       if(abs(webThresh - thresholdTemp) > 0.1) {
          thresholdTemp = webThresh;
          Serial.print("Threshold Berubah ke: ");
          Serial.println(thresholdTemp);
       }
    }
  }
}
