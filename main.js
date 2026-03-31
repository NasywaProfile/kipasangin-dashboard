// --- DOM Elements ---
const welcomeScreen = document.getElementById('welcomeScreen');
const appContainer = document.getElementById('appContainer');
const startBtn = document.getElementById('startBtn');

const powerSwitch = document.getElementById('powerSwitch');
const statusLabel = document.getElementById('statusLabel');
const fanBlades = document.getElementById('fanBlades');
const speedSlider = document.getElementById('speedSlider');
const speedValueLabel = document.getElementById('speedValue');
const tempValueLabel = document.getElementById('tempValue');
const historyList = document.getElementById('historyList');

// --- Application State ---
let isPowerOn = false;
let currentSpeed = 0;
let currentTemp = 24.5;
let sessionActive = false;

// --- Initialize ---
function init() {
    updateUI();
    
    // Simulate Temperature fluctuations
    setInterval(() => {
        if (!sessionActive) return;
        
        if (isPowerOn) {
            currentTemp -= (currentSpeed / 100) * 0.05 + 0.01;
            if (currentTemp < 18.5) currentTemp = 18.5;
        } else {
            currentTemp += 0.02;
            if (currentTemp > 28.5) currentTemp = 28.5;
        }
        tempValueLabel.textContent = currentTemp.toFixed(1);
    }, 2000);
}

// --- Navigation ---
startBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    sessionActive = true;
    addHistory('Session Started', 'on');
});

// --- Fan Controls ---
powerSwitch.addEventListener('click', () => {
    togglePower(!isPowerOn);
});

speedSlider.addEventListener('input', (e) => {
    currentSpeed = parseInt(e.target.value);
    
    if (currentSpeed > 0 && !isPowerOn) {
        togglePower(true);
    } else if (currentSpeed === 0 && isPowerOn) {
        togglePower(false);
    } else {
        updateAnimation();
        speedValueLabel.textContent = isPowerOn ? `${currentSpeed}%` : 'Standby';
    }
});

function togglePower(state) {
    isPowerOn = state;
    
    if (isPowerOn) {
        powerSwitch.classList.remove('off');
        powerSwitch.classList.add('on');
        statusLabel.textContent = 'Active Running';
        
        if (currentSpeed === 0) {
            currentSpeed = 25;
            speedSlider.value = 25;
        }
        speedValueLabel.textContent = `${currentSpeed}%`;
        addHistory('Manual Startup', 'on');
    } else {
        powerSwitch.classList.remove('on');
        powerSwitch.classList.add('off');
        statusLabel.textContent = 'Standby';
        speedValueLabel.textContent = 'Standby';
        addHistory('System Shutdown', 'off');
    }
    
    updateAnimation();
}

function updateAnimation() {
    if (isPowerOn && currentSpeed > 0) {
        fanBlades.classList.add('spinning');
        const duration = 2.5 - (currentSpeed / 100) * 2.3;
        fanBlades.style.animationDuration = `${duration}s`;
    } else {
        fanBlades.classList.remove('spinning');
    }
}

function addHistory(title, type) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-left">
            <div class="history-dot ${type === 'on' ? 'dot-on' : 'dot-off'}"></div>
            <div class="history-text">
                <h5>${title}</h5>
                <p>Status: ${type.toUpperCase()}</p>
            </div>
        </div>
        <p class="history-time">${timeStr}</p>
    `;
    
    historyList.prepend(item);
    if (historyList.children.length > 4) {
        historyList.removeChild(historyList.lastChild);
    }
}

function updateUI() {
    tempValueLabel.textContent = currentTemp.toFixed(1);
    addHistory('Device Ready', 'on');
}

init();
