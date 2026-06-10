const welcomeScreen = document.getElementById('welcomeScreen');
const appContainer = document.getElementById('appContainer');
// --- Onboarding Elements ---
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');

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

const autoModeSwitch = document.getElementById('autoModeSwitch');
const autoModeLabel = document.getElementById('autoModeLabel');

// --- Cloud State ---


// --- Application State ---
let isPowerOn = false;
let currentTemp = 24.5;
let sessionActive = false;
let thresholdTemp = 32.0;
let activeThresholdTemp = 32.0; // Tambahan untuk memisahkan threshold yang diedit dan yang aktif
let isAutoMode = false; // Status mode otomatis
let lastLoggedThreshold = 32.0; // Tambahan untuk memori threshold sebelumnya
let tempHistory = [24.5, 24.5, 24.5, 24.5, 24.5];
let lastDbStatus = false;
let lastPowerCommandTime = 0; // Kunci agar status tidak balik-balik sendiri saat diklik
let lastModeCommandTime = 0; // Kunci untuk debounce auto mode update

// --- Initialize ---
function init() {
    updateUI();
    // Ambil riwayat terbaru dari MySQL saat pertama load dashboard
    loadInitialHistory();
    sessionActive = true;
}

// --- Simple Enter Flow ---
function enterDashboard() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    
    if (welcomeScreen) {
        welcomeScreen.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        welcomeScreen.style.opacity = '0';
        welcomeScreen.style.transform = 'scale(1.02)';
    }

    setTimeout(() => {
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (appContainer) {
            appContainer.classList.remove('hidden');
            appContainer.style.animation = 'dashboardEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
        }
        sessionActive = true;
        loadInitialHistory();
    }, 600);
}

if (startBtn) startBtn.addEventListener('click', enterDashboard);

if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (appContainer) appContainer.style.animation = 'dashboardExit 0.6s ease forwards';
        setTimeout(() => {
            if (appContainer) appContainer.classList.add('hidden');
            if (welcomeScreen) {
                welcomeScreen.classList.remove('hidden');
                welcomeScreen.style.opacity = '1';
                welcomeScreen.style.transform = 'scale(1)';
            }
            sessionActive = false;
        }, 600);
    });
}



// --- Automation Logic ---
if (thresholdSlider) {
    thresholdSlider.addEventListener('input', () => {
        thresholdTemp = parseFloat(thresholdSlider.value);
        if (thresholdInput) thresholdInput.value = thresholdTemp;
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
        statusLabel.textContent = 'Cooling';
        statusLabel.style.color = '#10B981';
        fanBlades.classList.add('spinning');

        const title = source === 'auto' ? 'Auto-Cooling' : 'Fan Started';
        addHistory(title, 'on');

        if (source === 'auto') {
            logToLocal('auto_on');
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
            logToLocal('auto_off');
        }
    }
}

function updateAutoModeUI() {
    const toggleUI = document.querySelector('.auto-ui');
    const powerToggleUI = document.querySelector('.power-toggle-ui');
    if (isAutoMode) {
        if (autoModeSwitch) autoModeSwitch.checked = true;
        if (toggleUI) toggleUI.classList.add('on');
        if (autoModeLabel) {
            autoModeLabel.textContent = 'Automatic';
            autoModeLabel.style.color = '#3B82F6'; // Blue for auto
        }
        // Disable power switch in Auto Mode
        if (powerSwitch) powerSwitch.disabled = true;
        if (powerToggleUI) {
            powerToggleUI.style.opacity = '0.6';
            powerToggleUI.style.cursor = 'not-allowed';
            powerToggleUI.style.pointerEvents = 'none';
        }
    } else {
        if (autoModeSwitch) autoModeSwitch.checked = false;
        if (toggleUI) toggleUI.classList.remove('on');
        if (autoModeLabel) {
            autoModeLabel.textContent = 'Manual';
            autoModeLabel.style.color = '#64748B';
        }
        // Enable power switch in Manual Mode
        if (powerSwitch) powerSwitch.disabled = false;
        if (powerToggleUI) {
            powerToggleUI.style.opacity = '1';
            powerToggleUI.style.cursor = 'pointer';
            powerToggleUI.style.pointerEvents = 'auto';
        }
    }
}

function addHistory(title, type, temp = null, timestamp = null) {
    console.log("Debug: Adding history item:", title, type, temp, timestamp);
    const dateObj = timestamp ? new Date(timestamp) : new Date();
    
    // Format WIB Indonesia seperti di halaman Riwayat Lengkap (format: 26 Mei, 15:43)
    const timeStr = dateObj.toLocaleString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
    }).replace(/\./g, ':'); // Ganti "." khas id-ID menjadi ":" untuk format jam modern

    const tempToShow = temp !== null ? temp : currentTemp;

    let iconSvg = '';
    let typeClass = '';

    if (type === 'on') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
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
    
    // Limit to 3 items only in dashboard view
    while (historyList.children.length > 3) {
        historyList.lastElementChild.remove();
    }

    if (historyCountLabel) historyCountLabel.textContent = historyList.children.length;
}

