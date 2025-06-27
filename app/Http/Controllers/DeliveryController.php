<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeliveryRequest;
use App\Http\Requests\UpdateDeliveryRequest;
use App\Models\Delivery;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        // Agregar campos calculados a cada entrega
        $deliveries->getCollection()->transform(function ($delivery) {
            $delivery->status_label = $delivery->status_label;
            $delivery->status_color = $delivery->status_color;
            $delivery->can_be_edited = $delivery->canBeEdited();
            $delivery->can_be_deleted = $delivery->canBeDeleted();
            $delivery->total_points = $delivery->total_points;
            return $delivery;
        });

        $zones = Zone::active()->orderBy('name')->get();

        return Inertia::render('entregas/gestionar', [
            'deliveries' => $deliveries,
            'zones' => $zones,
            'filters' => $request->only(['search']),
            'availableStatuses' => Delivery::STATUSES,
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
        // Verificar si la entrega se puede editar
        if (!$delivery->canBeEdited()) {
            return back()
                ->with('error', 'No se puede editar una entrega que ya está completada o cancelada.');
        }

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
        // Verificar si la entrega se puede eliminar
        if (!$delivery->canBeDeleted()) {
            return back()
                ->with('error', 'No se puede eliminar una entrega que está en progreso, completada o cancelada.');
        }

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

                // Crear el punto duplicado
                $newDelivery->deliveryPoints()->create($pointData);
            }

            DB::commit();

            return redirect()
                ->route('entregas.gestionar')
                ->with('success', "Entrega '{$newDelivery->name}' duplicada exitosamente con " . $originalPoints->count() . " puntos de entrega.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()
                ->with('error', 'No se pudo duplicar la entrega. Inténtalo nuevamente.');
        }
    }

    /**
     * Iniciar una entrega
     */
    public function start(Delivery $delivery)
    {
        if (!$delivery->canBeStarted()) {
            return back()
                ->with('error', 'No se puede iniciar esta entrega. Verifica que tenga puntos de entrega asignados.');
        }

        $delivery->start();

        return back()
            ->with('success', "Entrega '{$delivery->name}' iniciada exitosamente.");
    }

    /**
     * Cancelar una entrega
     */
    public function cancel(Delivery $delivery)
    {
        if (!$delivery->cancel()) {
            return back()
                ->with('error', 'No se puede cancelar una entrega que ya está completada.');
        }

        return back()
            ->with('success', "Entrega '{$delivery->name}' cancelada exitosamente.");
    }

    /**
     * Reactivar una entrega (cambiar de cancelada a programada)
     */
    public function reactivate(Delivery $delivery)
    {
        if ($delivery->status !== Delivery::STATUS_CANCELADA) {
            return back()
                ->with('error', 'Solo se pueden reactivar entregas canceladas.');
        }

        $delivery->update(['status' => Delivery::STATUS_PROGRAMADA]);

        return back()
            ->with('success', "Entrega '{$delivery->name}' reactivada exitosamente.");
    }
}
