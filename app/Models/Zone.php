<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELACIONES
    // ═══════════════════════════════════════════════════════════

    /**
     * Relación con entregas (deliveries)
     */
    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope para obtener solo zonas activas
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope para obtener solo zonas inactivas
     */
    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }
}
