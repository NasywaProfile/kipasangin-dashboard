<?php
// Fix for Vercel read-only filesystem
$paths = [
    'storage/framework/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs'
];
foreach ($paths as $path) {
    if (!is_dir("/tmp/{$path}")) {
        mkdir("/tmp/{$path}", 0755, true);
    }
}

require __DIR__ . '/../public/index.php';
