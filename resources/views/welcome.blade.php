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
