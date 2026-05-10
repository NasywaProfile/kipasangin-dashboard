<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_kipas', function (Blueprint $table) {
            $table->id();
            $table->string('device_id', 50)->unique()->comment('ID unik perangkat, misal: FAN-001');
            $table->string('nama_kipas', 100)->comment('Nama tampilan perangkat');
            $table->string('lokasi', 150)->nullable()->comment('Lokasi pemasangan');
            $table->enum('status', ['ON', 'OFF', 'AUTO'])->default('OFF')->comment('Status terakhir perangkat');
            $table->decimal('suhu', 5, 2)->nullable()->comment('Suhu terakhir terbaca (°C)');
            $table->unsignedTinyInteger('kecepatan')->default(0)->comment('Kecepatan kipas 0-100%');
            $table->string('ip_address', 45)->nullable()->comment('IP address ESP32');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_kipas');
    }
};
