<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SellerRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'phone' => ['required', 'digits:9', 'regex:/^9[0-9]{8}$/'],
            'dni' => ['nullable', 'digits:8', 'numeric'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'Los nombres son obligatorios.',
            'first_name.string' => 'Los nombres deben ser texto válido.',
            'first_name.max' => 'Los nombres no pueden exceder 50 caracteres.',
            'last_name.required' => 'Los apellidos son obligatorios.',
            'last_name.string' => 'Los apellidos deben ser texto válido.',
            'last_name.max' => 'Los apellidos no pueden exceder 50 caracteres.',
            'phone.required' => 'El teléfono es obligatorio.',
            'phone.digits' => 'El teléfono debe tener exactamente 9 dígitos.',
            'phone.regex' => 'El teléfono debe empezar con 9 y contener solo números.',
            'dni.digits' => 'El DNI debe tener exactamente 8 dígitos.',
            'dni.numeric' => 'El DNI solo debe contener números.',
        ];
    }
}
