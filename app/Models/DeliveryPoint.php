<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        // Identificación
        'delivery_id',
        'route_order',

        // Información del punto (ADMIN)
        'point_name',
        'address',
        'latitude',
        'longitude',
        'reference',

        // Información comercial (ADMIN)
        'client_user_id',
        'seller_id',
        'mobility_id',
        'amount_to_collect',

        // Control y planificación (ADMIN)
        'priority',
        'estimated_delivery_time',
        'delivery_instructions',
        'status',

        // Información de pago (CONDUCTOR)
        'payment_method_id',
        'amount_collected',
        'payment_image',
        'payment_reference',
        'payment_notes',

        // Información de entrega (CONDUCTOR)
        'delivery_image',
        'observation',
        'cancellation_reason',
        'customer_rating',

        // Control de tiempos (SISTEMA/CONDUCTOR)
        'arrival_time',
        'departure_time',
        'delivered_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'amount_to_collect' => 'decimal:2',
        'amount_collected' => 'decimal:2',
        'customer_rating' => 'integer',
        'route_order' => 'integer',
        'estimated_delivery_time' => 'datetime:H:i',
        'arrival_time' => 'datetime',
        'departure_time' => 'datetime',
        'delivered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELACIONES
    // ═══════════════════════════════════════════════════════════

    /**
     * Relación con entrega
     */
    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    /**
     * Relación con cliente
     */
    public function client()
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    /**
     * Relación con vendedor
     */
    public function seller()
    {
        return $this->belongsTo(Seller::class);
    }

    /**
     * Relación con movilidad
     */
    public function mobility()
    {
        return $this->belongsTo(Mobility::class);
    }

    /**
     * Relación con forma de pago
     */
    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 ACCESSORS & MUTATORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get the client's full name
     */
    public function getClientFullNameAttribute(): string
    {
        return $this->client ? "{$this->client->first_name} {$this->client->last_name}" : '';
    }

    /**
     * Get the seller's full name
     */
    public function getSellerFullNameAttribute(): string
    {
        return $this->seller ? $this->seller->full_name : '';
    }

    /**
     * Get the status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pendiente' => 'bg-yellow-100 text-yellow-800',
            'en_ruta' => 'bg-blue-100 text-blue-800',
            'entregado' => 'bg-green-100 text-green-800',
            'cancelado' => 'bg-red-100 text-red-800',
            'reagendado' => 'bg-purple-100 text-purple-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Get the priority badge color
     */
    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            'alta' => 'bg-red-100 text-red-800',
            'media' => 'bg-yellow-100 text-yellow-800',
            'baja' => 'bg-green-100 text-green-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Check if point is completed
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'entregado';
    }

    /**
     * Check if point can be edited
     */
    public function getCanEditAttribute(): bool
    {
        return in_array($this->status, ['pendiente', 'reagendado']);
    }

    /**
     * Get delivery time difference
     */
    public function getDeliveryTimeDifferenceAttribute(): ?int
    {
        if (!$this->delivered_at || !$this->arrival_time) {
            return null;
        }

        return $this->delivered_at->diffInMinutes($this->arrival_time);
    }

    // ═══════════════════════════════════════════════════════════
    // 🔔 EVENTOS DEL MODELO
    // ═══════════════════════════════════════════════════════════

    /**
     * Boot del modelo para eventos
     */
    protected static function boot()
    {
        parent::boot();

        // Cuando se actualiza un punto de entrega
        static::updated(function ($deliveryPoint) {
            // Si cambió el estado, verificar si la entrega debe cambiar de estado
            if ($deliveryPoint->isDirty('status')) {
                $deliveryPoint->delivery->updateStatusIfNeeded();
            }
        });

        // Cuando se crea un punto de entrega
        static::created(function ($deliveryPoint) {
            $deliveryPoint->delivery->updateStatusIfNeeded();
        });

        // Cuando se elimina un punto de entrega
        static::deleted(function ($deliveryPoint) {
            $deliveryPoint->delivery->updateStatusIfNeeded();
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 🔍 SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope para puntos por estado
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope para puntos de una entrega ordenados por ruta
     */
    public function scopeOrderedByRoute($query)
    {
        return $query->orderBy('route_order')->orderBy('created_at');
    }

    /**
     * Scope para puntos pendientes
     */
    public function scopePending($query)
    {
        return $query->whereIn('status', ['pendiente', 'reagendado']);
    }

    /**
     * Scope para puntos completados
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'entregado');
    }

    /**
     * Scope para incluir todas las relaciones
     */
    public function scopeWithAllRelations($query)
    {
        return $query->with(['client', 'seller', 'mobility', 'paymentMethod']);
    }
}
