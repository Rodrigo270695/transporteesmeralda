<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentRequest;
use App\Models\TechnicalReview;
use App\Models\Mobility;
use Illuminate\Support\Facades\Storage;

class TechnicalReviewController extends Controller
{
    /**
     * Store or update technical review for a mobility
     */
    public function store(DocumentRequest $request, Mobility $mobility)
    {
        $validated = $request->validated();
        $validated['mobility_id'] = $mobility->id;

        // Manejar subida de archivo
        if ($request->hasFile('digital_document')) {
            $file = $request->file('digital_document');
            $filename = 'technical_review_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/technical-reviews', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        // Si ya existe una revisión técnica, la actualizamos; si no, creamos una nueva
        $technicalReview = $mobility->technicalReview;
        if ($technicalReview) {
            // Si hay un archivo anterior y se está subiendo uno nuevo, eliminar el anterior
            if (isset($validated['digital_document']) && $technicalReview->digital_document) {
                Storage::disk('public')->delete($technicalReview->digital_document);
            }
            $technicalReview->update($validated);
            $message = 'Revisión técnica actualizada exitosamente.';
        } else {
            TechnicalReview::create($validated);
            $message = 'Revisión técnica registrada exitosamente.';
        }

        return back()->with('success', $message);
    }

    /**
     * Update technical review
     */
    public function update(DocumentRequest $request, Mobility $mobility, TechnicalReview $technicalReview)
    {
        $validated = $request->validated();

        // Remover digital_document de los datos validados para evitar que se borre si no se sube archivo
        unset($validated['digital_document']);

        // Manejar subida de archivo solo si se proporciona uno nuevo
        if ($request->hasFile('digital_document')) {
            // Eliminar archivo anterior si existe
            if ($technicalReview->digital_document) {
                Storage::disk('public')->delete($technicalReview->digital_document);
            }

            $file = $request->file('digital_document');
            $filename = 'technical_review_' . $mobility->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('documents/technical-reviews', $filename, 'public');
            $validated['digital_document'] = $path;
        }

        $technicalReview->update($validated);

        return back()->with('success', 'Revisión técnica actualizada exitosamente.');
    }

    /**
     * Remove technical review from storage
     */
    public function destroy(Mobility $mobility)
    {
        if ($mobility->technicalReview) {
            // Eliminar archivo si existe
            if ($mobility->technicalReview->digital_document) {
                Storage::disk('public')->delete($mobility->technicalReview->digital_document);
            }

            $mobility->technicalReview->delete();
            return back()->with('success', 'Revisión técnica eliminada exitosamente.');
        }

        return back()->with('error', 'No se encontró revisión técnica para eliminar.');
    }

    /**
     * View technical review document in browser
     */
    public function viewDocument(Mobility $mobility)
    {
        $technicalReview = $mobility->technicalReview;

        if (!$technicalReview || !$technicalReview->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $technicalReview->digital_document);

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
     * Download technical review document
     */
    public function downloadDocument(Mobility $mobility)
    {
        $technicalReview = $mobility->technicalReview;

        if (!$technicalReview || !$technicalReview->digital_document) {
            abort(404, 'Documento no encontrado.');
        }

        $filePath = storage_path('app/public/' . $technicalReview->digital_document);

        if (!file_exists($filePath)) {
            abort(404, 'Archivo no encontrado.');
        }

        $fileName = 'RevisionTecnica_' . $mobility->name . '_' . $mobility->plate . '.' . pathinfo($technicalReview->digital_document, PATHINFO_EXTENSION);

        return response()->download($filePath, $fileName);
    }
}