// Fetch 5 riwayat terbaru dari MySQL untuk Dashboard Utama
async function loadInitialHistory() {
    try {
        const apiBase = window.API_BASE || '/api';
        console.log("Debug: Fetching initial history from", `${apiBase}/activity-log`);
        
        const response = await fetch(`${apiBase}/activity-log`);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        
        const data = await response.json();
        console.log("Debug: Received history data:", data);

        if (data && data.length > 0) {
            historyList.innerHTML = ''; // Bersihkan loader
            const latest = data.slice(0, 3); // Ambil 3 teratas saja
            // Reverse agar yang paling baru ada di atas (karena addHistory pakai prepend)
            latest.reverse().forEach(row => {
                const meta = getActivityMeta(row.action_type);
                addHistory(meta.label, meta.icon, parseFloat(row.temperature), row.created_at);
            });
        } else {
            console.log("Debug: History data is empty");
        }
    } catch (e) {
        console.error("Critical: loadInitialHistory Failed:", e);
    }
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
            icon: '/images/vidsunset.png'
        });
    }
}

// ============================================================
// MQTT - REAL-TIME PERINTAH (< 200ms)
// ============================================================
const MQTT_BROKER = window.location.protocol === 'https:'
    ? 'wss://broker.hivemq.com:8884/mqtt'
    : 'ws://broker.hivemq.com:8000/mqtt';
const MQTT_CLIENT_ID = 'SF_' + Math.random().toString(10).slice(2, 6); // ID lebih pendek biar disukai HP

const cloudStatus = document.getElementById('cloudStatus');
const cloudStatusText = cloudStatus.querySelector('span:nth-child(2)');

const MQTT_TOPIC_PREFIX = window.MQTT_DEVICE_PREFIX || 'smartfan/device_1';

const mqttClient = mqtt.connect(MQTT_BROKER, {
    clientId: MQTT_CLIENT_ID,
    username: window.MQTT_USER || undefined,
    password: window.MQTT_PASS || undefined,
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
    console.log('✅ Connected to MQTT Broker:', MQTT_BROKER);
    console.log('Dashboard Terhubung ke Server. Menunggu data dari Kipas...');

    // Subscribe ke data dari Arduino
    mqttClient.subscribe(MQTT_TOPIC_PREFIX + '/data/#');

    // Minta status awal dari Arduino
    // (Jika Kipas online, dia akan menangkap pesan ini dan membalas)
    mqttClient.publish(MQTT_TOPIC_PREFIX + '/cmd/status', btoa('request'));
});

mqttClient.on('offline', () => {
    cloudStatus.classList.remove('online');
    cloudStatusText.textContent = 'Offline';
    console.warn('⚠️ MQTT Connection Offline/Disconnected');
});

