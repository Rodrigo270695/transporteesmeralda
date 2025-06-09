<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeliveryRequest;
use App\Http\Requests\UpdateDeliveryRequest;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeliveryController extends Controller
{
    /**
     * Display a listing of deliveries.
     */
    public function index(Request $request)
    {
        $query = Delivery::query();

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('template_number', 'like', "%{$search}%");
            });
        }

        $deliveries = $query->orderBy('delivery_date', 'desc')
                           ->paginate(10)
                           ->withQueryString();

        return Inertia::render('entregas/gestionar', [
            'deliveries' => $deliveries,
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
}
