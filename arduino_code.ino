#include <DHT.h>

/*
 * Smart Fan Dashboard - Web Serial Edition (Smart Hybrid Mode)
 * Logika: Dashboard mengikuti sensor, tapi klik Manual mengunci status.
 */

#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;
bool fanState = false;

// Logika Cerdas
bool manualOverride = false; 
bool lastAutoState = false;

void setFan(bool state) {
  if (state != fanState) {
    fanState = state;
    if (fanState) {
      pinMode(relayPin, OUTPUT);
      digitalWrite(relayPin, LOW); 
    } else {
      pinMode(relayPin, INPUT); 
    }
    // Selalu kabari dashboard setiap kali status berubah
    Serial.print("S:");
    Serial.println(fanState ? "1" : "0");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(relayPin, INPUT); 
  fanState = false;
  
  // Inisialisasi state awal sensor
  float t = dht.readTemperature();
  lastAutoState = (!isnan(t) && t >= 32);
}

void loop() {
  // 1. Baca Perintah dari Dashboard (Interaksi User)
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input == "ON") {
      manualOverride = true; 
      setFan(true);
    } 
    else if (input == "OFF") {
      manualOverride = true; 
      setFan(false);
    }
  }

  // 2. Logika Sensor & Sinkronisasi
  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temperature = dht.readTemperature();
    if (!isnan(temperature)) {
      // Kirim Suhu ke Dashboard
      Serial.print("T:");
      Serial.println(temperature, 1);
      
      bool currentAutoState = (temperature >= 32);

      // JIKA terjadi perubahan ambang batas (misal dari panas ke dingin atau sebaliknya)
      if (currentAutoState != lastAutoState) {
        manualOverride = false; // Reset override karena ada "event" suhu baru
        lastAutoState = currentAutoState;
        Serial.println("System: Auto-logic reset due to temperature event.");
      }

      // Jalankan otomatis HANYA jika sedang tidak di-override manual
      if (!manualOverride) {
        setFan(currentAutoState);
      }
    }
  }
}
