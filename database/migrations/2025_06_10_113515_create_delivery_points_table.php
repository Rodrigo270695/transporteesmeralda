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
        Schema::create('delivery_points', function (Blueprint $table) {
            // ═══════════════════════════════════════════════════════════
            // 🆔 IDENTIFICACIÓN Y RELACIONES
            // ═══════════════════════════════════════════════════════════
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries')->onDelete('cascade');
            $table->integer('route_order')->default(0);

            // ═══════════════════════════════════════════════════════════
            // 📍 INFORMACIÓN DEL PUNTO (ADMIN DEFINE)
            // ═══════════════════════════════════════════════════════════
            $table->string('point_name', 100);
            $table->text('address');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->text('reference')->nullable();

            // ═══════════════════════════════════════════════════════════
            // 💼 INFORMACIÓN COMERCIAL (ADMIN DEFINE)
            // ═══════════════════════════════════════════════════════════
            $table->foreignId('client_user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('seller_id')->constrained('sellers')->onDelete('restrict');
            $table->foreignId('mobility_id')->constrained('mobilities')->onDelete('restrict');
            $table->decimal('amount_to_collect', 8, 2);

            // ═══════════════════════════════════════════════════════════
            // 📋 CONTROL Y PLANIFICACIÓN (ADMIN DEFINE)
            // ═══════════════════════════════════════════════════════════
            $table->enum('priority', ['alta', 'media', 'baja'])->default('media');
            $table->time('estimated_delivery_time')->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->enum('status', ['pendiente', 'en_ruta', 'entregado', 'cancelado', 'reagendado'])->default('pendiente');

            // ═══════════════════════════════════════════════════════════
            // 💰 INFORMACIÓN DE PAGO (CONDUCTOR ACTUALIZA)
            // ═══════════════════════════════════════════════════════════
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->onDelete('set null');
            $table->decimal('amount_collected', 8, 2)->nullable();
            $table->string('payment_image')->nullable();
            $table->string('payment_reference', 50)->nullable();
            $table->text('payment_notes')->nullable();

            // ═══════════════════════════════════════════════════════════
            // 📦 INFORMACIÓN DE ENTREGA (CONDUCTOR ACTUALIZA)
            // ═══════════════════════════════════════════════════════════
            $table->string('delivery_image')->nullable();
            $table->text('observation')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->tinyInteger('customer_rating')->nullable();
            $table->text('customer_comment')->nullable();
            $table->timestamp('rated_at')->nullable();

            // ═══════════════════════════════════════════════════════════
            // ⏰ CONTROL DE TIEMPOS (SISTEMA/CONDUCTOR ACTUALIZA)
            // ═══════════════════════════════════════════════════════════
            $table->timestamp('arrival_time')->nullable();
            $table->timestamp('departure_time')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            // ═══════════════════════════════════════════════════════════
            // 🔑 ÍNDICES PARA OPTIMIZACIÓN
            // ═══════════════════════════════════════════════════════════
            $table->index(['delivery_id', 'status'], 'idx_delivery_status');
            $table->index(['seller_id', 'created_at'], 'idx_seller_date');
            $table->index(['client_user_id', 'created_at'], 'idx_client_date');
            $table->index(['mobility_id', 'status'], 'idx_mobility_status');
            $table->index(['latitude', 'longitude'], 'idx_coordinates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_points');
    }
};
