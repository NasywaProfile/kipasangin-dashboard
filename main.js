// --- DOM Elements ---
const welcomeScreen = document.getElementById('welcomeScreen');
const appContainer = document.getElementById('appContainer');
// --- Onboarding Elements ---
const massiveText = document.getElementById('massiveText');
const mainToggle = document.getElementById('mainToggle');
const toggleKnob = document.getElementById('toggleKnob');
const subtextContainer = document.getElementById('subtextContainer');
const backBtn = document.getElementById('backBtn');

const powerSwitch = document.getElementById('powerSwitch');
const statusLabel = document.getElementById('statusLabel');
const fanBlades = document.getElementById('fanBlades');
const tempValueLabel = document.getElementById('tempValue');
const historyList = document.getElementById('historyList');
const historyCountLabel = document.getElementById('historyCount');
const tempSparkline = document.getElementById('tempSparkline');

// --- Application State ---
let isPowerOn = false;
let currentTemp = 24.5;
let sessionActive = false;
let tempHistory = [24.5, 24.5, 24.5, 24.5, 24.5];

// --- Initialize ---
function init() {
    updateUI();
    
    // Simulate Temperature fluctuations
    setInterval(() => {
        if (!sessionActive) return;
        
        if (isPowerOn) {
            currentTemp -= 0.1;
            if (currentTemp < 20.0) currentTemp = 20.0;
        } else {
            currentTemp += 0.05;
            if (currentTemp > 28.0) currentTemp = 28.0;
        }
        
        tempValueLabel.textContent = currentTemp.toFixed(1);
        
        // Update Sparkline
        tempHistory.shift();
        tempHistory.push(currentTemp);
        updateSparkline();
        
    }, 2000);
}

// --- Navigation & Onboarding Flow ---
// --- Navigation & Onboarding Flow ---
let onboardingToggled = false;

mainToggle.addEventListener('click', () => {
    if (onboardingToggled) return; // prevent multiple clicks
    onboardingToggled = true;
    
    // Switch to cold theme
    welcomeScreen.classList.remove('theme-hot-home');
    welcomeScreen.classList.add('theme-cold-home');
    
    // Change text content via fade
    massiveText.style.opacity = '0';
    subtextContainer.style.opacity = '0';
    
    // Change knob emoji
    toggleKnob.textContent = '❄️';
    
    setTimeout(() => {
        massiveText.innerHTML = 'COOLING<br>ENGAGED';
        subtextContainer.textContent = 'Atmospheric conditions optimizing. Redirecting to control dashboard...';
        massiveText.style.opacity = '1';
        subtextContainer.style.opacity = '1';
    }, 400);
    
    // Wait 2 seconds before entering dashboard
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.style.animation = 'fadeUp 0.6s ease forwards';
        sessionActive = true;
        
        if (historyList.children.length === 0) {
            // Initial set of events
            addHistory('System Initialized', 'on', 24.5);
            addHistory('Automatic Cooling Engaged', 'on', 26.2);
            addHistory('Energy Saving Mode', 'off', 24.8);
            addHistory('Night Mode Active', 'on', 23.5);
            addHistory('Manual Override', 'off', 24.1);
            addHistory('Temperature Calibration', 'on', 24.4);
            addHistory('Fan Speed Optimized', 'on', 24.5);
        }
    }, 2000);
});

backBtn.addEventListener('click', () => {
    appContainer.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    sessionActive = false;
    
    // Reset welcome screen state
    onboardingToggled = false;
    welcomeScreen.classList.remove('theme-cold-home');
    welcomeScreen.classList.add('theme-hot-home');
    
    toggleKnob.textContent = '🔥';
    massiveText.innerHTML = 'FEELING<br>THE HEAT?';
    subtextContainer.textContent = "It's getting warm in here. Tap the switch to instantly activate the advanced cooling sequence and bring the temperature down.";
});

// --- Fan Controls ---
powerSwitch.addEventListener('click', () => {
    isPowerOn = !isPowerOn;
    
    if (isPowerOn) {
        powerSwitch.classList.add('on');
        appContainer.classList.add('active-cool'); // Add Cool Atmosphere
        statusLabel.textContent = 'Active Cooling';
        statusLabel.style.color = '#3B82F6';
        fanBlades.classList.add('spinning');
        addHistory('Fan Turned On', 'on');
    } else {
        powerSwitch.classList.remove('on');
        appContainer.classList.remove('active-cool'); // Remove Cool Atmosphere
        statusLabel.textContent = 'Standby';
        statusLabel.style.color = '#64748B';
        fanBlades.classList.remove('spinning');
        addHistory('Fan Turned Off', 'off');
    }
});

function addHistory(title, type, temp = null) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempToShow = temp !== null ? temp : currentTemp;
    
    const iconSvg = type === 'on' 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`;
        
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-left">
            <div class="history-icon-box ${type === 'on' ? 'type-on' : 'type-off'}">
                ${iconSvg}
            </div>
            <div class="history-text">
                <h5>${title}</h5>
                <p>State: ${type.toUpperCase()} • <span>${tempToShow.toFixed(1)}°C</span></p>
            </div>
        </div>
        <div class="history-time">${timeStr}</div>
    `;
    
    // Add animation
    item.style.animation = 'fadeUp 0.4s ease backwards';
    
    historyList.prepend(item);
    
    // Update count
    if (historyCountLabel) {
        historyCountLabel.textContent = historyList.children.length;
    }
    
    // Maintain a reasonable limit
    if (historyList.children.length > 50) {
        historyList.removeChild(historyList.lastChild);
    }
}

function updateSparkline() {
    const min = 19;
    const max = 29;
    const range = max - min;
    
    const pts = tempHistory.map((t, i) => {
        const x = i * 25; // 0 to 100
        const y = 30 - (((t - min) / range) * 30);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    // Animate the sparkline transition
    tempSparkline.style.transition = 'all 0.5s ease';
    tempSparkline.setAttribute('d', pts);
}

function updateUI() {
    const val = currentTemp.toFixed(1);
    tempValueLabel.textContent = val;
    const headerVal = document.getElementById('headerTempValue');
    if (headerVal) headerVal.textContent = val;
    updateSparkline();
}

init();
