<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user')->id;
        $driverId = $this->route('user')->driver?->id;

        $rules = [
            'first_name' => ['required', 'string', 'max:25'],
            'last_name' => ['required', 'string', 'max:25'],
            'dni' => ['required', 'string', 'size:8', Rule::unique('users', 'dni')->ignore($userId)],
            'phone' => ['required', 'string', 'size:9'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', 'string', Rule::in(['admin', 'cliente', 'conductor'])],
        ];

        // Si es conductor, agregar validaciones para licencia
        if ($this->input('role') === 'conductor') {
            $rules['license_number'] = ['required', 'string', 'max:20', Rule::unique('drivers', 'license_number')->ignore($driverId)];
            $rules['license_type'] = ['required', 'string', Rule::in([
                'A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc',
                'B-I', 'B-IIa', 'B-IIb', 'B-IIc',
                'C-I', 'C-II'
            ])];
        }

        return $rules;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'nombre',
            'last_name' => 'apellido',
            'dni' => 'DNI',
            'phone' => 'teléfono',
            'email' => 'correo electrónico',
            'password' => 'contraseña',
            'role' => 'rol',
            'license_number' => 'número de licencia',
            'license_type' => 'tipo de licencia',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'dni.size' => 'El DNI debe tener exactamente 8 dígitos.',
            'phone.size' => 'El teléfono debe tener exactamente 9 dígitos.',
            'dni.unique' => 'Este DNI ya está registrado.',
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'license_number.unique' => 'Este número de licencia ya está registrado.',
        ];
    }
}
