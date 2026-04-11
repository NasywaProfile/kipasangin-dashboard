// --- DOM Elements ---
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

// --- Serial State ---
let port;
let writer;
let reader;
let serialKeepReading = false;

// --- Application State ---
let isPowerOn = false;
let currentTemp = 24.5;
let sessionActive = false;
let thresholdTemp = 32.0;
let tempHistory = [24.5, 24.5, 24.5, 24.5, 24.5];

// --- Initialize ---
function init() {
    updateUI();
}

// --- Simple Enter Flow ---
function enterDashboard() {
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
        sessionActive = false;
    }, 600);
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
    if (isPowerOn) {
        powerSwitch.classList.add('on');
        appContainer.classList.add('active-cool');
        statusLabel.textContent = 'Active Cooling';
        statusLabel.style.color = '#A67347';
        fanBlades.classList.add('spinning');
        
        const title = source === 'auto' ? 'Auto-Cooling' : 'Fan Started';
        addHistory(title, 'on');
    } else {
        powerSwitch.classList.remove('on');
        appContainer.classList.remove('active-cool');
        statusLabel.textContent = 'Standby';
        statusLabel.style.color = '#64748B';
        fanBlades.classList.remove('spinning');
        
        const title = source === 'auto' ? 'Target Reached' : 'Fan Stopped';
        addHistory(title, 'off');
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

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDFLZu2goPcVIj5ZbsjyfqEEfVlqAMDZ4s",
    authDomain: "smart-fan-ff0a0.firebaseapp.com",
    databaseURL: "https://smart-fan-ff0a0-default-rtdb.firebaseio.com",
    projectId: "smart-fan-ff0a0",
    storageBucket: "smart-fan-ff0a0.firebasestorage.app",
    messagingSenderId: "63176942461",
    appId: "1:63176942461:web:fac75ae0a051b616f82214"
};

// --- Firebase Initialization ---
let db;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    
    // UI Cloud Status
    const cloudStatus = document.getElementById('cloudStatus');
    const cloudStatusText = cloudStatus.querySelector('span:nth-child(2)');
    
    const connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            cloudStatus.classList.add('online');
            cloudStatusText.textContent = 'Online';
            if (historyList && historyList.children.length === 0) {
                addHistory('Cloud Connected', 'on', 24.5);
            }
        } else {
            cloudStatus.classList.remove('online');
            cloudStatusText.textContent = 'Offline';
        }
    });

    // Listen to Temperature
    db.ref('smartfan/temperature').on('value', (snapshot) => {
        const temp = snapshot.val();
        if (temp !== null) handleTempUpdate(temp);
    });

    // Listen to Power State
    db.ref('smartfan/power').on('value', (snapshot) => {
        const state = snapshot.val();
        if (state !== null && state !== isPowerOn) {
            isPowerOn = state;
            updatePowerUI('auto');
        }
    });

} catch (err) {
    console.error("Firebase Init Error (did you set your config?):", err);
}

// --- Sync Functions ---
function sendThreshold(val) {
    if (db) {
        db.ref('smartfan/threshold').set(val);
    }
    // Include the precise value in history
    addHistory(`Target set to ${val.toFixed(1)}°C`, 'settings'); 
}

powerSwitch.addEventListener('click', () => {
    isPowerOn = !isPowerOn;
    updatePowerUI('manual');

    // Make sure we write boolean to DB
    if (db) {
        db.ref('smartfan/power').set(isPowerOn);
        db.ref('smartfan/manualOverride').set(true); // Tell ESP32 user clicked it
    }
});

function handleTempUpdate(temp) {
    currentTemp = temp;
    tempValueLabel.textContent = currentTemp.toFixed(1);
    tempHistory.shift();
    tempHistory.push(currentTemp);
    updateSparkline();
}

init();
