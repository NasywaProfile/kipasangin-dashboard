<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\MasterKipas;
use Illuminate\Database\Seeder;

class MasterKipasSeeder extends Seeder
{
    public function run(): void
    {
        $fan = MasterKipas::firstOrCreate(
            ['device_id' => 'FAN-001'],
            [
                'nama_kipas' => 'Kipas Ruang Tengah',
                'lokasi'     => 'Ruang Tengah Lt.1',
                'status'     => 'OFF',
                'suhu'       => 24.50,
                'kecepatan'  => 0,
                'ip_address' => '192.168.1.100',
            ]
        );

        // Tambah riwayat awal agar dashboard tidak kosong
        ActivityLog::create([
            'device_id'   => $fan->id,
            'action_type' => 'manual_off',
            'temperature' => 24.50,
            'keterangan'  => 'Sistem baru diinisialisasi (Laravel)',
        ]);
        
        ActivityLog::create([
            'device_id'   => $fan->id,
            'action_type' => 'threshold_change',
            'temperature' => 32.00,
            'keterangan'  => 'Threshold default diatur ke 32°C',
        ]);
    }
}
