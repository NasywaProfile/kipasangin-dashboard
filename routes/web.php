<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Dashboard utama (tidak perlu login)
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
