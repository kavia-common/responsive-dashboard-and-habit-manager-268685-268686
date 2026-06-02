import React, {useMemo, useState} from 'react';

import {Button} from '../../ui/primitives/Button';
import {FormField} from '../../ui/primitives/FormField';
import {useData} from '../../state/data/DataContext';

function downloadText(filename, text) {
    const blob = new Blob([text], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// PUBLIC_INTERFACE
export function ExportPage() {
    /** Data export/import page (JSON) using the local-first data store. */
    const data = useData();
    const snapshot = data.getSnapshot();

    const [importText, setImportText] = useState('');
    const [status, setStatus] = useState('');
    const exportJson = useMemo(() => JSON.stringify(data.exportData(), null, 2), [data, snapshot.meta && snapshot.meta.updatedAt]);

    function onDownload() {
        const name = `habit-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
        downloadText(name, exportJson);
        setStatus('Downloaded JSON export.');
    }

    function onCopy() {
        navigator.clipboard
            .writeText(exportJson)
            .then(() => setStatus('Copied export JSON to clipboard.'))
            .catch(() => setStatus('Unable to copy to clipboard.'));
    }

    function onImport() {
        setStatus('');
        try {
            data.importData(importText);
            setImportText('');
            setStatus('Import complete. Your local data was replaced by the imported dataset.');
        } catch (e) {
            setStatus(e && e.message ? e.message : 'Import failed.');
        }
    }

    return (
        <div>
            <h1 className="pageTitle">Export / Import</h1>
            <p className="pageHint">Download your data as JSON, or import from a previous export. (CSV can be added once required.)</p>

            <div className="grid2">
                <div className="card">
                    <div className="cardTitle">Export</div>
                    <div className="mutedText">
                        This export includes habits, check-ins, reminders, and settings. Sync queue is omitted.
                    </div>

                    <div style={{display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap'}}>
                        <Button onClick={onDownload}>Download JSON</Button>
                        <Button variant="secondary" onClick={onCopy}>
                            Copy JSON
                        </Button>
                    </div>

                    <div className="mutedText" style={{marginTop: 12, fontSize: 12}}>
                        Preview:
                    </div>
                    <pre
                        style={{
                            marginTop: 8,
                            padding: 12,
                            borderRadius: 12,
                            border: '1px solid rgba(17, 24, 39, 0.10)',
                            background: 'rgba(17, 24, 39, 0.03)',
                            maxHeight: 260,
                            overflow: 'auto',
                            fontSize: 12
                        }}
                    >
                        {exportJson}
                    </pre>
                </div>

                <div className="card">
                    <div className="cardTitle">Import</div>
                    <div className="mutedText">
                        Import replaces your local dataset. Keep a backup export before importing.
                    </div>

                    <div className="form" style={{marginTop: 12}}>
                        <FormField label="Paste export JSON">
                            <textarea
                                className="input"
                                style={{height: 240, resize: 'vertical'}}
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder='{"habits":[...],"checkins":[...],"reminders":[...],"settings":{...}}'
                            />
                        </FormField>

                        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                            <Button variant="secondary" onClick={() => setImportText('')}>
                                Clear
                            </Button>
                            <Button onClick={onImport} disabled={!importText.trim()}>
                                Import
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {status ? (
                <div className="card" style={{marginTop: 14}}>
                    <div className="cardTitle">Status</div>
                    <div className="mutedText">{status}</div>
                </div>
            ) : null}
        </div>
    );
}
