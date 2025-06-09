<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'driver']);

        // Aplicar filtro de búsqueda si existe
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('roles', function ($roleQuery) use ($search) {
                      $roleQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $users = $query->orderBy('created_at', 'desc')
                      ->paginate(5)
                      ->withQueryString(); // Mantener parámetros de búsqueda en los links de paginación

        $roles = Role::all();

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

        return redirect()
            ->route('usuarios.gestionar')
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

        return redirect()
            ->route('usuarios.gestionar')
            ->with('success', 'Usuario actualizado exitosamente.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        try {
            $userName = $user->first_name . ' ' . $user->last_name;
            $user->delete();

            return redirect()
                ->route('usuarios.gestionar')
                ->with('success', "Usuario {$userName} eliminado exitosamente.");
        } catch (\Exception $e) {
            return redirect()
                ->route('usuarios.gestionar')
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
}
