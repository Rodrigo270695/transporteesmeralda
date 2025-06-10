<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryPointRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Determinar si es para actualización (conductor) o creación (admin)
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $isConductorUpdate = $isUpdate && $this->has('status');

        if ($isConductorUpdate) {
            // Validaciones para conductor (actualizando estado)
            return $this->conductorUpdateRules();
        }

        // Validaciones para admin (creando/editando punto)
        return $this->adminRules();
    }

    /**
     * Validaciones para administrador (crear/editar punto)
     */
    protected function adminRules(): array
    {
        return [
            // Información del punto
            'point_name' => ['required', 'string', 'max:100'],
            'address' => ['required', 'string'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'reference' => ['nullable', 'string'],

            // Información comercial
            'client_user_id' => ['required', 'exists:users,id'],
            'seller_id' => ['required', 'exists:sellers,id'],
            'mobility_id' => ['required', 'exists:mobilities,id'],
            'amount_to_collect' => ['required', 'numeric', 'min:0', 'max:999999.99'],

            // Control y planificación
            'priority' => ['required', 'in:alta,media,baja'],
            'estimated_delivery_time' => ['nullable', 'date_format:H:i'],
            'delivery_instructions' => ['nullable', 'string'],
            'route_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Validaciones para conductor (actualizar estado)
     */
    protected function conductorUpdateRules(): array
    {
        $rules = [
            'status' => ['required', 'in:pendiente,en_ruta,entregado,cancelado,reagendado'],
        ];

        // Si está marcando como entregado, requerir información de pago y entrega
        if ($this->input('status') === 'entregado') {
            $rules = array_merge($rules, [
                'payment_method_id' => ['required', 'exists:payment_methods,id'],
                'amount_collected' => ['required', 'numeric', 'min:0', 'max:999999.99'],
                'payment_image' => ['required', 'string'], // Base64 o ruta
                'payment_reference' => ['nullable', 'string', 'max:50'],
                'payment_notes' => ['nullable', 'string'],
                'delivery_image' => ['required', 'string'], // Base64 o ruta
                'observation' => ['nullable', 'string'],
                'customer_rating' => ['nullable', 'integer', 'between:1,5'],
            ]);
        }

        // Si está marcando como cancelado, requerir motivo
        if ($this->input('status') === 'cancelado') {
            $rules['cancellation_reason'] = ['required', 'string'];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            // Información del punto
            'point_name.required' => 'El nombre del punto es obligatorio.',
            'point_name.max' => 'El nombre del punto no puede exceder 100 caracteres.',
            'address.required' => 'La dirección es obligatoria.',
            'latitude.required' => 'Las coordenadas son obligatorias.',
            'latitude.between' => 'La latitud debe estar entre -90 y 90.',
            'longitude.required' => 'Las coordenadas son obligatorias.',
            'longitude.between' => 'La longitud debe estar entre -180 y 180.',

            // Información comercial
            'client_user_id.required' => 'El cliente es obligatorio.',
            'client_user_id.exists' => 'El cliente seleccionado no existe.',
            'seller_id.required' => 'El vendedor es obligatorio.',
            'seller_id.exists' => 'El vendedor seleccionado no existe.',
            'mobility_id.required' => 'El vehículo es obligatorio.',
            'mobility_id.exists' => 'El vehículo seleccionado no existe.',
            'amount_to_collect.required' => 'El monto a cobrar es obligatorio.',
            'amount_to_collect.numeric' => 'El monto debe ser un número válido.',
            'amount_to_collect.min' => 'El monto debe ser mayor o igual a 0.',
            'amount_to_collect.max' => 'El monto no puede exceder 999,999.99.',

            // Control y planificación
            'priority.required' => 'La prioridad es obligatoria.',
            'priority.in' => 'La prioridad debe ser alta, media o baja.',
            'estimated_delivery_time.date_format' => 'El tiempo estimado debe tener formato HH:MM.',

            // Estado
            'status.required' => 'El estado es obligatorio.',
            'status.in' => 'El estado seleccionado no es válido.',

            // Información de pago (conductor)
            'payment_method_id.required' => 'La forma de pago es obligatoria para completar la entrega.',
            'payment_method_id.exists' => 'La forma de pago seleccionada no existe.',
            'amount_collected.required' => 'El monto cobrado es obligatorio.',
            'amount_collected.numeric' => 'El monto cobrado debe ser un número válido.',
            'payment_image.required' => 'La foto del comprobante es obligatoria.',
            'payment_reference.max' => 'La referencia no puede exceder 50 caracteres.',

            // Información de entrega (conductor)
            'delivery_image.required' => 'La foto de entrega es obligatoria.',
            'customer_rating.integer' => 'La calificación debe ser un número entero.',
            'customer_rating.between' => 'La calificación debe estar entre 1 y 5.',

            // Cancelación
            'cancellation_reason.required' => 'El motivo de cancelación es obligatorio.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Si es una actualización de conductor y viene arrival_time, establecerlo
        if ($this->isMethod('put') && $this->input('status') === 'en_ruta') {
            $this->merge([
                'arrival_time' => now(),
            ]);
        }

        // Si es completado, establecer delivered_at
        if ($this->isMethod('put') && $this->input('status') === 'entregado') {
            $this->merge([
                'delivered_at' => now(),
                'departure_time' => now(),
            ]);
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validar que el monto cobrado no sea muy diferente al planificado
            if ($this->has(['amount_collected', 'amount_to_collect'])) {
                $collected = (float) $this->input('amount_collected');
                $planned = (float) $this->input('amount_to_collect', 0);

                if ($planned > 0) {
                    $difference = abs($collected - $planned) / $planned * 100;

                    // Si la diferencia es mayor al 20%, requerir notas
                    if ($difference > 20 && empty($this->input('payment_notes'))) {
                        $validator->errors()->add('payment_notes',
                            'Debe agregar observaciones cuando el monto cobrado difiere significativamente del planificado.'
                        );
                    }
                }
            }

            // Validar que el cliente tenga rol de cliente
            if ($this->has('client_user_id')) {
                $user = \App\Models\User::find($this->input('client_user_id'));
                if ($user && !$user->hasRole('cliente')) {
                    $validator->errors()->add('client_user_id',
                        'El usuario seleccionado no tiene rol de cliente.'
                    );
                }
            }
        });
    }
}
