const welcomeScreen = document.getElementById('welcomeScreen');
const appContainer = document.getElementById('appContainer');
// --- Onboarding Elements ---
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const tutorialScreen = document.getElementById('tutorialScreen');
const openTutorialBtn = document.getElementById('openTutorialBtn');
const closeTutorialBtn = document.getElementById('closeTutorialBtn');

const powerSwitch = document.getElementById('powerSwitch');
const statusLabel = document.getElementById('statusLabel');
const fanBlades = document.getElementById('fanBlades');
const tempValueLabel = document.getElementById('tempValue');
const historyList = document.getElementById('historyList');
const historyCountLabel = document.getElementById('historyCount');
const tempSparkline = document.getElementById('tempSparkline');
const connectSerialBtn = document.getElementById('connectSerial');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdInput = document.getElementById('thresholdInput');
const tempUpBtn = document.getElementById('tempUp');
const tempDownBtn = document.getElementById('tempDown');

// --- Cloud State ---


// --- Application State ---
let isPowerOn = false;
let currentTemp = 24.5;
let sessionActive = false;
let thresholdTemp = 32.0;
let lastLoggedThreshold = 32.0; // Tambahan untuk memori threshold sebelumnya
let tempHistory = [24.5, 24.5, 24.5, 24.5, 24.5];
let lastDbStatus = false; 
let lastPowerCommandTime = 0; // Kunci agar status tidak balik-balik sendiri saat diklik

// --- Initialize ---
function init() {
    updateUI();
}

// --- Simple Enter Flow ---
function enterDashboard() {
    // Minta izin notifikasi saat tombol ditekan (best practice agar tidak diblokir browser)
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    welcomeScreen.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.transform = 'scale(1.02)';

    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.style.animation = 'dashboardEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
        sessionActive = true;

        if (historyList.children.length === 0) {
            addHistory('System Online', 'on', 24.5);
        }
    }, 600);
}

if (startBtn) startBtn.addEventListener('click', enterDashboard);

backBtn.addEventListener('click', () => {
    appContainer.style.animation = 'dashboardExit 0.6s ease forwards';
    setTimeout(() => {
        appContainer.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        welcomeScreen.style.opacity = '1';
        welcomeScreen.style.transform = 'scale(1)';
        sessionActive = false;
    }, 600);
});

// --- Tutorial Screen Logic ---
if (openTutorialBtn) openTutorialBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    tutorialScreen.classList.remove('hidden');
    tutorialScreen.style.animation = 'dashboardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
});

const closeTutorialBtns = document.querySelectorAll('.closeTutorialBtn');
closeTutorialBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tutorialScreen.style.animation = 'dashboardExit 0.5s ease forwards';
        setTimeout(() => {
            tutorialScreen.classList.add('hidden');
            welcomeScreen.classList.remove('hidden');
        }, 500);
    });
});



// --- Automation Logic ---
if (thresholdSlider) {
    thresholdSlider.addEventListener('input', () => {
        thresholdTemp = parseFloat(thresholdSlider.value);
        if (thresholdInput) thresholdInput.value = thresholdTemp;
    });

    thresholdSlider.addEventListener('change', () => {
        sendThreshold(thresholdTemp);
    });
}

if (thresholdInput) {
    thresholdInput.addEventListener('input', () => {
        let val = parseFloat(thresholdInput.value);
        if (!isNaN(val)) {
            if (val < 20) val = 20;
            if (val > 45) val = 45;
            thresholdTemp = val;
            if (thresholdSlider) thresholdSlider.value = thresholdTemp;
        }
    });

    thresholdInput.addEventListener('change', () => {
        let val = parseFloat(thresholdInput.value);
        if (isNaN(val)) val = 32;
        if (val < 20) val = 20;
        if (val > 45) val = 45;
        thresholdTemp = val;
        thresholdInput.value = thresholdTemp;
        if (thresholdSlider) thresholdSlider.value = thresholdTemp;
    });

    // Handle Enter Key
    thresholdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            thresholdInput.blur();
            sendThreshold(thresholdTemp);
        }
    });
}

const sendThresholdBtn = document.getElementById('sendThresholdBtn');
if (sendThresholdBtn) {
    sendThresholdBtn.addEventListener('click', () => {
        sendThreshold(thresholdTemp);
    });
}



if (tempUpBtn) tempUpBtn.addEventListener('click', () => {
    // 0.1 precision as requested
    thresholdSlider.value = (parseFloat(thresholdSlider.value) + 0.1).toFixed(1);
    thresholdSlider.dispatchEvent(new Event('input'));
    thresholdSlider.dispatchEvent(new Event('change'));
});

if (tempDownBtn) tempDownBtn.addEventListener('click', () => {
    // 0.1 precision
    thresholdSlider.value = (parseFloat(thresholdSlider.value) - 0.1).toFixed(1);
    thresholdSlider.dispatchEvent(new Event('input'));
    thresholdSlider.dispatchEvent(new Event('change'));
});

