<?php
// Fix for Vercel read-only filesystem
$paths = [
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/framework/testing',
    'storage/logs',
    'bootstrap/cache'
];
foreach ($paths as $path) {
    if (!is_dir("/tmp/{$path}")) {
        mkdir("/tmp/{$path}", 0755, true);
    }
}
// Additional fix for the root storage path in tmp
if (!is_dir("/tmp/storage/framework/views")) {
    mkdir("/tmp/storage/framework/cache", 0755, true);
    mkdir("/tmp/storage/framework/sessions", 0755, true);
    mkdir("/tmp/storage/framework/views", 0755, true);
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
$app = require_once __DIR__.'/../bootstrap/app.php';

// Rebind paths for Vercel
$app->useStoragePath('/tmp/storage');

$app->handleRequest(Illuminate\Http\Request::capture());
