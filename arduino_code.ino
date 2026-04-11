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
float thresholdTemp = 32.0; // Default threshold
float hysteresis = 0.5;

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
  lastAutoState = (!isnan(t) && t >= thresholdTemp);
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
    else if (input.startsWith("SET:")) {
      float newThreshold = input.substring(4).toFloat();
      if (newThreshold > 0) {
        thresholdTemp = newThreshold;
        Serial.print("M:Threshold set to ");
        Serial.println(thresholdTemp);
      }
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
      
      // --- Strict Logic: Above = ON, Below = OFF ---
      if (temperature >= thresholdTemp) {
        currentAutoState = true;
      } else {
        currentAutoState = false;
      }

      // JIKA terjadi perubahan
      if (currentAutoState != lastAutoState) {
        manualOverride = false; 
        lastAutoState = currentAutoState;
      }

      if (!manualOverride) {
        setFan(currentAutoState);
      }
    }
  }
}
