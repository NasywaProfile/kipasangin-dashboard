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

// --- Serial State ---
let port;
let writer;
let reader;
let serialKeepReading = false;

// --- Application State ---
let isPowerOn = false;
let currentTemp = 24.5;
let sessionActive = false;
let tempHistory = [24.5, 24.5, 24.5, 24.5, 24.5];

// --- Initialize ---
function init() {
    updateUI();
}

// --- Simple Enter Flow ---
function enterDashboard() {
    // Smooth transition out of welcome screen
    welcomeScreen.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    welcomeScreen.style.opacity = '0';
    welcomeScreen.style.transform = 'scale(1.02)';
    
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        welcomeScreen.style.opacity = '';
        welcomeScreen.style.transform = '';
        
        appContainer.classList.remove('hidden');
        appContainer.style.animation = 'dashboardEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
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
    }, 600); // Wait for fade out
}

if (startBtn) {
    startBtn.addEventListener('click', enterDashboard);
}

backBtn.addEventListener('click', () => {
    // Smooth transition out of dashboard
    appContainer.style.animation = 'dashboardExit 0.6s ease forwards';
    
    setTimeout(() => {
        appContainer.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        sessionActive = false;
        
        // Let welcome screen fade back in
        welcomeScreen.style.animation = 'dashboardEnter 0.8s ease backwards';
    }, 600);
});

// --- Fan Controls ---
powerSwitch.addEventListener('click', () => {
    isPowerOn = !isPowerOn;
    updatePowerUI();
    
    // Send to Arduino
    if (writer) {
        const cmd = isPowerOn ? "ON\n" : "OFF\n";
        writer.write(new TextEncoder().encode(cmd));
    }
});

function updatePowerUI() {
    if (isPowerOn) {
        powerSwitch.classList.add('on');
        appContainer.classList.add('active-cool');
        statusLabel.textContent = 'Active Cooling';
        statusLabel.style.color = '#3B82F6';
        fanBlades.classList.add('spinning');
        addHistory('Fan Turned On', 'on');
    } else {
        powerSwitch.classList.remove('on');
        appContainer.classList.remove('active-cool');
        statusLabel.textContent = 'Standby';
        statusLabel.style.color = '#64748B';
        fanBlades.classList.remove('spinning');
        addHistory('Fan Turned Off', 'off');
    }
}

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

// --- Serial Logic ---
if (connectSerialBtn) {
    connectSerialBtn.addEventListener('click', async () => {
        if (!('serial' in navigator)) {
            alert('Web Serial API not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            
            writer = port.writable.getWriter();
            serialKeepReading = true;
            
            connectSerialBtn.classList.add('connected');
            connectSerialBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Live</span>
            `;
            
            readSerial();
            
        } catch (err) {
            console.error('Serial connection failed:', err);
        }
    });
}

async function readSerial() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();

    let buffer = "";

    try {
        while (serialKeepReading) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep last incomplete line

            for (const line of lines) {
                const trimmed = line.trim();
                // Expecting "T:25.4" or "S:1/0"
                if (trimmed.startsWith('T:')) {
                    const temp = parseFloat(trimmed.slice(2));
                    if (!isNaN(temp)) {
                        handleTempUpdate(temp);
                    }
                } else if (trimmed.startsWith('S:')) {
                    const state = trimmed.slice(2);
                    const newPower = state === '1';
                    if (newPower !== isPowerOn) {
                        isPowerOn = newPower;
                        updatePowerUI();
                    }
                }
            }
        }
    } catch (err) {
        console.error('Serial read error:', err);
    } finally {
        reader.releaseLock();
    }
}

function handleTempUpdate(temp) {
    // If temp changed significantly, add to history
    if (Math.abs(temp - currentTemp) > 0.5) {
        addHistory('Temperature Shift', 'on', temp);
    }
    
    currentTemp = temp;
    tempValueLabel.textContent = currentTemp.toFixed(1);
    
    tempHistory.shift();
    tempHistory.push(currentTemp);
    updateSparkline();
}

init();
