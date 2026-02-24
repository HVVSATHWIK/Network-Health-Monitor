import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, XCircle, FileText, X } from 'lucide-react';
import { IngestionPipeline } from '../services/IngestionPipeline';
import { RawTelemetry } from '../services/TelemetryMapper';
import { PerfMonitorService } from '../services/PerfMonitorService';
import { useNetworkStore } from '../store/useNetworkStore';

interface ImportResult {
    success: boolean;
    filename: string;
    format: 'json' | 'csv';
    total: number;
    ingested: number;
    alertsBefore: number;
    alertsAfter: number;
    devicesAffected: string[];
}

/** Parse a CSV string into an array of RawTelemetry objects */
function parseCSV(content: string): RawTelemetry[] {
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: RawTelemetry[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const obj: Record<string, unknown> = {};

        headers.forEach((h, idx) => {
            const val = values[idx] ?? '';
            if (val === '') return;
            // Auto-cast numbers
            const num = Number(val);
            obj[h] = isNaN(num) ? val : num;
        });

        // Minimal validation
        if (obj.deviceId || obj.ip || obj.mac) {
            rows.push(obj as unknown as RawTelemetry);
        }
    }

    return rows;
}

export const DataImporter: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [result, setResult] = useState<ImportResult | null>(null);

    const isTelemetryLike = (item: unknown): item is RawTelemetry => {
        if (!item || typeof item !== 'object') return false;
        const rec = item as Record<string, unknown>;
        return Boolean(rec.deviceId || rec.ip || rec.mac);
    };

    const ingestBatch = (batch: RawTelemetry[], filename: string, format: 'json' | 'csv') => {
        const store = useNetworkStore.getState();
        const alertsBefore = store.alerts.length;

        IngestionPipeline.processTelemetryBatch(batch);

        const storeAfter = useNetworkStore.getState();
        const alertsAfter = storeAfter.alerts.length;

        // Which devices were touched
        const touchedIds = [...new Set(batch.map(t => t.deviceId).filter(Boolean))];

        // Protect imported devices from simulation overwrite
        if (touchedIds.length > 0) {
            storeAfter.markDevicesAsFaulted(touchedIds);
        }
        const touchedNames = touchedIds
            .map(id => storeAfter.devices.find(d => d.id === id)?.name ?? id)
            .filter(Boolean);

        // Record in store so AI / Smart Logs can reference it
        store.recordImportEvent({
            filename,
            format,
            recordsIngested: batch.length,
            alertsGenerated: Math.max(0, alertsAfter - alertsBefore),
            devicesAffected: touchedNames,
            timestamp: Date.now(),
        });

        // Add a synthetic alert so the AI feed picks it up immediately
        store.addAlert({
            id: `import-${Date.now()}`,
            severity: 'info',
            layer: 'L7',
            device: touchedNames[0] ?? 'System',
            message: `Data import: ${batch.length} records from ${filename} (${format.toUpperCase()}) — ${Math.max(0, alertsAfter - alertsBefore)} new alerts generated across ${touchedNames.length} devices`,
            timestamp: new Date(),
            aiCorrelation: `Imported telemetry affected: ${touchedNames.join(', ')}`,
        });

        setResult({
            success: true,
            filename,
            format,
            total: batch.length,
            ingested: batch.length,
            alertsBefore,
            alertsAfter,
            devicesAffected: touchedNames,
        });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const startedAt = PerfMonitorService.startTimer();

        const isCSV = file.name.toLowerCase().endsWith('.csv');
        const isJSON = file.name.toLowerCase().endsWith('.json');

        if (!isCSV && !isJSON) {
            setResult({ success: false, filename: file.name, format: 'json', total: 0, ingested: 0, alertsBefore: 0, alertsAfter: 0, devicesAffected: [] });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                let batch: RawTelemetry[] = [];

                if (isCSV) {
                    batch = parseCSV(content);
                } else {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        batch = parsed.filter(isTelemetryLike);
                    }
                }

                if (batch.length > 0) {
                    PerfMonitorService.recordFileImport(batch.length, Math.max(0, performance.now() - startedAt));
                    ingestBatch(batch, file.name, isCSV ? 'csv' : 'json');
                } else {
                    setResult({ success: false, filename: file.name, format: isCSV ? 'csv' : 'json', total: 0, ingested: 0, alertsBefore: 0, alertsAfter: 0, devicesAffected: [] });
                }
            } catch (error) {
                if (import.meta.env.DEV) console.error('Import error:', error);
                setResult({ success: false, filename: file.name, format: isCSV ? 'csv' : 'json', total: 0, ingested: 0, alertsBefore: 0, alertsAfter: 0, devicesAffected: [] });
            }

            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <>
            <input
                type="file"
                accept=".json,.csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                id="data-import-trigger"
                onClick={() => fileInputRef.current?.click()}
                className="whitespace-nowrap flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full shadow-lg transition-all text-sm font-semibold"
                title="Import Telemetry (JSON or CSV)"
            >
                <Upload className="w-4 h-4" />
                <span>Import Data</span>
            </button>

            {/* Import result toast */}
            {result && (
                <div className="fixed bottom-6 right-6 z-[9999] max-w-md animate-in slide-in-from-bottom-4">
                    <div className={`rounded-xl border p-4 shadow-2xl backdrop-blur-lg ${result.success ? 'bg-emerald-950/90 border-emerald-700/50' : 'bg-red-950/90 border-red-700/50'}`}>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-semibold text-white truncate">{result.filename}</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">{result.format}</span>
                                </div>
                                {result.success ? (
                                    <>
                                        <p className="text-sm text-emerald-300">
                                            {result.ingested} record{result.ingested !== 1 ? 's' : ''} ingested successfully
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {Math.max(0, result.alertsAfter - result.alertsBefore)} new alert{Math.max(0, result.alertsAfter - result.alertsBefore) !== 1 ? 's' : ''} generated
                                            {result.devicesAffected.length > 0 && (
                                                <> · Devices: {result.devicesAffected.join(', ')}</>
                                            )}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-red-300">
                                        No valid telemetry records found. Expected JSON array or CSV with deviceId/ip/mac columns.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="text-slate-500 hover:text-white transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
