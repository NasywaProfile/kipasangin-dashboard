// --- Smart Fan IoT (WiFi Manager + Firebase) ---
// Perlu install library di Arduino IDE:
// 1. WiFiManager by tzapu
// 2. Firebase ESP32 Client by Mobizt
// 3. DHT sensor library by Adafruit

#include <WiFi.h>
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <DHT.h>

#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;

// --- FIREBASE CREDENTIALS ---
// Ganti dengan konfigurasi Firebase Anda
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

void setup() {
  Serial.begin(115200);
  
  // 1. Matikan Kipas Secara Tegas Saat Pertama Kali Nyala
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); // HIGH = Kipas Mati (Berdasarkan skema Active-Low / Relay umum)
  isPowerOn = false;
  
  dht.begin();

  // 2. WiFi Manager Configuration
  WiFiManager wm;
  // Berguna untuk Test Awal: Hapus tanda // di bawah ini JIKA WiFi lama nyangkut dan portal tidak muncul
  // wm.resetSettings(); 
  
  Serial.println("Memulai Koneksi WiFi...");
  // Ini akan membuat WiFi AP bernama "SmartFan_Setup" jika alat belum pernah tersambung ke WiFi
  bool res = wm.autoConnect("SmartFan_Setup");
  if (!res) {
    Serial.println("Gagal koneksi WiFi, restart...");
    delay(3000);
    ESP.restart();
  }
  Serial.println("WiFi Terhubung!");

  // 3. Firebase Configuration
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

  // Set nilai awal Sistem ke Firebase (Selalu MULAI DARI OFF)
  Firebase.RTDB.setFloat(&fbdo, "smartfan/temperature", currentTemp);
  Firebase.RTDB.getFloat(&fbdo, "smartfan/threshold");
  // Cek kalau belum ada, isi default
  if(fbdo.dataType() == "null") {
      Firebase.RTDB.setFloat(&fbdo, "smartfan/threshold", thresholdTemp);
  } else {
      thresholdTemp = fbdo.floatData();
  }
  
  Firebase.RTDB.setBool(&fbdo, "smartfan/power", false);
  Firebase.RTDB.setBool(&fbdo, "smartfan/manualOverride", false);

  Serial.println("Sistem Berjalan Online! Default Mati.");
}

void setFan(bool state) {
  if(state != isPowerOn) {
    isPowerOn = state;
    digitalWrite(relayPin, isPowerOn ? LOW : HIGH); // LOW artinya nyala (Relay Active Low)
    
    // Sync power state to Firebase immediately
    Firebase.RTDB.setBool(&fbdo, "smartfan/power", isPowerOn);
    Serial.print("Fan State Berubah: ");
    Serial.println(isPowerOn ? "ON" : "OFF");
  }
}

void loop() {
  // 1. Baca Sensor dan Logika Threshold setiap 2 detik
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temp = dht.readTemperature();
    if (!isnan(temp)) {
      currentTemp = temp;
      
      // Update Temperature to Firebase (hanya update tiap 10 detik atau jika beda jauh)
      if (millis() - lastFirebaseSync > 10000) {
         Firebase.RTDB.setFloat(&fbdo, "smartfan/temperature", currentTemp);
         lastFirebaseSync = millis();
      }

      // Logika "Nyala di atas, Mati di bawah"
      if (!manualOverride) {
        if (currentTemp >= thresholdTemp && !isPowerOn) {
          setFan(true);
        } else if (currentTemp < (thresholdTemp - hysteresis) && isPowerOn) {
          setFan(false);
        }
      }
    }
  }

  // 2. Baca perintah dari Firebase
  if (Firebase.ready()) {
    // Ambil info manualOverride dari web
    if (Firebase.RTDB.getBool(&fbdo, "smartfan/manualOverride")) {
       bool userOverride = fbdo.boolData();
       if(userOverride != manualOverride) {
          manualOverride = userOverride;
          Serial.println("Manual Override Berubah!");
       }
    }

    // Ambil info power dari web
    if (Firebase.RTDB.getBool(&fbdo, "smartfan/power")) {
       bool webPower = fbdo.boolData();
       if (webPower != isPowerOn) {
         setFan(webPower);
       }
    }

    // Ambil threshold dari web
    if (Firebase.RTDB.getFloat(&fbdo, "smartfan/threshold")) {
       float webThresh = fbdo.floatData();
       if(abs(webThresh - thresholdTemp) > 0.05) { // Threshold changed
          thresholdTemp = webThresh;
          manualOverride = false; // Reset override kalau suhu target diubah
          Firebase.RTDB.setBool(&fbdo, "smartfan/manualOverride", false);
          Serial.print("Threshold Berubah ke: ");
          Serial.println(thresholdTemp);
       }
    }
  }
}
