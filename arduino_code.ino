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
#include <WiFiClientSecure.h> // <-- Tambahan untuk MQTTS!
#include <base64.h>           // <-- Tambahan untuk Base64!
#include "mbedtls/base64.h"   // <-- Digunakan untuk decoding Base64 di ESP32
#include <WiFiManager.h> // <-- Tambahan Library Baru!
#include <MQTT.h>
#include <HTTPClient.h>
#include <DHT.h>

// --- KONFIGURASI WIFI ---
// WiFi sekarang diatur secara otomatis/dinamis dari HP! 
// Jadi kita tidak perlu lagi menuliskan SSID & Password di sini.

// --- KONFIGURASI MQTT (HiveMQ Public - Gratis, Stabil) ---
const char mqtt_host[] = "broker.hivemq.com";
const int  mqtt_port   = 8883; // MQTTS (Secure TLS/SSL)
const char mqtt_user[] = "";    // Isi dengan username private broker Anda jika ada
const char mqtt_pass[] = "";    // Isi dengan password private broker Anda jika ada
const char mqtt_topic_prefix[] = "smartfan/device_1"; // Prefix topik unik untuk keamanan

// --- KONFIGURASI LOCAL SERVER (XAMPP) ---
// Ganti [IP_LAPTOP] dengan IP Laptop Anda (misal: 192.168.1.10)
const char* local_server_url = "https://[IP_LAPTOP]/kipasangin/public/api/activity-log";

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

WiFiClientSecure net;
MQTTClient  mqttClient(512);

unsigned long lastSensorRead  = 0;

// Helper function to decode Base64 using built-in mbedtls
String base64Decode(const String &input) {
  size_t outputLength;
  size_t inputLength = input.length();
  size_t bufferSize = (inputLength * 3) / 4 + 2;
  unsigned char *outputBuffer = (unsigned char *)malloc(bufferSize);
  if (outputBuffer == NULL) {
    return "";
  }

  int result = mbedtls_base64_decode(outputBuffer, bufferSize, &outputLength, (const unsigned char *)input.c_str(), inputLength);
  if (result != 0) {
    free(outputBuffer);
    return "";
  }

  outputBuffer[outputLength] = '\0';
  String decoded = String((char *)outputBuffer);
  free(outputBuffer);
  return decoded;
}

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
  mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/power").c_str(), isPowerOn ? "ON" : "OFF", false, 1);
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

  // Decode Base64 Payload
  String decodedPayload = base64Decode(payload);
  Serial.println("Decoded: " + decodedPayload);

  if (topic == String(mqtt_topic_prefix) + "/cmd/power") {
    manualOverride = true;
    // Sinkronkan mode manual ke dashboard secara real-time
    mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/mode").c_str(), "MANUAL", false, 1);
    bool newState = (decodedPayload == "ON");
    if (newState != isPowerOn) {
      setFan(newState, "manual"); // ⚡ RELAY NYALA/MATI INSTAN DI SINI
    }
  }
  else if (topic == String(mqtt_topic_prefix) + "/cmd/threshold") {
    float val = decodedPayload.toFloat();
    if (val > 0) {
      thresholdTemp = val;
      Serial.println("Threshold: " + String(thresholdTemp, 1));
      mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/threshold").c_str(), String(thresholdTemp, 1).c_str(), false, 1);
    }
  }
  else if (topic == String(mqtt_topic_prefix) + "/cmd/mode") {
    if (decodedPayload == "AUTO") {
      manualOverride = false;
      Serial.println("Mode: AUTO");
    } else {
      manualOverride = true;
      Serial.println("Mode: MANUAL");
    }
    mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/mode").c_str(), manualOverride ? "MANUAL" : "AUTO", false, 1);
  }
  else if (topic == String(mqtt_topic_prefix) + "/cmd/status") {
    // Dashboard request status saat pertama connect
    mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/power").c_str(), isPowerOn ? "ON" : "OFF");
    mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/temp").c_str(),  String(currentTemp, 1).c_str());
    mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/threshold").c_str(), String(thresholdTemp, 1).c_str());
    mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/mode").c_str(), manualOverride ? "MANUAL" : "AUTO");
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

  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // Mengabaikan validasi SSL (aman untuk localhost/self-signed sertifikat)

  HTTPClient http;
  
  http.begin(secureClient, local_server_url); // Gunakan client secure untuk koneksi HTTPS!
  http.setTimeout(1500); // Set timeout 1.5 detik
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"device_id\": 1, \"action_type\": \"" + type + "\", \"temperature\": " + String(temp, 1) + ", \"token\": \"KipasAnginSecureToken123\"}";
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
  net.setInsecure(); // Mengabaikan validasi rantai sertifikat (aman dari masa kedaluwarsa sertifikat broker publik)
  mqttClient.begin(mqtt_host, mqtt_port, net);
  mqttClient.onMessage(messageReceived);
  mqttClient.setKeepAlive(10); // Diubah menjadi 10 detik agar deteksi LWT (offline) lebih cepat

  String statusTopic = String(mqtt_topic_prefix) + "/data/status";
  mqttClient.setWill(statusTopic.c_str(), "OFFLINE", true, 1);

  String clientId = "esp32_fan_" + String(WiFi.macAddress());
  Serial.print("MQTT");
  while (!mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) { Serial.print("."); delay(500); }
  Serial.println(" OK!");

  // Publikasi status ONLINE segera setelah tersambung
  mqttClient.publish(statusTopic.c_str(), "ONLINE", true, 1);

  String cmdTopic = String(mqtt_topic_prefix) + "/cmd/#";
  mqttClient.subscribe(cmdTopic.c_str(), 1); // QoS 1 = pasti diterima

  // Umumkan status awal ke dashboard
  mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/power").c_str(), isPowerOn ? "ON" : "OFF", false, 1);
  mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/threshold").c_str(), String(thresholdTemp, 1).c_str(), false, 1);
  mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/mode").c_str(), manualOverride ? "MANUAL" : "AUTO", false, 1);
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
      mqttClient.publish(String(String(mqtt_topic_prefix) + "/data/temp").c_str(), String(currentTemp, 1).c_str(), false, 0);
    } else {
      Serial.println("⚠️ Error: Sensor DHT11 tidak terbaca (NaN)! Periksa kabel jumper Anda.");
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
