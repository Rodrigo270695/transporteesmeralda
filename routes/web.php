<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;

// Redireccionar la raíz al login
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Rutas de Usuarios
    Route::prefix('usuarios')->name('usuarios.')->group(function () {
        Route::get('registrar-cliente', [UserController::class, 'registrarCliente'])->name('registrar-cliente');
        Route::get('registrar-conductor', [UserController::class, 'registrarConductor'])->name('registrar-conductor');
        Route::get('gestionar', [UserController::class, 'index'])->name('gestionar');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('{user}', [UserController::class, 'show'])->name('show');
        Route::put('{user}', [UserController::class, 'update'])->name('update');
        Route::delete('{user}', [UserController::class, 'destroy'])->name('destroy');
    });

    // Rutas de Transportes
    Route::prefix('transportes')->group(function () {
        Route::get('vehiculos', function () {
            return Inertia::render('transportes/vehiculos');
        })->name('transportes.vehiculos');

        Route::get('rutas', function () {
            return Inertia::render('transportes/rutas');
        })->name('transportes.rutas');

        Route::get('programar', function () {
            return Inertia::render('transportes/programar');
        })->name('transportes.programar');
    });

    // Rutas de Gestión
    Route::prefix('gestion')->group(function () {
        Route::get('reservas', function () {
            return Inertia::render('gestion/reservas');
        })->name('gestion.reservas');

        Route::get('facturacion', function () {
            return Inertia::render('gestion/facturacion');
        })->name('gestion.facturacion');
    });

    // Rutas de Reportes
    Route::prefix('reportes')->group(function () {
        Route::get('ingresos', function () {
            return Inertia::render('reportes/ingresos');
        })->name('reportes.ingresos');

        Route::get('viajes', function () {
            return Inertia::render('reportes/viajes');
        })->name('reportes.viajes');

        Route::get('estadisticas', function () {
            return Inertia::render('reportes/estadisticas');
        })->name('reportes.estadisticas');
    });

    // Configuración
    Route::get('configuracion', function () {
        return Inertia::render('configuracion');
    })->name('configuracion');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
