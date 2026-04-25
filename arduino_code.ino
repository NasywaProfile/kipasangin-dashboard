// =====================================================
// Smart Fan IoT - HYBRID (MQTT Real-time + Firebase Logging)
// 
// Install di Library Manager:
// 1. MQTT by Joel Gaehwiler
// 2. DHT sensor library by Adafruit
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

// --- KONFIGURASI SUPABASE ---
#define SUPABASE_URL "https://tddbbqwksbkqcfpdpjuc.supabase.co"
#define SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGJicXdrc2JrcWNmcGRwanVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTAyMjMsImV4cCI6MjA5MTgyNjIyM30.jEUYXFH3JGhHnBnr2b65T8Ldj6j69EV2msTiRZxPeS8"

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
bool  manualOverride = false;
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
    logToSupabase(isPowerOn ? "auto_on" : "auto_off", currentTemp, thresholdTemp);
  }
}

// =====================================================
// TERIMA PERINTAH DARI MQTT — LANGSUNG EKSEKUSI
// =====================================================
void messageReceived(String &topic, String &payload) {
  Serial.println("MSG: " + topic + " -> " + payload);

  if (topic == "smartfan/cmd/power") {
    manualOverride = true;
    bool newState = (payload == "ON");
    if (newState != isPowerOn) {
      setFan(newState, "manual"); // ⚡ RELAY NYALA/MATI INSTAN DI SINI
    }
  }
  else if (topic == "smartfan/cmd/threshold") {
    float val = payload.toFloat();
    if (val > 0) {
      thresholdTemp = val;
      manualOverride = false; // kembalikan ke mode otomatis
      Serial.println("Threshold: " + String(thresholdTemp, 1));
    }
  }
  else if (topic == "smartfan/cmd/status") {
    // Dashboard request status saat pertama connect
    mqttClient.publish("smartfan/data/power", isPowerOn ? "ON" : "OFF");
    mqttClient.publish("smartfan/data/temp",  String(currentTemp, 1));
    mqttClient.publish("smartfan/data/threshold", String(thresholdTemp, 1));
  }
}

// =====================================================
// SUPABASE LOG (background, non-blocking waktu)
// =====================================================
void logToSupabase(String type, float temp, float threshold) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  
  String url = String(SUPABASE_URL) + "/rest/v1/activity_log";
  http.begin(url);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  String payload = "{\"type\": \"" + type + "\", \"temp\": " + String(temp, 1) + ", \"threshold\": " + String(threshold, 1) + "}";
  http.POST(payload);
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
