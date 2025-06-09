<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentMethodRequest;
use App\Http\Requests\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    /**
     * Display a listing of payment methods.
     */
    public function index(Request $request)
    {
        $query = PaymentMethod::query();

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $paymentMethods = $query->orderBy('created_at', 'desc')
                               ->paginate(10)
                               ->withQueryString();

        return Inertia::render('formas-pago/gestionar', [
            'paymentMethods' => $paymentMethods,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new payment method.
     */
    public function create()
    {
        return Inertia::render('formas-pago/crear');
    }

    /**
     * Store a newly created payment method in storage.
     */
    public function store(StorePaymentMethodRequest $request)
    {
        $validated = $request->validated();

        PaymentMethod::create($validated);

        return redirect()
            ->route('formas-pago.gestionar')
            ->with('success', 'Forma de pago registrada exitosamente.');
    }

    /**
     * Display the specified payment method.
     */
    public function show(PaymentMethod $paymentMethod)
    {
        return Inertia::render('formas-pago/mostrar', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    /**
     * Show the form for editing the specified payment method.
     */
    public function edit(PaymentMethod $paymentMethod)
    {
        return Inertia::render('formas-pago/editar', [
            'paymentMethod' => $paymentMethod,
        ]);
    }

    /**
     * Update the specified payment method in storage.
     */
    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod)
    {
        $validated = $request->validated();

        $paymentMethod->update($validated);

        return redirect()
            ->route('formas-pago.gestionar')
            ->with('success', 'Forma de pago actualizada exitosamente.');
    }

    /**
     * Remove the specified payment method from storage.
     */
    public function destroy(PaymentMethod $paymentMethod)
    {
        try {
            $paymentMethodName = $paymentMethod->name;
            $paymentMethod->delete();

            return redirect()
                ->route('formas-pago.gestionar')
                ->with('success', "Forma de pago '{$paymentMethodName}' eliminada exitosamente.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'No se pudo eliminar la forma de pago. Inténtalo nuevamente.');
        }
    }
}
