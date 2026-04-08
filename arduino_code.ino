#include <DHT.h>

/*
 * Smart Fan Dashboard - Web Serial Edition (Manual Override)
 */

#define DHTPIN 33
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18;
bool fanState = false;
bool manualMode = false; // Jika true, abaikan logika suhu rendah

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
  Serial.println("System Ready - Manual Override Enabled");
}

void loop() {
  // 1. Baca Perintah dari Dashboard
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input == "ON") {
      manualMode = true; // Kunci ke ON
      setFan(true);
    } 
    else if (input == "OFF") {
      manualMode = false; // Kembali ke Logika Suhu
      setFan(false);
    }
  }

  // 2. Baca Sensor & Logika Otomatis
  static unsigned long lastSensorRead = 0;
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    
    float temperature = dht.readTemperature();
    if (!isnan(temperature)) {
      Serial.print("T:");
      Serial.println(temperature, 1);
      
      // LOGIKA OTOMATIS
      if (temperature >= 32) {
        setFan(true); // Selalu nyalakan jika panas
      } 
      else {
        // Hanya matikan otomatis jika TIDAK sedang dalam Manual Mode (ON)
        if (!manualMode) {
          setFan(false);
        }
      }
    }
  }
}
