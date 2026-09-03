import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4">
        {isDestructive && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1c2a3a]">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-lg border border-[#223347] bg-[#141e2b] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-[#1b2839] transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          disabled={isLoading}
          className={`rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-[#00e5c9] text-[#041816] hover:bg-[#1affda]'
          }`}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
