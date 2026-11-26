import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'ยกเลิก',
  tone = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#e3dcef] bg-white p-6 shadow-xl">
        <h3 id="confirm-modal-title" className="text-lg font-semibold text-[#242030]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#625972]">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#d8d0e5] bg-white text-[#3d1b5c] hover:bg-[#f4effa] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tone === 'danger'
                ? 'bg-[#b43c57] hover:bg-[#962f46]'
                : 'bg-[#5b2a86] hover:bg-[#3d1b5c]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
