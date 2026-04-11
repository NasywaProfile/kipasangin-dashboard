// --- Smart Fan IoT LITE (MQTT + Hotspot HP) ---
// Perlu install library di Arduino IDE:
// 1. MQTT by Joel Gaehwiler
// 2. DHT sensor library by Adafruit

#include <WiFi.h>
#include <MQTT.h>
#include <DHT.h>

// --- KONFIGURASI WIFI (HOTSPOT HP) ---
const char ssid[] = "NAMA_HOTSPOT_HP";
const char pass[] = "PASSWORD_HOTSPOT";

// --- KONFIGURASI MQTT ---
const char mqtt_broker[] = "public.cloud.shiftr.io";
const char client_id[] = "esp32_smartfan_unique_123"; // Ganti angka bebas agar unik

WiFiClient net;
MQTTClient client;
DHT dht(33, DHT11);

const int relayPin = 18;

// State Variables
bool isPowerOn = false;
bool manualOverride = false;
float currentTemp = 0;
float thresholdTemp = 32.0;
float hysteresis = 0.5;
unsigned long lastMillis = 0;

void connect() {
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nWiFi Connected!");

  Serial.print("Connecting to MQTT...");
  // Gunakan ID unik yang berbeda untuk "membersihkan" sesi lama di broker
  String id = String(client_id) + String(millis()); 
  while (!client.connect(id.c_str(), "public", "public")) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nMQTT Connected!");

  // SUBSCRIBE ke topik perintah
  client.subscribe("smartfan/cmd/#");
}

void messageReceived(String &topic, String &payload) {
  Serial.println("Incoming: " + topic + " - " + payload);

  if (topic == "smartfan/cmd/power") {
    if (payload == "ON") {
      isPowerOn = true;
      manualOverride = true; 
      digitalWrite(relayPin, LOW); // KEMBALI KE LOGIKA AWAL (LOW = NYALA)
    } else if (payload == "OFF") {
      isPowerOn = false;
      manualOverride = true; 
      digitalWrite(relayPin, HIGH); // KEMBALI KE LOGIKA AWAL (HIGH = MATI)
    }
    Serial.println(isPowerOn ? "USER: Fan ON" : "USER: Fan OFF");
  } 
  else if (topic == "smartfan/cmd/threshold") {
    thresholdTemp = payload.toFloat();
    manualOverride = false; 
    Serial.print("New Threshold: ");
    Serial.println(thresholdTemp);
  }
}

void setup() {
  Serial.begin(115200);
  
  // LOGIKA AWAL YANG BERHASIL: MATI ADALAH HIGH
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH); 
  isPowerOn = false;
  manualOverride = false;
  
  dht.begin();
  WiFi.begin(ssid, pass);
  
  client.begin(mqtt_broker, net);
  client.onMessage(messageReceived);

  connect();
}

void loop() {
  client.loop();
  delay(10);

  if (!client.connected()) {
    connect();
  }

  if (millis() - lastMillis > 5000) {
    lastMillis = millis();
    float t = dht.readTemperature();
    
    if (!isnan(t)) {
      currentTemp = t;
      client.publish("smartfan/data/temp", String(currentTemp, 1));

      // JALANKAN OTOMATIS HANYA JIKA TIDAK DI-LOCK MANUAL
      if (!manualOverride) {
        if (currentTemp >= thresholdTemp) {
          if (!isPowerOn) {
            isPowerOn = true;
            digitalWrite(relayPin, LOW); // HIDUPKAN
            client.publish("smartfan/cmd/power", "ON"); // Jangan pakai retain
          }
        } 
        else if (currentTemp < (thresholdTemp - hysteresis)) {
          if (isPowerOn) {
            isPowerOn = false;
            digitalWrite(relayPin, HIGH); // MATIKAN
            client.publish("smartfan/cmd/power", "OFF"); // Jangan pakai retain
          }
        }
      }
    }
  }
}
