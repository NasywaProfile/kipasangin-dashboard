<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorLog extends Model
{
    protected $table = 'error_log';

    public $timestamps = false; // Hanya pakai created_at

    protected $fillable = [
        'device_id',
        'error_code',
        'error_msg',
        'severity',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(MasterKipas::class, 'device_id');
    }
}
