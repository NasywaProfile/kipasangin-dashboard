<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_log';

    public $timestamps = false; // Hanya pakai created_at

    protected $fillable = [
        'device_id',
        'action_type',
        'temperature',
        'keterangan',
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
        'created_at'  => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(MasterKipas::class, 'device_id');
    }
}
