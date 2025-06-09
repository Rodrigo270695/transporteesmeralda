<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:100', 'unique:deliveries,name'],
            'delivery_date' => ['required', 'date'],
            'template_number' => ['required', 'string', 'max:15'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.string' => 'El nombre debe ser texto válido.',
            'name.max' => 'El nombre no puede exceder 100 caracteres.',
            'name.unique' => 'Ya existe una entrega con este nombre.',
            'delivery_date.required' => 'La fecha es obligatoria.',
            'delivery_date.date' => 'Debe ser una fecha válida.',
            'template_number.required' => 'El número de plantilla es obligatorio.',
            'template_number.string' => 'El número de plantilla debe ser texto válido.',
            'template_number.max' => 'El número de plantilla no puede exceder 15 caracteres.',
        ];
    }
}