mqttClient.on('error', (err) => {
    console.error('❌ MQTT error:', err);
});

// Terima data dari Arduino via MQTT
mqttClient.on('message', (topic, message) => {
    const data = message.toString().trim();
    console.log('📩 MQTT Msg Received:', topic, '->', data);

    // --- LWT (Last Will and Testament) & Online/Offline Real-time Status ---
    if (topic === MQTT_TOPIC_PREFIX + '/data/status') {
        if (data === 'ONLINE') {
            if (cloudStatusText.textContent !== 'Online') {
                cloudStatus.classList.add('online');
                cloudStatusText.textContent = 'Online';
                addHistory('Kipas Terhubung', 'on', currentTemp);
                syncDeviceStatus('Online');
            }
        } else if (data === 'OFFLINE') {
            if (cloudStatusText.textContent !== 'Offline') {
                cloudStatus.classList.remove('online');
                cloudStatusText.textContent = 'Offline';
                statusLabel.textContent = 'Standby';
                syncDeviceStatus('Offline');
                logSystemError('Koneksi Terputus / Mati Lampu');
            }
        }
        return; // Skip standard message processing for status topic
    }

    // 🌟 LOGIKA HEARTBEAT/REAL-TIME FALLBACK 🌟
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

    // Reset timer Offline - Kita set ke 15 detik agar aman dari fluktuasi sensor/jaringan
    clearTimeout(deviceTimeout);
    deviceTimeout = setTimeout(async () => {
        if (cloudStatusText.textContent === 'Online') {
            console.log("⚠️ Koneksi timeout! Mengubah status ke Offline...");
            cloudStatus.classList.remove('online');
            cloudStatusText.textContent = 'Offline';
            statusLabel.textContent = 'Standby';

            // Sync ke Database - Set Offline (PAKSA)
            await syncDeviceStatus('Offline');
            await logSystemError('Koneksi Terputus / Mati Lampu');
        }
    }, 15000);

    if (topic === MQTT_TOPIC_PREFIX + '/data/temp') {
        handleTempUpdate(parseFloat(data));

    } else if (topic === MQTT_TOPIC_PREFIX + '/data/power') {
        // Jika baru saja ditekan manual, abaikan data balik selama 5 detik biar nggak dobel log
        if (Date.now() - lastPowerCommandTime < 5000) return;

        const newState = (data === 'ON');
        if (newState !== isPowerOn) {
            isPowerOn = newState;
            // Jika sedang mode manual, tetap anggap update ini sebagai manual agar tidak kirim log 'auto' miring
            updatePowerUI(isManualOverride ? 'manual' : 'auto');
        }

    } else if (topic === MQTT_TOPIC_PREFIX + '/data/threshold') {
        const t = parseFloat(data);
        if (!isNaN(t)) {
            thresholdTemp = t;
            activeThresholdTemp = t;
            if (thresholdInput) thresholdInput.value = t.toFixed(1);
            if (thresholdSlider) thresholdSlider.value = t;
        }
    } else if (topic === MQTT_TOPIC_PREFIX + '/data/mode') {
        if (Date.now() - lastModeCommandTime < 5000) return; // Abaikan pesan lama jika baru saja diubah manual
        isAutoMode = (data === 'AUTO');
        updateAutoModeUI();
    }
});

// ============================================================
// LOCAL BACKEND (PHP & MySQL)
// ============================================================

