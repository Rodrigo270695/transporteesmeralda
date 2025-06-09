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
        Schema::create('liquidators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mobility_id')->constrained('mobilities')->onDelete('restrict');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('dni', 20);
            $table->string('phone', 20);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('liquidators');
    }
};
