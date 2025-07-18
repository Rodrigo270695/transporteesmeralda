<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'user_id',
        'delivery_point_id',
        'delivery_point_name',
        'data',
        'read_at',
        'is_read',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Tipos de notificaciones disponibles
    const TYPE_STATUS_CHANGE = 'status_change';
    const TYPE_PROXIMITY = 'proximity';
    const TYPE_DELIVERY = 'delivery';
    const TYPE_DELIVERY_RATING = 'delivery_rating';
    const TYPE_RESCHEDULE = 'reschedule';
    const TYPE_PAYMENT = 'payment';
    const TYPE_SYSTEM = 'system';

    /**
     * Relación con el usuario que recibe la notificación
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el punto de entrega
     */
    public function deliveryPoint(): BelongsTo
    {
        return $this->belongsTo(DeliveryPoint::class);
    }

    /**
     * Marcar la notificación como leída
     */
    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Scope para obtener notificaciones no leídas
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope para filtrar por tipo
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope para obtener notificaciones de un usuario específico
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Crear una notificación de cambio de estado
     */
    public static function createStatusChangeNotification(
        DeliveryPoint $deliveryPoint,
        string $oldStatus,
        string $newStatus
    ): self {
        $statusMessages = [
            'pendiente' => 'Tu envío está pendiente de recogida',
            'en_ruta' => 'Tu envío está en camino',
            'entregado' => 'Tu envío ha sido entregado exitosamente',
            'cancelado' => 'Tu envío ha sido cancelado',
            'reagendado' => 'Tu envío ha sido reagendado',
        ];

        $statusEmojis = [
            'pendiente' => '⏳',
            'en_ruta' => '🚛',
            'entregado' => '✅',
            'cancelado' => '❌',
            'reagendado' => '📅',
        ];

        $title = ($statusEmojis[$newStatus] ?? '📦') . ' Cambio de Estado';
        $message = $statusMessages[$newStatus] ?? 'El estado de tu envío ha cambiado';

        return self::create([
            'type' => self::TYPE_STATUS_CHANGE,
            'title' => $title,
            'message' => $message,
            'user_id' => $deliveryPoint->client_user_id,
            'delivery_point_id' => $deliveryPoint->id,
            'delivery_point_name' => $deliveryPoint->point_name,
            'data' => [
                'point_name' => $deliveryPoint->point_name,
                'address' => $deliveryPoint->address,
                'previous_status' => $oldStatus,
                'new_status' => $newStatus,
                'conductor_name' => $deliveryPoint->mobility->conductor ?
                    $deliveryPoint->mobility->conductor->first_name . ' ' . $deliveryPoint->mobility->conductor->last_name : null,
                'vehicle_info' => $deliveryPoint->mobility->name . ' - ' . $deliveryPoint->mobility->plate,
                'timestamp' => now()->toISOString(),
            ],
        ]);
    }

    /**
     * Crear una notificación de proximidad
     */
    public static function createProximityNotification(
        DeliveryPoint $deliveryPoint,
        int $estimatedMinutes = 5
    ): self {
        $conductorName = $deliveryPoint->mobility->conductor ?
            $deliveryPoint->mobility->conductor->first_name . ' ' . $deliveryPoint->mobility->conductor->last_name :
            'El conductor';

        return self::create([
            'type' => self::TYPE_PROXIMITY,
            'title' => '📍 Conductor cerca',
            'message' => "{$conductorName} está a {$estimatedMinutes} minutos de tu ubicación. Por favor prepárate para recibir tu envío.",
            'user_id' => $deliveryPoint->client_user_id,
            'delivery_point_id' => $deliveryPoint->id,
            'delivery_point_name' => $deliveryPoint->point_name,
            'data' => [
                'estimated_minutes' => $estimatedMinutes,
                'conductor_phone' => $deliveryPoint->mobility->conductor->phone ?? null,
            ],
        ]);
    }

    /**
     * Crear una notificación de entrega completada
     */
    public static function createDeliveryNotification(DeliveryPoint $deliveryPoint): self
    {
        return self::create([
            'type' => self::TYPE_DELIVERY,
            'title' => '✅ Entrega completada',
            'message' => "Tu envío \"{$deliveryPoint->point_name}\" ha sido entregado exitosamente. ¡Califica nuestro servicio!",
            'user_id' => $deliveryPoint->client_user_id,
            'delivery_point_id' => $deliveryPoint->id,
            'delivery_point_name' => $deliveryPoint->point_name,
            'data' => [
                'delivered_at' => $deliveryPoint->delivered_at,
                'amount_collected' => $deliveryPoint->amount_collected,
                'payment_method' => $deliveryPoint->paymentMethod->name ?? null,
            ],
        ]);
    }

    /**
     * Crear una notificación de calificación de servicio
     */
    public static function createRatingNotification(DeliveryPoint $deliveryPoint): self
    {
        return self::create([
            'type' => self::TYPE_DELIVERY_RATING,
            'title' => '⭐ Califica tu Servicio',
            'message' => 'Tu envío ha sido entregado. ¡Ayúdanos calificando el servicio!',
            'user_id' => $deliveryPoint->client_user_id,
            'delivery_point_id' => $deliveryPoint->id,
            'delivery_point_name' => $deliveryPoint->point_name,
            'data' => [
                'point_name' => $deliveryPoint->point_name,
                'address' => $deliveryPoint->address,
                'delivered_at' => $deliveryPoint->delivered_at->toISOString(),
                'conductor_name' => $deliveryPoint->mobility->conductor ?
                    $deliveryPoint->mobility->conductor->first_name . ' ' . $deliveryPoint->mobility->conductor->last_name : null,
                'vehicle_info' => $deliveryPoint->mobility->name . ' - ' . $deliveryPoint->mobility->plate,
                'can_rate' => true,
            ],
        ]);
    }

    /**
     * Crear una notificación de reagendamiento
     */
    public static function createRescheduleNotification(
        DeliveryPoint $deliveryPoint,
        string $newDate,
        string $reason = null
    ): self {
        $message = "Tu envío \"{$deliveryPoint->point_name}\" ha sido reprogramado para {$newDate}.";
        if ($reason) {
            $message .= " Motivo: {$reason}";
        }

        return self::create([
            'type' => self::TYPE_RESCHEDULE,
            'title' => '📅 Envío reagendado',
            'message' => $message,
            'user_id' => $deliveryPoint->client_user_id,
            'delivery_point_id' => $deliveryPoint->id,
            'delivery_point_name' => $deliveryPoint->point_name,
            'data' => [
                'new_date' => $newDate,
                'reason' => $reason,
            ],
        ]);
    }

    /**
     * Crear una notificación de pago
     */
    public static function createPaymentNotification(
        DeliveryPoint $deliveryPoint,
        float $amount,
        string $type = 'pending'
    ): self {
        $titles = [
            'pending' => '💰 Pago pendiente',
            'received' => '✅ Pago recibido',
        ];

        $messages = [
            'pending' => "Tienes un pago pendiente de S/ {$amount} para el envío \"{$deliveryPoint->point_name}\". El conductor cobrará al momento de la entrega.",
            'received' => "Pago de S/ {$amount} recibido por el envío \"{$deliveryPoint->point_name}\". ¡Gracias!",
        ];

        return self::create([
            'type' => self::TYPE_PAYMENT,
            'title' => $titles[$type] ?? '💰 Información de pago',
            'message' => $messages[$type] ?? "Información sobre el pago de tu envío.",
            'user_id' => $deliveryPoint->client_user_id,
            'delivery_point_id' => $deliveryPoint->id,
            'delivery_point_name' => $deliveryPoint->point_name,
            'data' => [
                'amount' => $amount,
                'payment_type' => $type,
                'payment_method' => $deliveryPoint->paymentMethod->name ?? null,
            ],
        ]);
    }
}
