#include <DHT.h>

/*
 * Smart Fan Dashboard - Web Serial Edition (Absolute Override & Auto Mode)
 */

#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;
bool fanState = false;
bool autoEnabled = true; // Mode bawaan: Otomatis

void setFan(bool state) {
  if (state != fanState) {
    fanState = state;
    if (fanState) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW); 
      Serial.println("S:1");
    } else {
      pinMode(relayPin, INPUT); 
      Serial.println("S:0");
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(relayPin, INPUT); 
  fanState = false;
  autoEnabled = true;
  Serial.println("System Ready - Multi Mode (Auto/Manual)");
}

void loop() {
  // 1. Baca Perintah dari Dashboard
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input == "ON") {
      autoEnabled = false; // Matikan otomatis jika user klik ON manual
      setFan(true);
      Serial.println("System: Manual ON");
    } 
    else if (input == "OFF") {
      autoEnabled = false; // Matikan otomatis jika user klik OFF manual
      setFan(false);
      Serial.println("System: Manual OFF");
    }
    else if (input == "AUTO") {
      autoEnabled = true; // Kembali ke mode otomatis sensor
      Serial.println("System: Auto Mode Engaged");
    }
  }

  // 2. Baca Sensor & Logika
  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temperature = dht.readTemperature();
    if (!isnan(temperature)) {
      Serial.print("T:");
      Serial.println(temperature, 1);
      
      // LOGIKA OTOMATIS (Hanya jalan jika autoEnabled = true)
      if (autoEnabled) {
        if (temperature >= 32) {
          setFan(true);
        } else {
          setFan(false);
        }
      }
    }
  }
}
