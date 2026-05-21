// =====================================================
// Smart Fan IoT - HYBRID (MQTT Real-time + MySQL Logging)
//
// Install di Library Manager:
// 1. WiFiManager by tzapu
// 2. MQTT by Joel Gaehwiler
// 3. DHT sensor library by Adafruit
//
// WiFi + HTTPClient sudah bawaan ESP32 (tidak perlu install)
// =====================================================

#include <WiFi.h>
#include <WiFiManager.h> // <-- Tambahan Library Baru!
#include <MQTT.h>
#include <HTTPClient.h>
#include <DHT.h>

// --- KONFIGURASI WIFI ---
// WiFi sekarang diatur secara otomatis/dinamis dari HP! 
// Jadi kita tidak perlu lagi menuliskan SSID & Password di sini.

// --- KONFIGURASI MQTT (HiveMQ Public - Gratis, Stabil) ---
const char mqtt_host[] = "broker.hivemq.com";
const int  mqtt_port   = 1883; // Plain TCP, TANPA SSL = super cepat!

// --- KONFIGURASI LOCAL SERVER (XAMPP) ---
// Ganti [IP_LAPTOP] dengan IP Laptop Anda (misal: 192.168.1.10)
const char* local_server_url = "http://[IP_LAPTOP]/kipasangin/public/api/activity-log";

// --- KONFIGURASI HARDWARE ---
#define DHTPIN  33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;
// Active-Low relay: LOW = NYALA, INPUT (Hi-Z) = MATI
#define RELAY_ON()  { pinMode(relayPin, OUTPUT); digitalWrite(relayPin, LOW); }
#define RELAY_OFF() { pinMode(relayPin, INPUT); }

// --- State ---
bool  isPowerOn    = false;
bool  manualOverride = true; // Mulai dalam mode manual agar tidak langsung ON saat baru nyala
float currentTemp  = 24.5;
float thresholdTemp = 32.0;
float hysteresis   = 0.2; // Diperkecil supaya bereaksi lebih cepat

WiFiClient  net;
MQTTClient  mqttClient(512);

unsigned long lastSensorRead  = 0;

// =====================================================
// SWITCH RELAY — INSTAN, lalu publish status ke MQTT
// =====================================================
void setFan(bool state, String source) {
  isPowerOn = state;
  if (isPowerOn) {
    RELAY_ON();
  } else {
    RELAY_OFF();
  }
  // Publish balik status biar dashboard sinkron
  mqttClient.publish("smartfan/data/power", isPowerOn ? "ON" : "OFF", false, 1);
  Serial.println(isPowerOn ? "Fan: ON" : "Fan: OFF");

  // Jika triggernya dari sensor suhu (otomatis), log ke database.
  // Kalau dari manual, dashboard udah nge-log, jadi ngga perlu dobel.
  if (source == "auto") {
    logToLocal(isPowerOn ? "auto_on" : "auto_off", currentTemp);
  }
}

// =====================================================
// TERIMA PERINTAH DARI MQTT — LANGSUNG EKSEKUSI
// =====================================================
void messageReceived(String &topic, String &payload) {
  Serial.println("MSG: " + topic + " -> " + payload);

  if (topic == "smartfan/cmd/power") {
    manualOverride = true;
    // Sinkronkan mode manual ke dashboard secara real-time
    mqttClient.publish("smartfan/data/mode", "MANUAL", false, 1);
    bool newState = (payload == "ON");
    if (newState != isPowerOn) {
      setFan(newState, "manual"); // ⚡ RELAY NYALA/MATI INSTAN DI SINI
    }
  }
  else if (topic == "smartfan/cmd/threshold") {
    float val = payload.toFloat();
    if (val > 0) {
      thresholdTemp = val;
      Serial.println("Threshold: " + String(thresholdTemp, 1));
    }
  }
  else if (topic == "smartfan/cmd/mode") {
    if (payload == "AUTO") {
      manualOverride = false;
      Serial.println("Mode: AUTO");
    } else {
      manualOverride = true;
      Serial.println("Mode: MANUAL");
    }
    mqttClient.publish("smartfan/data/mode", manualOverride ? "MANUAL" : "AUTO", false, 1);
  }
  else if (topic == "smartfan/cmd/status") {
    // Dashboard request status saat pertama connect
    mqttClient.publish("smartfan/data/power", isPowerOn ? "ON" : "OFF");
    mqttClient.publish("smartfan/data/temp",  String(currentTemp, 1));
    mqttClient.publish("smartfan/data/threshold", String(thresholdTemp, 1)); // FIX: Gunakan thresholdTemp asli
    mqttClient.publish("smartfan/data/mode", manualOverride ? "MANUAL" : "AUTO");
  }
}

