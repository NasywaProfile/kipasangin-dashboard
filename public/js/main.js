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

        // Ambil riwayat terbaru dari MySQL saat masuk
        loadInitialHistory();
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

// Fetch 5 riwayat terbaru dari MySQL untuk Dashboard Utama
async function loadInitialHistory() {
    try {
        const apiBase = window.API_BASE || '/api';
        const response = await fetch(`${apiBase}/activity-log`);
        const data = await response.json();

        if (data && data.length > 0) {
            historyList.innerHTML = ''; // Bersihkan loader/dummy
            // Ambil maksimal 5 saja untuk dashboard ringkas
            const latest = data.slice(0, 5);
            latest.reverse().forEach(row => {
                const meta = getActivityMeta(row.action_type);
                addHistory(meta.label, meta.icon, parseFloat(row.temperature));
            });
        }
    } catch (e) {
        console.error("Load Initial History Error:", e);
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

    // Reset timer Offline - Kita set ke 5 detik biar super instan ketahuan kalau mati
    clearTimeout(deviceTimeout);
    deviceTimeout = setTimeout(async () => {
        if (cloudStatusText.textContent === 'Online') {
            console.log("⚠️ Timeout super instan! Mengubah status ke Offline...");
            cloudStatus.classList.remove('online');
            cloudStatusText.textContent = 'Offline';
            statusLabel.textContent = 'Standby';

            // Sync ke Database - Set Offline (PAKSA)
            await syncDeviceStatus('Offline');
            await logSystemError('Koneksi Terputus / Mati Lampu');
        }
    }, 5000);

    if (topic === 'smartfan/data/temp') {
        handleTempUpdate(parseFloat(data));

    } else if (topic === 'smartfan/data/power') {
        // Jika baru saja ditekan manual, abaikan data balik selama 5 detik biar nggak dobel log
        if (Date.now() - lastPowerCommandTime < 5000) return;

        const newState = (data === 'ON');
        if (newState !== isPowerOn) {
            isPowerOn = newState;
            // Jika sedang mode manual, tetap anggap update ini sebagai manual agar tidak kirim log 'auto' miring
            updatePowerUI(isManualOverride ? 'manual' : 'auto');
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
                temperature: recordTemp
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
    try {
        const apiBase = window.API_BASE || '/api';
        await fetch(`${apiBase}/error-log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.CSRF_TOKEN || ''
            },
            body: JSON.stringify({
                device_id: 1,
                error_msg: msg
            })
        });
    } catch (e) {
        console.error("Local Error Log Gagal:", e);
    }
}

let isManualOverride = false;

// ============================================================
// TOMBOL POWER → PUBLISH MQTT INSTAN + LOG LOCAL
// ============================================================
window.handlePowerToggle = () => {
    lastPowerCommandTime = Date.now();
    if ("vibrate" in navigator) navigator.vibrate(50);

    // KETIKA TOMBOL DITEKAN → Masuk Mode Manual
    isManualOverride = true;

    isPowerOn = powerSwitch.checked; // Ambil status dari checkbox
    updatePowerUI('manual');

    const cmd = isPowerOn ? 'ON' : 'OFF';
    mqttClient.publish('smartfan/cmd/power', cmd);

    // Log ke Local tanpa mengganggu tampilan
    logToLocal(isPowerOn ? 'manual_on' : 'manual_off');
};

powerSwitch.addEventListener('change', window.handlePowerToggle);

// ============================================================
// KIRIM THRESHOLD → MQTT INSTAN
// ============================================================
window.sendThreshold = async function (val) {
    if (!mqttClient.connected) {
        mqttClient.reconnect();
    }
    mqttClient.publish('smartfan/cmd/threshold', val.toFixed(1));

    // KETIKA SLIDER DIGESER → Kembali ke Mode Otomatis
    isManualOverride = false;

    // 1. Catat perubahan threshold DULU
    if (val !== lastLoggedThreshold) {
        await logToLocal('threshold_change', val);
        addHistory(`Target Suhu: ${val.toFixed(1)}°C`, 'settings');
        lastLoggedThreshold = val;

        // Kasih jeda 100ms agar urutan di DB tidak tertukar
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 2. Kemudian baru cek kondisi suhu vs Slider baru (Auto On/Off)
    const shouldBeOn = currentTemp >= val;
    if (shouldBeOn !== isPowerOn) {
        isPowerOn = shouldBeOn;
        await updatePowerUI('auto');
    }
}

function handleTempUpdate(temp) {
    currentTemp = temp;
    tempValueLabel.textContent = currentTemp.toFixed(1);
    tempHistory.shift();
    tempHistory.push(currentTemp);
    updateSparkline();

    // HANYA CEK OTOMATIS JIKA TIDAK SEDANG DALAM MODE MANUAL
    if (!isManualOverride) {
        const shouldBeOn = currentTemp >= thresholdTemp;
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
        historyScreen.classList.add('hidden');
    });
}

if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.history-tab.active')?.dataset.tab;
        if (activeTab === 'error') loadErrorLog();
        else loadActivityLog();
    });
}

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
