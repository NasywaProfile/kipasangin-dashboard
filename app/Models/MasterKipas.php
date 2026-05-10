<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterKipas extends Model
{
    protected $table = 'master_kipas';

    protected $fillable = [
        'device_id',
        'nama_kipas',
        'lokasi',
        'status',
        'suhu',
        'kecepatan',
        'ip_address',
    ];

    protected $casts = [
        'suhu'      => 'decimal:2',
        'kecepatan' => 'integer',
    ];

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'device_id');
    }

    public function errorLogs(): HasMany
    {
        return $this->hasMany(ErrorLog::class, 'device_id');
    }
}
