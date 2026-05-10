<?php

namespace Database\Seeders;

use App\Models\MasterKipas;
use Illuminate\Database\Seeder;

class MasterKipasSeeder extends Seeder
{
    public function run(): void
    {
        MasterKipas::firstOrCreate(
            ['device_id' => 'FAN-001'],
            [
                'nama_kipas' => 'Kipas Ruang Tengah',
                'lokasi'     => 'Ruang Tengah Lt.1',
                'status'     => 'OFF',
                'suhu'       => 0.00,
                'kecepatan'  => 0,
                'ip_address' => '192.168.1.100',
            ]
        );
    }
}
