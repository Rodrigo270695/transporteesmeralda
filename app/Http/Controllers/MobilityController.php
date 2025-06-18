<?php

namespace App\Http\Controllers;

use App\Models\Mobility;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MobilityController extends Controller
{
    /**
     * Display a listing of mobilities.
     */
    public function index(Request $request)
    {
        $query = Mobility::with(['conductor', 'liquidator', 'soat', 'technicalReview', 'permit', 'fireExtinguisher', 'propertyCard']);

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('plate', 'like', "%{$search}%")
                  ->orWhereHas('conductor', function ($conductorQuery) use ($search) {
                      $conductorQuery->where('first_name', 'like', "%{$search}%")
                                   ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        $mobilities = $query->orderBy('created_at', 'desc')
                           ->paginate(10)
                           ->withQueryString();

        // Obtener conductores para el modal
        $conductors = User::whereHas('roles', function ($q) {
            $q->where('name', 'conductor');
        })->orderBy('first_name', 'asc')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('movilidad/gestionar', [
            'mobilities' => $mobilities,
            'filters' => $request->only(['search']),
            'conductors' => $conductors,
        ]);
    }

    /**
     * Show the form for creating a new mobility.
     */
    public function create()
    {
        // Obtener solo usuarios con rol conductor
        $conductors = User::whereHas('roles', function ($q) {
            $q->where('name', 'conductor');
        })->orderBy('first_name', 'asc')->get();

        return Inertia::render('movilidad/crear', [
            'conductors' => $conductors,
        ]);
    }

    /**
     * Store a newly created mobility in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'plate' => 'required|string|max:20|unique:mobilities,plate',
            'conductor_user_id' => 'required|exists:users,id',
        ]);

        Mobility::create($validated);

        return redirect()
            ->route('movilidad.gestionar')
            ->with('success', 'Movilidad registrada exitosamente.');
    }

    /**
     * Display the specified mobility with all its documents.
     */
    public function show(Mobility $mobility)
    {
        $mobility->load([
            'conductor',
            'liquidator',
            'soat',
            'technicalReview',
            'permit',
            'fireExtinguisher',
            'propertyCard'
        ]);

        return Inertia::render('movilidad/detalles', [
            'mobility' => $mobility,
        ]);
    }

    /**
     * Show the form for editing the specified mobility.
     */
    public function edit(Mobility $mobility)
    {
        $conductors = User::whereHas('roles', function ($q) {
            $q->where('name', 'conductor');
        })->orderBy('first_name', 'asc')->get();

        return Inertia::render('movilidad/editar', [
            'mobility' => $mobility,
            'conductors' => $conductors,
        ]);
    }

    /**
     * Update the specified mobility in storage.
     */
    public function update(Request $request, Mobility $mobility)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'plate' => 'required|string|max:20|unique:mobilities,plate,' . $mobility->id,
            'conductor_user_id' => 'required|exists:users,id',
        ]);

        $mobility->update($validated);

        return redirect()
            ->route('movilidad.gestionar')
            ->with('success', 'Movilidad actualizada exitosamente.');
    }

    /**
     * Remove the specified mobility from storage.
     */
    public function destroy(Mobility $mobility)
    {
        try {
            $mobilityName = $mobility->name;
            $mobility->delete();

            return redirect()
                ->route('movilidad.gestionar')
                ->with('success', "Movilidad '{$mobilityName}' eliminada exitosamente.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'No se pudo eliminar la movilidad. Inténtalo nuevamente.');
        }
    }
}
