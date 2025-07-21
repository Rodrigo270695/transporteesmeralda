<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo verificar si el usuario está autenticado
        if (Auth::check()) {
            $user = Auth::user();

            // Verificar si el usuario está desactivado
            if ($user && $user->status === 'inactive') {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                // Si es una request AJAX/Inertia, retornar error JSON
                if ($request->expectsJson() || $request->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Tu cuenta ha sido desactivada. Contacta al administrador.',
                        'redirect' => route('login')
                    ], 401);
                }

                // Si es una request normal, redirigir al login con mensaje
                return redirect()->route('login')
                    ->with('error', 'Tu cuenta ha sido desactivada. Contacta al administrador.');
            }
        }

        return $next($request);
    }
}
