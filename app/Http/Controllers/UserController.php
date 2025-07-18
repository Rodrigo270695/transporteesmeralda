<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Models\Driver;
use App\Exports\ClientsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;

use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of users (only admins).
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'driver'])
                    ->whereHas('roles', function ($q) {
                        $q->where('name', 'admin');
                    });

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
                      ->paginate(10)
                      ->withQueryString(); // Mantener parámetros de búsqueda en los links de paginación

        $roles = Role::where('name', 'admin')->get();

        return Inertia::render('usuarios/gestionar', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $roles = Role::all();

        return Inertia::render('usuarios/crear', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        // Crear el usuario
        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'dni' => $validated['dni'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        // Asignar rol
        if (isset($validated['role'])) {
            $user->assignRole($validated['role']);
        }

        // Si es conductor, crear perfil de conductor
        if ($validated['role'] === 'conductor' && isset($validated['license_number'])) {
            Driver::create([
                'user_id' => $user->id,
                'license_number' => $validated['license_number'],
                'license_type' => $validated['license_type'],
            ]);
        }

        // Redirigir según el rol del usuario creado
        $redirectRoute = match ($validated['role']) {
            'cliente' => 'usuarios.gestionar-clientes',
            'conductor' => 'usuarios.gestionar-conductores',
            'admin' => 'usuarios.gestionar',
            default => 'usuarios.gestionar'
        };

        return redirect()
            ->route($redirectRoute)
            ->with('success', 'Usuario registrado exitosamente.');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        $user->load(['roles', 'driver']);

        return Inertia::render('usuarios/mostrar', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $user->load(['roles', 'driver']);
        $roles = Role::all();

        return Inertia::render('usuarios/editar', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

        // Actualizar datos del usuario
        $updateData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'dni' => $validated['dni'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
        ];

        // Solo actualizar contraseña si se proporciona
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Actualizar rol
        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        // Actualizar perfil de conductor si aplica
        if ($validated['role'] === 'conductor') {
            if ($user->driver) {
                $user->driver->update([
                    'license_number' => $validated['license_number'],
                    'license_type' => $validated['license_type'],
                ]);
            } else {
                Driver::create([
                    'user_id' => $user->id,
                    'license_number' => $validated['license_number'],
                    'license_type' => $validated['license_type'],
                ]);
            }
        } else {
            // Si ya no es conductor, eliminar perfil de conductor
            if ($user->driver) {
                $user->driver->delete();
            }
        }

        // Redirigir según el rol del usuario actualizado
        $redirectRoute = match ($validated['role']) {
            'cliente' => 'usuarios.gestionar-clientes',
            'conductor' => 'usuarios.gestionar-conductores',
            'admin' => 'usuarios.gestionar',
            default => 'usuarios.gestionar'
        };

        return redirect()
            ->route($redirectRoute)
            ->with('success', 'Usuario actualizado exitosamente.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user)
    {
        try {
            $userName = $user->first_name . ' ' . $user->last_name;

            // Obtener el rol del usuario antes de eliminarlo
            $userRole = $user->roles->first()?->name ?? 'admin';

            $user->delete();

            // Determinar la ruta de redirección basada en el rol del usuario eliminado
            $redirectRoute = match ($userRole) {
                'cliente' => 'usuarios.gestionar-clientes',
                'conductor' => 'usuarios.gestionar-conductores',
                'admin' => 'usuarios.gestionar',
                default => 'usuarios.gestionar'
            };

            return redirect()
                ->route($redirectRoute)
                ->with('success', "Usuario {$userName} eliminado exitosamente.");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'No se pudo eliminar el usuario. Inténtalo nuevamente.');
        }
    }

    /**
     * Show form for registering a cliente.
     */
    public function registrarCliente()
    {
        return Inertia::render('usuarios/registrar-cliente');
    }

    /**
     * Show form for registering a conductor.
     */
    public function registrarConductor()
    {
        return Inertia::render('usuarios/registrar-conductor');
    }

    /**
     * Display a listing of clients only.
     */
    public function gestionarClientes(Request $request)
    {
        $query = User::with(['roles', 'driver'])
                    ->whereHas('roles', function ($q) {
                        $q->where('name', 'cliente');
                    });

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
                      ->paginate(5)
                      ->withQueryString();

        $roles = Role::where('name', 'cliente')->get();

        return Inertia::render('usuarios/gestionar-clientes', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display a listing of drivers only.
     */
    public function gestionarConductores(Request $request)
    {
        $query = User::with(['roles', 'driver'])
                    ->whereHas('roles', function ($q) {
                        $q->where('name', 'conductor');
                    });

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
                      ->paginate(5)
                      ->withQueryString();

        $roles = Role::where('name', 'conductor')->get();

        return Inertia::render('usuarios/gestionar-conductores', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Export clients to Excel
     */
    public function exportClients()
    {
        try {
            $fileName = 'reporte_clientes_' . now()->format('Y-m-d_H-i-s') . '.xlsx';

            return Excel::download(new ClientsExport, $fileName);
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al generar el reporte Excel. Inténtalo nuevamente.');
        }
    }
}