function updatePowerUI(source = 'manual') {
    const toggleUI = document.querySelector('.power-toggle-ui');
    if (isPowerOn) {
        if (powerSwitch) powerSwitch.checked = true;
        if (toggleUI) toggleUI.classList.add('on');
        appContainer.classList.add('active-cool');
        statusLabel.textContent = 'Active Cooling';
        statusLabel.style.color = '#A67347';
        fanBlades.classList.add('spinning');

        const title = source === 'auto' ? 'Auto-Cooling' : 'Fan Started';
        addHistory(title, 'on');
        
        if (source === 'auto') {
            logToSupabase('auto_on');
            fireNotification('⚠️ Suhu Panas - Kipas Menyala', `Kipas Pintar menyala otomatis. Suhu ruangan mencapai ${currentTemp.toFixed(1)}°C.`);
        }
    } else {
        if (powerSwitch) powerSwitch.checked = false;
        if (toggleUI) toggleUI.classList.remove('on');
        appContainer.classList.remove('active-cool');
        statusLabel.textContent = 'Standby';
        statusLabel.style.color = '#64748B';
        fanBlades.classList.remove('spinning');

        const title = source === 'auto' ? 'Target Reached' : 'Fan Stopped';
        addHistory(title, 'off');

        if (source === 'auto') {
            logToSupabase('auto_off');
        }
    }
}

