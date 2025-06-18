<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'delivery_date',
        'template_number',
        'zone_id',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELACIONES
    // ═══════════════════════════════════════════════════════════

    /**
     * Relación con zona
     */
    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * Relación con puntos de entrega
     */
    public function deliveryPoints()
    {
        return $this->hasMany(DeliveryPoint::class)->orderedByRoute();
    }

    /**
     * Puntos pendientes
     */
    public function pendingPoints()
    {
        return $this->hasMany(DeliveryPoint::class)->pending();
    }

    /**
     * Puntos completados
     */
    public function completedPoints()
    {
        return $this->hasMany(DeliveryPoint::class)->completed();
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get total points count
     */
    public function getTotalPointsAttribute(): int
    {
        return $this->deliveryPoints()->count();
    }

    /**
     * Get completed points count
     */
    public function getCompletedPointsCountAttribute(): int
    {
        return $this->completedPoints()->count();
    }

    /**
     * Get pending points count
     */
    public function getPendingPointsCountAttribute(): int
    {
        return $this->pendingPoints()->count();
    }

    /**
     * Get total amount to collect
     */
    public function getTotalAmountToCollectAttribute(): float
    {
        return $this->deliveryPoints()->sum('amount_to_collect');
    }

    /**
     * Get total amount collected
     */
    public function getTotalAmountCollectedAttribute(): float
    {
        return $this->deliveryPoints()->whereNotNull('amount_collected')->sum('amount_collected');
    }

    /**
     * Get delivery progress percentage
     */
    public function getProgressPercentageAttribute(): int
    {
        if ($this->total_points === 0) {
            return 0;
        }

        return round(($this->completed_points_count / $this->total_points) * 100);
    }

    /**
     * Check if delivery is completed
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->total_points > 0 && $this->pending_points_count === 0;
    }

    /**
     * Accessor temporal para status (siempre borrador para permitir crear puntos)
     */
    public function getStatusAttribute(): string
    {
        return 'borrador';
    }
}