// =====================================================
// LOCAL LOG (background, non-blocking waktu)
// =====================================================
void logToLocal(String type, float temp) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // Safety Check: Jangan kirim HTTP jika URL masih berupa placeholder [IP_LAPTOP]
  if (strstr(local_server_url, "[IP_LAPTOP]") != NULL) {
    Serial.println("Skipping logToLocal: local_server_url still contains placeholder [IP_LAPTOP]");
    return;
  }

  HTTPClient http;
  
  http.begin(local_server_url); // Gunakan internal client agar tidak menabrak socket MQTT net!
  http.setTimeout(1500); // Set timeout 1.5 detik
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"device_id\": 1, \"action_type\": \"" + type + "\", \"temperature\": " + String(temp, 1) + "}";
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    Serial.println("Log Success: " + String(httpResponseCode));
  } else {
    Serial.println("Log Error: " + String(httpResponseCode));
  }
  http.end();
}

// =====================================================
// KONEKSI WIFI + MQTT
// =====================================================
void connectAll() {
  // WiFi
  if (WiFi.status() != WL_CONNECTED) {
    WiFiManager wm;
    
    // NOTE: Kalau kamu pengen ngehapus WiFi rumah lama yang sempat tersimpan 
    // agar kipasnya mancarin "Setup_Kipas_Pintar" lagi, hilangkan komentar (//) pada baris di bawah:
    // wm.resetSettings(); 

    Serial.println("\nMencari WiFi yang tersimpan...");
    
    // Ini ajaibnya: Kalau gagal nemu WiFi, ESP32 otomatis bikin WiFi namanya "Setup_Kipas_Pintar"
    if (!wm.autoConnect("Setup_Kipas_Pintar")) {
      Serial.println("Gagal connect dan timeout... Restart alat.");
      delay(3000);
      ESP.restart();
      delay(5000);
    }
    Serial.println("\nWiFi OK! Terhubung dengan IP: " + WiFi.localIP().toString());
  }

  // MQTT
  mqttClient.begin(mqtt_host, mqtt_port, net);
  mqttClient.onMessage(messageReceived);
  mqttClient.setKeepAlive(60);

  String clientId = "esp32_fan_" + String(WiFi.macAddress());
  Serial.print("MQTT");
  while (!mqttClient.connect(clientId.c_str())) { Serial.print("."); delay(500); }
  Serial.println(" OK!");

  mqttClient.subscribe("smartfan/cmd/#", 1); // QoS 1 = pasti diterima

  // Umumkan status awal ke dashboard
  mqttClient.publish("smartfan/data/power", isPowerOn ? "ON" : "OFF", false, 1);
  mqttClient.publish("smartfan/data/threshold", String(thresholdTemp, 1), false, 1);
  mqttClient.publish("smartfan/data/mode", manualOverride ? "MANUAL" : "AUTO", false, 1);
}

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);

  // Pastikan kipas MATI saat pertama nyala
  RELAY_OFF();
  isPowerOn = false;

  dht.begin();
  connectAll();
  Serial.println("Siap! Kipas standby (OFF).");
}

// =====================================================
// LOOP UTAMA
// =====================================================
void loop() {
  // Jaga koneksi MQTT tetap hidup (non-blocking)
  mqttClient.loop();

  // Reconnect jika putus
  if (!mqttClient.connected()) {
    Serial.println("MQTT putus, reconnect...");
    connectAll();
  }



  // Baca sensor setiap 2 detik (batas maksimal kecepatan sensor DHT11)
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();

    float temp = dht.readTemperature();
    if (!isnan(temp)) {
      currentTemp = temp;

      // Publish suhu via MQTT (real-time ke dashboard)
      mqttClient.publish("smartfan/data/temp", String(currentTemp, 1), false, 0);
    }
  }

  // Logika Otomatis (dievaluasi terus-menerus, tidak usah nunggu 2 detik!)
  // Bereaksi INSTAN kalau batas threshold diubah dari HP.
  if (!manualOverride) {
    if (currentTemp >= thresholdTemp && !isPowerOn) {
      setFan(true, "auto");
    } else if (currentTemp < (thresholdTemp - hysteresis) && isPowerOn) {
      setFan(false, "auto");
    }
  }
}
