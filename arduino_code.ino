#include <DHT.h>

/*
 * Konfigurasi untuk ESP32 & Dashboard
 */

#define DHTPIN 33        // GPIO untuk sensor DHT11
#define DHTTYPE DHT11    // Tipe sensor DHT11
DHT dht(DHTPIN, DHTTYPE);

const int relayPin = 18; // GPIO untuk Relay
bool fanState = false;

void setFan(bool state) {
  fanState = state;
  if (fanState) {
    // Menyalakan Relay (Active Low)
    pinMode(relayPin, OUTPUT);
    digitalWrite(relayPin, LOW); 
    Serial.println("S:1"); // Kirim status ke dashboard
    Serial.println("kipas menyala");
  } else {
    // Mematikan Relay dengan memutus jalur data (High-Impedance)
    pinMode(relayPin, INPUT); 
    Serial.println("S:0"); // Kirim status ke dashboard
    Serial.println("kipas mati");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("Sensor DHT11 Siap");
  
  // Awal: Mati
  pinMode(relayPin, INPUT); 
  fanState = false;
}

void loop() {
  // 1. Baca Perintah dari Dashboard
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "ON") setFan(true);
    else if (cmd == "OFF") setFan(false);
  }

  // 2. Baca Sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    // Serial.println("Gagal membaca sensor DHT11!");
    return;
  }

  // 3. Kirim Data ke Dashboard (Format Khusus)
  Serial.print("T:");
  Serial.println(temperature, 1);
  
  // Log Serial Biasa (Tetap ada untuk Monitor)
  Serial.print("Suhu: ");
  Serial.print(temperature);
  Serial.print(" °C | Kelembaban: ");
  Serial.print(humidity);
  Serial.println(" %");

  // 4. Logika Otomatis (Optional: Jika mau dashboard saja yang kontrol, hapus bagian ini)
  if (temperature >= 32 && !fanState) {
    setFan(true);
  } else if (temperature < 32 && fanState) {
    // Anda bisa matikan otomatis atau biarkan Dashboard yang kontrol penuh
    // setFan(false); 
  }

  delay(2000);
}
