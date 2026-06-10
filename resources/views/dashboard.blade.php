<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Smart Fan IoT Dashboard — Monitor dan kontrol kipas pintar berbasis ESP32 secara real-time.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>Smart Fan — Dashboard IoT</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>

<body>
    <!-- Main Dashboard -->
    <div id="appContainer" class="app-container">
        <!-- Wind Animation Overlay -->
        <div class="wind-lines" id="windOverlay">
            <div class="wind-line w1"></div>
            <div class="wind-line w2"></div>
            <div class="wind-line w3"></div>
            <div class="wind-line w4"></div>
        </div>

        <!-- Left Panel: Integrated Fan & Power -->
        <section class="dashboard-visuals">
            <header class="visual-header">
                <div class="header-left">
                    <!-- Form Logout -->
                    <form action="{{ route('logout') }}" method="POST" id="logoutForm" style="display: inline-block; margin-right: 15px;">
                        @csrf
                        <button type="submit" class="back-btn" title="Keluar / Logout" aria-label="Logout" style="display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </form>
                    <div class="titles">
                        <h1>Smart Fan</h1>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <!-- Setup WiFi Link -->
                    <a href="{{ route('wifi-setup') }}" class="cloud-status" style="cursor: pointer; display: flex; align-items: center; gap: 8px; text-decoration: none;" title="Setup WiFi Perangkat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3" />
                        </svg>
                        <span>WiFi Setup</span>
                    </a>

                    <div id="cloudStatus" class="cloud-status">
                        <span class="cloud-dot"></span>
                        <span>Offline</span>
                    </div>
                </div>
            </header>

            <div class="fan-display">
                <div class="fan-glow"></div>
                <div class="fan-frame">
                    <div class="fan-spinner" id="fanBlades">
                        <div class="fan-blade b1"></div>
                        <div class="fan-blade b2"></div>
                        <div class="fan-blade b3"></div>
                        <div class="fan-hub"></div>
                    </div>
                </div>
            </div>

            <!-- Modern Power Control -->
            <div class="power-control-wrapper">
                <!-- Power Toggle -->
                <div class="power-card">
                    <div class="power-info">
                        <h3>Device Power</h3>
                        <p id="statusLabel">Standby</p>
                    </div>
                    <label class="power-switch-label">
                        <input type="checkbox" id="powerSwitch" style="display:none">
                        <div class="power-toggle-ui">
                            <div class="toggle-knob">
                                <svg class="p-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                    <line x1="12" y1="2" x2="12" y2="12" />
                                </svg>
                            </div>
                        </div>
                    </label>
                </div>

                <!-- Auto Mode Toggle -->
                <div class="power-card">
                    <div class="power-info">
                        <h3>Auto Mode</h3>
                        <p id="autoModeLabel">Manual</p>
                    </div>
                    <label class="power-switch-label">
                        <input type="checkbox" id="autoModeSwitch" style="display:none">
                        <div class="power-toggle-ui auto-ui">
                            <div class="toggle-knob">
                                <svg class="p-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/><circle cx="12" cy="12" r="4"/>
                                </svg>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        </section>

        <div class="dashboard-content modern-light">
            <!-- Right Panel Sections -->
            <div class="side-panel-wrapper">

                <!-- 1. Environment Stats -->
                <section class="panel-section environment-entry">
                    <div class="section-tag">Environment</div>
                    <div class="main-stats-card">
                        <div class="stats-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                            </svg>
                        </div>
                        <div class="stats-main-info">
                            <p>Room Temperature</p>
                            <div class="stats-value-row">
                                <span id="tempValue">24.5</span><span class="unit-label">°C</span>
                            </div>
                        </div>
                        <div class="stats-trend">
                            <svg viewBox="0 0 100 30" class="main-sparkline">
                                <path d="M0 15 L 25 15 L 50 15 L 75 15 L 100 15" fill="none" stroke="#A67347"
                                    stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                                    id="tempSparkline" />
                            </svg>
                        </div>
                    </div>
                </section>

                <!-- 2. Automation Control -->
                <section class="panel-section automation-entry">
                    <div class="section-tag">Automation Settings</div>
                    <div class="automation-card">
                        <div class="auto-header">
                            <div class="auto-title">
                                <h4>Temp Threshold</h4>
                                <p>Fan auto-activates at this temperature</p>
                            </div>
                            <div class="auto-badge">
                                <input type="number" id="thresholdInput" value="32" min="20" max="45" step="0.1">
                                <span class="badge-unit">°C</span>
                                <button id="sendThresholdBtn" class="mini-send-btn" title="Update Threshold">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="auto-control-box">
                            <div class="stepper-btn" id="tempDown">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                            <div class="slider-track-box">
                                <input type="range" id="thresholdSlider" min="20" max="45" step="0.1" value="32"
                                    class="premium-slider">
                                <div class="slider-marks">
                                    <span>20°</span>
                                    <span>32°</span>
                                    <span>45°</span>
                                </div>
                            </div>
                            <div class="stepper-btn" id="tempUp">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 3. Recent Activity -->
                <section class="panel-section history-entry">
                    <div class="history-header-row">
                        <div class="section-tag">Recent Activity</div>
                        <div class="history-count-pill" id="historyCount">0</div>
                    </div>
                    <div class="activity-scroll-list" id="historyList">
                        <!-- Activity items go here -->
                    </div>
                </section>

                <!-- 4. Riwayat Button -->
                <section class="panel-section">
                    <button id="openHistoryBtn" class="riwayat-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        Lihat Riwayat Lengkap
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
                </section>

            </div>
        </div>
    </div>

    <!-- ===================== HALAMAN RIWAYAT ===================== -->
    <div id="historyScreen" class="history-screen hidden">
        <div class="history-page-card">

            <!-- Header -->
            <div class="history-page-header">
                <div class="header-top-row">
                    <button id="backFromHistoryBtn" class="back-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <h2 class="history-page-title">Riwayat <span>Sistem</span></h2>
                    
                    <div class="date-filter-wrapper-pill">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <input type="date" id="historyDateFilter" class="date-input">
                        <button id="clearDateBtn" class="clear-btn-pill">Reset</button>
                    </div>
                </div>

                <!-- Tab Switcher (Lovable Style) -->
                <div class="history-nav-tabs">
                    <button class="history-tab active" data-tab="activity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        Aktivitas
                    </button>
                    <button class="history-tab" data-tab="error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Error Log
                    </button>
                </div>
            </div>

            <!-- Tab Content -->
            <div id="tabActivity" class="history-tab-content active">
                <div id="activityLogList" class="history-db-list">
                    <div class="history-loading">
                        <div class="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                </div>
            </div>

            <div id="tabError" class="history-tab-content">
                <div id="errorLogList" class="history-db-list">
                    <div class="history-loading">
                        <div class="loading-spinner"></div>
                        <p>Memuat data...</p>
                    </div>
                </div>
            </div>

        </div>
    </div>



    <script>
        // Gunakan URL Laravel asli untuk API Base
        window.API_BASE = "{{ url('api') }}";
        window.IMAGE_BASE = "{{ asset('images') }}";
        window.CSRF_TOKEN = "{{ csrf_token() }}";
        window.DEVICE_TOKEN = "{{ env('DEVICE_TOKEN', 'KipasAnginSecureToken123') }}";
        window.MQTT_USER = "{{ env('MQTT_USER', '') }}";
        window.MQTT_PASS = "{{ env('MQTT_PASS', '') }}";
        window.MQTT_DEVICE_PREFIX = "{{ env('MQTT_DEVICE_PREFIX', 'smartfan/device_1') }}";
        console.log("Debug: API_BASE is", window.API_BASE);
    </script>
    <script src="https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js"></script>
    <script type="module" src="{{ asset('js/app-v1.js') }}?v={{ time() }}"></script>
</body>

</html>
