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
        .welcome-container {
            padding: 20px;
            box-sizing: border-box;
        }

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

        @media screen and (max-width: 480px) {
            .auth-card {
                padding: 30px 20px;
                border-radius: 24px;
            }
            .auth-title {
                font-size: 26px;
            }
            .form-input {
                padding: 14px 16px;
                font-size: 14px;
            }
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
        </div>
    </div>
</body>
</html>
