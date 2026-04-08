#include <DHT.h>

/*
 * Smart Fan Dashboard - Web Serial Edition (Manual + Auto Mode)
 */

#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;
bool fanState = false;
bool autoMode = true; // Default adalah otomatis

void setFan(bool state) {
  if (state != fanState) {
    fanState = state;
    if (fanState) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW); 
      Serial.println("S:1"); // Kabari Web: Fan ON
    } else {
      pinMode(relayPin, INPUT); 
      Serial.println("S:0"); // Kabari Web: Fan OFF
    }
  }
}

void setAuto(bool mode) {
  autoMode = mode;
  Serial.print("A:");
  Serial.println(autoMode ? "1" : "0"); // Kabari Web: Auto Mode Status
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(relayPin, INPUT); 
  fanState = false;
  autoMode = true;
}

void loop() {
  // 1. Baca Perintah dari Dashboard
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input == "ON") {
      setAuto(false); // Matikan Auto jika user klik Power ON di dashboard
      setFan(true);
    } 
    else if (input == "OFF") {
      setAuto(false); // Matikan Auto jika user klik Power OFF di dashboard
      setFan(false);
    }
    else if (input == "AUTO") {
      setAuto(true); // Aktifkan Auto jika user klik tombol Auto Mode
    }
  }

  // 2. Logika Sensor & Otomatis
  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temperature = dht.readTemperature();
    if (!isnan(temperature)) {
      Serial.print("T:");
      Serial.println(temperature, 1);
      
      // JALANKAN LOGIKA HANYA JIKA AUTO MODE AKTIF
      if (autoMode) {
        if (temperature >= 32) {
          setFan(true);
        } else {
          setFan(false);
        }
      }
    }
  }
}
