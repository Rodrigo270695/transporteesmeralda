<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Driver;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // First, create roles
        $this->call(RolePermissionSeeder::class);

        // Create admin user
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'System',
            'dni' => '77344506',
            'phone' => '987654321',
            'email' => 'admin@transportesesmeralda.com',
            'password' => Hash::make('*Rodrigo95*'),
        ]);

        // Assign admin role
        $admin->assignRole('admin');

        // Create test cliente user
        $cliente = User::create([
            'first_name' => 'Cliente',
            'last_name' => 'Test',
            'dni' => '87654321',
            'phone' => '123456789',
            'email' => 'cliente@example.com',
            'password' => Hash::make('cliente123'),
        ]);

        // Assign cliente role
        $cliente->assignRole('cliente');

        // Create test conductor user
        $conductor = User::create([
            'first_name' => 'Conductor',
            'last_name' => 'Test',
            'dni' => '11223344',
            'phone' => '555666777',
            'email' => 'conductor@example.com',
            'password' => Hash::make('conductor123'),
        ]);

        // Assign conductor role
        $conductor->assignRole('conductor');

        // Create driver profile for conductor
        Driver::create([
            'user_id' => $conductor->id,
            'license_number' => 'Q12345678',
            'license_type' => 'B-I',
        ]);

        // Create additional test users for pagination testing
        $additionalUsers = [
            ['María', 'García', '12345678', '987111222', 'maria@example.com', 'cliente'],
            ['Carlos', 'López', '23456789', '987222333', 'carlos@example.com', 'conductor'],
            ['Ana', 'Martínez', '34567890', '987333444', 'ana@example.com', 'cliente'],
            ['Luis', 'Rodríguez', '45678901', '987444555', 'luis@example.com', 'conductor'],
            ['Carmen', 'Fernández', '56789012', '987555666', 'carmen@example.com', 'cliente'],
            ['José', 'González', '67890123', '987666777', 'jose@example.com', 'cliente'],
            ['Laura', 'Sánchez', '78901234', '987777888', 'laura@example.com', 'conductor'],
            ['Pedro', 'Ramírez', '89012345', '987888999', 'pedro@example.com', 'cliente'],
            ['Elena', 'Torres', '90123456', '987999000', 'elena@example.com', 'cliente'],
            ['Miguel', 'Vargas', '01234567', '987000111', 'miguel@example.com', 'conductor'],
            ['Rosa', 'Morales', '13579246', '987111000', 'rosa@example.com', 'cliente'],
            ['Antonio', 'Jiménez', '24681357', '987222111', 'antonio@example.com', 'cliente'],
        ];

        foreach ($additionalUsers as $index => $userData) {
            $user = User::create([
                'first_name' => $userData[0],
                'last_name' => $userData[1],
                'dni' => $userData[2],
                'phone' => $userData[3],
                'email' => $userData[4],
                'password' => Hash::make('password123'),
            ]);

            $user->assignRole($userData[5]);

            // Create driver profile for conductors
            if ($userData[5] === 'conductor') {
                Driver::create([
                    'user_id' => $user->id,
                    'license_number' => 'Q' . str_pad($index + 10000000, 8, '0', STR_PAD_LEFT),
                    'license_type' => ['B-I', 'B-IIa', 'A-I', 'C-I'][array_rand(['B-I', 'B-IIa', 'A-I', 'C-I'])],
                ]);
            }
        }

        $this->command->info('Users created successfully:');
        $this->command->info('Admin: DNI 77344506 / Phone 987654321 / Password: admin123');
        $this->command->info('Cliente: DNI 87654321 / Phone 123456789 / Password: cliente123');
        $this->command->info('Conductor: DNI 11223344 / Phone 555666777 / Password: conductor123');
        $this->command->info('Additional 12 users created for testing pagination');
        $this->command->info('Driver profile created for conductor with license Q12345678 (B-I)');
    }
}
