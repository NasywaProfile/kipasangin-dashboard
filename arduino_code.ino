/*
 * Smart Fan Dashboard - Firebase IoT Edition (FIX TIME SYNC)
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>
#include "time.h"

// 1. KREDENSIAL WIFI
#define WIFI_SSID "MyRepublic_C2464735"
#define WIFI_PASSWORD "C2464735"

// 2. KREDENSIAL FIREBASE
#define API_KEY "AIzaSyDFLZu2goPcVIj5ZbsjyfqEEfVlqAMDZ4s"
#define DATABASE_URL "https://smart-fan-ff0a0-default-rtdb.firebaseio.com/"

// 3. KONFIGURASI PIN
#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
const int relayPin = 18;

// Firebase Data Objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
bool fanState = false;

// Fungsi Sinkronisasi Waktu (Wajib untuk HTTPS di ESP32)
void syncTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Menyinkronkan Waktu");
  while (time(nullptr) < 1000000000l) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWaktu Sinkron!");
}

void setFan(bool state) {
  fanState = state;
  if (fanState) {
    pinMode(relayPin, OUTPUT);
    digitalWrite(relayPin, LOW); 
  } else {
    pinMode(relayPin, INPUT); 
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(relayPin, INPUT); 
  dht.begin();

  // Koneksi WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menyambungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Terhubung!");

  // Sinkronisasi Waktu
  syncTime();

  // Konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 1. Baca Perintah dari Firebase (Fan State)
  if (Firebase.ready()) {
    if (Firebase.getInt(fbdo, "/device/fanState")) {
      int val = fbdo.intData();
      bool newS = (val == 1);
      if (newS != fanState) {
        setFan(newS);
        Serial.println(newS ? "Dashboard: Kipas ON" : "Dashboard: Kipas OFF");
      }
    }
  }

  // 2. Kirim Data ke Firebase (Setiap 3 detik)
  if (millis() - sendDataPrevMillis > 3000 || sendDataPrevMillis == 0) {
    sendDataPrevMillis = millis();
    
    float temperature = dht.readTemperature();
    
    if (isnan(temperature)) {
      Serial.println("Error: Sensor DHT11 tidak terbaca!");
    } else {
      Serial.print("Mencoba kirim suhu: ");
      Serial.println(temperature);
      
      if (Firebase.ready()) {
        if (Firebase.setFloat(fbdo, "/device/temperature", temperature)) {
          Serial.println(">>> BERHASIL KIRIM KE FIREBASE!");
        } else {
          Serial.print(">>> GAGAL KIRIM: ");
          Serial.println(fbdo.errorReason());
        }
      }
      
      // Logika Otomatis: Nyalakan jika >= 32 derajat, Matikan jika < 32
      if (temperature >= 32 && !fanState) {
          Firebase.setInt(fbdo, "/device/fanState", 1);
          setFan(true);
      } else if (temperature < 32 && fanState) {
          Firebase.setInt(fbdo, "/device/fanState", 0);
          setFan(false);
      }
    }
  }
}