function addHistory(title, type, temp = null) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempToShow = temp !== null ? temp : currentTemp;

    let iconSvg = '';
    let typeClass = '';

    if (type === 'on') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        typeClass = 'act-on';
    } else if (type === 'off') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`;
        typeClass = 'act-off';
    } else {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;
        typeClass = 'act-settings';
    }

    const item = document.createElement('div');
    item.className = 'activity-card';
    item.innerHTML = `
        <div class="act-icon ${typeClass}">${iconSvg}</div>
        <div class="act-info">
            <h5>${title}</h5>
            <p>${tempToShow.toFixed(1)}°C</p>
        </div>
        <div class="act-time">${timeStr}</div>
    `;

    historyList.prepend(item);
    if (historyCountLabel) historyCountLabel.textContent = historyList.children.length;
}

function updateSparkline() {
    const pts = tempHistory.map((t, i) => {
        const x = i * 25;
        const y = 30 - (((t - 19) / 10) * 30);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    tempSparkline.setAttribute('d', pts);
}

function updateUI() {
    tempValueLabel.textContent = currentTemp.toFixed(1);
    updateSparkline();
}

// Fungsi bantu untuk memanggil Notifikasi OS
function fireNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: 'vidsunset.png' // Meminjam gambar sunset sebagai icon notif
        });
    }
}

// ============================================================
// MQTT - REAL-TIME PERINTAH (< 200ms)
// ============================================================
const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const MQTT_CLIENT_ID = 'SF_' + Math.random().toString(10).slice(2, 6); // ID lebih pendek biar disukai HP

const cloudStatus = document.getElementById('cloudStatus');
const cloudStatusText = cloudStatus.querySelector('span:nth-child(2)');

const mqttClient = mqtt.connect(MQTT_BROKER, {
    clientId: MQTT_CLIENT_ID,
    clean: true,
    reconnectPeriod: 1000,
    keepalive: 60,
    connectTimeout: 30000,
    protocolVersion: 4 // Gunakan versi 4 yang lebih stabil untuk HP
});

let deviceTimeout;

mqttClient.on('connect', () => {
    // Saat web merespon server MQTT, status JANGAN langsung hijau.
    // Tunggu sampai ada data beneran dari Kipas Pintar.
    cloudStatus.classList.remove('online');
    cloudStatusText.textContent = 'Offline';
    console.log('Dashboard Terhubung ke Server. Menunggu Kipas...');

    // Subscribe ke data dari Arduino
    mqttClient.subscribe('smartfan/data/#');

    // Minta status awal dari Arduino
    // (Jika Kipas online, dia akan menangkap pesan ini dan membalas)
    mqttClient.publish('smartfan/cmd/status', 'request');
});

mqttClient.on('offline', () => {
    cloudStatus.classList.remove('online');
    cloudStatusText.textContent = 'Offline';
});

mqttClient.on('error', (err) => {
    console.error('MQTT error:', err);
});

// Terima data dari Arduino via MQTT
mqttClient.on('message', (topic, message) => {
    const data = message.toString().trim();

    // 🌟 LOGIKA HEARTBEAT/REAL-TIME 🌟
    // Karena ESP32 mengirim suhu setiap 2 detik, artinya selama kita
    // menerima pesan apapun, KIPAS 100% ONLINE SECARA FISIK!
    if (cloudStatusText.textContent !== 'Online') {
        cloudStatus.classList.add('online');
        cloudStatusText.textContent = 'Online';
        if (historyList && historyList.children.length === 0) {
            addHistory('Kipas Terhubung', 'on', currentTemp);
        }
        
        // Sync ke Database - Set Online (PAKSA)
        syncDeviceStatus('Online');
    }

    // Reset timer Offline - Diperlonggar jadi 40 detik untuk HP agar tidak gampang offline
    clearTimeout(deviceTimeout);
    deviceTimeout = setTimeout(async () => {
        if (cloudStatusText.textContent === 'Online') {
            cloudStatus.classList.remove('online');
            cloudStatusText.textContent = 'Offline';
            statusLabel.textContent = 'Standby';
            
            // Sync ke Database - Set Offline (PAKSA)
            await syncDeviceStatus('Offline');
            logSystemError('Koneksi Terputus / Mati Lampu');
        }
    }, 40000); 

    if (topic === 'smartfan/data/temp') {
        handleTempUpdate(parseFloat(data));

    } else if (topic === 'smartfan/data/power') {
        if (Date.now() - lastPowerCommandTime < 2000) return;

        const newState = (data === 'ON');
        if (newState !== isPowerOn) {
            isPowerOn = newState;
            updatePowerUI('auto');
        }

    } else if (topic === 'smartfan/data/threshold') {
        const t = parseFloat(data);
        if (!isNaN(t)) {
            thresholdTemp = t;
            if (thresholdInput) thresholdInput.value = t.toFixed(1);
            if (thresholdSlider) thresholdSlider.value = t;
        }
    }
});

// ============================================================
// SUPABASE - LOGGING RIWAYAT (background, non-blocking)
// ============================================================
const supabaseUrl = 'https://tddbbqwksbkqcfpdpjuc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZGJicXdrc2JrcWNmcGRwanVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTAyMjMsImV4cCI6MjA5MTgyNjIyM30.jEUYXFH3JGhHnBnr2b65T8Ldj6j69EV2msTiRZxPeS8';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
window.supabaseClient = supabaseClient; // Agar bisa diakses dari console browser

async function logToSupabase(action) {
    if (!supabaseClient) return;
    try {
        console.log(`📝 Mencatat Aktivitas: ${action}`);
        await supabaseClient.from('activity_log').insert([{
            device_id: 'kipas-01',
            action_type: action,
            temperature: currentTemp
        }]);
    } catch (e) {
        console.error("Log Error:", e);
    }
}

// Fungsi Baru: Mencatat RIWAYAT status Online/Offline (Nambah terus ke bawah)
async function syncDeviceStatus(statusStr) {
    if (!supabaseClient) return;
    try {
        const statusBool = (statusStr === 'Online');
        console.log(`📡 Mencatat Riwayat: ${statusStr} (${statusBool})`);
        
        // Sekarang pakai .insert() agar BARIS NAMBAH TERUS (History)
        const { error } = await supabaseClient
            .from('devices') 
            .insert([
                { 
                    device_name: 'kipas-01', // Nama kolom baru sesuai SQL
                    is_online: statusBool 
                }
            ]);
        
        if (error) console.error("Supabase Error:", error.message);
    } catch (e) {
        console.error("Sync Error:", e);
    }
}

// Fungsi Baru: Mencatat Error otomatis ke Tabel Error Log
async function logSystemError(msg) {
    if (!supabaseClient) return;
    try {
        await supabaseClient.from('error_log').insert([{ 
            device_id: 'kipas-01', // Samakan dengan ID di tabel devices
            error_msg: msg 
        }]);
    } catch(e) {}
}

// ============================================================
// TOMBOL POWER → PUBLISH MQTT INSTAN + LOG FIREBASE
// ============================================================
window.handlePowerToggle = () => {
    lastPowerCommandTime = Date.now(); 
    if ("vibrate" in navigator) navigator.vibrate(50);

    isPowerOn = powerSwitch.checked; // Ambil status dari checkbox
    updatePowerUI('manual');

    const cmd = isPowerOn ? 'ON' : 'OFF';
    mqttClient.publish('smartfan/cmd/power', cmd); 
    
    // Log ke Supabase tanpa mengganggu tampilan
    logToSupabase(isPowerOn ? 'manual_on' : 'manual_off');
};

powerSwitch.addEventListener('change', window.handlePowerToggle);

// ============================================================
// KIRIM THRESHOLD → MQTT INSTAN
// ============================================================
window.sendThreshold = function(val) {
    if (!mqttClient.connected) {
        mqttClient.reconnect();
    }
    mqttClient.publish('smartfan/cmd/threshold', val.toFixed(1));
    
    // Cuma rekam ke database JIKA angkanya benar-benar berubah
    if (val !== lastLoggedThreshold) {
        logToSupabase('threshold_change');
        addHistory(`Target Suhu: ${val.toFixed(1)}°C`, 'settings');
        lastLoggedThreshold = val; // Simpan angka baru di memori
    }
}

function handleTempUpdate(temp) {
    currentTemp = temp;
    tempValueLabel.textContent = currentTemp.toFixed(1);
    tempHistory.shift();
    tempHistory.push(currentTemp);
    updateSparkline();
}

// Loop Reconnect Otomatis khusus untuk HP (Cek setiap 5 detik)
setInterval(() => {
    if (mqttClient && !mqttClient.connected) {
        console.log("MQTT Putus, menyambung kembali...");
        mqttClient.reconnect();
    }
}, 5000);

init();
