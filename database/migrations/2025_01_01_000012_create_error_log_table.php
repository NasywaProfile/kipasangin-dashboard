<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('error_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('master_kipas')->cascadeOnDelete();
            $table->string('error_code', 30)->nullable()->comment('Kode error singkat');
            $table->text('error_msg')->comment('Pesan error lengkap');
            $table->enum('severity', ['INFO', 'WARNING', 'ERROR', 'CRITICAL'])->default('ERROR');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_log');
    }
};
