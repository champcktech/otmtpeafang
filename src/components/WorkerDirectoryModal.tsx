import React, { useMemo, useState } from 'react';
import { Plus, RotateCcw, Search, Trash2, UserPlus, X } from 'lucide-react';
import {
  RATE_LABEL,
  RATE_SHORT_LABEL,
  WORKER_TYPES,
  WorkerPreset,
  WorkerRow,
  WorkerType,
} from '../types/overtime';

interface WorkerDirectoryModalProps {
  open: boolean;
  presets: WorkerPreset[];
  currentWorkers: WorkerRow[];
  onClose: () => void;
  onAddPreset: (name: string, defaultType: WorkerType, alsoInsertToTable: boolean) => boolean;
  onRemovePreset: (id: string) => void;
  onInsertWorker: (preset: WorkerPreset) => void;
  onResetDefaults: () => void;
}

export const WorkerDirectoryModal: React.FC<WorkerDirectoryModalProps> = ({
  open,
  presets,
  currentWorkers,
  onClose,
  onAddPreset,
  onRemovePreset,
  onInsertWorker,
  onResetDefaults,
}) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WorkerType>('1');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentNamesSet = useMemo(
    () => new Set(currentWorkers.map((w) => w.name.trim()).filter(Boolean)),
    [currentWorkers]
  );

  const presetNamesSet = useMemo(
    () => new Set(presets.map((p) => p.name.trim())),
    [presets]
  );

  const unsavedFromTable = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ name: string; type: WorkerType }> = [];
    for (const w of currentWorkers) {
      const trimmed = w.name.trim();
      if (trimmed && !presetNamesSet.has(trimmed) && !seen.has(trimmed)) {
        seen.add(trimmed);
        list.push({ name: trimmed, type: w.type });
      }
    }
    return list;
  }, [currentWorkers, presetNamesSet]);

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        RATE_SHORT_LABEL[p.defaultType].toLowerCase().includes(q)
    );
  }, [presets, search]);

  if (!open) return null;

  const handleSubmit = (alsoInsert: boolean) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMsg('กรุณากรอกชื่อ-สกุลคนงาน');
      return;
    }
    if (presetNamesSet.has(trimmed)) {
      setErrorMsg('มีรายชื่อนี้อยู่ในคลังรายชื่อแล้ว');
      return;
    }
    const ok = onAddPreset(trimmed, newType, alsoInsert);
    if (ok) {
      setNewName('');
      setNewType('1');
      setErrorMsg(null);
    }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worker-dir-title"
    >
      <div className="w-full max-w-xl max-h-[88vh] rounded-xl border border-[#e3dcef] bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e2f2]">
          <div>
            <h2 id="worker-dir-title" className="text-base font-semibold text-[#242030]">
              จัดการและเพิ่มรายชื่อคนงาน
            </h2>
            <p className="text-xs text-[#6f6680] mt-0.5">
              รายชื่อที่บันทึกไว้จะแสดงเป็นตัวเลือกอัตโนมัติในตาราง และเลือกใส่ในเอกสารได้ทันที
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

        {/* Add New Worker Form */}
        <div className="px-6 py-4 bg-[#faf8fd] border-b border-[#e8e2f2] space-y-3">
          <div className="text-sm font-semibold text-[#3d1b5c]">เพิ่มรายชื่อคนงานใหม่</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-7">
              <label htmlFor="new-worker-name" className="block text-xs font-medium text-[#5d546e] mb-1">
                ชื่อ-สกุล
              </label>
              <input
                id="new-worker-name"
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(true);
                  }
                }}
                placeholder="เช่น นายสมชาย ใจดี"
                className="w-full px-3 py-2 text-sm bg-white border border-[#dad1ea] rounded-lg text-[#1f1a29] placeholder:text-[#9c93ad] focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30 focus:border-[#5b2a86]"
              />
            </div>
            <div className="sm:col-span-5">
              <label htmlFor="new-worker-type" className="block text-xs font-medium text-[#5d546e] mb-1">
                ประเภทเริ่มต้น
              </label>
              <select
                id="new-worker-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as WorkerType)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#dad1ea] rounded-lg text-[#1f1a29] focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30 focus:border-[#5b2a86]"
              >
                {WORKER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RATE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && <p className="text-xs font-medium text-[#b43c57]">{errorMsg}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#5b2a86] hover:bg-[#3d1b5c] text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>บันทึกและใส่ในตาราง</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#f4effa] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกเข้าคลังอย่างเดียว</span>
            </button>
          </div>
        </div>

        {/* Unsaved names currently typed in table */}
        {unsavedFromTable.length > 0 && (
          <div className="px-6 py-2.5 bg-[#fef9ec] border-b border-[#f5e3b3] flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#7c580c]">
              รายชื่อที่พิมพ์ในตาราง (ยังไม่บันทึก):
            </span>
            {unsavedFromTable.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onAddPreset(item.name, item.type, false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-[#e5c97b] text-[#5c3e05] hover:bg-[#fdf3d7] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>บันทึก {item.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Saved Directory List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#5d546e]">
              รายชื่อที่บันทึกไว้ ({presets.length} คน)
            </span>
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-[#8a809c] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ..."
                aria-label="ค้นหารายชื่อคนงาน"
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#dad1ea] rounded-lg text-[#1f1a29] placeholder:text-[#9c93ad] focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
              />
            </div>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#6f6680]">
              {presets.length === 0 ? 'ยังไม่มีรายชื่อคนงานที่บันทึกไว้' : 'ไม่พบรายชื่อที่ค้นหา'}
            </div>
          ) : (
            <div className="divide-y divide-[#f0ebf7] border border-[#e8e2f2] rounded-xl overflow-hidden">
              {filteredPresets.map((preset) => {
                const isInTable = currentNamesSet.has(preset.name.trim());
                return (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white hover:bg-[#faf8fd] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#242030] truncate">
                        {preset.name}
                      </div>
                      <div className="text-xs text-[#6f6680]">
                        {RATE_LABEL[preset.defaultType]}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onInsertWorker(preset)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                          isInTable
                            ? 'bg-[#f4effa] text-[#6f6680] hover:bg-[#e8ddf7] hover:text-[#3d1b5c]'
                            : 'bg-[#f4effa] text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#e8ddf7]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isInTable ? 'มีในตารางแล้ว (เพิ่มอีก)' : 'ใส่ในตาราง'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePreset(preset.id)}
                        aria-label={`ลบ ${preset.name} ออกจากคลังรายชื่อ`}
                        className="p-1.5 rounded-lg text-[#9e475e] hover:bg-[#fdf2f4] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e8e2f2] bg-[#faf8fd] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6f6680] hover:text-[#3d1b5c] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่ารายชื่อเริ่มต้น</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-[#d8d0e5] bg-white text-[#3d1b5c] hover:bg-[#f4effa] transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
