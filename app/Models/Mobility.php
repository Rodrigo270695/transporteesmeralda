<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mobility extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'plate',
        'conductor_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación con el conductor (Usuario)
    public function conductor()
    {
        return $this->belongsTo(User::class, 'conductor_user_id');
    }

    // Relación con liquidador
    public function liquidator()
    {
        return $this->hasOne(Liquidator::class);
    }

    // Relación con SOAT
    public function soat()
    {
        return $this->hasOne(Soat::class);
    }

    // Relación con revisión técnica
    public function technicalReview()
    {
        return $this->hasOne(TechnicalReview::class);
    }

    // Relación con permisos
    public function permit()
    {
        return $this->hasOne(Permit::class);
    }

    // Relación con extintor
    public function fireExtinguisher()
    {
        return $this->hasOne(FireExtinguisher::class);
    }

    // Relación con tarjeta de propiedad
    public function propertyCard()
    {
        return $this->hasOne(PropertyCard::class);
    }

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELACIONES ENTREGA - DELIVERY POINTS
    // ═══════════════════════════════════════════════════════════

    /**
     * Relación con puntos de entrega
     */
    public function deliveryPoints()
    {
        return $this->hasMany(DeliveryPoint::class);
    }

    /**
     * Puntos de entrega pendientes de esta movilidad
     */
    public function pendingDeliveryPoints()
    {
        return $this->deliveryPoints()->pending();
    }

    /**
     * Puntos de entrega completados de esta movilidad
     */
    public function completedDeliveryPoints()
    {
        return $this->deliveryPoints()->completed();
    }

    /**
     * Puntos de entrega en ruta de esta movilidad
     */
    public function activeDeliveryPoints()
    {
        return $this->deliveryPoints()->byStatus('en_ruta');
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 ACCESSORS PARA MOVILIDAD
    // ═══════════════════════════════════════════════════════════

    /**
     * Get total delivery points assigned to this mobility
     */
    public function getTotalDeliveryPointsAttribute(): int
    {
        return $this->deliveryPoints()->count();
    }

    /**
     * Get pending delivery points count
     */
    public function getPendingDeliveryPointsCountAttribute(): int
    {
        return $this->pendingDeliveryPoints()->count();
    }

    /**
     * Get active delivery points count (en ruta)
     */
    public function getActiveDeliveryPointsCountAttribute(): int
    {
        return $this->activeDeliveryPoints()->count();
    }

    /**
     * Get total amount to collect by this mobility
     */
    public function getTotalAmountToCollectAttribute(): float
    {
        return $this->deliveryPoints()->sum('amount_to_collect');
    }

    /**
     * Get total amount collected by this mobility
     */
    public function getTotalAmountCollectedAttribute(): float
    {
        return $this->deliveryPoints()->whereNotNull('amount_collected')->sum('amount_collected');
    }

    /**
     * Check if mobility is currently active (has points en_ruta)
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->active_delivery_points_count > 0;
    }

    /**
     * Get mobility efficiency percentage
     */
    public function getEfficiencyPercentageAttribute(): int
    {
        if ($this->total_delivery_points === 0) {
            return 0;
        }

        $completed = $this->completedDeliveryPoints()->count();
        return round(($completed / $this->total_delivery_points) * 100);
    }

    /**
     * Get conductor's full name
     */
    public function getConductorFullNameAttribute(): string
    {
        return $this->conductor ? $this->conductor->full_name : 'Sin conductor';
    }
}
