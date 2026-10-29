"use client";

import { Printer } from "lucide-react";

/**
 * Printing is a real workflow for staff: a case file goes to the consular
 * officer on paper, and a cash receipt is handed to the client at the desk.
 * The stylesheet in globals.css strips the app chrome for the printed copy.
 */
export function PrintButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className ?? "btn-secondary btn-sm"}>
      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
