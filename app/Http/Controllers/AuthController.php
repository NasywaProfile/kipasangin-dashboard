<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if ($request->username === 'smartfan' && $request->password === '123') {
            // Find or create the user in the database to allow standard Auth session behavior
            $user = User::firstOrCreate(
                ['username' => 'smartfan'],
                ['password' => Hash::make('123')]
            );

            // In case the password has been modified or needs sync
            if (!Hash::check('123', $user->password)) {
                $user->password = Hash::make('123');
                $user->save();
            }

            Auth::login($user);
            $request->session()->regenerate();
            return redirect()->route('dashboard');
        }

        throw ValidationException::withMessages([
            'username' => __('Username atau password salah.'),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('home');
    }
}
