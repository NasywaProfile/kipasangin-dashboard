/*
 * Smart Fan Dashboard - Firebase IoT Edition (Support HP & Website)
 * 
 * Library yang dibutuhkan (Install via Library Manager):
 * 1. Firebase ESP Client (oleh Mobizt)
 * 2. DHT sensor library (oleh Adafruit)
 */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

// 1. KREDENSIAL WIFI
#define WIFI_SSID "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD "PASSWORD_WIFI_KAMU"

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
    delay(300);
  }
  Serial.println("\nWiFi Terhubung!");

  // Konfigurasi Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 1. Baca Perintah dari Firebase (Fan State)
  if (Firebase.ready()) {
    int val = 0;
    if (Firebase.RTDB.getInt(&fbdo, "/device/fanState")) {
      if (fbdo.dataType() == "int") {
        val = fbdo.intData();
        bool newS = (val == 1);
        if (newS != fanState) {
          setFan(newS);
          Serial.println(newS ? "Kipas Nyala" : "Kipas Mati");
        }
      }
    }
  }

  // 2. Kirim Data ke Firebase (Setiap 3 detik)
  if (Firebase.ready() && (millis() - sendDataPrevMillis > 3000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    
    float temperature = dht.readTemperature();
    if (!isnan(temperature)) {
      Firebase.RTDB.setFloat(&fbdo, "/device/temperature", temperature);
      Serial.print("Update Suhu: ");
      Serial.println(temperature);
      
      // Logika Otomatis: Nyalakan jika >= 32 derajat
      if (temperature >= 32 && !fanState) {
          Firebase.RTDB.setInt(&fbdo, "/device/fanState", 1);
      }
    }
  }
}
