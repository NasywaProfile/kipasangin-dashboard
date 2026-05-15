<?php

use App\Models\ActivityLog;
use App\Models\ErrorLog;
use Illuminate\Support\Facades\DB;

try {
    $errors = DB::table('error_log')->get();
    echo "Found " . $errors->count() . " errors to migrate.\n";

    foreach ($errors as $error) {
        DB::table('activity_log')->insert([
            'device_id'   => $error->device_id,
            'action_type' => 'ERROR',
            'keterangan'  => $error->error_msg,
            'created_at'  => $error->created_at,
        ]);
    }

    echo "Migration complete.\n";
} catch (\Exception $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
}
