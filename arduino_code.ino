#include <DHT.h>

/*
 * Smart Fan Dashboard - Web Serial Edition
 * Koneksi via kabel USB (Laptop Only)
 */

#define DHTPIN 33        // GPIO untuk sensor DHT11
#define DHTTYPE DHT11    // Tipe sensor DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18; // GPIO untuk Relay
bool fanState = false;

void setFan(bool state) {
  if (state != fanState) {
    fanState = state;
    if (fanState) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW); // Active Low
      Serial.println("S:1"); // Kirim status ke dashboard
    } else {
      pinMode(relayPin, INPUT); // Mematikan Relay
      Serial.println("S:0"); // Kirim status ke dashboard
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(relayPin, INPUT); 
  fanState = false;
  Serial.println("System Ready - Serial Mode");
}

void loop() {
  // 1. Baca Perintah dari Dashboard (Manual Override)
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input == "ON") setFan(true);
    else if (input == "OFF") setFan(false);
  }

  // 2. Baca Sensor & Auto Logic
  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temperature = dht.readTemperature();
    if (!isnan(temperature)) {
      // Kirim Suhu ke Dashboard
      Serial.print("T:");
      Serial.println(temperature, 1);
      
      // LOGIKA OTOMATIS
      if (temperature >= 32) {
        setFan(true);
      } else {
        setFan(false);
      }
    }
  }
}
