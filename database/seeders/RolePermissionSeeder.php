<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create basic roles for transport system
        $roles = [
            'admin',
            'cliente',
            'conductor'
        ];

        // Create roles
        foreach ($roles as $role) {
            Role::create(['name' => $role]);
        }

        $this->command->info('Roles created successfully!');
        $this->command->info('Created roles: Admin, Cliente, Conductor');
    }
}
