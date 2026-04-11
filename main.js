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
const thresholdLabel = document.getElementById('thresholdLabel');

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

// --- Fan Controls ---
powerSwitch.addEventListener('click', () => {
    isPowerOn = !isPowerOn;
    updatePowerUI('manual');

    if (writer) {
        const cmd = isPowerOn ? "ON\n" : "OFF\n";
        writer.write(new TextEncoder().encode(cmd));
    }
});

// --- Threshold Controls ---
thresholdSlider.addEventListener('input', (e) => {
    thresholdTemp = parseFloat(e.target.value);
    thresholdLabel.textContent = thresholdTemp;
});

thresholdSlider.addEventListener('change', () => {
    if (writer) {
        const cmd = `SET:${thresholdTemp}\n`;
        writer.write(new TextEncoder().encode(cmd));
    }
    addHistory(`Threshold: ${thresholdTemp}°C`, 'settings'); 
});

if (tempUpBtn) tempUpBtn.addEventListener('click', () => {
    thresholdSlider.value = parseFloat(thresholdSlider.value) + 0.5;
    thresholdSlider.dispatchEvent(new Event('input'));
    thresholdSlider.dispatchEvent(new Event('change'));
});

if (tempDownBtn) tempDownBtn.addEventListener('click', () => {
    thresholdSlider.value = parseFloat(thresholdSlider.value) - 0.5;
    thresholdSlider.dispatchEvent(new Event('input'));
    thresholdSlider.dispatchEvent(new Event('change'));
});

// --- Helper for ID selection ---
function id(name) { return document.getElementById(name); }

function updatePowerUI(source = 'manual') {
    if (isPowerOn) {
        powerSwitch.classList.add('on');
        appContainer.classList.add('active-cool');
        statusLabel.textContent = 'Active Cooling';
        statusLabel.style.color = '#FACD15'; // Match yellow theme
        fanBlades.classList.add('spinning');
        
        const title = source === 'auto' ? 'Auto-Cooling Activated' : 'Fan Powered On';
        addHistory(title, 'on');
    } else {
        powerSwitch.classList.remove('on');
        appContainer.classList.remove('active-cool');
        statusLabel.textContent = 'Standby';
        statusLabel.style.color = '#64748B';
        fanBlades.classList.remove('spinning');
        
        const title = source === 'auto' ? 'Auto-Cooling Deactivated' : 'Fan Powered Off';
        addHistory(title, 'off');
    }
}

function addHistory(title, type, temp = null) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempToShow = temp !== null ? temp : currentTemp;
    
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    item.innerHTML = `
        <div class="timeline-top">
            <div class="timeline-dot"></div>
            <span class="timeline-time">${timeStr}</span>
        </div>
        <div class="timeline-card">
            <div class="card-left">
                <h5>${title}</h5>
                <p>${type.toUpperCase()} • ${tempToShow.toFixed(1)}°C</p>
            </div>
            <div class="card-right">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FACD15" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </div>
        </div>
    `;
    
    historyList.prepend(item);
}

function updateSparkline() {
    const pts = tempHistory.map((t, i) => {
        const x = i * 25;
        const y = 40 - (((t - 19) / 10) * 40);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    tempSparkline.setAttribute('d', pts);
}

function updateUI() {
    tempValueLabel.textContent = currentTemp.toFixed(1);
    updateSparkline();
}

// --- Serial Logic ---
if (connectSerialBtn) {
    connectSerialBtn.addEventListener('click', async () => {
        try {
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            writer = port.writable.getWriter();
            serialKeepReading = true;
            connectSerialBtn.classList.add('connected');
            connectSerialBtn.innerHTML = `Connect Live`;
            readSerial();
        } catch (err) { console.error(err); }
    });
}

async function readSerial() {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();
    let buffer = "";
    while (serialKeepReading) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('T:')) {
                handleTempUpdate(parseFloat(trimmed.slice(2)));
            } else if (trimmed.startsWith('S:')) {
                const newState = (trimmed.slice(2) === '1');
                if (newState !== isPowerOn) {
                    isPowerOn = newState;
                    updatePowerUI('auto'); // Sync update from device
                }
            } else if (trimmed.startsWith('M:')) {
                console.log("Device Message:", trimmed.slice(2));
            }
        }
    }
}

function handleTempUpdate(temp) {
    currentTemp = temp;
    tempValueLabel.textContent = currentTemp.toFixed(1);
    tempHistory.shift();
    tempHistory.push(currentTemp);
    updateSparkline();
}

init();
initDial();
