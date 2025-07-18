<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\DeliveryPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\HasApiTokens;

class MobileAuthController extends Controller
{


    public function login(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|size:8',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('dni', $request->dni)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'DNI o contraseña incorrectos.',
            ], 401);
        }

        // Verificar que el usuario tiene rol de cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado. Esta aplicación es solo para clientes.',
            ], 403);
        }

        // Crear token de acceso
        $token = $user->createToken('mobile-app')->plainTextToken;

        // Cargar roles y permisos
        $user->load('roles', 'permissions');

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'dni' => $user->dni,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'full_name' => $user->getFullNameAttribute(),
                    'is_client' => $user->getIsClientAttribute(),
                    'is_conductor' => $user->getIsConductorAttribute(),
                    'is_admin' => $user->getIsAdminAttribute(),
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout de usuario móvil
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('roles', 'permissions');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'dni' => $user->dni,
                'phone' => $user->phone,
                'email' => $user->email,
                'full_name' => $user->getFullNameAttribute(),
                'is_client' => $user->getIsClientAttribute(),
                'is_conductor' => $user->getIsConductorAttribute(),
                'is_admin' => $user->getIsAdminAttribute(),
            ],
        ]);
    }

    /**
     * Actualizar ubicación del usuario (para conductores)
     */
    public function updateLocation(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        $user->update([
            'current_latitude' => $request->latitude,
            'current_longitude' => $request->longitude,
            'last_location_update' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ubicación actualizada exitosamente.',
        ]);
    }

    /**
     * Obtener puntos de entrega del día de hoy para el cliente autenticado
     */
    public function getTodayDeliveryPoints(Request $request)
    {
        $user = $request->user();

        // Verificar que el usuario es un cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado. Solo los clientes pueden ver sus puntos de entrega.',
            ], 403);
        }

        // Obtener puntos de entrega del cliente para el día de hoy
        $deliveryPoints = DeliveryPoint::with([
            'delivery' => function ($query) {
                $query->select('id', 'name', 'delivery_date', 'template_number', 'zone_id', 'status');
            },
            'delivery.zone:id,name,description',
            'seller:id,first_name,last_name,phone',
            'mobility:id,name,plate,conductor_user_id',
            'mobility.conductor:id,first_name,last_name,phone,current_latitude,current_longitude,last_location_update',
            'paymentMethod:id,name,description'
        ])
            ->whereHas('delivery', function ($query) {
                $query->whereDate('delivery_date', today())
                    ->where('status', '!=', 'cancelada');
            })
            ->where('client_user_id', $user->id)
            ->orderBy('route_order')
            ->get();

        // Formatear los datos para la respuesta
        $formattedPoints = $deliveryPoints->map(function ($point) {
            return [
                'id' => $point->id,
                'point_name' => $point->point_name,
                'address' => $point->address,
                'latitude' => $point->latitude,
                'longitude' => $point->longitude,
                'reference' => $point->reference,
                'route_order' => $point->route_order,
                'status' => $point->status,
                'status_color' => $point->status_color,
                'priority' => $point->priority,
                'priority_color' => $point->priority_color,
                'amount_to_collect' => $point->amount_to_collect,
                'amount_collected' => $point->amount_collected,
                'estimated_delivery_time' => $point->estimated_delivery_time?->format('H:i'),
                'delivery_instructions' => $point->delivery_instructions,
                'payment_reference' => $point->payment_reference,
                'payment_notes' => $point->payment_notes,
                'observation' => $point->observation,
                'customer_rating' => $point->customer_rating,
                'arrival_time' => $point->arrival_time?->format('H:i'),
                'departure_time' => $point->departure_time?->format('H:i'),
                'delivered_at' => $point->delivered_at?->format('H:i'),
                'is_completed' => $point->is_completed,
                'can_edit' => $point->can_edit,
                'delivery' => [
                    'id' => $point->delivery->id,
                    'name' => $point->delivery->name,
                    'delivery_date' => $point->delivery->delivery_date->format('Y-m-d'),
                    'template_number' => $point->delivery->template_number,
                    'status' => $point->delivery->status,
                    'zone' => [
                        'id' => $point->delivery->zone->id,
                        'name' => $point->delivery->zone->name,
                        'description' => $point->delivery->zone->description,
                    ],
                ],
                'seller' => [
                    'id' => $point->seller->id,
                    'full_name' => "{$point->seller->first_name} {$point->seller->last_name}",
                    'phone' => $point->seller->phone,
                ],
                'mobility' => [
                    'id' => $point->mobility->id,
                    'brand' => $point->mobility->name ?? 'N/A',
                    'model' => 'N/A',
                    'plate' => $point->mobility->plate,
                    'color' => 'N/A',
                    'full_description' => "{$point->mobility->name} - {$point->mobility->plate}",
                    'conductor' => $point->mobility->conductor ? [
                        'id' => $point->mobility->conductor->id,
                        'full_name' => "{$point->mobility->conductor->first_name} {$point->mobility->conductor->last_name}",
                        'phone' => $point->mobility->conductor->phone,
                        'current_latitude' => $point->mobility->conductor->current_latitude,
                        'current_longitude' => $point->mobility->conductor->current_longitude,
                        'last_location_update' => $point->mobility->conductor->last_location_update?->format('Y-m-d H:i:s'),
                        'is_online' => $point->mobility->conductor->last_location_update &&
                            $point->mobility->conductor->last_location_update->diffInMinutes(now()) <= 10,
                        'is_en_route' => $point->status === 'en_ruta' &&
                            $point->mobility->conductor->current_latitude &&
                            $point->mobility->conductor->current_longitude,
                    ] : null,
                ],
                'payment_method' => $point->paymentMethod ? [
                    'id' => $point->paymentMethod->id,
                    'name' => $point->paymentMethod->name,
                    'type' => $point->paymentMethod->description,
                ] : null,
            ];
        });

        // Estadísticas resumidas
        $stats = [
            'total_points' => $deliveryPoints->count(),
            'pending_points' => $deliveryPoints->where('status', 'pendiente')->count(),
            'en_route_points' => $deliveryPoints->where('status', 'en_ruta')->count(),
            'delivered_points' => $deliveryPoints->where('status', 'entregado')->count(),
            'cancelled_points' => $deliveryPoints->where('status', 'cancelado')->count(),
            'rescheduled_points' => $deliveryPoints->where('status', 'reagendado')->count(),
            'total_amount_to_collect' => $deliveryPoints->sum('amount_to_collect'),
            'total_amount_collected' => $deliveryPoints->whereNotNull('amount_collected')->sum('amount_collected'),
            'progress_percentage' => $deliveryPoints->count() > 0 ?
                round(($deliveryPoints->where('status', 'entregado')->count() / $deliveryPoints->count()) * 100) : 0,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Puntos de entrega obtenidos exitosamente.',
            'data' => [
                'delivery_points' => $formattedPoints,
                'stats' => $stats,
                'today' => today()->format('Y-m-d'),
                'today_formatted' => today()->format('d/m/Y'),
            ],
        ]);
    }

    /**
     * Obtener historial de envíos del cliente filtrado por fecha
     */
    public function getClientDeliveryHistory(Request $request)
    {
        $user = $request->user();

        // Verificar que el usuario es un cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado. Solo los clientes pueden ver su historial de envíos.',
            ], 403);
        }

        // Validar parámetros de fecha
        $request->validate([
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        // Configurar fechas por defecto (últimos 30 días si no se especifica)
        $fromDate = $request->from_date ?? now()->subDays(30)->format('Y-m-d');
        $toDate = $request->to_date ?? now()->format('Y-m-d');
        $perPage = $request->per_page ?? 15;

        // Obtener puntos de entrega del cliente en el rango de fechas
        $deliveryPointsQuery = DeliveryPoint::with([
            'delivery' => function ($query) {
                $query->select('id', 'name', 'delivery_date', 'template_number', 'zone_id', 'status');
            },
            'delivery.zone:id,name,description',
            'seller:id,first_name,last_name,phone',
            'mobility:id,name,plate,conductor_user_id',
            'mobility.conductor:id,first_name,last_name,phone',
            'paymentMethod:id,name,description'
        ])
            ->whereHas('delivery', function ($query) use ($fromDate, $toDate) {
                $query->whereBetween('delivery_date', [$fromDate, $toDate]);
            })
            ->where('client_user_id', $user->id)
            ->orderByDesc('created_at') // Ordenar por fecha de creación descendente
            ->orderByDesc('id'); // Orden secundario por ID descendente

        // Paginación
        $deliveryPoints = $deliveryPointsQuery->paginate($perPage);

        // Formatear los datos para la respuesta
        $formattedPoints = $deliveryPoints->getCollection()->map(function ($point) {
            return [
                'id' => $point->id,
                'point_name' => $point->point_name,
                'address' => $point->address,
                'latitude' => $point->latitude,
                'longitude' => $point->longitude,
                'reference' => $point->reference,
                'route_order' => $point->route_order,
                'status' => $point->status,
                'status_color' => $point->status_color,
                'priority' => $point->priority,
                'priority_color' => $point->priority_color,
                'amount_to_collect' => $point->amount_to_collect,
                'amount_collected' => $point->amount_collected,
                'estimated_delivery_time' => $point->estimated_delivery_time?->format('H:i'),
                'delivery_instructions' => $point->delivery_instructions,
                'payment_reference' => $point->payment_reference,
                'payment_notes' => $point->payment_notes,
                'observation' => $point->observation,
                'customer_rating' => $point->customer_rating,
                'arrival_time' => $point->arrival_time?->format('H:i'),
                'departure_time' => $point->departure_time?->format('H:i'),
                'delivered_at' => $point->delivered_at?->format('d/m/Y H:i'),
                'created_at' => $point->created_at?->format('d/m/Y H:i'),
                'updated_at' => $point->updated_at?->format('d/m/Y H:i'),
                'is_completed' => $point->is_completed,
                'can_edit' => false, // En historial no se puede editar
                'delivery' => [
                    'id' => $point->delivery->id,
                    'name' => $point->delivery->name,
                    'delivery_date' => $point->delivery->delivery_date->format('Y-m-d'),
                    'delivery_date_formatted' => $point->delivery->delivery_date->format('d/m/Y'),
                    'template_number' => $point->delivery->template_number,
                    'status' => $point->delivery->status,
                    'zone' => [
                        'id' => $point->delivery->zone->id,
                        'name' => $point->delivery->zone->name,
                        'description' => $point->delivery->zone->description,
                    ],
                ],
                'seller' => [
                    'id' => $point->seller->id,
                    'full_name' => "{$point->seller->first_name} {$point->seller->last_name}",
                    'phone' => $point->seller->phone,
                ],
                'mobility' => [
                    'id' => $point->mobility->id,
                    'brand' => $point->mobility->name ?? 'N/A',
                    'model' => 'N/A',
                    'plate' => $point->mobility->plate,
                    'color' => 'N/A',
                    'full_description' => "{$point->mobility->name} - {$point->mobility->plate}",
                    'conductor' => $point->mobility->conductor ? [
                        'id' => $point->mobility->conductor->id,
                        'full_name' => "{$point->mobility->conductor->first_name} {$point->mobility->conductor->last_name}",
                        'phone' => $point->mobility->conductor->phone,
                    ] : null,
                ],
                'payment_method' => $point->paymentMethod ? [
                    'id' => $point->paymentMethod->id,
                    'name' => $point->paymentMethod->name,
                    'type' => $point->paymentMethod->description,
                ] : null,
            ];
        });

        // Estadísticas del historial
        $allPointsInRange = DeliveryPoint::whereHas('delivery', function ($query) use ($fromDate, $toDate) {
            $query->whereBetween('delivery_date', [$fromDate, $toDate]);
        })->where('client_user_id', $user->id)->get();

        $stats = [
            'total_points' => $allPointsInRange->count(),
            'delivered_points' => $allPointsInRange->where('status', 'entregado')->count(),
            'cancelled_points' => $allPointsInRange->where('status', 'cancelado')->count(),
            'rescheduled_points' => $allPointsInRange->where('status', 'reagendado')->count(),
            'total_amount_collected' => $allPointsInRange->whereNotNull('amount_collected')->sum('amount_collected'),
            'delivery_success_rate' => $allPointsInRange->count() > 0 ?
                round(($allPointsInRange->where('status', 'entregado')->count() / $allPointsInRange->count()) * 100, 1) : 0,
        ];

        // Agrupar por fecha para mejor visualización
        $pointsByDate = $formattedPoints->groupBy(function ($point) {
            return $point['delivery']['delivery_date_formatted'];
        });

        return response()->json([
            'success' => true,
            'message' => 'Historial de envíos obtenido exitosamente.',
            'data' => [
                'delivery_points' => $formattedPoints,
                'points_by_date' => $pointsByDate,
                'stats' => $stats,
                'pagination' => [
                    'current_page' => $deliveryPoints->currentPage(),
                    'last_page' => $deliveryPoints->lastPage(),
                    'per_page' => $deliveryPoints->perPage(),
                    'total' => $deliveryPoints->total(),
                    'from' => $deliveryPoints->firstItem(),
                    'to' => $deliveryPoints->lastItem(),
                ],
                'filters' => [
                    'from_date' => $fromDate,
                    'to_date' => $toDate,
                    'from_date_formatted' => \Carbon\Carbon::parse($fromDate)->format('d/m/Y'),
                    'to_date_formatted' => \Carbon\Carbon::parse($toDate)->format('d/m/Y'),
                ],
            ],
        ]);
    }

    /**
     * Calificar el servicio de un punto de entrega entregado
     */
    public function rateDeliveryService(Request $request, $deliveryPointId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        // Verificar que el usuario es un cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado. Solo los clientes pueden calificar el servicio.',
            ], 403);
        }

        // Buscar el punto de entrega
        $deliveryPoint = DeliveryPoint::where('id', $deliveryPointId)
            ->where('client_user_id', $user->id)
            ->first();

        if (!$deliveryPoint) {
            return response()->json([
                'success' => false,
                'message' => 'Punto de entrega no encontrado o no autorizado.',
            ], 404);
        }

        // Verificar que el punto de entrega esté entregado
        if ($deliveryPoint->status !== 'entregado') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden calificar entregas completadas.',
            ], 400);
        }

        // Verificar que no haya sido calificado anteriormente
        if ($deliveryPoint->customer_rating) {
            return response()->json([
                'success' => false,
                'message' => 'Esta entrega ya ha sido calificada.',
            ], 400);
        }

        // Guardar la calificación
        $deliveryPoint->update([
            'customer_rating' => $request->rating,
            'customer_comment' => $request->comment,
            'rated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Calificación guardada exitosamente.',
            'data' => [
                'delivery_point_id' => $deliveryPoint->id,
                'rating' => $deliveryPoint->customer_rating,
                'comment' => $deliveryPoint->customer_comment,
                'rated_at' => $deliveryPoint->rated_at->format('d/m/Y H:i'),
            ],
        ]);
    }

    /**
     * Obtener notificaciones del cliente con filtros simplificados
     */
    public function getNotifications(Request $request)
    {
        $request->validate([
            'per_page' => 'nullable|integer|min:1|max:50',
            'page' => 'nullable|integer|min:1',
            'type' => 'nullable|in:status_change,delivery_rating',
            'is_read' => 'nullable|boolean',
        ]);

        $user = $request->user();

        // Verificar que el usuario es un cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado.',
            ], 403);
        }

        $perPage = $request->per_page ?? 20;

        $query = $user->notifications()
            ->with(['deliveryPoint:id,point_name,address,status'])
            ->whereIn('type', ['status_change', 'delivery_rating']) // Solo estos tipos
            ->latest();

        // Aplicar filtros
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_read')) {
            if ($request->is_read) {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications->items(),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'from' => $notifications->firstItem(),
                    'to' => $notifications->lastItem(),
                ],
            ],
        ]);
    }

    /**
     * Obtener cantidad de notificaciones no leídas
     */
    public function getUnreadNotificationsCount(Request $request)
    {
        $user = $request->user();

        // Verificar que el usuario es un cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado.',
            ], 403);
        }

        $count = $user->notifications()
            ->whereNull('read_at')
            ->whereIn('type', ['status_change', 'delivery_rating'])
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $count,
            ],
        ]);
    }

    /**
     * Marcar una notificación como leída
     */
    public function markNotificationAsRead(Request $request, $notificationId)
    {
        $user = $request->user();

        $notification = $user->notifications()
            ->where('id', $notificationId)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        if (!$notification->read_at) {
            $notification->update([
                'read_at' => now(),
                'is_read' => true,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída.',
        ]);
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    public function markAllNotificationsAsRead(Request $request)
    {
        $user = $request->user();

        // Contar las notificaciones que serán marcadas como leídas
        $updatedCount = $user->notifications()
            ->whereNull('read_at')
            ->whereIn('type', ['status_change', 'delivery_rating'])
            ->count();

        // Actualizar las notificaciones
        $user->notifications()
            ->whereNull('read_at')
            ->whereIn('type', ['status_change', 'delivery_rating'])
            ->update([
                'read_at' => now(),
                'is_read' => true,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Todas las notificaciones marcadas como leídas.',
            'data' => [
                'updated_count' => $updatedCount,
            ],
        ]);
    }

    /**
     * Eliminar una notificación
     */
    public function deleteNotification(Request $request, $notificationId)
    {
        $user = $request->user();

        $notification = $user->notifications()
            ->where('id', $notificationId)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notificación eliminada exitosamente.',
        ]);
    }

    /**
     * Obtener puntos de entrega entregados pendientes de calificación
     */
    public function getDeliveredPointsForRating(Request $request)
    {
        $user = $request->user();

        // Verificar que el usuario es un cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado.',
            ], 403);
        }

        // Obtener puntos entregados sin calificar de los últimos 30 días
        $deliveredPoints = DeliveryPoint::with([
            'delivery:id,name,delivery_date',
            'mobility:id,name,plate',
            'mobility.conductor:id,first_name,last_name',
        ])
            ->where('client_user_id', $user->id)
            ->where('status', 'entregado')
            ->whereNull('customer_rating')
            ->whereNotNull('delivered_at')
            ->whereDate('delivered_at', '>=', now()->subDays(30))
            ->orderByDesc('delivered_at')
            ->get();

        $formattedPoints = $deliveredPoints->map(function ($point) {
            return [
                'id' => $point->id,
                'point_name' => $point->point_name,
                'address' => $point->address,
                'delivered_at' => $point->delivered_at->format('d/m/Y H:i'),
                'delivery_date' => $point->delivery->delivery_date->format('d/m/Y'),
                'mobility' => [
                    'description' => "{$point->mobility->name} - {$point->mobility->plate}",
                    'conductor' => $point->mobility->conductor ? [
                        'name' => "{$point->mobility->conductor->first_name} {$point->mobility->conductor->last_name}",
                    ] : null,
                ],
                'can_rate' => true,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'delivered_points' => $formattedPoints,
                'total_pending_rating' => $deliveredPoints->count(),
            ],
        ]);
    }
}
