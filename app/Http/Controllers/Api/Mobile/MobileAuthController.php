<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\HasApiTokens;

class MobileAuthController extends Controller
{
    /**
     * Login de usuario móvil
     */
    public function login(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|size:8',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('dni', $request->dni)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'DNI o contraseña incorrectos.',
            ], 401);
        }

        // Verificar que el usuario tiene rol de cliente
        if (!$user->hasRole('cliente')) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado. Esta aplicación es solo para clientes.',
            ], 403);
        }

        // Crear token de acceso
        $token = $user->createToken('mobile-app')->plainTextToken;

        // Cargar roles y permisos
        $user->load('roles', 'permissions');

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'dni' => $user->dni,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'full_name' => $user->getFullNameAttribute(),
                    'is_client' => $user->getIsClientAttribute(),
                    'is_conductor' => $user->getIsConductorAttribute(),
                    'is_admin' => $user->getIsAdminAttribute(),
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout de usuario móvil
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('roles', 'permissions');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'dni' => $user->dni,
                'phone' => $user->phone,
                'email' => $user->email,
                'full_name' => $user->getFullNameAttribute(),
                'is_client' => $user->getIsClientAttribute(),
                'is_conductor' => $user->getIsConductorAttribute(),
                'is_admin' => $user->getIsAdminAttribute(),
            ],
        ]);
    }

    /**
     * Actualizar ubicación del usuario (para conductores)
     */
    public function updateLocation(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        $user->update([
            'current_latitude' => $request->latitude,
            'current_longitude' => $request->longitude,
            'last_location_update' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ubicación actualizada exitosamente.',
        ]);
    }
}
