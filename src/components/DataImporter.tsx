import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { IngestionPipeline } from '../services/IngestionPipeline';
import { RawTelemetry } from '../services/TelemetryMapper';

export const DataImporter: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isTelemetryLike = (item: unknown): item is RawTelemetry => {
        if (!item || typeof item !== 'object') return false;
        const rec = item as Record<string, unknown>;
        return Boolean(rec.deviceId || rec.ip || rec.mac);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);

                if (Array.isArray(parsedData)) {
                    // Validate minimal structure
                    const validBatch = parsedData.filter(isTelemetryLike);

                    if (validBatch.length > 0) {
                        IngestionPipeline.processTelemetryBatch(validBatch);
                        alert(`Successfully imported ${validBatch.length} telemetry records.`);
                    } else {
                        alert('No valid telemetry records found in JSON.');
                    }
                } else {
                    alert('Invalid JSON format. Expected an array of telemetry objects.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to parse JSON file.');
            }

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <>
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                id="data-import-trigger"
                onClick={() => fileInputRef.current?.click()}
                className="whitespace-nowrap flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full shadow-lg transition-all text-sm font-semibold"
                title="Import Telemetry JSON"
            >
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
            </button>
        </>
    );
};
