// DOM Elements
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

// Initialization
function init() {
    updateUI();
    
    // Simulate Temperature fluctuations
    setInterval(() => {
        if (isPowerOn) {
            // Temperature drops slightly when fan is on
            currentTemp -= (currentSpeed / 100) * 0.05;
            if (currentTemp < 21) currentTemp = 21;
        } else {
            // Temperature rises when fan is off
            currentTemp += 0.02;
            if (currentTemp > 28) currentTemp = 28;
        }
        tempValueLabel.textContent = currentTemp.toFixed(1);
    }, 2000);
}

// Power Toggle Logic
powerSwitch.addEventListener('click', () => {
    isPowerOn = !isPowerOn;
    
    if (isPowerOn) {
        powerSwitch.classList.remove('off');
        powerSwitch.classList.add('on');
        statusLabel.textContent = 'Running';
        statusLabel.style.color = '#D4FF00';
        
        // Default speed when turned on
        if (currentSpeed === 0) {
            currentSpeed = 35;
            speedSlider.value = 35;
            speedValueLabel.textContent = '35%';
        }
        addHistory('Fan Turned On', 'Just now', 'on');
    } else {
        powerSwitch.classList.remove('on');
        powerSwitch.classList.add('off');
        statusLabel.textContent = 'Off';
        statusLabel.style.color = '#8E9BAE';
        addHistory('Fan Turned Off', 'Just now', 'off');
    }
    
    updateAnimation();
});

// Speed Slider Logic
speedSlider.addEventListener('input', (e) => {
    currentSpeed = parseInt(e.target.value);
    speedValueLabel.textContent = `${currentSpeed}%`;
    
    // If user interacts with slider, auto-turn on power if it's off (standard UX)
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
        statusLabel.textContent = 'Running';
        statusLabel.style.color = '#D4FF00';
        addHistory('Fan Started', 'Just now', 'on');
    } else {
        powerSwitch.classList.remove('on');
        statusLabel.textContent = 'Off';
        statusLabel.style.color = '#8E9BAE';
        addHistory('Fan Stopped', 'Just now', 'off');
    }
}

function updateAnimation() {
    if (isPowerOn && currentSpeed > 0) {
        fanBlades.classList.add('spinning');
        // Map speed (1-100) to animation duration (5s to 0.1s)
        const duration = 2.5 - (currentSpeed / 100) * 2.3;
        fanBlades.style.animationDuration = `${duration}s`;
    } else {
        fanBlades.classList.remove('spinning');
    }
}

function addHistory(title, time, type) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-icon ${type}"></div>
        <div class="history-info">
            <h4>${title}</h4>
            <p>${time}</p>
        </div>
    `;
    
    // Insert at the top
    historyList.prepend(item);
    
    // Keep only last 5 items
    if (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

function updateUI() {
    tempValueLabel.textContent = currentTemp.toFixed(1);
}

init();
