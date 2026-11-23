import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { ImportBatchResult } from '../../types/api';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_CSV_CONTENT = [
  'property_slug,external_id,reviewer_name,guest_country_code,guest_country_name,trip_type,room_type,stay_nights,score,title,positive_comment,negative_comment,review_date',
  'amsterdam-canal-house,SAMPLE-9001,Claire V.,FR,France,couple,Canal View Deluxe,3,9.3,"Magical weekend on the canals","Spotless room, warm staff at reception, and delicious croissants at breakfast.","Street noise on Saturday night.",2026-10-12',
  'berlin-business-hotel,SAMPLE-9002,Henrik S.,SE,Sweden,business,Executive Work Suite,2,8.7,"Reliable business stay","Fast wifi for video calls and very quiet soundproofed room.","Coffee machine at breakfast was slow.",2026-10-14',
].join('\n');

export function ImportModal({ open, onOpenChange }: ImportModalProps): React.JSX.Element {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<ImportBatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadImportFile(file),
    onSuccess: (result) => {
      setBatchResult(result);
      void queryClient.invalidateQueries();
      showToast({
        title: `Import complete: ${result.importedRows} new reviews`,
        description: `${result.duplicateRows} duplicates skipped, ${result.failedRows} failed validation.`,
        variant: result.failedRows > 0 ? 'info' : 'success',
      });
    },
    onError: (err: Error) => {
      showToast({
        title: 'Import failed',
        description: err.message,
        variant: 'error',
      });
    },
  });

  const handleFileSelect = (file: File | undefined): void => {
    if (!file) return;
    setSelectedFile(file);
    setBatchResult(null);
  };

  const downloadSampleCsv = (): void => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-reviews-import.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedFile(null);
          setBatchResult(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-elevated"
        >
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-content-primary">
                Import Guest Reviews (CSV / JSON)
              </Dialog.Title>
              <p className="mt-0.5 text-xs text-content-secondary">
                Idempotent upload: duplicates are skipped automatically via external_id or SHA-256 content hash.
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close import modal"
                className="rounded-md p-1.5 text-content-muted hover:bg-subtle hover:text-content-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileSelect(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-7 text-center transition-colors ${
              dragActive
                ? 'border-brand bg-brand-subtle'
                : 'border-border-strong bg-subtle/40 hover:border-brand/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <UploadCloud className="h-8 w-8 text-brand" />
            <p className="mt-2 text-sm font-medium text-content-primary">
              {selectedFile ? selectedFile.name : 'Drag & drop a .csv or .json file here'}
            </p>
            <p className="mt-1 text-xs text-content-muted">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to import`
                : 'or click to browse from your computer (max 5 MB)'}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download sample CSV template
            </button>
            <span className="text-content-muted">
              Valid slugs: amsterdam-canal-house, barcelona-beach-resort, berlin-business-hotel, zurich-alpine-lodge
            </span>
          </div>

          {batchResult && (
            <div className="mt-4 rounded-lg border border-border bg-subtle/60 p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-content-primary">
                <CheckCircle2 className="h-4 w-4 text-sentiment-pos" />
                Batch Import Summary ({batchResult.filename})
              </div>
              <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
                <div className="rounded bg-surface p-2 border border-border">
                  <p className="text-content-muted">Total Rows</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {batchResult.totalRows}
                  </p>
                </div>
                <div className="rounded bg-surface p-2 border border-border">
                  <p className="text-sentiment-pos">Imported</p>
                  <p className="mt-0.5 text-sm font-semibold text-sentiment-pos tabular-nums">
                    {batchResult.importedRows}
                  </p>
                </div>
                <div className="rounded bg-surface p-2 border border-border">
                  <p className="text-content-secondary">Duplicates</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {batchResult.duplicateRows}
                  </p>
                </div>
                <div className="rounded bg-surface p-2 border border-border">
                  <p className="text-sentiment-neg">Failed</p>
                  <p className="mt-0.5 text-sm font-semibold text-sentiment-neg tabular-nums">
                    {batchResult.failedRows}
                  </p>
                </div>
              </div>

              {batchResult.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto rounded border border-sentiment-neg/30 bg-sentiment-neg-bg p-2.5 space-y-1">
                  <p className="font-semibold text-sentiment-neg flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Row-level Validation Errors:
                  </p>
                  {batchResult.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-content-primary font-mono">
                      Row #{err.rowNumber} {err.field ? `[${err.field}]` : ''}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-content-secondary hover:bg-subtle"
              >
                Close
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {uploadMutation.isPending ? 'Importing & Tagging...' : 'Run Import'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
