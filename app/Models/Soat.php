<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Soat extends Model
{
    use HasFactory;

    protected $fillable = [
        'mobility_id',
        'start_date',
        'end_date',
        'digital_document',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación con movilidad
    public function mobility()
    {
        return $this->belongsTo(Mobility::class);
    }
}
