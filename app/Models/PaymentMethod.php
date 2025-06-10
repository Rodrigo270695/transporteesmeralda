<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

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
     * Puntos de entrega completados con este método de pago
     */
    public function completedDeliveryPoints()
    {
        return $this->deliveryPoints()->completed();
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 ACCESSORS PARA MÉTODOS DE PAGO
    // ═══════════════════════════════════════════════════════════

    /**
     * Get total delivery points using this payment method
     */
    public function getTotalUsageCountAttribute(): int
    {
        return $this->deliveryPoints()->count();
    }

    /**
     * Get total amount collected with this payment method
     */
    public function getTotalAmountCollectedAttribute(): float
    {
        return $this->deliveryPoints()->whereNotNull('amount_collected')->sum('amount_collected');
    }

    /**
     * Get average amount per transaction
     */
    public function getAverageAmountPerTransactionAttribute(): float
    {
        $count = $this->deliveryPoints()->whereNotNull('amount_collected')->count();

        if ($count === 0) {
            return 0;
        }

        return $this->total_amount_collected / $count;
    }

    /**
     * Get usage percentage compared to all payment methods
     */
    public function getUsagePercentageAttribute(): int
    {
        $totalDeliveryPoints = DeliveryPoint::whereNotNull('payment_method_id')->count();

        if ($totalDeliveryPoints === 0) {
            return 0;
        }

        return round(($this->total_usage_count / $totalDeliveryPoints) * 100);
    }

    /**
     * Check if payment method is popular (>10% usage)
     */
    public function getIsPopularAttribute(): bool
    {
        return $this->usage_percentage > 10;
    }
}
