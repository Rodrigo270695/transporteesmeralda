<?php

namespace App\Http\Controllers;

use App\Http\Requests\ZoneRequest;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ZoneController extends Controller
{
    /**
     * Display a listing of zones.
     */
    public function index(Request $request)
    {
        $query = Zone::query();

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $zones = $query->orderBy('created_at', 'desc')
                      ->paginate(10)
                      ->withQueryString();

        return Inertia::render('zonas/gestionar', [
            'zones' => $zones,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new zone.
     */
    public function create()
    {
        return Inertia::render('zonas/crear');
    }

    /**
     * Store a newly created zone in storage.
     */
    public function store(ZoneRequest $request)
    {
        $validated = $request->validated();

        Zone::create($validated);

        return redirect()
            ->route('zonas.gestionar')
            ->with('success', 'Zona registrada exitosamente.');
    }

    /**
     * Display the specified zone.
     */
    public function show(Zone $zone)
    {
        return Inertia::render('zonas/mostrar', [
            'zone' => $zone,
        ]);
    }

    /**
     * Show the form for editing the specified zone.
     */
    public function edit(Zone $zone)
    {
        return Inertia::render('zonas/editar', [
            'zone' => $zone,
        ]);
    }

    /**
     * Update the specified zone in storage.
     */
    public function update(ZoneRequest $request, Zone $zone)
    {
        $validated = $request->validated();

        $zone->update($validated);

        return redirect()
            ->route('zonas.gestionar')
            ->with('success', 'Zona actualizada exitosamente.');
    }

    /**
     * Remove the specified zone from storage.
     */
    public function destroy(Zone $zone)
    {
        try {
            $zoneName = $zone->name;
            $zone->delete();

            return redirect()
                ->route('zonas.gestionar')
                ->with('success', "Zona '{$zoneName}' eliminada exitosamente.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'No se pudo eliminar la zona. Inténtalo nuevamente.');
        }
    }
}
