<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryPointResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'delivery_id' => $this->delivery_id,

            // Información del punto
            'point_name' => $this->point_name,
            'address' => $this->address,
            'coordinates' => [
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
            ],
            'reference' => $this->reference,

            // Información comercial
            'client' => [
                'id' => $this->client_user_id,
                'name' => $this->client ? $this->client->first_name . ' ' . $this->client->last_name : null,
                'email' => $this->client?->email,
                'phone' => $this->client?->phone,
                'full_name' => $this->client_full_name,
            ],

            'seller' => [
                'id' => $this->seller_id,
                'name' => $this->seller ? $this->seller->first_name . ' ' . $this->seller->last_name : null,
                'phone' => $this->seller?->phone,
                'performance_percentage' => $this->seller?->performance_percentage,
            ],

            'mobility' => [
                'id' => $this->mobility_id,
                'plate_number' => $this->mobility?->plate,
                'brand' => $this->mobility?->name,
                'model' => '', // Campo vacío por ahora
                'driver_name' => $this->mobility?->conductor ? $this->mobility->conductor->first_name . ' ' . $this->mobility->conductor->last_name : null,
            ],

            // Montos
            'amount_to_collect' => [
                'amount' => $this->amount_to_collect,
                'formatted' => 'S/ ' . number_format($this->amount_to_collect, 2),
            ],
            'amount_collected' => [
                'amount' => $this->amount_collected,
                'formatted' => $this->amount_collected ? 'S/ ' . number_format($this->amount_collected, 2) : null,
            ],

            // Control y planificación
            'priority' => $this->priority,
            'priority_label' => match($this->priority) {
                'alta' => 'Alta',
                'media' => 'Media',
                'baja' => 'Baja',
                default => $this->priority
            },
            'estimated_delivery_time' => $this->estimated_delivery_time,
            'delivery_instructions' => $this->delivery_instructions,
            'route_order' => $this->route_order,

            // Estado y seguimiento
            'status' => $this->status,
            'status_label' => match($this->status) {
                'pendiente' => 'Pendiente',
                'en_ruta' => 'En Ruta',
                'entregado' => 'Entregado',
                'cancelado' => 'Cancelado',
                'reagendado' => 'Reagendado',
                default => $this->status
            },
            'status_color' => $this->status_color,
            'can_edit' => $this->can_edit,

            // Información de pago
            'payment_method' => $this->paymentMethod ? [
                'id' => $this->paymentMethod->id,
                'name' => $this->paymentMethod->name,
            ] : null,
            'payment_reference' => $this->payment_reference,
            'payment_notes' => $this->payment_notes,

            // Imágenes y comprobantes
            'images' => [
                'payment_image' => $this->payment_image,
                'delivery_image' => $this->delivery_image,
            ],

            // Observaciones y calificación
            'observation' => $this->observation,
            'cancellation_reason' => $this->cancellation_reason,
            'customer_rating' => $this->customer_rating,

            // Timestamps
            'times' => [
                'arrival_time' => $this->arrival_time?->format('H:i:s'),
                'departure_time' => $this->departure_time?->format('H:i:s'),
                'delivered_at' => $this->delivered_at?->format('Y-m-d H:i:s'),
                'delivered_at_human' => $this->delivered_at?->diffForHumans(),
                'created_at' => $this->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
            ],

            // Links útiles (opcional)
            'links' => [
                'google_maps' => "https://www.google.com/maps?q={$this->latitude},{$this->longitude}",
                'waze' => "https://waze.com/ul?ll={$this->latitude},{$this->longitude}&navigate=yes",
            ],

            // Estadísticas (si es necesario)
            'stats' => $this->when($request->include_stats, [
                'time_spent' => $this->time_spent_minutes,
                'delivery_efficiency' => $this->delivery_efficiency_percentage,
            ]),
        ];
    }

    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'meta' => [
                'timestamp' => now()->toISOString(),
                'user_role' => $request->user()?->getRoleNames()->first(),
            ],
        ];
    }
}
