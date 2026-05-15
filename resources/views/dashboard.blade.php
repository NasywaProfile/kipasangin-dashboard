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
        /* Premium & Styled Setup WiFi Guide */
        .split-tutorial {
            display: flex;
            width: 100%;
            height: 100%;
            background: #FFFFFF;
            border-radius: 40px;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            margin: auto;
            border: 1.5px solid #E2E8F0;
        }

        .tutorial-left {
            flex: 1;
            padding: 60px;
            background: linear-gradient(165deg, #f8fafc 0%, #f1f5f9 100%);
            color: #1E293B;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 1px solid #E2E8F0;
            position: relative;
        }

        /* Aksen Dekorasi agar tidak terlalu minimalis */
        .tutorial-left::after {
            content: '';
            position: absolute;
            bottom: -50px; left: -50px;
            width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(30, 41, 59, 0.03) 0%, transparent 70%);
            pointer-events: none;
        }

        .tutorial-left h2 {
            font-size: 2.2rem !important;
            font-weight: 800 !important;
            color: #1E293B;
            margin-bottom: 15px !important;
            letter-spacing: -1px;
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
            padding: 60px;
            background: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow-y: auto;
            scrollbar-width: thin;
        }

        /* Judul Instruksi di Tengah */
        .tutorial-right h4 {
            color: #1E293B;
            text-align: center;
            font-size: 1.2rem;
            font-weight: 800;
            margin-bottom: 40px;
            position: relative;
        }

        .tutorial-right h4::after {
            content: '';
            position: absolute;
            bottom: -10px; left: 50%;
            transform: translateX(-50%);
            width: 40px; height: 3px;
            background: #1E293B;
            border-radius: 10px;
        }

        /* Penomoran Bergaya (Badge) */
        .tutorial-right ol {
            counter-reset: setup-steps;
            list-style: none;
            padding: 0;
            margin-bottom: 40px;
        }

        .tutorial-right ol li {
            counter-increment: setup-steps;
            position: relative;
            padding-left: 55px;
            margin-bottom: 25px;
            color: #475569;
            font-weight: 600;
            font-size: 1.05rem;
            line-height: 1.5;
        }

        .tutorial-right ol li::before {
            content: counter(setup-steps);
            position: absolute;
            left: 0; top: -2px;
            width: 36px; height: 36px;
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
            transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            box-shadow: 0 15px 30px rgba(30, 41, 59, 0.2);
        }

        .setup-btn:hover {
            background: #0F172A !important;
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(30, 41, 59, 0.25);
        }

        .d-none { display: none !important; }

        @media screen and (max-width: 900px) {
            .split-tutorial { flex-direction: column; height: 100%; border-radius: 0; }
            .tutorial-left, .tutorial-right { padding: 40px 30px; flex: none; }
            .tutorial-left { border-right: none; border-bottom: 1px solid #E2E8F0; }
        }
    </style>
</head>

<body>
    <!-- Single Card Video Home Screen -->
    <div id="welcomeScreen" class="welcome-container">

        <!-- Background Image -->
        <img src="{{ asset('images/vidsunset.png') }}" class="welcome-video" alt="Living Room with Fan Landscape">

        <!-- Overlay Gradient for Readability -->
        <div class="video-overlay"></div>

        <!-- Typography / Content -->
        <div class="welcome-text">
            <h1>Smart Fan<br><span>Experience</span></h1>
            <p class="welcome-subtitle">Seamless comfort for your living space</p>
        </div>

        <!-- Elegant Glass Button -->
        <div class="start-btn-wrapper" style="flex-direction: column; align-items: center; gap: 0;">
            <button id="startBtn" class="glass-start-btn">
                <span>Start Experience</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </button>

            <!-- Setup WiFi Button -->
            <div style="margin-top: 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; width: 100%;">
                <button id="openTutorialBtnWelcome"
                    style="color: rgba(255,255,255,0.85); background: transparent; border: none; text-decoration: none; font-size: 0.9rem; font-weight: 400; cursor: pointer; padding: 5px; transition: color 0.3s; font-family: 'Outfit', sans-serif;">
                    Belum konfigurasi WiFi? <span style="text-decoration: underline;">Sambungkan dulu</span>
                </button>
            </div>
        </div>

    </div>

    <!-- Main Dashboard -->
    <div id="appContainer" class="app-container hidden">
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
                    <button id="backBtn" class="back-btn" aria-label="Go Back">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <div class="titles">
                        <h1>Smart Fan</h1>
                    </div>
                </div>

                <div id="cloudStatus" class="cloud-status">
                    <span class="cloud-dot"></span>
                    <span>Offline</span>
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
                <div id="openTutorialBtnDashboard" style="margin-top: 15px; text-align: center;">
                    <button class="open-tutorial-link" style="background:none; border:none; color:var(--text-muted); text-decoration:underline; font-size:12px; cursor:pointer;">
                        Butuh bantuan setup WiFi?
                    </button>
                </div>
            </div>
        </section>

        <div class="dashboard-content modern-light">
            <div class="dashboard-right">
                <div class="right-content-scroll">
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
                                    <div class="temp-badge">
                                        <span id="thresholdValue">32</span> <span class="unit">°C</span>
                                        <button id="applyThresholdBtn" class="apply-btn">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>
                                    </div>
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
                    
                    <div class="date-filter">
                        <input type="text" id="dateFilter" placeholder="Contoh: 15/05/2026" readonly>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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
    <div id="tutorialScreen" class="history-screen hidden" style="opacity: 0; z-index: 2100;">

        <div class="split-tutorial">
            <div class="tutorial-left">
                <h2>Panduan Setup WiFi</h2>
                <p style="font-size: 1.1rem; line-height: 1.6; color: #64748B;">
                    Hubungkan Kipas Pintar ke jaringan internet Anda untuk kontrol jarak jauh yang lancar.
                </p>

                <div class="important-box">
                    <h3>⚠️ Penting</h3>
                    <p style="color: #475569; margin: 0; font-size: 0.95rem;">
                        Saat memproses koneksi WiFi, <b>mohon jangan menutup</b> layar ini agar konfigurasi tersimpan dengan benar.
                    </p>
                </div>
            </div>

            <div class="tutorial-right">
                <button class="closeTutorialBtn desktop-close-btn"
                    style="position: absolute; top: 25px; right: 25px; background: #F1F5F9; border: none; color: #64748B; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">✕</button>
                
                <h4>Instruksi Setup</h4>
                <ol>
                    <li>Buka Pengaturan WiFi di HP Anda.</li>
                    <li>Hubungkan ke WiFi <b>Setup_Kipas_Pintar</b>.</li>
                    <li>Kembali ke halaman dashboard ini.</li>
                    <li>Klik tombol di bawah untuk konfigurasi:</li>
                </ol>

                <a href="http://192.168.4.1" target="_blank" class="setup-btn">
                    Buka Pengaturan Setup
                </a>

                <p style="margin-top: 35px; font-size: 0.85rem; color: #94A3B8; text-align: center;">
                    *Kipas akan restart otomatis setelah password disimpan.
                </p>
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
