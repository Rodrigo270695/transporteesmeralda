<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentRequest;
use App\Models\FireExtinguisher;
use App\Models\Mobility;
use Illuminate\Support\Facades\Storage;

class FireExtinguisherController extends Controller
{
    /**
     * Store or update fire extinguisher for a mobility
     */
    public function store(DocumentRequest $request, Mobility $mobility)
    {
        $validated = $request->validated();
        $validated['mobility_id'] = $mobility->id;

        // Manejar subida de archivo
        if ($request->hasFile('digital_document')) {
            $file = $request->file('digital_document');
            $filename = 'fire_extinguisher_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/fire-extinguishers', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        // Si ya existe un extintor, lo actualizamos; si no, creamos uno nuevo
        $fireExtinguisher = $mobility->fireExtinguisher;
        if ($fireExtinguisher) {
            // Si hay un archivo anterior y se está subiendo uno nuevo, eliminar el anterior
            if (isset($validated['digital_document']) && $fireExtinguisher->digital_document) {
                Storage::disk('public')->delete($fireExtinguisher->digital_document);
            }
            $fireExtinguisher->update($validated);
            $message = 'Extintor actualizado exitosamente.';
        } else {
            FireExtinguisher::create($validated);
            $message = 'Extintor registrado exitosamente.';
        }

        return back()->with('success', $message);
    }

    /**
     * Update fire extinguisher
     */
    public function update(DocumentRequest $request, Mobility $mobility, FireExtinguisher $fireExtinguisher)
    {
        $validated = $request->validated();

        // Remover digital_document de los datos validados para evitar que se borre si no se sube archivo
        unset($validated['digital_document']);

        // Manejar subida de archivo solo si se proporciona uno nuevo
        if ($request->hasFile('digital_document')) {
            // Eliminar archivo anterior si existe
            if ($fireExtinguisher->digital_document) {
                Storage::disk('public')->delete($fireExtinguisher->digital_document);
            }

            $file = $request->file('digital_document');
            $filename = 'fire_extinguisher_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/fire-extinguishers', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        $fireExtinguisher->update($validated);

        return back()->with('success', 'Extintor actualizado exitosamente.');
    }

    /**
     * Remove fire extinguisher from storage
     */
    public function destroy(Mobility $mobility)
    {
        if ($mobility->fireExtinguisher) {
            // Eliminar archivo si existe
            if ($mobility->fireExtinguisher->digital_document) {
                Storage::disk('public')->delete($mobility->fireExtinguisher->digital_document);
            }

            $mobility->fireExtinguisher->delete();
            return back()->with('success', 'Extintor eliminado exitosamente.');
        }

        return back()->with('error', 'No se encontró extintor para eliminar.');
    }

    /**
     * View fire extinguisher document in browser
     */
    public function viewDocument(Mobility $mobility)
    {
        $fireExtinguisher = $mobility->fireExtinguisher;

        if (!$fireExtinguisher || !$fireExtinguisher->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $fireExtinguisher->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $mimeType = mime_content_type($filePath);

        return response()->file($filePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline'
        ]);
    }

    /**
     * Download fire extinguisher document
     */
    public function downloadDocument(Mobility $mobility)
    {
        $fireExtinguisher = $mobility->fireExtinguisher;

        if (!$fireExtinguisher || !$fireExtinguisher->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $fireExtinguisher->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $fileName = 'Extintor_' . $mobility->name . '_' . $mobility->plate . '.' . pathinfo($fireExtinguisher->digital_document, PATHINFO_EXTENSION);

        return response()->download($filePath, $fileName);
    }
}
