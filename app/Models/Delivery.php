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
        'status',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // 📋 CONSTANTES DE ESTADO
    // ═══════════════════════════════════════════════════════════

    const STATUS_PROGRAMADA = 'programada';
    const STATUS_EN_PROGRESO = 'en_progreso';
    const STATUS_COMPLETADA = 'completada';
    const STATUS_CANCELADA = 'cancelada';

    const STATUSES = [
        self::STATUS_PROGRAMADA => 'Programada',
        self::STATUS_EN_PROGRESO => 'En Progreso',
        self::STATUS_COMPLETADA => 'Completada',
        self::STATUS_CANCELADA => 'Cancelada',
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
     * Get formatted status
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? 'Desconocido';
    }

    /**
     * Get status color class
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PROGRAMADA => 'bg-blue-100 text-blue-800',
            self::STATUS_EN_PROGRESO => 'bg-yellow-100 text-yellow-800',
            self::STATUS_COMPLETADA => 'bg-green-100 text-green-800',
            self::STATUS_CANCELADA => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 MÉTODOS DE ESTADO
    // ═══════════════════════════════════════════════════════════

    /**
     * Verificar si se puede editar la entrega
     */
    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_PROGRAMADA, self::STATUS_EN_PROGRESO]);
    }

    /**
     * Verificar si se puede iniciar la entrega
     */
    public function canBeStarted(): bool
    {
        return $this->status === self::STATUS_PROGRAMADA && $this->total_points > 0;
    }

    /**
     * Verificar si se puede eliminar la entrega
     */
    public function canBeDeleted(): bool
    {
        return $this->status === self::STATUS_PROGRAMADA;
    }

    /**
     * Verificar si se puede completar automáticamente
     */
    public function canBeCompleted(): bool
    {
        return $this->status === self::STATUS_EN_PROGRESO && $this->pending_points_count === 0;
    }

    /**
     * Iniciar entrega
     */
    public function start(): bool
    {
        if (!$this->canBeStarted()) {
            return false;
        }

        return $this->update(['status' => self::STATUS_EN_PROGRESO]);
    }

    /**
     * Completar entrega automáticamente
     */
    public function complete(): bool
    {
        if (!$this->canBeCompleted()) {
            return false;
        }

        return $this->update(['status' => self::STATUS_COMPLETADA]);
    }

    /**
     * Cancelar entrega
     */
    public function cancel(): bool
    {
        if ($this->status === self::STATUS_COMPLETADA) {
            return false;
        }

        return $this->update(['status' => self::STATUS_CANCELADA]);
    }

    /**
     * Verificar y actualizar estado automáticamente
     */
    public function updateStatusIfNeeded(): void
    {
        // Si está en progreso y todos los puntos están completados, marcar como completada
        if ($this->canBeCompleted()) {
            $this->complete();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 🔍 SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope para entregas activas (programadas o en progreso)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_PROGRAMADA, self::STATUS_EN_PROGRESO]);
    }

    /**
     * Scope para entregas completadas
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETADA);
    }

    /**
     * Scope para entregas programadas
     */
    public function scopeProgrammed($query)
    {
        return $query->where('status', self::STATUS_PROGRAMADA);
    }
}
