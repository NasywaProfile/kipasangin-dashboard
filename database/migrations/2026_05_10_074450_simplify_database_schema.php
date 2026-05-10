<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Hapus kolom di master_kipas
        Schema::table('master_kipas', function (Blueprint $table) {
            $table->dropColumn(['lokasi', 'kecepatan']);
        });

        // 2. Hapus kolom di error_log
        Schema::table('error_log', function (Blueprint $table) {
            $table->dropColumn('error_code');
        });

        // 3. Update nama kipas yang sudah ada
        DB::table('master_kipas')
            ->where('nama_kipas', 'Kipas Ruang Tengah')
            ->update(['nama_kipas' => 'Smart Fan']);
    }

    public function down(): void
    {
        Schema::table('master_kipas', function (Blueprint $table) {
            $table->string('lokasi', 150)->nullable();
            $table->unsignedTinyInteger('kecepatan')->default(0);
        });

        Schema::table('error_log', function (Blueprint $table) {
            $table->string('error_code', 30)->nullable();
        });
    }
};
