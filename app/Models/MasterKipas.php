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
        'status',
        'suhu',
        'ip_address',
    ];

    protected $casts = [
        'suhu' => 'decimal:2',
    ];

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'device_id');
    }
}
