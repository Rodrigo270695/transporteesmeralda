<?php

namespace App\Http\Controllers;

use App\Http\Requests\SellerRequest;
use App\Models\Seller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellerController extends Controller
{
    /**
     * Display a listing of sellers.
     */
    public function index(Request $request)
    {
        $query = Seller::query();

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%");
            });
        }

        $sellers = $query->orderBy('created_at', 'desc')
                        ->paginate(10)
                        ->withQueryString();

        return Inertia::render('vendedores/gestionar', [
            'sellers' => $sellers,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new seller.
     */
    public function create()
    {
        return Inertia::render('vendedores/crear');
    }

    /**
     * Store a newly created seller in storage.
     */
    public function store(SellerRequest $request)
    {
        $validated = $request->validated();

        Seller::create($validated);

        return redirect()
            ->route('vendedores.gestionar')
            ->with('success', 'Vendedor registrado exitosamente.');
    }

    /**
     * Display the specified seller.
     */
    public function show(Seller $seller)
    {
        return Inertia::render('vendedores/mostrar', [
            'seller' => $seller,
        ]);
    }

    /**
     * Show the form for editing the specified seller.
     */
    public function edit(Seller $seller)
    {
        return Inertia::render('vendedores/editar', [
            'seller' => $seller,
        ]);
    }

    /**
     * Update the specified seller in storage.
     */
    public function update(SellerRequest $request, Seller $seller)
    {
        $validated = $request->validated();

        $seller->update($validated);

        return redirect()
            ->route('vendedores.gestionar')
            ->with('success', 'Vendedor actualizado exitosamente.');
    }

    /**
     * Remove the specified seller from storage.
     */
    public function destroy(Seller $seller)
    {
        try {
            $sellerName = $seller->full_name;
            $seller->delete();

            return redirect()
                ->route('vendedores.gestionar')
                ->with('success', "Vendedor '{$sellerName}' eliminado exitosamente.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'No se pudo eliminar el vendedor. Inténtalo nuevamente.');
        }
    }
}
