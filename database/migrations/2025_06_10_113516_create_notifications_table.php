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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // status_change, proximity, delivery, reschedule, payment, system
            $table->string('title');
            $table->text('message');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Cliente que recibe la notificación
            $table->foreignId('delivery_point_id')->nullable()->constrained('delivery_points')->onDelete('cascade');
            $table->string('delivery_point_name')->nullable();
            $table->json('data')->nullable(); // Datos adicionales en JSON
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            // Índices para mejor performance
            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
            $table->index(['delivery_point_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
