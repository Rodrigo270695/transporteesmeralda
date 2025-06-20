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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->date('delivery_date');
            $table->string('template_number', 15);
            $table->foreignId('zone_id')->constrained('zones')->onDelete('restrict');
            $table->enum('status', ['programada', 'en_progreso', 'completada', 'cancelada'])->default('programada');
            $table->timestamps();

            // Índices para optimización
            $table->index(['status', 'delivery_date'], 'idx_status_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
