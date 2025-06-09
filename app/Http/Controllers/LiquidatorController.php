<?php

namespace App\Http\Controllers;

use App\Http\Requests\LiquidatorRequest;
use App\Models\Liquidator;
use App\Models\Mobility;

class LiquidatorController extends Controller
{
    /**
     * Store or update liquidator for a mobility
     */
    public function store(LiquidatorRequest $request, Mobility $mobility)
    {
        $validated = $request->validated();
        $validated['mobility_id'] = $mobility->id;

        // Si ya existe un liquidador, lo actualizamos; si no, creamos uno nuevo
        $liquidator = $mobility->liquidator;
        if ($liquidator) {
            $liquidator->update($validated);
            $message = 'Liquidador actualizado exitosamente.';
        } else {
            Liquidator::create($validated);
            $message = 'Liquidador registrado exitosamente.';
        }

        return back()->with('success', $message);
    }

    /**
     * Update liquidator
     */
    public function update(LiquidatorRequest $request, Mobility $mobility, Liquidator $liquidator)
    {
        $validated = $request->validated();
        $liquidator->update($validated);

        return back()->with('success', 'Liquidador actualizado exitosamente.');
    }

    /**
     * Remove liquidator from storage
     */
    public function destroy(Mobility $mobility)
    {
        if ($mobility->liquidator) {
            $mobility->liquidator->delete();
            return back()->with('success', 'Liquidador eliminado exitosamente.');
        }

        return back()->with('error', 'No se encontró liquidador para eliminar.');
    }
}
