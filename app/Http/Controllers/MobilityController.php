<?php

namespace App\Http\Controllers;

use App\Models\Mobility;
use App\Models\User;
use App\Exports\MobilityExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class MobilityController extends Controller
{
    /**
     * Display a listing of mobilities.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Mobility::with(['conductor', 'liquidator', 'soat', 'technicalReview', 'permit', 'fireExtinguisher', 'propertyCard']);

        // Verificar si es conductor (roles ya cargados en middleware)
        $userRoles = $user->roles->pluck('name')->toArray();
        $isConductor = in_array('conductor', $userRoles);

        // Si el usuario es conductor, filtrar solo sus movilidades
        if ($isConductor) {
            $query->where('conductor_user_id', $user->id);
        }

        // Aplicar filtro de búsqueda si existe (solo para administradores)
        if (!$isConductor && $request->has('search') && !empty($request->search)) {
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
            'userRole' => $isConductor ? 'conductor' : 'admin',
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
        $user = Auth::user();

        // Verificar si es conductor (roles ya cargados en middleware)
        $userRoles = $user->roles->pluck('name')->toArray();
        $isConductor = in_array('conductor', $userRoles);

        // Si es conductor, verificar que puede ver esta movilidad
        if ($isConductor && $mobility->conductor_user_id !== $user->id) {
            abort(403, 'No tienes permisos para ver esta movilidad.');
        }

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
            'userRole' => $isConductor ? 'conductor' : 'admin',
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

    /**
     * Export mobilities to Excel
     */
    public function export()
    {
        try {
            $fileName = 'reporte_movilidades_' . now()->format('Y-m-d_H-i-s') . '.xlsx';

            return Excel::download(new MobilityExport, $fileName);
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al generar el reporte Excel. Inténtalo nuevamente.');
        }
    }
}
