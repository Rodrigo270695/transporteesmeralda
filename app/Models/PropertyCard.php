<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'mobility_id',
        'digital_document',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELACIONES
    // ═══════════════════════════════════════════════════════════

    /**
     * Relación con movilidad
     */
    public function mobility()
    {
        return $this->belongsTo(Mobility::class);
    }
}
