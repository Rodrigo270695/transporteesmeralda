<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentRequest;
use App\Models\Soat;
use App\Models\Mobility;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class SoatController extends Controller
{
    /**
     * Store or update SOAT for a mobility
     */
    public function store(DocumentRequest $request, Mobility $mobility)
    {
        $validated = $request->validated();
        $validated['mobility_id'] = $mobility->id;

        // Manejar subida de archivo
        if ($request->hasFile('digital_document')) {
            $file = $request->file('digital_document');
            $filename = 'soat_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/soat', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        // Si ya existe un SOAT, lo actualizamos; si no, creamos uno nuevo
        $soat = $mobility->soat;
        if ($soat) {
            // Si hay un archivo anterior y se está subiendo uno nuevo, eliminar el anterior
            if (isset($validated['digital_document']) && $soat->digital_document) {
                Storage::disk('public')->delete($soat->digital_document);
            }
            $soat->update($validated);
            $message = 'SOAT actualizado exitosamente.';
        } else {
            $soat = Soat::create($validated);
            $message = 'SOAT registrado exitosamente.';
        }

        return back()->with('success', $message);
    }

    /**
     * Update SOAT
     */
    public function update(DocumentRequest $request, Mobility $mobility, Soat $soat)
    {
        $validated = $request->validated();

        // Remover digital_document de los datos validados para evitar que se borre si no se sube archivo
        unset($validated['digital_document']);

        // Manejar subida de archivo solo si se proporciona uno nuevo
        if ($request->hasFile('digital_document')) {
            // Eliminar archivo anterior si existe
            if ($soat->digital_document) {
                Storage::disk('public')->delete($soat->digital_document);
            }

            $file = $request->file('digital_document');
            $filename = 'soat_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/soat', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        $soat->update($validated);

        return back()->with('success', 'SOAT actualizado exitosamente.');
    }

    /**
     * Remove SOAT from storage
     */
    public function destroy(Mobility $mobility)
    {
        if ($mobility->soat) {
            // Eliminar archivo si existe
            if ($mobility->soat->digital_document) {
                Storage::disk('public')->delete($mobility->soat->digital_document);
            }

            $mobility->soat->delete();
            return back()->with('success', 'SOAT eliminado exitosamente.');
        }

        return back()->with('error', 'No se encontró SOAT para eliminar.');
    }

    /**
     * View SOAT document in browser
     */
    public function viewDocument(Mobility $mobility)
    {
        $soat = $mobility->soat;

        if (!$soat || !$soat->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $soat->digital_document);

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
     * Download SOAT document
     */
    public function downloadDocument(Mobility $mobility)
    {
        $soat = $mobility->soat;

        if (!$soat || !$soat->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $soat->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $fileName = 'SOAT_' . $mobility->name . '_' . $mobility->plate . '.' . pathinfo($soat->digital_document, PATHINFO_EXTENSION);

        return response()->download($filePath, $fileName);
    }
}
