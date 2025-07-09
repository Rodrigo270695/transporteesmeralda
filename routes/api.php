<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\Api\Mobile\MobileAuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Rutas API para conductores (PWA)
Route::middleware(['auth:web'])->prefix('conductor')->name('api.conductor.')->group(function () {
    // Ubicación
    Route::post('location', [DriverController::class, 'updateLocation'])->name('location');
    Route::post('location/bulk', [DriverController::class, 'updateLocationBulk'])->name('location.bulk');

    // Entregas
    Route::post('delivery/{delivery}/update', [DriverController::class, 'updateDeliveryStatus'])->name('delivery.update');
    Route::put('punto/{deliveryPoint}', [DriverController::class, 'updatePoint'])->name('punto.update');

    // Imágenes
    Route::post('upload-image', [DriverController::class, 'uploadImages'])->name('upload-image');

    // Sincronización
    Route::post('sync', [DriverController::class, 'syncData'])->name('sync');

    // Notificaciones Push
    Route::post('push-subscription', [DriverController::class, 'storePushSubscription'])->name('push-subscription.store');
    Route::delete('push-subscription', [DriverController::class, 'removePushSubscription'])->name('push-subscription.remove');
});

// ══════════════════════════════════════════════════════════════
// 📱 RUTAS API PARA APLICACIÓN MÓVIL
// ══════════════════════════════════════════════════════════════

Route::prefix('mobile')->name('mobile.')->group(function () {

    // Rutas públicas (sin autenticación)
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [MobileAuthController::class, 'login'])->name('login');
    });

    // Rutas protegidas (requieren autenticación)
    Route::middleware('auth:sanctum')->group(function () {

        // Autenticación
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('logout', [MobileAuthController::class, 'logout'])->name('logout');
            Route::get('me', [MobileAuthController::class, 'me'])->name('me');
            Route::post('update-location', [MobileAuthController::class, 'updateLocation'])->name('update-location');
        });

    });
});
