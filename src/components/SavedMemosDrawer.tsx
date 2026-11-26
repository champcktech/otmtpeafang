import React from 'react';
import { Trash2, X, FileText } from 'lucide-react';
import { SavedMemo } from '../types/overtime';
import { formatCurrency, thaiDateFull } from '../utils/thaiFormat';

interface SavedMemosDrawerProps {
  open: boolean;
  memos: SavedMemo[];
  onClose: () => void;
  onLoad: (memo: SavedMemo) => void;
  onDelete: (id: string) => void;
}

export const SavedMemosDrawer: React.FC<SavedMemosDrawerProps> = ({
  open,
  memos,
  onClose,
  onLoad,
  onDelete,
}) => {
  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex justify-end bg-slate-900/35"
      role="dialog"
      aria-modal="true"
      aria-label="ประวัติเอกสารที่บันทึก"
    >
      <div className="w-full max-w-md bg-white h-full border-l border-[#e3dcef] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2f2]">
          <div>
            <h2 className="text-base font-semibold text-[#242030]">ประวัติบันทึกข้อความที่บันทึกไว้</h2>
            <p className="text-xs text-[#6f6680] mt-0.5">
              บันทึกในเครื่องอัตโนมัติสำหรับเรียกใช้ซ้ำหรือแก้ไข
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 rounded-lg text-[#6f6680] hover:text-[#242030] hover:bg-[#f4effa] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {memos.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 mx-auto text-[#c3b8d6] mb-3" />
              <p className="text-sm font-medium text-[#3d1b5c]">ยังไม่มีเอกสารที่บันทึกไว้</p>
              <p className="text-xs text-[#6f6680] mt-1">
                กดปุ่ม &ldquo;บันทึกเก็บไว้&rdquo; เพื่อเก็บแบบฟอร์มไว้ใช้งานครั้งถัดไป
              </p>
            </div>
          ) : (
            memos.map((memo) => {
              const workerCount = memo.data.workers.filter((w) => w.name.trim()).length;
              return (
                <div
                  key={memo.id}
                  className="border border-[#e3dcef] rounded-xl p-4 bg-white hover:border-[#b9a6d9] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-[#242030] truncate">
                        {memo.data.jobName.trim() || 'ไม่ระบุชื่องาน'}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6f6680]">
                        <span>ปฏิบัติงาน {thaiDateFull(memo.data.workDate)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{workerCount} คน</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num font-semibold text-[#3d1b5c]">
                          {formatCurrency(memo.totalCost)} บาท
                        </span>
                      </div>
                      {memo.data.repairNo.trim() && (
                        <div className="mt-1 text-xs text-[#6f6680]">
                          ใบสั่งซ่อม <span className="font-mono-num">{memo.data.repairNo}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(memo.id)}
                      aria-label="ลบรายการที่บันทึก"
                      className="p-1.5 rounded-lg text-[#9e475e] hover:bg-[#fdf2f4] transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#f1edf7] flex items-center justify-between">
                    <span className="text-[11px] text-[#8a809c]">
                      บันทึกเมื่อ {new Date(memo.savedAt).toLocaleString('th-TH')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onLoad(memo)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f4effa] text-[#3d1b5c] hover:bg-[#e6daf6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      เปิดใช้งาน
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
