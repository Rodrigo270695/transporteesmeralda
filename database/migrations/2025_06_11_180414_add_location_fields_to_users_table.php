<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('current_latitude', 10, 8)->nullable()->comment('Latitud actual del conductor');
            $table->decimal('current_longitude', 11, 8)->nullable()->comment('Longitud actual del conductor');
            $table->timestamp('last_location_update')->nullable()->comment('Última actualización de ubicación');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['current_latitude', 'current_longitude', 'last_location_update']);
        });
    }
};
