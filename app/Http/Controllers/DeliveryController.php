<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeliveryRequest;
use App\Http\Requests\UpdateDeliveryRequest;
use App\Models\Delivery;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    /**
     * Display a listing of deliveries.
     */
    public function index(Request $request)
    {
        $query = Delivery::with('zone');

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('template_number', 'like', "%{$search}%")
                  ->orWhereHas('zone', function ($zoneQuery) use ($search) {
                      $zoneQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $deliveries = $query->orderBy('delivery_date', 'desc')
                           ->paginate(10)
                           ->withQueryString();

        $zones = Zone::active()->orderBy('name')->get();

        return Inertia::render('entregas/gestionar', [
            'deliveries' => $deliveries,
            'zones' => $zones,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new delivery.
     */
    public function create()
    {
        return Inertia::render('entregas/crear');
    }

    /**
     * Store a newly created delivery in storage.
     */
    public function store(StoreDeliveryRequest $request)
    {
        $validated = $request->validated();

        Delivery::create($validated);

        return redirect()
            ->route('entregas.gestionar')
            ->with('success', 'Entrega registrada exitosamente.');
    }

    /**
     * Display the specified delivery.
     */
    public function show(Delivery $delivery)
    {
        return Inertia::render('entregas/mostrar', [
            'delivery' => $delivery,
        ]);
    }

    /**
     * Show the form for editing the specified delivery.
     */
    public function edit(Delivery $delivery)
    {
        return Inertia::render('entregas/editar', [
            'delivery' => $delivery,
        ]);
    }

    /**
     * Update the specified delivery in storage.
     */
    public function update(UpdateDeliveryRequest $request, Delivery $delivery)
    {
        $validated = $request->validated();

        $delivery->update($validated);

        return redirect()
            ->route('entregas.gestionar')
            ->with('success', 'Entrega actualizada exitosamente.');
    }

    /**
     * Remove the specified delivery from storage.
     */
    public function destroy(Delivery $delivery)
    {
        try {
            $deliveryName = $delivery->name;
            $delivery->delete();

            return redirect()
                ->route('entregas.gestionar')
                ->with('success', "Entrega '{$deliveryName}' eliminada exitosamente.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'No se pudo eliminar la entrega. Inténtalo nuevamente.');
        }
    }

    /**
     * Duplicate a delivery with all its delivery points
     */
    public function duplicate(StoreDeliveryRequest $request, Delivery $delivery)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Crear la nueva entrega
            $newDelivery = Delivery::create($validated);

            // Duplicar todos los puntos de entrega
            $originalPoints = $delivery->deliveryPoints()->get();

            // Debug: Log para verificar cuántos puntos se encontraron
            Log::info('Duplicando entrega', [
                'original_delivery_id' => $delivery->id,
                'new_delivery_id' => $newDelivery->id,
                'original_points_count' => $originalPoints->count(),
                'original_points' => $originalPoints->toArray()
            ]);

            $duplicatedCount = 0;
            foreach ($originalPoints as $originalPoint) {
                $pointData = $originalPoint->toArray();

                // Remover campos que no se deben copiar
                unset($pointData['id']);
                unset($pointData['created_at']);
                unset($pointData['updated_at']);
                unset($pointData['delivery_id']);

                // Resetear campos específicos del conductor
                $pointData['payment_method_id'] = null;
                $pointData['amount_collected'] = null;
                $pointData['payment_image'] = null;
                $pointData['payment_reference'] = null;
                $pointData['payment_notes'] = null;
                $pointData['delivery_image'] = null;
                $pointData['observation'] = null;
                $pointData['cancellation_reason'] = null;
                $pointData['customer_rating'] = null;
                $pointData['arrival_time'] = null;
                $pointData['departure_time'] = null;
                $pointData['delivered_at'] = null;
                $pointData['status'] = 'pendiente';

                // Asignar la nueva entrega
                $pointData['delivery_id'] = $newDelivery->id;

                // Debug: Log del punto que se va a crear
                Log::info('Creando punto duplicado', [
                    'point_data' => $pointData
                ]);

                // Crear el punto duplicado
                $createdPoint = $newDelivery->deliveryPoints()->create($pointData);
                $duplicatedCount++;

                // Debug: Log del punto creado
                Log::info('Punto creado', [
                    'created_point_id' => $createdPoint->id,
                    'point_name' => $createdPoint->point_name
                ]);
            }

            DB::commit();

            // Debug: Log final
            Log::info('Duplicación completada', [
                'duplicated_count' => $duplicatedCount,
                'final_points_count' => $newDelivery->deliveryPoints()->count()
            ]);

            return redirect()
                ->route('entregas.gestionar')
                ->with('success', "Entrega '{$newDelivery->name}' duplicada exitosamente con " . $duplicatedCount . " puntos de entrega.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error duplicando entrega', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()
                ->with('error', 'No se pudo duplicar la entrega: ' . $e->getMessage());
        }
    }
}
