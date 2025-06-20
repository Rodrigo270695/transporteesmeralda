<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ZoneController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DeliveryPointController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\SellerController;
use App\Http\Controllers\MobilityController;
use App\Http\Controllers\LiquidatorController;
use App\Http\Controllers\SoatController;
use App\Http\Controllers\TechnicalReviewController;
use App\Http\Controllers\PermitController;
use App\Http\Controllers\FireExtinguisherController;
use App\Http\Controllers\PropertyCardController;

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
        Route::get('gestionar-clientes', [UserController::class, 'gestionarClientes'])->name('gestionar-clientes');
        Route::get('gestionar-conductores', [UserController::class, 'gestionarConductores'])->name('gestionar-conductores');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('{user}', [UserController::class, 'show'])->name('show');
        Route::put('{user}', [UserController::class, 'update'])->name('update');
        Route::delete('{user}', [UserController::class, 'destroy'])->name('destroy');
    });

    // Rutas de Transportes
    Route::prefix('transportes')->group(function () {
        Route::get('rutas', function () {
            return Inertia::render('transportes/rutas');
        })->name('transportes.rutas');

        Route::get('programar', function () {
            return Inertia::render('transportes/programar');
        })->name('transportes.programar');
    });

    // Rutas de Movilidad
    Route::prefix('movilidad')->name('movilidad.')->group(function () {
        Route::get('gestionar', [MobilityController::class, 'index'])->name('gestionar');
        Route::get('crear', [MobilityController::class, 'create'])->name('crear');
        Route::post('/', [MobilityController::class, 'store'])->name('store');
        Route::get('{mobility}', [MobilityController::class, 'show'])->name('detalles');
        Route::get('{mobility}/editar', [MobilityController::class, 'edit'])->name('editar');
        Route::put('{mobility}', [MobilityController::class, 'update'])->name('update');
        Route::delete('{mobility}', [MobilityController::class, 'destroy'])->name('destroy');

        // Rutas para documentos de movilidad
        Route::prefix('{mobility}')->group(function () {
            // Liquidador
            Route::post('liquidador', [LiquidatorController::class, 'store'])->name('liquidador.store');
            Route::put('liquidador/{liquidator}', [LiquidatorController::class, 'update'])->name('liquidador.update');
            Route::delete('liquidador', [LiquidatorController::class, 'destroy'])->name('liquidador.destroy');

            // SOAT
            Route::post('soat', [SoatController::class, 'store'])->name('soat.store');
            Route::put('soat/{soat}', [SoatController::class, 'update'])->name('soat.update');
            Route::delete('soat', [SoatController::class, 'destroy'])->name('soat.destroy');
            Route::get('soat/view', [SoatController::class, 'viewDocument'])->name('soat.view');
            Route::get('soat/download', [SoatController::class, 'downloadDocument'])->name('soat.download');

            // Revisión Técnica
            Route::post('revision-tecnica', [TechnicalReviewController::class, 'store'])->name('revision-tecnica.store');
            Route::put('revision-tecnica/{technical_review}', [TechnicalReviewController::class, 'update'])->name('revision-tecnica.update');
            Route::delete('revision-tecnica', [TechnicalReviewController::class, 'destroy'])->name('revision-tecnica.destroy');
            Route::get('revision-tecnica/view', [TechnicalReviewController::class, 'viewDocument'])->name('revision-tecnica.view');
            Route::get('revision-tecnica/download', [TechnicalReviewController::class, 'downloadDocument'])->name('revision-tecnica.download');

            // Permisos
            Route::post('permiso', [PermitController::class, 'store'])->name('permiso.store');
            Route::put('permiso/{permit}', [PermitController::class, 'update'])->name('permiso.update');
            Route::delete('permiso', [PermitController::class, 'destroy'])->name('permiso.destroy');
            Route::get('permiso/view', [PermitController::class, 'viewDocument'])->name('permiso.view');
            Route::get('permiso/download', [PermitController::class, 'downloadDocument'])->name('permiso.download');

            // Extintor
            Route::post('extintor', [FireExtinguisherController::class, 'store'])->name('extintor.store');
            Route::put('extintor/{fire_extinguisher}', [FireExtinguisherController::class, 'update'])->name('extintor.update');
            Route::delete('extintor', [FireExtinguisherController::class, 'destroy'])->name('extintor.destroy');
            Route::get('extintor/view', [FireExtinguisherController::class, 'viewDocument'])->name('extintor.view');
            Route::get('extintor/download', [FireExtinguisherController::class, 'downloadDocument'])->name('extintor.download');

            // Tarjeta de Propiedad
            Route::post('tarjeta-propiedad', [PropertyCardController::class, 'store'])->name('tarjeta-propiedad.store');
            Route::put('tarjeta-propiedad/{property_card}', [PropertyCardController::class, 'update'])->name('tarjeta-propiedad.update');
            Route::delete('tarjeta-propiedad', [PropertyCardController::class, 'destroy'])->name('tarjeta-propiedad.destroy');
            Route::get('tarjeta-propiedad/view', [PropertyCardController::class, 'viewDocument'])->name('tarjeta-propiedad.view');
            Route::get('tarjeta-propiedad/download', [PropertyCardController::class, 'downloadDocument'])->name('tarjeta-propiedad.download');
        });
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

    // Rutas de Formas de Pago
    Route::prefix('formas-pago')->name('formas-pago.')->group(function () {
        Route::get('gestionar', [PaymentMethodController::class, 'index'])->name('gestionar');
        Route::post('/', [PaymentMethodController::class, 'store'])->name('store');
        Route::get('{payment_method}', [PaymentMethodController::class, 'show'])->name('show');
        Route::put('{payment_method}', [PaymentMethodController::class, 'update'])->name('update');
        Route::delete('{payment_method}', [PaymentMethodController::class, 'destroy'])->name('destroy');
    });

    // Rutas de Zonas
    Route::prefix('zonas')->name('zonas.')->group(function () {
        Route::get('gestionar', [ZoneController::class, 'index'])->name('gestionar');
        Route::post('/', [ZoneController::class, 'store'])->name('store');
        Route::get('{zone}', [ZoneController::class, 'show'])->name('show');
        Route::put('{zone}', [ZoneController::class, 'update'])->name('update');
        Route::delete('{zone}', [ZoneController::class, 'destroy'])->name('destroy');
    });

    // Rutas de Vendedores
    Route::prefix('vendedores')->name('vendedores.')->group(function () {
        Route::get('gestionar', [SellerController::class, 'index'])->name('gestionar');
        Route::post('/', [SellerController::class, 'store'])->name('store');
        Route::get('{seller}', [SellerController::class, 'show'])->name('show');
        Route::put('{seller}', [SellerController::class, 'update'])->name('update');
        Route::delete('{seller}', [SellerController::class, 'destroy'])->name('destroy');
    });

    // Rutas de Entregas
    Route::prefix('entregas')->name('entregas.')->group(function () {
        Route::get('gestionar', [DeliveryController::class, 'index'])->name('gestionar');
        Route::post('/', [DeliveryController::class, 'store'])->name('store');
        Route::post('{delivery}/duplicar', [DeliveryController::class, 'duplicate'])->name('duplicate');
        Route::get('{delivery}', [DeliveryController::class, 'show'])->name('show');
        Route::put('{delivery}', [DeliveryController::class, 'update'])->name('update');
        Route::delete('{delivery}', [DeliveryController::class, 'destroy'])->name('destroy');

        // Rutas para cambio de estado
        Route::post('{delivery}/iniciar', [DeliveryController::class, 'start'])->name('start');
        Route::post('{delivery}/cancelar', [DeliveryController::class, 'cancel'])->name('cancel');
        Route::post('{delivery}/reactivar', [DeliveryController::class, 'reactivate'])->name('reactivate');

                // Rutas de Puntos de Entrega
        Route::prefix('{delivery}/puntos')->name('puntos.')->group(function () {
            Route::get('/', [DeliveryPointController::class, 'index'])->name('index');
            Route::get('mapa', [DeliveryPointController::class, 'map'])->name('map');
            Route::get('crear', [DeliveryPointController::class, 'create'])->name('create');
            Route::post('/', [DeliveryPointController::class, 'store'])->name('store');
            Route::get('{deliveryPoint}', [DeliveryPointController::class, 'show'])->name('show');
            Route::get('{deliveryPoint}/editar', [DeliveryPointController::class, 'edit'])->name('edit');
            Route::put('{deliveryPoint}', [DeliveryPointController::class, 'update'])->name('update');
            Route::delete('{deliveryPoint}', [DeliveryPointController::class, 'destroy'])->name('destroy');

            // Rutas especiales
                            Route::post('bulk-order', [DeliveryPointController::class, 'bulkUpdateOrder'])->name('bulk-order');
                Route::post('update-order', [DeliveryPointController::class, 'updateOrder'])->name('update-order');
                Route::post('{deliveryPoint}/upload-images', [DeliveryPointController::class, 'uploadImages'])->name('upload-images');
            Route::post('optimize-route', [DeliveryPointController::class, 'optimizeRoute'])->name('optimize-route');
        });

        // Ruta especial para conductores
        Route::get('{delivery}/conductor', [DeliveryPointController::class, 'forConductor'])->name('conductor');
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

    // Rutas para Conductores
    Route::prefix('conductor')->name('conductor.')->group(function () {
        Route::get('dashboard', [DriverController::class, 'dashboard'])->name('dashboard');
        Route::get('entrega/{delivery}', [DriverController::class, 'delivery'])->name('entrega');
        Route::put('punto/{deliveryPoint}', [DriverController::class, 'updatePoint'])->name('actualizar-punto');
        Route::post('imagenes', [DriverController::class, 'uploadImages'])->name('subir-imagenes');
        Route::post('ubicacion', [DriverController::class, 'updateLocation'])->name('actualizar-ubicacion');
        Route::get('entrega/{delivery}/siguiente-punto', [DriverController::class, 'nextPoint'])->name('siguiente-punto');
    });

    // Configuración
    Route::get('configuracion', function () {
        return Inertia::render('configuracion');
    })->name('configuracion');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
