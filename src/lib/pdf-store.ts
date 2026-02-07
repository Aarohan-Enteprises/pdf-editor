// Module-level store for transferring PDF data between tool pages.
// Works because Next.js client-side navigation preserves JS module state.

let pendingPDF: { data: ArrayBuffer; filename: string } | null = null;

export function setPendingPDF(data: Uint8Array, filename: string) {
  // Store as ArrayBuffer (valid BlobPart) to avoid TS Uint8Array/SharedArrayBuffer issues
  pendingPDF = { data: new Uint8Array(data).buffer as ArrayBuffer, filename };
}

export function getPendingPDF(): { data: ArrayBuffer; filename: string } | null {
  const pdf = pendingPDF;
  pendingPDF = null; // Clear after retrieval (one-time use)
  return pdf;
}