async function logToLocal(action, val = null) {
    // Jika Manual ON akan Blok Auto On
    if (isManualOverride && action.startsWith('auto_')) {
        return;
    }

    try {
        const recordTemp = (action === 'threshold_change' && val !== null) ? val : currentTemp;
        const apiBase = window.API_BASE || '/api';

        const res = await fetch(`${apiBase}/activity-log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({
                device_id: 1,
                action_type: action,
                temperature: recordTemp,
                token: window.DEVICE_TOKEN || ''
            })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`API Error (${res.status}):`, errText);
        }
    } catch (e) {
        console.error("Local Log Network Error:", e);
    }
}

// Sinkronisasi status koneksi ke UI (Hanya lokal, tidak simpan ke DB)
async function syncDeviceStatus(statusStr) {
    console.log(`📡 Status Koneksi: ${statusStr}`);
    // Status Online/Offline sekarang hanya tampil di UI Dashboard
    // Tidak lagi dikirim ke database master_kipas agar DB lebih ringan
}

// Mencatat Error otomatis ke Tabel Error Log
async function logSystemError(msg) {
    console.log(`[Debug] Mencoba mencatat error ke database: ${msg}`);
    try {
        const apiBase = window.API_BASE || '/api';
        const url = `${apiBase}/error-log`;
        
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({
                device_id: 1, // Sesuai ID di database
                error_msg: msg,
                severity: 'CRITICAL',
                token: window.DEVICE_TOKEN || ''
            })
        });

        if (res.ok) {
            console.log("✅ Error log berhasil tersimpan di database.");
        } else {
            const errData = await res.json();
            console.error("❌ Gagal simpan error log:", errData);
        }
    } catch (e) {
        console.error("❌ Network Error saat simpan error log:", e);
    }
}

let isManualOverride = false;

// ============================================================
// TOMBOL POWER → PUBLISH MQTT INSTAN + LOG LOCAL
// ============================================================
window.handlePowerToggle = () => {
    if (isAutoMode) {
        if (powerSwitch) powerSwitch.checked = isPowerOn;
        return;
    }
    lastPowerCommandTime = Date.now();
    lastModeCommandTime = Date.now(); // Cegah state mode lama me-revert state
    if ("vibrate" in navigator) navigator.vibrate(50);

    // KETIKA TOMBOL DITEKAN → Masuk Mode Manual
    isManualOverride = true;
    isAutoMode = false;
    if (autoModeSwitch) autoModeSwitch.checked = false;
    updateAutoModeUI();
    mqttClient.publish(MQTT_TOPIC_PREFIX + '/cmd/mode', btoa('MANUAL'));

    isPowerOn = !isPowerOn; // Toggle status secara langsung untuk stabilitas di HP/Mobile
    updatePowerUI('manual');

    const cmd = isPowerOn ? 'ON' : 'OFF';
    mqttClient.publish(MQTT_TOPIC_PREFIX + '/cmd/power', btoa(cmd));

    // Log ke Local tanpa mengganggu tampilan
    logToLocal(isPowerOn ? 'manual_on' : 'manual_off');
};

powerSwitch.addEventListener('change', window.handlePowerToggle);

// ============================================================
// TOMBOL AUTO MODE → PUBLISH MQTT
// ============================================================
window.handleAutoModeToggle = () => {
    lastModeCommandTime = Date.now(); // Cegah state mode lama me-revert
    isAutoMode = !isAutoMode; // Toggle status secara langsung untuk stabilitas di HP/Mobile
    updateAutoModeUI();
    
    const cmd = isAutoMode ? 'AUTO' : 'MANUAL';
    mqttClient.publish(MQTT_TOPIC_PREFIX + '/cmd/mode', btoa(cmd));
    
    if (isAutoMode) {
        isManualOverride = false; // Reset manual override since auto is now active
        addHistory('Mode Otomatis Aktif', 'settings');
        // Trigger evaluasi suhu segera
        handleTempUpdate(currentTemp);
    } else {
        isManualOverride = true; // Manual override is active when Auto is turned off
        addHistory('Mode Manual Aktif', 'settings');
    }
};

if (autoModeSwitch) autoModeSwitch.addEventListener('change', window.handleAutoModeToggle);

// ============================================================
// KIRIM THRESHOLD → MQTT INSTAN
// ============================================================
window.sendThreshold = async function (val) {
    if (!mqttClient.connected) {
        mqttClient.reconnect();
    }
    mqttClient.publish(MQTT_TOPIC_PREFIX + '/cmd/threshold', btoa(val.toFixed(1)));

    activeThresholdTemp = val; // Set active threshold immediately on submit

    // 1. Catat perubahan threshold DULU
    if (val !== lastLoggedThreshold) {
        await logToLocal('threshold_change', val);
        addHistory(`Target Suhu: ${val.toFixed(1)}°C`, 'settings');
        lastLoggedThreshold = val;

        // Kasih jeda 100ms agar urutan di DB tidak tertukar
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. Kemudian baru cek kondisi suhu vs Slider baru hanya jika MODE AUTO AKTIF
    if (isAutoMode) {
        isManualOverride = false;
        const shouldBeOn = currentTemp >= val;
        if (shouldBeOn !== isPowerOn) {
            isPowerOn = shouldBeOn;
            await updatePowerUI('auto');
        }
    }
}

function handleTempUpdate(temp) {
    currentTemp = temp;
    tempValueLabel.textContent = currentTemp.toFixed(1);
    tempHistory.shift();
    tempHistory.push(currentTemp);
    updateSparkline();

    // HANYA CEK OTOMATIS JIKA MODE AUTO AKTIF
    if (isAutoMode) {
        const shouldBeOn = currentTemp >= activeThresholdTemp;
        if (shouldBeOn !== isPowerOn) {
            isPowerOn = shouldBeOn;
            updatePowerUI('auto');
        }
    }
}

// Loop Reconnect Otomatis khusus untuk HP (Cek setiap 5 detik)
setInterval(() => {
    if (mqttClient && !mqttClient.connected) {
        console.log("MQTT Putus, menyambung kembali...");
        mqttClient.reconnect();
    }
}, 5000);

// ============================================================
// HALAMAN RIWAYAT — Navigasi & Fetch dari Database Lokal
// ============================================================
const historyScreen      = document.getElementById('historyScreen');
const openHistoryBtn     = document.getElementById('openHistoryBtn');
const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
const refreshHistoryBtn  = document.getElementById('refreshHistoryBtn');
const activityLogList    = document.getElementById('activityLogList');
const errorLogList       = document.getElementById('errorLogList');
const historyDateFilter  = document.getElementById('historyDateFilter');
const clearDateBtn       = document.getElementById('clearDateBtn');


// Peta action_type → label & icon type
function getActivityMeta(type) {
    const map = {
        manual_on:       { label: 'Kipas Dinyalakan (Manual)',   icon: 'on'        },
        manual_off:      { label: 'Kipas Dimatikan (Manual)',    icon: 'off'       },
        auto_on:         { label: 'Kipas Menyala (Otomatis)',    icon: 'auto'      },
        auto_off:        { label: 'Kipas Mati (Otomatis)',       icon: 'auto'      },
        threshold_change:{ label: 'Target Suhu Diubah',         icon: 'threshold' },
    };
    return map[type] || { label: type, icon: 'auto' };
}

function formatTime(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function iconSvgFor(type) {
    if (type === 'on')  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`;
    if (type === 'off') return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`;
    if (type === 'threshold') return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`;
    if (type === 'error') return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
}

// Render activity_log
async function loadActivityLog() {
    activityLogList.innerHTML = `<div class="history-loading"><div class="loading-spinner"></div><p>Memuat data aktivitas...</p></div>`;
    
    try {
        const apiBase = window.API_BASE || '/api';
        let url = `${apiBase}/activity-log`;
        if (historyDateFilter.value) {
            url += `?date=${historyDateFilter.value}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0 || data.error) {
            activityLogList.innerHTML = `<div class="history-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                <p>${historyDateFilter.value ? 'Tidak ada data pada tanggal ini.' : 'Belum ada riwayat aktivitas.'}</p></div>`; 
            return;
        }

        activityLogList.innerHTML = '';
        data.forEach(row => {
            const meta = getActivityMeta(row.action_type);
            const div = document.createElement('div');
            div.className = 'db-row';
            div.innerHTML = `
                <div class="db-row-icon type-${meta.icon}">${iconSvgFor(meta.icon)}</div>
                <div class="db-row-info">
                    <h5>${meta.label}</h5>
                    <p>${row.temperature != null ? row.temperature + '°C' : '—'} · Device #${row.device_id ?? 1}</p>
                </div>
                <div class="db-row-time">${formatTime(row.created_at)}</div>`;
            activityLogList.appendChild(div);
        });
    } catch (e) {
        console.error("Fetch Activity Error:", e);
        activityLogList.innerHTML = `<div class="history-empty"><p>Gagal mengambil data dari server lokal.</p></div>`;
    }
}

// Render error_log
async function loadErrorLog() {
    errorLogList.innerHTML = `<div class="history-loading"><div class="loading-spinner"></div><p>Memuat data error...</p></div>`;
    
    try {
        const apiBase = window.API_BASE || '/api';
        let url = `${apiBase}/error-log`;
        if (historyDateFilter.value) {
            url += `?date=${historyDateFilter.value}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0 || data.error) {
            errorLogList.innerHTML = `<div class="history-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>${historyDateFilter.value ? 'Tidak ada error pada tanggal ini.' : 'Tidak ada error yang tercatat. Sistem berjalan normal! ✅'}</p></div>`; 
            return;
        }

        errorLogList.innerHTML = '';
        data.forEach(row => {
            const div = document.createElement('div');
            div.className = 'db-row';
            div.innerHTML = `
                <div class="db-row-icon type-error">${iconSvgFor('error')}</div>
                <div class="db-row-info">
                    <h5>${row.error_msg || 'Error tidak diketahui'}</h5>
                    <p>Device #${row.device_id ?? 1}</p>
                </div>
                <div class="db-row-time">${formatTime(row.created_at)}</div>`;
            errorLogList.appendChild(div);
        });
    } catch (e) {
        console.error("Fetch Error Log Error:", e);
        errorLogList.innerHTML = `<div class="history-empty"><p>Gagal mengambil data error dari server lokal.</p></div>`;
    }
}

// Navigasi & Event Listeners
if (openHistoryBtn) {
    openHistoryBtn.addEventListener('click', () => {
        historyScreen.classList.remove('hidden');
        loadActivityLog();
    });
}

if (backFromHistoryBtn) {
    backFromHistoryBtn.addEventListener('click', () => {
        historyScreen.classList.add('closing');
        setTimeout(() => {
            historyScreen.classList.add('hidden');
            historyScreen.classList.remove('closing');
        }, 500);
    });
}

// Tab Switching Logic (Lovable Style)
document.querySelectorAll('.history-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        
        // Update UI Tabs
        document.querySelectorAll('.history-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update Content
        document.querySelectorAll('.history-tab-content').forEach(c => c.classList.remove('active'));
        if (target === 'activity') {
            document.getElementById('tabActivity').classList.add('active');
            loadActivityLog();
        } else {
            document.getElementById('tabError').classList.add('active');
            loadErrorLog();
        }
    });
});

// Filter Tanggal
if (historyDateFilter) {
    historyDateFilter.addEventListener('change', () => {
        const activeTab = document.querySelector('.history-tab.active')?.dataset.tab;
        if (activeTab === 'error') loadErrorLog();
        else loadActivityLog();
    });
}

if (clearDateBtn) {
    clearDateBtn.addEventListener('click', () => {
        historyDateFilter.value = '';
        const activeTab = document.querySelector('.history-tab.active')?.dataset.tab;
        if (activeTab === 'error') loadErrorLog();
        else loadActivityLog();
    });
}

// Tab switching
document.querySelectorAll('.history-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.history-tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
        if (tab === 'activity') loadActivityLog();
        else loadErrorLog();
    });
});

init();
