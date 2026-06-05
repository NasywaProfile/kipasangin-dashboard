<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Smart Fan IoT — Seamless comfort for your living space.">
    <title>Smart Fan — Welcome</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <style>
        /* CSS tambahan agar visual tutorial rapi di landing page */
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
        <div class="start-btn-wrapper">
            <a href="{{ Auth::check() ? route('dashboard') : route('login') }}" class="glass-start-btn" style="text-decoration: none;">
                <span>Start Experience</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </a>
        </div>

    </div>
</body>
</html>
