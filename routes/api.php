<?php

use App\Http\Controllers\FanApiController;
use Illuminate\Support\Facades\Route;

// ── Master Kipas ─────────────────────────────────────────────
Route::get('/master-kipas',       [FanApiController::class, 'indexDevices']);
Route::post('/master-kipas',      [FanApiController::class, 'storeDevice']);
Route::put('/master-kipas/{id}',  [FanApiController::class, 'updateDevice']);

// ── Activity Log ─────────────────────────────────────────────
Route::get('/activity-log',       [FanApiController::class, 'indexActivity']);
Route::post('/activity-log',      [FanApiController::class, 'storeActivity']);

// ── Error Log ────────────────────────────────────────────────
Route::get('/error-log',          [FanApiController::class, 'indexErrors']);
Route::post('/error-log',         [FanApiController::class, 'storeError']);
