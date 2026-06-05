<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Panduan Setup WiFi Smart Fan — Langkah-langkah untuk menghubungkan perangkat ke jaringan internet.">
    <title>Smart Fan — Panduan Setup WiFi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <style>
        body {
            background-color: #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
        }

        .split-tutorial {
            display: flex;
            width: 100%;
            height: 100%;
            background: #FFFFFF;
            border-radius: 40px;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            border: 1.5px solid #E2E8F0;
            position: relative;
            animation: dashboardEnter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .tutorial-left {
            flex: 1;
            padding: 55px;
            background: #F1F5F9; /* Slate Light */
            color: #1E293B;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 1px solid #E2E8F0;
        }

        .tutorial-left h2 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.2;
            margin: 0 0 15px 0;
            letter-spacing: -1px;
        }

        .tutorial-left p {
            font-size: 1.05rem;
            line-height: 1.6;
            color: #64748B;
            margin: 0 0 35px 0;
        }

        .important-box {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            padding: 25px;
            border-radius: 24px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.02);
        }

        .important-box h3 {
            font-size: 0.95rem;
            color: #EF4444;
            margin: 0 0 8px 0;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .important-box p {
            margin: 0;
            color: #475569;
            font-size: 0.95rem;
            line-height: 1.6;
        }

        .tutorial-right {
            flex: 1.25;
            padding: 65px 55px;
            background: #FFFFFF;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            position: relative;
        }

        .tutorial-right h4 {
            color: #0F172A;
            text-align: center;
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0 0 45px 0;
            position: relative;
        }

        .tutorial-right h4::after {
            content: '';
            position: absolute;
            bottom: -12px;
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
            margin: 0 0 45px 0;
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
            box-shadow: 0 4px 10px rgba(30, 41, 59, 0.15);
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

        .close-btn {
            position: absolute;
            top: 25px;
            right: 25px;
            background: #1E293B;
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
            text-decoration: none;
            transition: all 0.3s ease;
            z-index: 100;
        }

        .close-btn:hover {
            background: #0F172A;
            transform: rotate(90deg) scale(1.1);
        }

        .footer-note {
            margin-top: auto;
            padding-top: 30px;
            text-align: center;
            font-size: 0.85rem;
            color: #94A3B8;
        }

        @keyframes dashboardEnter {
            from { opacity: 0; transform: scale(0.97) translateY(15px); filter: blur(5px); }
            to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @media screen and (max-width: 900px) {
            body { padding: 16px; overflow-y: auto; min-height: 100dvh; height: auto; }
            .split-tutorial { 
                flex-direction: column; 
                height: auto; 
                border-radius: 32px; 
                width: 100%;
                max-width: 600px;
                margin: auto;
            }
            .tutorial-left { padding: 35px 25px; border-right: none; border-bottom: 1px solid #E2E8F0; }
            .tutorial-left h2 { font-size: 1.8rem; }
            .tutorial-left p { margin-bottom: 20px; font-size: 0.95rem; }
            .tutorial-right { padding: 40px 25px; }
            .tutorial-right h4 { font-size: 1.25rem; margin-bottom: 30px; }
            .tutorial-right ol { margin-bottom: 30px; }
            .tutorial-right ol li { font-size: 0.95rem; margin-bottom: 15px; gap: 12px; }
            .tutorial-right ol li::before { width: 30px; height: 30px; border-radius: 8px; font-size: 0.8rem; }
            .close-btn { top: 15px; right: 15px; width: 36px; height: 36px; font-size: 14px; }
            .setup-btn { padding: 15px; font-size: 1rem; border-radius: 14px; }
            .footer-note { padding-top: 20px; }
        }
    </style>
</head>

<body>
    <div class="split-tutorial">
        <!-- Close Button (Redirects back to Dashboard) -->
        <a href="{{ route('dashboard') }}" class="close-btn" title="Kembali ke Dashboard">✕</a>

        <!-- Left Side: Header info -->
        <div class="tutorial-left">
            <h2>Panduan<br>Setup WiFi</h2>
            <p>
                Ikuti instruksi di sebelah kanan untuk menghubungkan kipas ke internet.
            </p>

            <div class="important-box">
                <h3>⚠️ Penting</h3>
                <p>
                    Pastikan Anda <b>tidak menutup atau me-refresh</b> halaman ini hingga proses konfigurasi pada perangkat selesai.
                </p>
            </div>
        </div>

        <!-- Right Side: Steps -->
        <div class="tutorial-right">
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

            <div class="footer-note">
                Kipas akan otomatis restart setelah password disimpan.
            </div>
        </div>
    </div>
</body>

</html>
