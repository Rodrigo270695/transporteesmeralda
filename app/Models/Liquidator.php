<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Liquidator extends Model
{
    use HasFactory;

    protected $fillable = [
        'mobility_id',
        'first_name',
        'last_name',
        'dni',
        'phone',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación con movilidad
    public function mobility()
    {
        return $this->belongsTo(Mobility::class);
    }
}
