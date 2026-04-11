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
#include <MQTT.h>
#include <HTTPClient.h>
#include <DHT.h>

// --- KONFIGURASI WIFI ---
#define WIFI_SSID     "NAMA_WIFI_KAMU"
#define WIFI_PASSWORD "PASSWORD_WIFI_KAMU"

// --- KONFIGURASI MQTT (HiveMQ Public - Gratis, Stabil) ---
const char mqtt_host[] = "broker.hivemq.com";
const int  mqtt_port   = 1883; // Plain TCP, TANPA SSL = super cepat!

// --- KONFIGURASI FIREBASE (untuk logging suhu saja) ---
#define FIREBASE_HOST "https://smart-fan-ff0a0-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyDFLZu2goPcVIj5ZbsjyfqEEfVlqAMDZ4s"

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
float hysteresis   = 0.5;

WiFiClient  net;
MQTTClient  mqttClient(512);

unsigned long lastSensorRead  = 0;
unsigned long lastFirebaseLog = 0;
bool pendingFirebaseLog = false;

// =====================================================
// SWITCH RELAY — INSTAN, lalu publish status ke MQTT
// =====================================================
void setFan(bool state) {
  isPowerOn = state;
  if (isPowerOn) {
    RELAY_ON();
  } else {
    RELAY_OFF();
  }
  // Publish balik status biar dashboard sinkron
  mqttClient.publish("smartfan/data/power", isPowerOn ? "ON" : "OFF", false, 1);
  pendingFirebaseLog = true; // tandai untuk log ke Firebase
  Serial.println(isPowerOn ? "Fan: ON" : "Fan: OFF");
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
      setFan(newState); // ⚡ RELAY NYALA/MATI INSTAN DI SINI
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
// FIREBASE LOG (background, non-blocking waktu)
// =====================================================
void logToFirebase(float temp) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(FIREBASE_HOST) + "/smartfan/temperature.json?auth=" + FIREBASE_AUTH);
  http.setTimeout(3000);
  http.addHeader("Content-Type", "application/json");
  http.PUT(String(temp, 1));
  http.end();
}

void logPowerToFirebase() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(FIREBASE_HOST) + "/smartfan/power.json?auth=" + FIREBASE_AUTH);
  http.setTimeout(3000);
  http.addHeader("Content-Type", "application/json");
  http.PUT(isPowerOn ? "true" : "false");
  http.end();
}

// =====================================================
// KONEKSI WIFI + MQTT
// =====================================================
void connectAll() {
  // WiFi
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("WiFi");
    while (WiFi.status() != WL_CONNECTED) { Serial.print("."); delay(500); }
    Serial.println(" OK! IP: " + WiFi.localIP().toString());
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

  // Kirim log Firebase untuk power state jika ada perubahan
  if (pendingFirebaseLog) {
    pendingFirebaseLog = false;
    logPowerToFirebase();
  }

  // Baca sensor setiap 5 detik + publish suhu via MQTT + log ke Firebase
  if (millis() - lastSensorRead > 5000) {
    lastSensorRead = millis();

    float temp = dht.readTemperature();
    if (!isnan(temp)) {
      currentTemp = temp;

      // Publish suhu via MQTT (real-time ke dashboard)
      mqttClient.publish("smartfan/data/temp", String(currentTemp, 1), false, 0);

      // Log suhu ke Firebase setiap 30 detik (background, tidak ganggu MQTT)
      if (millis() - lastFirebaseLog > 30000) {
        lastFirebaseLog = millis();
        logToFirebase(currentTemp);
      }

      // Logika Otomatis (hanya jika tidak manual)
      if (!manualOverride) {
        if (currentTemp >= thresholdTemp && !isPowerOn) {
          setFan(true);
        } else if (currentTemp < (thresholdTemp - hysteresis) && isPowerOn) {
          setFan(false);
        }
      }
    }
  }
}
