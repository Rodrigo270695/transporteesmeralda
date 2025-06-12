<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeliveryPointRequest;
use App\Http\Resources\DeliveryPointResource;
use App\Models\DeliveryPoint;
use App\Models\Delivery;
use App\Models\User;
use App\Models\Seller;
use App\Models\Mobility;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class DeliveryPointController extends Controller
{
    /**
     * Display a listing of delivery points for admin.
     * Vista principal para administradores.
     */
    public function index(Delivery $delivery, Request $request)
    {
        // Si es una petición AJAX/JSON, devolver datos
        if ($request->wantsJson()) {
            return $this->getPointsJson($delivery, $request);
        }

        // Vista principal para administradores
        return Inertia::render('entregas/puntos/Index', [
            'delivery' => [
                'id' => $delivery->id,
                'name' => $delivery->name,
                'delivery_date' => $delivery->delivery_date,
                'status' => $delivery->status,
                'progress_percentage' => $delivery->progress_percentage,
                'total_amount_to_collect' => $delivery->total_amount_to_collect,
                'total_amount_collected' => $delivery->total_amount_collected,
            ],
            'filters' => $request->only(['search', 'status', 'priority', 'mobility_id', 'seller_id']),
            // Datos para los selects
            'clients' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'cliente');
                })
                ->select('id', 'first_name', 'last_name', 'email', 'phone')
                ->orderBy('first_name')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'full_name' => $user->first_name . ' ' . $user->last_name,
                    ];
                }),
            'sellers' => Seller::select('id', 'first_name', 'last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function ($seller) {
                    return [
                        'id' => $seller->id,
                        'name' => $seller->first_name . ' ' . $seller->last_name,
                    ];
                }),
            'mobilities' => Mobility::with(['conductor:id,first_name,last_name'])
                ->select('id', 'name', 'plate', 'conductor_user_id')
                ->orderBy('plate')
                ->get()
                ->map(function ($mobility) {
                    return [
                        'id' => $mobility->id,
                        'plate_number' => $mobility->plate,
                        'brand' => $mobility->name, // Usando name como brand por compatibilidad
                        'model' => '', // Campo vacío por ahora
                        'driver_name' => $mobility->conductor ? $mobility->conductor->first_name . ' ' . $mobility->conductor->last_name : '',
                    ];
                }),
            'payment_methods' => PaymentMethod::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the map view for delivery points management.
     */
    public function map(Delivery $delivery): Response
    {
        return Inertia::render('entregas/puntos/Map', [
            'delivery' => [
                'id' => $delivery->id,
                'name' => $delivery->name,
                'delivery_date' => $delivery->delivery_date,
                'status' => $delivery->status,
                'progress_percentage' => $delivery->progress_percentage,
                'total_amount_to_collect' => $delivery->total_amount_to_collect,
                'total_amount_collected' => $delivery->total_amount_collected,
            ],
            'clients' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'cliente');
                })
                ->select('id', 'first_name', 'last_name', 'email', 'phone')
                ->orderBy('first_name')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'full_name' => $user->first_name . ' ' . $user->last_name,
                    ];
                }),
            'sellers' => Seller::select('id', 'first_name', 'last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function ($seller) {
                    return [
                        'id' => $seller->id,
                        'name' => $seller->first_name . ' ' . $seller->last_name,
                    ];
                }),
            'mobilities' => Mobility::with(['conductor:id,first_name,last_name'])
                ->select('id', 'name', 'plate', 'conductor_user_id')
                ->orderBy('plate')
                ->get()
                ->map(function ($mobility) {
                    return [
                        'id' => $mobility->id,
                        'plate_number' => $mobility->plate,
                        'brand' => $mobility->name,
                        'model' => '',
                        'driver_name' => $mobility->conductor ? $mobility->conductor->first_name . ' ' . $mobility->conductor->last_name : '',
                    ];
                }),
            'payment_methods' => PaymentMethod::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new delivery point.
     */
    public function create(Delivery $delivery): Response
    {
        // COMENTADO: Permitir crear puntos sin restricción de estado para admin
        // if ($delivery->status !== 'borrador') {
        //     abort(422, 'Solo se pueden agregar puntos a entregas en estado borrador.');
        // }

        return Inertia::render('entregas/puntos/Create', [
            'delivery' => [
                'id' => $delivery->id,
                'name' => $delivery->name,
                'delivery_date' => $delivery->delivery_date,
                'status' => $delivery->status,
            ],
            'clients' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'cliente');
                })
                ->select('id', 'first_name', 'last_name', 'email', 'phone')
                ->orderBy('first_name')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'full_name' => $user->first_name . ' ' . $user->last_name,
                    ];
                }),
            'sellers' => Seller::select('id', 'first_name', 'last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function ($seller) {
                    return [
                        'id' => $seller->id,
                        'name' => $seller->first_name . ' ' . $seller->last_name,
                    ];
                }),
            'mobilities' => Mobility::with(['conductor:id,first_name,last_name'])
                ->select('id', 'name', 'plate', 'conductor_user_id')
                ->orderBy('plate')
                ->get()
                ->map(function ($mobility) {
                    return [
                        'id' => $mobility->id,
                        'plate_number' => $mobility->plate,
                        'brand' => $mobility->name, // Usando name como brand por compatibilidad
                        'model' => '', // Campo vacío por ahora
                        'driver_name' => $mobility->conductor ? $mobility->conductor->first_name . ' ' . $mobility->conductor->last_name : '',
                    ];
                }),
        ]);
    }

    /**
     * Store a newly created delivery point.
     */
    public function store(Delivery $delivery, DeliveryPointRequest $request)
    {
        try {
            // COMENTADO: Permitir que el admin registre puntos sin restricción de estado
            // if ($delivery->status !== 'borrador') {
            //     if ($request->wantsJson()) {
            //         return response()->json([
            //             'success' => false,
            //             'message' => 'Solo se pueden agregar puntos a entregas en estado borrador.'
            //         ], 422);
            //     }
            //     return back()->withErrors(['error' => 'Solo se pueden agregar puntos a entregas en estado borrador.']);
            // }

            DB::beginTransaction();

            // Obtener el siguiente route_order si no se especifica
            $routeOrder = $request->route_order ?? $delivery->deliveryPoints()->max('route_order') + 1;

            $deliveryPoint = $delivery->deliveryPoints()->create([
                // Información del punto
                'point_name' => $request->point_name,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'reference' => $request->reference,

                // Información comercial
                'client_user_id' => $request->client_user_id,
                'seller_id' => $request->seller_id,
                'mobility_id' => $request->mobility_id,
                'amount_to_collect' => $request->amount_to_collect,

                // Control y planificación
                'priority' => $request->priority,
                'estimated_delivery_time' => $request->estimated_delivery_time,
                'delivery_instructions' => $request->delivery_instructions,
                'route_order' => $routeOrder,
                'status' => 'pendiente',
            ]);

            // Cargar las relaciones
            $deliveryPoint->load(['client', 'seller', 'mobility']);

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Punto de entrega creado exitosamente.',
                    'data' => new DeliveryPointResource($deliveryPoint)
                ], 201);
            }

            return redirect()->route('entregas.puntos.index', $delivery)
                ->with('success', 'Punto de entrega creado exitosamente.');

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al crear el punto de entrega.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Error al crear el punto de entrega: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified delivery point.
     */
    public function show(Delivery $delivery, DeliveryPoint $deliveryPoint, Request $request)
    {
        // Verificar que el punto pertenece a la entrega
        if ($deliveryPoint->delivery_id !== $delivery->id) {
            abort(404, 'El punto de entrega no pertenece a esta entrega.');
        }

        $deliveryPoint->load(['client', 'seller', 'mobility', 'paymentMethod']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => new DeliveryPointResource($deliveryPoint)
            ]);
        }

        return Inertia::render('entregas/puntos/Show', [
            'delivery_point' => new DeliveryPointResource($deliveryPoint),
            'delivery' => [
                'id' => $delivery->id,
                'name' => $delivery->name,
                'delivery_date' => $delivery->delivery_date,
                'status' => $delivery->status,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified delivery point.
     */
    public function edit(Delivery $delivery, DeliveryPoint $deliveryPoint): Response
    {
        // Verificar que el punto pertenece a la entrega
        if ($deliveryPoint->delivery_id !== $delivery->id) {
            abort(404, 'El punto de entrega no pertenece a esta entrega.');
        }

        // COMENTADO: Permitir editar puntos sin restricción de estado para admin
        // if ($delivery->status !== 'borrador') {
        //     abort(422, 'Solo se pueden modificar puntos de entregas en estado borrador.');
        // }

        $deliveryPoint->load(['client', 'seller', 'mobility', 'paymentMethod']);

        return Inertia::render('entregas/puntos/Edit', [
            'delivery_point' => new DeliveryPointResource($deliveryPoint),
            'delivery' => [
                'id' => $delivery->id,
                'name' => $delivery->name,
                'delivery_date' => $delivery->delivery_date,
                'status' => $delivery->status,
            ],
            'clients' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'cliente');
                })
                ->select('id', 'first_name', 'last_name', 'email', 'phone')
                ->orderBy('first_name')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'full_name' => $user->first_name . ' ' . $user->last_name,
                    ];
                }),
            'sellers' => Seller::select('id', 'first_name', 'last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function ($seller) {
                    return [
                        'id' => $seller->id,
                        'name' => $seller->first_name . ' ' . $seller->last_name,
                    ];
                }),
            'mobilities' => Mobility::with(['conductor:id,first_name,last_name'])
                ->select('id', 'name', 'plate', 'conductor_user_id')
                ->orderBy('plate')
                ->get()
                ->map(function ($mobility) {
                    return [
                        'id' => $mobility->id,
                        'plate_number' => $mobility->plate,
                        'brand' => $mobility->name, // Usando name como brand por compatibilidad
                        'model' => '', // Campo vacío por ahora
                        'driver_name' => $mobility->conductor ? $mobility->conductor->first_name . ' ' . $mobility->conductor->last_name : '',
                    ];
                }),
        ]);
    }

    /**
     * Update the specified delivery point.
     */
    public function update(Delivery $delivery, DeliveryPoint $deliveryPoint, DeliveryPointRequest $request)
    {
        try {
            // Verificar que el punto pertenece a la entrega
            if ($deliveryPoint->delivery_id !== $delivery->id) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El punto de entrega no pertenece a esta entrega.'
                    ], 404);
                }
                abort(404, 'El punto de entrega no pertenece a esta entrega.');
            }

            $user = Auth::user();
            $isAdmin = $user->hasRole('admin');
            $isConductor = $user->hasRole('conductor');

            DB::beginTransaction();

            $message = '';

            // Actualización por administrador (modificar datos del punto)
            if ($isAdmin && !$request->has('status')) {
                // COMENTADO: Permitir actualizar puntos sin restricción de estado para admin
                // if ($delivery->status !== 'borrador') {
                //     $errorMsg = 'Solo se pueden modificar puntos de entregas en estado borrador.';
                //     if ($request->wantsJson()) {
                //         return response()->json(['success' => false, 'message' => $errorMsg], 422);
                //     }
                //     return back()->withErrors(['error' => $errorMsg]);
                // }

                $deliveryPoint->update([
                    'point_name' => $request->point_name,
                    'address' => $request->address,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                    'reference' => $request->reference,
                    'client_user_id' => $request->client_user_id,
                    'seller_id' => $request->seller_id,
                    'mobility_id' => $request->mobility_id,
                    'amount_to_collect' => $request->amount_to_collect,
                    'priority' => $request->priority,
                    'estimated_delivery_time' => $request->estimated_delivery_time,
                    'delivery_instructions' => $request->delivery_instructions,
                    'route_order' => $request->route_order ?? $deliveryPoint->route_order,
                ]);

                $message = 'Punto de entrega actualizado exitosamente.';
            }
            // Actualización por conductor (cambiar estado)
            elseif ($isConductor && $request->has('status')) {
                // Verificar que la entrega esté activa
                if ($delivery->status !== 'activa') {
                    $errorMsg = 'Solo se puede actualizar el estado en entregas activas.';
                    if ($request->wantsJson()) {
                        return response()->json(['success' => false, 'message' => $errorMsg], 422);
                    }
                    return back()->withErrors(['error' => $errorMsg]);
                }

                $updateData = ['status' => $request->status];

                // Si está llegando al punto
                if ($request->status === 'en_ruta') {
                    $updateData['arrival_time'] = now();
                }
                // Si está completando la entrega
                elseif ($request->status === 'entregado') {
                    $updateData = array_merge($updateData, [
                        'payment_method_id' => $request->payment_method_id,
                        'amount_collected' => $request->amount_collected,
                        'payment_image' => $request->payment_image,
                        'payment_reference' => $request->payment_reference,
                        'payment_notes' => $request->payment_notes,
                        'delivery_image' => $request->delivery_image,
                        'observation' => $request->observation,
                        'customer_rating' => $request->customer_rating,
                        'delivered_at' => now(),
                        'departure_time' => now(),
                    ]);
                }
                // Si está cancelando
                elseif ($request->status === 'cancelado') {
                    $updateData['cancellation_reason'] = $request->cancellation_reason;
                }

                $deliveryPoint->update($updateData);

                $message = match($request->status) {
                    'en_ruta' => 'Estado actualizado: En ruta al punto.',
                    'entregado' => 'Entrega completada exitosamente.',
                    'cancelado' => 'Punto marcado como cancelado.',
                    'reagendado' => 'Punto reagendado.',
                    default => 'Estado actualizado.',
                };
            }
            else {
                $errorMsg = 'No tiene permisos para realizar esta acción.';
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => $errorMsg], 403);
                }
                return back()->withErrors(['error' => $errorMsg]);
            }

            // Cargar las relaciones actualizadas
            $deliveryPoint->load(['client', 'seller', 'mobility', 'paymentMethod']);

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => new DeliveryPointResource($deliveryPoint)
                ]);
            }

            return redirect()->route('entregas.puntos.index', $delivery)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al actualizar el punto de entrega.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Error al actualizar el punto de entrega: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified delivery point.
     */
    public function destroy(Delivery $delivery, DeliveryPoint $deliveryPoint, Request $request)
    {
        try {
            // Verificar que el punto pertenece a la entrega
            if ($deliveryPoint->delivery_id !== $delivery->id) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El punto de entrega no pertenece a esta entrega.'
                    ], 404);
                }
                abort(404, 'El punto de entrega no pertenece a esta entrega.');
            }

            // Verificar que la entrega esté en estado borrador
            if ($delivery->status !== 'borrador') {
                $errorMsg = 'Solo se pueden eliminar puntos de entregas en estado borrador.';
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => $errorMsg], 422);
                }
                return back()->withErrors(['error' => $errorMsg]);
            }

            $deliveryPoint->delete();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Punto de entrega eliminado exitosamente.'
                ]);
            }

            return redirect()->route('entregas.puntos.index', $delivery)
                ->with('success', 'Punto de entrega eliminado exitosamente.');

        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al eliminar el punto de entrega.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Error al eliminar el punto de entrega: ' . $e->getMessage()]);
        }
    }

    /**
     * Bulk update route order for delivery points.
     * Para reordenar la ruta (administrador).
     */
    public function bulkUpdateOrder(Delivery $delivery, Request $request): JsonResponse
    {
        try {
            $request->validate([
                'points' => 'required|array|min:1',
                'points.*.id' => 'required|exists:delivery_points,id',
                'points.*.route_order' => 'required|integer|min:0',
            ]);

            // Verificar que la entrega esté en estado borrador
            if ($delivery->status !== 'borrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se puede reordenar puntos de entregas en estado borrador.'
                ], 422);
            }

            DB::beginTransaction();

            foreach ($request->points as $pointData) {
                DeliveryPoint::where('id', $pointData['id'])
                    ->where('delivery_id', $delivery->id)
                    ->update(['route_order' => $pointData['route_order']]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Orden de ruta actualizado exitosamente.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el orden de la ruta.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get delivery points for conductor (mobile view).
     * Vista especial para conductores en modo móvil.
     */
    public function forConductor(Delivery $delivery, Request $request)
    {
        try {
            $user = Auth::user();

            // Verificar que es conductor
            if ($user->role !== 'conductor') {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Solo los conductores pueden acceder a esta vista.'
                    ], 403);
                }
                abort(403, 'Solo los conductores pueden acceder a esta vista.');
            }

            // Verificar que la entrega esté activa
            if ($delivery->status !== 'activa') {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta entrega no está activa.'
                    ], 422);
                }
                abort(422, 'Esta entrega no está activa.');
            }

            // Obtener puntos ordenados por ruta
            $points = $delivery->deliveryPoints()
                ->with(['client:id,name,phone', 'paymentMethod:id,name'])
                ->select([
                    'id', 'point_name', 'address', 'latitude', 'longitude',
                    'reference', 'client_user_id', 'amount_to_collect',
                    'priority', 'delivery_instructions', 'status',
                    'route_order', 'estimated_delivery_time', 'mobility_id'
                ])
                ->whereIn('mobility_id', $user->assignedMobilities->pluck('id'))
                ->orderBy('route_order', 'asc')
                ->get();

            // Estadísticas rápidas
            $stats = [
                'total' => $points->count(),
                'pendientes' => $points->where('status', 'pendiente')->count(),
                'en_ruta' => $points->where('status', 'en_ruta')->count(),
                'entregados' => $points->where('status', 'entregado')->count(),
                'cancelados' => $points->where('status', 'cancelado')->count(),
                'monto_total' => $points->sum('amount_to_collect'),
                'monto_cobrado' => $points->where('status', 'entregado')->sum('amount_collected'),
            ];

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => DeliveryPointResource::collection($points),
                    'stats' => $stats,
                    'delivery' => [
                        'id' => $delivery->id,
                        'name' => $delivery->name,
                        'delivery_date' => $delivery->delivery_date,
                    ]
                ]);
            }

            // Vista para conductores
            return Inertia::render('entregas/conductor/Index', [
                'delivery' => [
                    'id' => $delivery->id,
                    'name' => $delivery->name,
                    'delivery_date' => $delivery->delivery_date,
                ],
                'points' => DeliveryPointResource::collection($points),
                'stats' => $stats,
                'payment_methods' => PaymentMethod::select('id', 'name')->orderBy('name')->get(),
            ]);

        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al obtener los puntos para el conductor.',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['error' => 'Error al obtener los puntos: ' . $e->getMessage()]);
        }
    }

    /**
     * Upload images for delivery point (payment and delivery proof).
     */
    public function uploadImages(Delivery $delivery, DeliveryPoint $deliveryPoint, Request $request): JsonResponse
    {
        try {
            $request->validate([
                'payment_image' => 'nullable|string', // Base64
                'delivery_image' => 'nullable|string', // Base64
            ]);

            $updateData = [];

            if ($request->has('payment_image')) {
                // Aquí puedes procesar la imagen base64 y guardarla
                // Por ahora solo guardamos el string
                $updateData['payment_image'] = $request->payment_image;
            }

            if ($request->has('delivery_image')) {
                $updateData['delivery_image'] = $request->delivery_image;
            }

            if (!empty($updateData)) {
                $deliveryPoint->update($updateData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Imágenes subidas exitosamente.',
                'data' => new DeliveryPointResource($deliveryPoint)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir las imágenes.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get delivery points as JSON for AJAX requests.
     * Método auxiliar para respuestas JSON.
     */
    private function getPointsJson(Delivery $delivery, Request $request): JsonResponse
    {
        try {
            $query = $delivery->deliveryPoints()
                ->with(['client', 'seller', 'mobility', 'paymentMethod']);

            // Filtros
            if ($request->has('status')) {
                $query->whereIn('status', explode(',', $request->status));
            }

            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            if ($request->has('mobility_id')) {
                $query->where('mobility_id', $request->mobility_id);
            }

            if ($request->has('seller_id')) {
                $query->where('seller_id', $request->seller_id);
            }

            // Búsqueda por texto
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('point_name', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%")
                      ->orWhereHas('client', function ($client) use ($search) {
                          $client->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Ordenamiento por defecto: route_order
            $points = $query->orderBy('route_order', 'asc')
                           ->orderBy('priority', 'desc')
                           ->get();

            return response()->json([
                'success' => true,
                'data' => DeliveryPointResource::collection($points),
                'delivery' => [
                    'id' => $delivery->id,
                    'name' => $delivery->name,
                    'delivery_date' => $delivery->delivery_date,
                    'status' => $delivery->status,
                    'progress_percentage' => $delivery->progress_percentage,
                    'total_amount_to_collect' => $delivery->total_amount_to_collect,
                    'total_amount_collected' => $delivery->total_amount_collected,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los puntos de entrega.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Optimize the route order of delivery points.
     */
    public function optimizeRoute(Delivery $delivery, Request $request): JsonResponse
    {
        try {
            // Verificar que la entrega esté en estado borrador
            if ($delivery->status !== 'borrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden optimizar rutas de entregas en estado borrador.'
                ], 422);
            }

            $points = $delivery->deliveryPoints()
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->get();

            if ($points->count() < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Se necesitan al menos 2 puntos con coordenadas para optimizar la ruta.'
                ], 422);
            }

            // Algoritmo simple de optimización: ordenar por cercanía desde un punto central
            // En una implementación real, usarías un algoritmo como el TSP (Traveling Salesman Problem)
            $centerLat = $points->avg('latitude');
            $centerLng = $points->avg('longitude');

            // Calcular distancia desde el centro y ordenar
            $optimizedPoints = $points->sortBy(function ($point) use ($centerLat, $centerLng) {
                return $this->calculateDistance(
                    $centerLat, $centerLng,
                    $point->latitude, $point->longitude
                );
            });

            // Actualizar el route_order
            $order = 1;
            foreach ($optimizedPoints as $point) {
                $point->update(['route_order' => $order]);
                $order++;
            }

            return response()->json([
                'success' => true,
                'message' => 'Ruta optimizada exitosamente.',
                'data' => DeliveryPointResource::collection($optimizedPoints->fresh())
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al optimizar la ruta.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2): float
    {
        $earthRadius = 6371; // Radio de la Tierra en kilómetros

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function updateOrder(Request $request, Delivery $delivery)
    {
        $request->validate([
            'points' => 'required|array',
            'points.*.id' => 'required|integer|exists:delivery_points,id',
            'points.*.route_order' => 'required|integer|min:1'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->points as $pointData) {
                DeliveryPoint::where('id', $pointData['id'])
                    ->where('delivery_id', $delivery->id)
                    ->update(['route_order' => $pointData['route_order']]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Orden actualizado correctamente',
                'points' => $delivery->deliveryPoints()->with(['client', 'seller', 'mobility'])->orderBy('route_order')->get()
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Error al actualizar el orden: ' . $e->getMessage()], 500);
        }
    }
}
