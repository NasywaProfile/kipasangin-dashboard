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
    <style>
        /* Premium & Responsive Setup WiFi Guide */
        .split-tutorial {
            display: flex;
            width: 100%;
            height: 100%;
            background: #FFFFFF;
            border-radius: 40px;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin: auto;
            border: 1.5px solid #E2E8F0;
            transition: all 0.5s ease;
        }

        .tutorial-left {
            flex: 1;
            padding: 50px;
            background: #F1F5F9; /* Slate Light */
            color: #1E293B;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 1px solid #E2E8F0;
        }

        .tutorial-left h2 {
            font-size: 2.2rem !important;
            font-weight: 800 !important;
            color: #0F172A;
            line-height: 1.2;
            margin-bottom: 15px !important;
        }

        .important-box {
            background: #FFFFFF !important;
            border: 1px solid #E2E8F0 !important;
            padding: 25px !important;
            border-radius: 24px !important;
            margin-top: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.03);
        }

        .important-box h3 {
            font-size: 0.95rem !important;
            color: #EF4444 !important;
            margin-bottom: 8px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .tutorial-right {
            flex: 1.2;
            padding: 60px 50px;
            background: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow-y: auto;
        }

        .tutorial-right h4 {
            color: #0F172A;
            text-align: center; /* Judul di Tengah */
            font-size: 1.4rem;
            font-weight: 800;
            margin-bottom: 40px;
            position: relative;
        }

        .tutorial-right h4::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 4px;
            background: #1E293B;
            border-radius: 10px;
        }

        /* Penomoran Instruksi Berdesain */
        .tutorial-right ol {
            counter-reset: my-counter;
            list-style: none;
            padding: 0;
            margin-bottom: 40px;
        }

        .tutorial-right ol li {
            counter-increment: my-counter;
            margin-bottom: 25px;
            color: #475569;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 1.05rem;
        }

        .tutorial-right ol li::before {
            content: counter(my-counter);
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            background: #1E293B;
            color: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.9rem;
            box-shadow: 0 4px 10px rgba(30, 41, 59, 0.2);
        }

        .setup-btn {
            display: block;
            text-align: center;
            color: #fff !important;
            background: #1E293B !important;
            padding: 20px;
            border-radius: 20px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 10px 25px rgba(30, 41, 59, 0.15);
        }

        .setup-btn:hover {
            background: #0F172A !important;
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(30, 41, 59, 0.25);
        }

        .closeTutorialBtn {
            transition: all 0.3s ease;
        }

        .closeTutorialBtn:hover {
            background: #0F172A !important;
            transform: rotate(90deg) scale(1.1);
        }

        .d-none { display: none !important; }

        @media screen and (max-width: 900px) {
            .split-tutorial { flex-direction: column; height: 100%; border-radius: 0; }
            .tutorial-left { padding: 40px 30px; border-right: none; border-bottom: 1px solid #E2E8F0; }
            .tutorial-right { padding: 40px 30px; }
            .tutorial-right h4 { font-size: 1.2rem; }
            .tutorial-right ol li { font-size: 1rem; }
        }
    </style>
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
                    <!-- Setup WiFi Button -->
                    <button id="openTutorialBtn" class="cloud-status" style="cursor: pointer; display: flex; align-items: center; gap: 8px;" title="Setup WiFi Perangkat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3" />
                        </svg>
                        <span>WiFi Setup</span>
                    </button>

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

    <!-- Tutorial Screen - Setup WiFi -->
    <div id="tutorialScreen" class="hidden"
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 10px; box-sizing: border-box; opacity: 0;">

        <div class="split-tutorial">
            <div class="tutorial-left">
                <h2>Panduan<br>Setup WiFi</h2>
                <p style="font-size: 1.1rem; line-height: 1.6; color: #64748B; margin-top: 10px;">
                    Ikuti instruksi di sebelah kanan untuk menghubungkan kipas ke internet.
                </p>

                <div class="important-box">
                    <h3>⚠️ Penting</h3>
                    <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.6;">
                        Pastikan Anda <b>tidak menutup atau me-refresh</b> halaman ini hingga proses konfigurasi pada perangkat selesai.
                    </p>
                </div>
            </div>

            <div class="tutorial-right">
                <button class="closeTutorialBtn desktop-close-btn"
                    style="position: absolute; top: 25px; right: 25px; background: #1E293B; border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);">
                    ✕
                </button>
                
                <h4>Instruksi Setup</h4>
                
                <ol>
                    <li>Buka <b>Pengaturan WiFi</b> di HP Anda.</li>
                    <li>Hubungkan ke WiFi <b>Setup_Kipas_Pintar</b>.</li>
                    <li>Setelah tersambung, kembali ke halaman ini.</li>
                    <li>Klik tombol di bawah ini untuk memulai:</li>
                </ol>

                <a href="http://192.168.4.1" target="_blank" class="setup-btn">
                    Buka Pengaturan Setup
                </a>

                <div style="margin-top: auto; padding-top: 30px; text-align: center;">
                    <p style="font-size: 0.85rem; color: #94A3B8;">Kipas akan otomatis restart setelah password disimpan.</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Gunakan URL Laravel asli untuk API Base
        window.API_BASE = "{{ url('api') }}";
        window.CSRF_TOKEN = "{{ csrf_token() }}";
        console.log("Debug: API_BASE is", window.API_BASE);
    </script>
    <script src="https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js"></script>
    <script type="module" src="{{ asset('js/app-v1.js') }}"></script>
</body>

</html>
