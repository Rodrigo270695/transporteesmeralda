<?php

namespace App\Http\Controllers;

use App\Http\Requests\DriverPointUpdateRequest;
use App\Http\Resources\DeliveryPointResource;
use App\Models\DeliveryPoint;
use App\Models\Delivery;
use App\Models\Mobility;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class DriverController extends Controller
{
    /**
     * Dashboard del conductor - Lista sus puntos de entrega directamente
     */
    public function dashboard(Request $request): Response
    {
        $user = Auth::user();

        // Verificar que es conductor (temporalmente comentado para debug)
        // if (!$user->roles()->where('name', 'conductor')->exists()) {
        //     abort(403, 'Solo los conductores pueden acceder a esta vista.');
        // }

        // Obtener movilidades asignadas al conductor
        $mobilities = Mobility::where('conductor_user_id', $user->id)->get();

        if ($mobilities->isEmpty()) {
            return Inertia::render('conductor/Dashboard', [
                'deliveryPoints' => [],
                'stats' => [],
                'user' => $user,
                'message' => 'No tienes vehículos asignados. Contacta al administrador.'
            ]);
        }

        // Filtro de fecha (por defecto hoy en zona horaria de Lima)
        $filterDate = $request->get('date', now('America/Lima')->toDateString());

        // Obtener DIRECTAMENTE todos los puntos de entrega del conductor para el día
        $deliveryPoints = DeliveryPoint::with([
                'delivery',
                'client',
                'seller',
                'mobility',
                'paymentMethod'
            ])
            ->whereHas('delivery', function($query) use ($filterDate) {
                $query->whereDate('delivery_date', $filterDate);
            })
            ->whereIn('mobility_id', $mobilities->pluck('id'))
            ->orderBy('route_order')
            ->get();

        // Calcular estadísticas de los puntos
        $totalPoints = $deliveryPoints->count();
        $completedPoints = $deliveryPoints->where('status', 'entregado')->count();
        $pendingPoints = $deliveryPoints->whereIn('status', ['pendiente', 'reagendado'])->count();
        $inRoutePoints = $deliveryPoints->where('status', 'en_ruta')->count();
        $canceledPoints = $deliveryPoints->where('status', 'cancelado')->count();

        $stats = [
            'total_points' => $totalPoints,
            'completed_points' => $completedPoints,
            'pending_points' => $pendingPoints,
            'in_route_points' => $inRoutePoints,
            'canceled_points' => $canceledPoints,
            'total_to_collect' => $deliveryPoints->sum('amount_to_collect'),
            'total_collected' => $deliveryPoints->where('status', 'entregado')->sum('amount_collected'),
            'progress_percentage' => $totalPoints > 0
                ? round(($completedPoints / $totalPoints) * 100, 1)
                : 0
        ];

        // Formatear puntos con toda la información necesaria
        $formattedPoints = $deliveryPoints->map(function($point) {
            return [
                'id' => $point->id,
                'delivery_id' => $point->delivery_id,
                'route_order' => (int) ($point->route_order ?? 0),
                'point_name' => $point->point_name,
                'address' => $point->address,
                'reference' => $point->reference,
                'status' => $point->status,
                'status_label' => $this->getStatusLabel($point->status),
                'priority' => $point->priority,
                'amount_to_collect' => (float) ($point->amount_to_collect ?? 0),
                'amount_collected' => (float) ($point->amount_collected ?? 0),
                'estimated_delivery_time' => $point->estimated_delivery_time,
                'delivery_instructions' => $point->delivery_instructions,
                'coordinates' => [
                    'latitude' => (float) ($point->latitude ?? 0),
                    'longitude' => (float) ($point->longitude ?? 0),
                ],
                'client' => [
                    'id' => $point->client?->id,
                    'name' => $point->client ? $point->client->first_name . ' ' . $point->client->last_name : 'Cliente',
                    'phone' => $point->client?->phone,
                    'email' => $point->client?->email,
                ],
                'seller' => [
                    'id' => $point->seller?->id,
                    'name' => $point->seller ? $point->seller->first_name . ' ' . $point->seller->last_name : null,
                ],
                'delivery' => [
                    'id' => $point->delivery?->id,
                    'name' => $point->delivery?->name,
                    'delivery_date' => $point->delivery?->delivery_date,
                ],
                'mobility' => [
                    'id' => $point->mobility?->id,
                    'name' => $point->mobility?->name,
                    'plate' => $point->mobility?->plate,
                ],
                'payment_method' => $point->paymentMethod ? [
                    'id' => $point->paymentMethod->id,
                    'name' => $point->paymentMethod->name,
                ] : null,
                'payment_reference' => $point->payment_reference,
                'payment_notes' => $point->payment_notes,
                'payment_image' => $point->payment_image,
                'delivery_image' => $point->delivery_image,
                'observation' => $point->observation,
                'arrival_time' => $point->arrival_time,
                'departure_time' => $point->departure_time,
                'delivered_at' => $point->delivered_at,
                'cancellation_reason' => $point->cancellation_reason,
            ];
        });

        return Inertia::render('conductor/Dashboard', [
            'deliveryPoints' => $formattedPoints,
            'stats' => $stats,
            'user' => $user,
            'paymentMethods' => PaymentMethod::where('status', true)->get(['id', 'name']),
            'filters' => [
                'date' => $filterDate
            ]
        ]);
    }

    /**
     * Obtener label legible para el status
     */
    private function getStatusLabel(string $status): string
    {
        return match($status) {
            'pendiente' => 'Pendiente',
            'en_ruta' => 'En Ruta',
            'entregado' => 'Entregado',
            'cancelado' => 'Cancelado',
            'reagendado' => 'Reagendado',
            default => 'Desconocido',
        };
    }

    /**
     * Vista de mapa específica para una entrega del conductor
     */
        public function delivery(Delivery $delivery): Response
    {
        $user = Auth::user();

        // Verificar que es conductor (temporalmente comentado para debug)
        // if (!$user->hasRole('conductor')) {
        //     abort(403, 'Solo los conductores pueden acceder a esta vista.');
        // }

        // Obtener puntos de entrega asignados al conductor
        $points = $delivery->deliveryPoints()
            ->whereHas('mobility', function($query) use ($user) {
                $query->where('conductor_user_id', $user->id);
            })
            ->with(['client', 'seller', 'mobility', 'paymentMethod'])
            ->orderBy('route_order')
            ->get();

        if ($points->isEmpty()) {
            abort(403, 'No tienes puntos asignados en esta entrega.');
        }

        // Calcular estadísticas en tiempo real
        $stats = [
            'total' => $points->count(),
            'pendientes' => $points->whereIn('status', ['pendiente', 'reagendado'])->count(),
            'en_ruta' => $points->where('status', 'en_ruta')->count(),
            'entregados' => $points->where('status', 'entregado')->count(),
            'cancelados' => $points->where('status', 'cancelado')->count(),
            'monto_total' => $points->sum('amount_to_collect'),
            'monto_cobrado' => $points->where('status', 'entregado')->sum('amount_collected'),
            'progreso' => $points->count() > 0
                ? round(($points->where('status', 'entregado')->count() / $points->count()) * 100, 1)
                : 0
        ];

        return Inertia::render('conductor/Delivery', [
            'delivery' => [
                'id' => $delivery->id,
                'name' => $delivery->name,
                'delivery_date' => $delivery->delivery_date,
                'status' => $delivery->status,
            ],
            'points' => $points->map(function($point) {
                return [
                    'id' => $point->id,
                    'delivery_id' => $point->delivery_id,
                    'route_order' => (int) ($point->route_order ?? 0),
                    'point_name' => $point->point_name,
                    'address' => $point->address,
                    'latitude' => (float) ($point->latitude ?? 0),
                    'longitude' => (float) ($point->longitude ?? 0),
                    'reference' => $point->reference,
                    'status' => $point->status,
                    'priority' => $point->priority,
                    'quantity' => (int) ($point->quantity ?? 1),
                    'amount_to_collect' => (float) ($point->amount_to_collect ?? 0),
                    'amount_collected' => (float) ($point->amount_collected ?? 0),
                    'payment_method_id' => $point->payment_method_id,
                    'payment_reference' => $point->payment_reference,
                    'payment_notes' => $point->payment_notes,
                    'payment_image' => $point->payment_image,
                    'delivery_image' => $point->delivery_image,
                    'observation' => $point->observation,
                    'cancellation_reason' => $point->cancellation_reason,
                    'arrival_time' => $point->arrival_time,
                    'departure_time' => $point->departure_time,
                    'delivered_at' => $point->delivered_at,
                    'client' => $point->client ? [
                        'id' => $point->client->id,
                        'name' => $point->client->first_name . ' ' . $point->client->last_name,
                        'email' => $point->client->email,
                        'phone' => $point->client->phone,
                    ] : null,
                    'seller' => $point->seller ? [
                        'id' => $point->seller->id,
                        'name' => $point->seller->first_name . ' ' . $point->seller->last_name,
                        'phone' => $point->seller->phone,
                    ] : null,
                    'mobility' => $point->mobility ? [
                        'id' => $point->mobility->id,
                        'plate' => $point->mobility->plate,
                        'brand' => $point->mobility->brand,
                        'model' => $point->mobility->model,
                    ] : null,
                    'payment_method' => $point->paymentMethod ? [
                        'id' => $point->paymentMethod->id,
                        'name' => $point->paymentMethod->name,
                    ] : null,
                ];
            }),
            'stats' => $stats,
            'payment_methods' => PaymentMethod::select('id', 'name')->orderBy('name')->get(),
            'user' => $user
        ]);
    }

    /**
     * Actualizar estado de un punto de entrega
     */
    public function updatePoint(DeliveryPoint $deliveryPoint, DriverPointUpdateRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();

            // Verificar que el punto pertenece a una movilidad del conductor
            if ($deliveryPoint->mobility->conductor_user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para actualizar este punto de entrega.'
                ], 403);
            }

            DB::beginTransaction();

            $updateData = ['status' => $request->status];
            $message = '';

            switch ($request->status) {
                case 'en_ruta':
                    $updateData['arrival_time'] = now();
                    $message = 'Estado actualizado: En ruta al punto de entrega.';
                    break;

                case 'entregado':
                    $updateData = array_merge($updateData, [
                        'payment_method_id' => $request->payment_method_id,
                        'amount_collected' => $request->amount_collected,
                        'payment_image' => $request->payment_image,
                        'payment_reference' => $request->payment_reference,
                        'payment_notes' => $request->payment_notes,
                        'delivery_image' => $request->delivery_image,
                        'observation' => $request->observation,
                        'delivered_at' => now(),
                        'departure_time' => now(),
                    ]);
                    $message = 'Entrega completada exitosamente.';
                    break;

                case 'cancelado':
                    $updateData['cancellation_reason'] = $request->cancellation_reason;
                    $message = 'Punto marcado como cancelado.';
                    break;

                case 'reagendado':
                    $updateData['cancellation_reason'] = $request->cancellation_reason;
                    $message = 'Punto reagendado correctamente.';
                    break;
            }

            // Agregar geolocalización si está disponible
            if ($request->has('current_latitude') && $request->has('current_longitude')) {
                $updateData['actual_latitude'] = $request->current_latitude;
                $updateData['actual_longitude'] = $request->current_longitude;
            }

            $deliveryPoint->update($updateData);

            // Cargar relaciones actualizadas
            $deliveryPoint->load(['client', 'seller', 'mobility', 'paymentMethod']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => new DeliveryPointResource($deliveryPoint)
            ]);

        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el punto de entrega.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar ubicación en lote (para background sync)
     */
    public function updateLocationBulk(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'locations' => 'required|array',
                'locations.*.latitude' => 'required|numeric|between:-90,90',
                'locations.*.longitude' => 'required|numeric|between:-180,180',
                'locations.*.timestamp' => 'required|date',
                'locations.*.accuracy' => 'nullable|numeric|min:0',
                'locations.*.speed' => 'nullable|numeric|min:0',
                'locations.*.heading' => 'nullable|numeric|between:0,360',
            ]);

            $user = Auth::user();
            $locations = $request->locations;
            $savedCount = 0;

            foreach ($locations as $locationData) {
                // Aquí podrías guardar en una tabla de tracking de ubicaciones
                // Por ahora solo logueamos
                Log::info('Location update', [
                    'user_id' => $user->id,
                    'latitude' => $locationData['latitude'],
                    'longitude' => $locationData['longitude'],
                    'timestamp' => $locationData['timestamp'],
                    'accuracy' => $locationData['accuracy'] ?? null,
                ]);
                $savedCount++;
            }

            return response()->json([
                'success' => true,
                'message' => "Se guardaron {$savedCount} ubicaciones correctamente.",
                'data' => [
                    'saved_count' => $savedCount,
                    'total_count' => count($locations)
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar ubicaciones en lote.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir imágenes desde PWA
     */
    public function uploadImages(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'delivery_point_id' => 'required|exists:delivery_points,id',
                'payment_image' => 'nullable|string', // Base64
                'delivery_image' => 'nullable|string', // Base64
            ]);

            $deliveryPoint = DeliveryPoint::findOrFail($request->delivery_point_id);
            $user = Auth::user();

            // Verificar permisos
            if ($deliveryPoint->mobility->conductor_user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para subir imágenes a este punto.'
                ], 403);
            }

            $updateData = [];

            // Procesar imagen de pago
            if ($request->payment_image) {
                $paymentImagePath = $this->saveBase64Image(
                    $request->payment_image,
                    'delivery-points/payments'
                );
                $updateData['payment_image'] = $paymentImagePath;
            }

            // Procesar imagen de entrega
            if ($request->delivery_image) {
                $deliveryImagePath = $this->saveBase64Image(
                    $request->delivery_image,
                    'delivery-points/deliveries'
                );
                $updateData['delivery_image'] = $deliveryImagePath;
            }

            if (!empty($updateData)) {
                $deliveryPoint->update($updateData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Imágenes subidas exitosamente.',
                'data' => new DeliveryPointResource($deliveryPoint)
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir las imágenes.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar ubicación actual del conductor
     */
    public function updateLocation(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
            ]);

            $user = Auth::user();

            // Actualizar ubicación del conductor (temporalmente comentado)
            // $user->update([
            //     'current_latitude' => $request->latitude,
            //     'current_longitude' => $request->longitude,
            //     'last_location_update' => now()
            // ]);

            // Aquí podrías agregar broadcast para tiempo real
            // broadcast(new DriverLocationUpdated($user, $request->latitude, $request->longitude));

            return response()->json([
                'success' => true,
                'message' => 'Ubicación actualizada correctamente.'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la ubicación.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener siguiente punto de entrega
     */
    public function nextPoint(Delivery $delivery): JsonResponse
    {
        try {
            $user = Auth::user();

            $nextPoint = $delivery->deliveryPoints()
                ->whereHas('mobility', function($query) use ($user) {
                    $query->where('conductor_user_id', $user->id);
                })
                ->whereIn('status', ['pendiente', 'reagendado'])
                ->orderBy('route_order')
                ->first();

            if (!$nextPoint) {
                return response()->json([
                    'success' => true,
                    'message' => 'No hay más puntos pendientes en esta entrega.',
                    'data' => null
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => new DeliveryPointResource($nextPoint)
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el siguiente punto.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Almacenar suscripción push
     */
    public function storePushSubscription(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'subscription.endpoint' => 'required|string',
                'subscription.keys.p256dh' => 'required|string',
                'subscription.keys.auth' => 'required|string',
            ]);

            $user = Auth::user();
            $subscription = $request->subscription;

            // Aquí podrías guardar la suscripción en la base de datos
            // Por ahora solo logueamos
            Log::info('Push subscription stored', [
                'user_id' => $user->id,
                'endpoint' => $subscription['endpoint'],
                'keys' => $subscription['keys']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Suscripción almacenada correctamente'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error almacenando suscripción',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remover suscripción push
     */
    public function removePushSubscription(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'endpoint' => 'required|string'
            ]);

            $user = Auth::user();
            $endpoint = $request->endpoint;

            // Aquí podrías remover la suscripción de la base de datos
            Log::info('Push subscription removed', [
                'user_id' => $user->id,
                'endpoint' => $endpoint
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Suscripción removida correctamente'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removiendo suscripción',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guardar imagen base64 en storage
     */
    private function saveBase64Image(string $base64Image, string $path): string
    {
        // Extraer datos de la imagen
        $image_parts = explode(";base64,", $base64Image);
        $image_type_aux = explode("image/", $image_parts[0]);
        $image_type = $image_type_aux[1];
        $image_base64 = base64_decode($image_parts[1]);

        // Generar nombre único
        $fileName = uniqid() . '_' . time() . '.' . $image_type;
        $filePath = $path . '/' . $fileName;

        // Guardar en storage
        Storage::disk('public')->put($filePath, $image_base64);

        return $filePath;
    }

    /**
     * Marcar punto como "en ruta"
     */
    public function startPoint(DeliveryPoint $deliveryPoint): JsonResponse
    {
        try {
            $user = Auth::user();

            // Verificar que el punto pertenece al conductor
            if ($deliveryPoint->mobility->conductor_user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para actualizar este punto.'
                ], 403);
            }

            // Verificar que el punto esté en estado pendiente
            if (!in_array($deliveryPoint->status, ['pendiente', 'reagendado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden iniciar puntos pendientes o reagendados.'
                ], 400);
            }

            // Actualizar estado
            $deliveryPoint->update([
                'status' => 'en_ruta',
                'arrival_time' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Punto marcado como en ruta exitosamente.',
                'data' => [
                    'id' => $deliveryPoint->id,
                    'status' => $deliveryPoint->status,
                    'status_label' => $this->getStatusLabel($deliveryPoint->status),
                    'arrival_time' => $deliveryPoint->arrival_time,
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Error al iniciar punto: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Completar punto de entrega con información mínima
     */
    public function completePoint(DeliveryPoint $deliveryPoint, Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            // Verificar que el punto pertenece al conductor
            if ($deliveryPoint->mobility->conductor_user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para actualizar este punto.'
                ], 403);
            }

            // Verificar que el punto esté en ruta
            if ($deliveryPoint->status !== 'en_ruta') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden completar puntos que estén en ruta.'
                ], 400);
            }

            // Validar datos requeridos
            $validated = $request->validate([
                'payment_method_id' => 'required|exists:payment_methods,id',
                'amount_collected' => 'required|numeric|min:0',
                'payment_reference' => 'nullable|string|max:50',
                'payment_notes' => 'nullable|string',
                'payment_image' => 'nullable|string',
                'delivery_image' => 'nullable|string',
                'observation' => 'nullable|string',
            ]);

            // Procesar imágenes base64 si existen
            if (!empty($validated['payment_image'])) {
                $validated['payment_image'] = $this->saveBase64Image(
                    $validated['payment_image'],
                    'payments'
                );
            }

            if (!empty($validated['delivery_image'])) {
                $validated['delivery_image'] = $this->saveBase64Image(
                    $validated['delivery_image'],
                    'deliveries'
                );
            }

            // Actualizar el punto
            $deliveryPoint->update([
                'status' => 'entregado',
                'payment_method_id' => $validated['payment_method_id'],
                'amount_collected' => $validated['amount_collected'],
                'payment_reference' => $validated['payment_reference'] ?? null,
                'payment_notes' => $validated['payment_notes'] ?? null,
                'payment_image' => $validated['payment_image'] ?? null,
                'delivery_image' => $validated['delivery_image'] ?? null,
                'observation' => $validated['observation'] ?? null,
                'delivered_at' => now(),
                'departure_time' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Punto completado exitosamente.',
                'data' => [
                    'id' => $deliveryPoint->id,
                    'status' => $deliveryPoint->status,
                    'status_label' => $this->getStatusLabel($deliveryPoint->status),
                    'amount_collected' => $deliveryPoint->amount_collected,
                    'delivered_at' => $deliveryPoint->delivered_at,
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Error al completar punto: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
