<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('master_kipas')->cascadeOnDelete();
            $table->string('action_type', 50)->comment('Jenis aksi: manual_on, manual_off, auto_on, auto_off, threshold_change');
            $table->decimal('temperature', 5, 2)->nullable()->comment('Suhu saat aktivitas terjadi (°C)');
            $table->text('keterangan')->nullable()->comment('Catatan tambahan');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_log');
    }
};
