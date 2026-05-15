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
        .split-tutorial {
            display: flex;
            width: 100%;
            height: 100%;
            background: #FFFFFF;
            border-radius: 40px;
            box-shadow: 0 25px 70px rgba(0,0,0,0.1);
            overflow: hidden;
            margin: auto;
            border: 1.5px solid #E2E8F0;
        }

        .tutorial-left {
            flex: 1.2;
            padding: 40px;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .tutorial-right {
            flex: 1;
            padding: 40px;
            background: #F9F9FB;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            color: #36312D;
            overflow-y: auto;
            position: relative;
            scrollbar-width: thin;
        }

        .d-none { display: none !important; }

        @media screen and (max-width: 900px) {
            .split-tutorial {
                flex-direction: column;
                height: auto;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 32px;
            }
            .tutorial-left, .tutorial-right { padding: 25px; }
            .mobile-close-btn { display: flex !important; }
            .desktop-close-btn { display: none !important; }
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
                <button id="openTutorialBtn"
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
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(250, 247, 242, 0.9); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 10px; box-sizing: border-box; opacity: 0;">

        <div class="split-tutorial">
            <!-- Left Side (Dark) -->
            <div class="tutorial-left">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="margin: 0; font-size: 1.8rem; font-weight: 700;">Panduan Setup WiFi</h2>
                    <button class="closeTutorialBtn mobile-close-btn d-none"
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; align-items: center; justify-content: center; font-size: 14px;">✕</button>
                </div>

                <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 25px; color: #cbd5e1;">
                    Smart Fan ini belum mengenali internet di sekitar Anda. Ikuti langkah di bawah ini untuk menghubungkannya.
                </p>

                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 18px; border-radius: 16px; margin-bottom: 20px;">
                    <h3 style="font-size: 1.1rem; margin-top: 0; margin-bottom: 8px; color: #fca5a5;">⚠️ SANGAT PENTING!</h3>
                    <p style="font-size: 0.9rem; margin: 0; line-height: 1.5; color: #f8fafc;">Saat memindahkan koneksi
                        WiFi di Perangkat Anda, <b>JANGAN MENUTUP ATAU ME-REFRESH HALAMAN WEB INI</b>. Biarkan halaman
                        ini tetap terjaga di layar/latar belakang.</p>
                </div>
            </div>

            <!-- Right Side (Light) -->
            <div class="tutorial-right">
                <button class="closeTutorialBtn desktop-close-btn"
                    style="position: absolute; top: 25px; right: 25px; background: white; border: 1px solid #e2e8f0; color: #64748B; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); transition: 0.2s; z-index: 10;">✕</button>
                <div style="margin-top: 10px;">
                    <h4 style="margin-bottom: 12px; color: #A67347; font-size: 1.1rem; font-weight: 700;">Langkah-langkah:</h4>
                    <ol style="font-size: 0.95rem; line-height: 1.7; padding-left: 20px; margin-bottom: 25px; color: #36312D; font-weight: 500;">
                        <li style="margin-bottom: 10px;">Buka <b>Pengaturan WiFi</b> di HP/Laptop.</li>
                        <li style="margin-bottom: 10px;">Hubungkan ke WiFi <b>Setup_Kipas_Pintar</b>.<br>
                            <i style="font-size: 0.8rem; color: #8B827A; font-weight: 400; line-height: 1.4; display: block; margin-top: 4px;">(Jika ada peringatan 'Tidak ada Internet', pilih opsi 'Tetap Terhubung').</i>
                        </li>
                        <li style="margin-bottom: 10px;">Setelah tersambung, <b>kembali buka halaman web ini</b>.</li>
                        <li style="margin-bottom: 10px;">Ketuk tombol merah di bawah ini:</li>
                    </ol>

                    <a href="http://192.168.4.1" target="_blank"
                        style="display: block; text-align: center; color: #fff; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 16px 20px; border-radius: 14px; text-decoration: none; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); margin-bottom: 25px;">
                        ⚙️ Buka Pengaturan Setup
                    </a>

                    <div style="border-top: 1px solid #EAE4DC; padding-top: 18px;">
                        <h4 style="margin-top: 0; margin-bottom: 8px; font-size: 0.95rem; color: #8B827A;">Apa yang terjadi selanjutnya?</h4>
                        <p style="font-size: 0.85rem; line-height: 1.6; color: #8B827A; margin: 0; font-weight: 400;">
                            Setelah menyimpan password, Kipas akan me-restart. Silakan tutup layar ini.<br><br>
                            Jika status masih <span style="background: rgba(239,68,68,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.3); font-size: 0.75rem; color: #ef4444; font-weight: 700;">Offline</span>,
                            ulangi proses ini. Jika berubah menjadi
                            <span style="background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.3); font-size: 0.75rem; color: #10b981; font-weight: 700;">Online</span>,
                            selamat! Kipas berhasil terhubung.
                        </p>
                    </div>
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
