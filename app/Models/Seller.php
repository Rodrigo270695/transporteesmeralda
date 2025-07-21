<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seller extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'dni',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['full_name'];

    /**
     * Get the seller's full name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
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
     * Puntos de entrega pendientes del vendedor
     */
    public function pendingDeliveryPoints()
    {
        return $this->deliveryPoints()->pending();
    }

    /**
     * Puntos de entrega completados del vendedor
     */
    public function completedDeliveryPoints()
    {
        return $this->deliveryPoints()->completed();
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 ACCESSORS PARA VENDEDORES
    // ═══════════════════════════════════════════════════════════

    /**
     * Get total delivery points for this seller
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
     * Get total amount to collect by this seller
     */
    public function getTotalAmountToCollectAttribute(): float
    {
        return $this->deliveryPoints()->sum('amount_to_collect');
    }

    /**
     * Get total amount collected by this seller
     */
    public function getTotalAmountCollectedAttribute(): float
    {
        return $this->deliveryPoints()->whereNotNull('amount_collected')->sum('amount_collected');
    }

    /**
     * Get seller's performance percentage
     */
    public function getPerformancePercentageAttribute(): int
    {
        if ($this->total_delivery_points === 0) {
            return 0;
        }

        $completed = $this->completedDeliveryPoints()->count();
        return round(($completed / $this->total_delivery_points) * 100);
    }
}
