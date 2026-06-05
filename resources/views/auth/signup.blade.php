<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Fan — Daftar</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <style>
        .auth-card {
            background: rgba(255, 255, 255, 0.07);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 32px;
            padding: 45px 35px;
            width: 100%;
            max-width: 420px;
            color: white;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
            z-index: 10;
            text-align: center;
            animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .auth-title {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -1px;
            line-height: 1.2;
        }

        .auth-title span {
            background: linear-gradient(135deg, #A67347 0%, #D4A373 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .auth-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.60);
            margin-bottom: 35px;
            font-weight: 400;
        }

        .form-group {
            text-align: left;
            margin-bottom: 20px;
            position: relative;
        }

        .form-label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
            display: block;
            padding-left: 4px;
        }

        .form-input {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 16px 20px;
            color: white;
            width: 100%;
            font-size: 15px;
            font-weight: 500;
            outline: none;
            transition: all 0.3s;
            font-family: 'Outfit', sans-serif;
        }

        .form-input:focus {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.12);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
        }

        .auth-btn {
            background: #FFFFFF;
            color: #1E293B;
            font-weight: 700;
            width: 100%;
            border: none;
            padding: 16px;
            border-radius: 100px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 16px;
            margin-top: 15px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            font-family: 'Outfit', sans-serif;
        }

        .auth-btn:hover {
            transform: translateY(-3px) scale(1.02);
            background: #F8FAFC;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .auth-link {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            margin-top: 25px;
            display: inline-block;
            transition: color 0.3s;
            font-weight: 500;
        }

        .auth-link:hover {
            color: white;
            text-decoration: underline;
        }

        .error-message {
            color: #FF5D5D;
            font-size: 13px;
            font-weight: 600;
            margin-top: 6px;
            padding-left: 4px;
        }

        /* CSS modal setup WiFi */
        .split-tutorial {
            display: flex;
            width: 100%;
            max-width: 900px;
            height: auto;
            max-height: 90vh;
            background: #FFFFFF;
            border-radius: 40px;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            margin: auto;
            border: 1.5px solid #E2E8F0;
        }
        .tutorial-left {
            flex: 1;
            padding: 50px;
            background: #F1F5F9;
            color: #1E293B;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 1px solid #E2E8F0;
        }
        .tutorial-left h2 {
            font-size: 2.2rem;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.2;
            margin-bottom: 15px;
        }
        .important-box {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            padding: 20px;
            border-radius: 20px;
            margin-top: 25px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.02);
        }
        .important-box h3 {
            font-size: 0.9rem;
            color: #EF4444;
            margin-bottom: 6px;
            font-weight: 800;
            text-transform: uppercase;
        }
        .tutorial-right {
            flex: 1.2;
            padding: 50px;
            background: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow-y: auto;
            position: relative;
        }
        .tutorial-right h4 {
            color: #0F172A;
            text-align: center;
            font-size: 1.4rem;
            font-weight: 800;
            margin-bottom: 30px;
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
        .tutorial-right ol {
            counter-reset: my-counter;
            list-style: none;
            padding: 0;
            margin-bottom: 30px;
        }
        .tutorial-right ol li {
            counter-increment: my-counter;
            margin-bottom: 20px;
            color: #475569;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 1rem;
        }
        .tutorial-right ol li::before {
            content: counter(my-counter);
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            background: #1E293B;
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.85rem;
        }
        .setup-btn {
            display: block;
            text-align: center;
            color: #fff !important;
            background: #1E293B;
            padding: 16px;
            border-radius: 16px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1rem;
            transition: all 0.3s;
        }
        .setup-btn:hover {
            background: #0F172A;
            transform: translateY(-2px);
        }
        @media screen and (max-width: 900px) {
            .split-tutorial { flex-direction: column; height: 95vh; border-radius: 24px; }
            .tutorial-left { padding: 30px 20px; border-right: none; border-bottom: 1px solid #E2E8F0; }
            .tutorial-right { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        <!-- Background Image -->
        <img src="{{ asset('images/vidsunset.png') }}" class="welcome-video" alt="Living Room with Fan Landscape">

        <!-- Overlay Gradient -->
        <div class="video-overlay"></div>

        <!-- Glassmorphism Card -->
        <div class="auth-card">
            <h2 class="auth-title">Daftar <span>Smarfan</span></h2>
            <p class="auth-subtitle">Buat akun untuk mengontrol perangkat Smart Fan Anda</p>

            <form action="{{ url('/signup') }}" method="POST">
                @csrf

                <div class="form-group">
                    <label class="form-label" for="username">Username</label>
                    <input type="text" name="username" id="username" class="form-input" placeholder="Buat username unik" value="{{ old('username') }}" required autofocus>
                    @error('username')
                        <div class="error-message">{{ $message }}</div>
                    @enderror
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">Password</label>
                    <input type="password" name="password" id="password" class="form-input" placeholder="Buat password minimal 4 karakter" required>
                    @error('password')
                        <div class="error-message">{{ $message }}</div>
                    @enderror
                </div>

                <button type="submit" class="auth-btn">Daftar Sekarang</button>
            </form>

            <a href="{{ url('/login') }}" class="auth-link">Sudah punya akun? Masuk di sini</a>
            <br/>
            <!-- Setup WiFi Trigger -->
            <button id="openTutorialBtn" style="background: transparent; border: none; outline: none; margin-top: 10px; font-size: 12px; opacity: 0.8; color: rgba(255,255,255,0.7); text-decoration: underline; cursor: pointer; font-family: 'Outfit', sans-serif;">
                Hubungkan alat ke WiFi
            </button>
        </div>
    </div>

    <!-- Tutorial Screen - Setup WiFi Modal -->
    <div id="tutorialScreen" class="hidden"
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 5000; padding: 10px; box-sizing: border-box; opacity: 0;">

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
                <button class="closeTutorialBtn"
                    style="position: absolute; top: 25px; right: 25px; background: #1E293B; border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2); transition: 0.3s;">
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
        const openTutorialBtn = document.getElementById('openTutorialBtn');
        const tutorialScreen = document.getElementById('tutorialScreen');
        const closeTutorialBtns = document.querySelectorAll('.closeTutorialBtn');

        if (openTutorialBtn && tutorialScreen) {
            openTutorialBtn.addEventListener('click', (e) => {
                e.preventDefault();
                tutorialScreen.classList.remove('hidden');
                tutorialScreen.style.animation = 'dashboardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';
            });
        }

        closeTutorialBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (tutorialScreen) {
                    tutorialScreen.style.animation = 'dashboardExit 0.5s ease forwards';
                    setTimeout(() => {
                        tutorialScreen.classList.add('hidden');
                    }, 500);
                }
            });
        });
    </script>
</body>
</html>
