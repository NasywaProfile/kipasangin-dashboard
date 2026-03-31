// --- DOM Elements ---
const welcomeScreen = document.getElementById('welcomeScreen');
const appContainer = document.getElementById('appContainer');
// --- Onboarding Elements ---
const swipeTrack = document.getElementById('swipeTrack');
const swipeThumb = document.getElementById('swipeThumb');
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

// --- Premium Swipe To Start Flow ---
let isDragging = false;
let startX = 0;
let currentX = 0;
let maxDrag = 0;

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

function onDragStart(e) {
    if (e.type === 'touchstart') e = e.touches[0];
    isDragging = true;
    startX = e.clientX - currentX;
    maxDrag = swipeTrack.offsetWidth - swipeThumb.offsetWidth - 10; // 5px padding on each side
    swipeTrack.classList.add('swiping');
}

function onDragMove(e) {
    if (!isDragging) return;
    if (e.type === 'touchmove') e = e.touches[0];
    currentX = e.clientX - startX;
    
    // Bounds
    if (currentX < 0) currentX = 0;
    if (currentX > maxDrag) currentX = maxDrag;
    
    swipeThumb.style.transform = `translateX(${currentX}px)`;
}

function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    swipeTrack.classList.remove('swiping');
    
    if (currentX >= maxDrag - 5) {
        // Unlocked!
        enterDashboard();
        
        // Reset for next time smoothly
        setTimeout(() => {
            currentX = 0;
            swipeThumb.style.transform = `translateX(0px)`;
            swipeThumb.style.transition = '';
        }, 1000);
    } else {
        // Snap back to zero
        currentX = 0;
        swipeThumb.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        swipeThumb.style.transform = `translateX(0px)`;
    }
}

// Attach Drag Interactions
if (swipeThumb) {
    swipeThumb.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    
    swipeThumb.addEventListener('touchstart', onDragStart, {passive: true});
    document.addEventListener('touchmove', onDragMove, {passive: true});
    document.addEventListener('touchend', onDragEnd);
    
    // clear transition so it responds immediately again
    swipeThumb.addEventListener('transitionend', () => {
        if (!isDragging) swipeThumb.style.transition = '';
    });
}

// Allow clicking on track to skip sliding entirely (optional fallback)
if (swipeTrack) {
    swipeTrack.addEventListener('dblclick', enterDashboard);
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
