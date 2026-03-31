// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const appContainer = document.getElementById('appContainer');
const startBtn = document.getElementById('startBtn');
const backHomeBtn = document.getElementById('backHomeBtn');

const powerSwitch = document.getElementById('powerSwitch');
const statusLabel = document.getElementById('statusLabel');
const fanBlades = document.getElementById('fanBlades');
const speedSlider = document.getElementById('speedSlider');
const speedValueLabel = document.getElementById('speedValue');
const tempValueLabel = document.getElementById('tempValue');
const historyList = document.getElementById('historyList');

// State
let isPowerOn = false;
let currentSpeed = 0;
let currentTemp = 24.5;
let sessionActive = false;

// Initialization
function init() {
    updateUI();
    
    // Simulate Temperature fluctuations
    setInterval(() => {
        if (!sessionActive) return;
        
        if (isPowerOn) {
            currentTemp -= (currentSpeed / 100) * 0.05;
            if (currentTemp < 19) currentTemp = 19;
        } else {
            currentTemp += 0.03;
            if (currentTemp > 28) currentTemp = 28;
        }
        tempValueLabel.textContent = currentTemp.toFixed(1);
    }, 2000);
}

// Navigation Logic
startBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    sessionActive = true;
});

backHomeBtn.addEventListener('click', () => {
    appContainer.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    sessionActive = false;
});

// Fan Control Logic
powerSwitch.addEventListener('click', () => {
    togglePower(!isPowerOn);
});

speedSlider.addEventListener('input', (e) => {
    currentSpeed = parseInt(e.target.value);
    speedValueLabel.textContent = `${currentSpeed}%`;
    
    // Auto-on when sliding speed up
    if (currentSpeed > 0 && !isPowerOn) {
        togglePower(true);
    } else if (currentSpeed === 0 && isPowerOn) {
        togglePower(false);
    }
    
    updateAnimation();
});

function togglePower(state) {
    isPowerOn = state;
    
    if (isPowerOn) {
        powerSwitch.classList.add('on');
        statusLabel.textContent = 'Active Running';
        statusLabel.style.color = '#3B82F6'; // Light Blue
        
        if (currentSpeed === 0) {
            currentSpeed = 30;
            speedSlider.value = 30;
            speedValueLabel.textContent = '30%';
        }
        addHistory('Fan Started', 'on');
    } else {
        powerSwitch.classList.remove('on');
        statusLabel.textContent = 'Standby';
        statusLabel.style.color = '#64748B'; // Slate Grey
        addHistory('Fan Stopped', 'off');
    }
    
    updateAnimation();
}

function updateAnimation() {
    if (isPowerOn && currentSpeed > 0) {
        fanBlades.classList.add('spinning');
        const duration = 3.0 - (currentSpeed / 100) * 2.8;
        fanBlades.style.animationDuration = `${duration}s`;
    } else {
        fanBlades.classList.remove('spinning');
    }
}

function addHistory(title, type) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dayStr = now.toLocaleDateString([], { weekday: 'short' });
    
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-icon ${type}"></div>
        <div class="history-info">
            <h4>${title}</h4>
            <p>${dayStr}, ${timeStr}</p>
        </div>
    `;
    
    historyList.prepend(item);
    if (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

function updateUI() {
    tempValueLabel.textContent = currentTemp.toFixed(1);
    
    // Default history items
    addHistory('Device Sync', 'on');
    addHistory('System Initialized', 'off');
}

init();
