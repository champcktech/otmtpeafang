import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  FileSpreadsheet,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { BudgetDeductionPreview } from './components/BudgetDeductionPreview';
import { ConfirmModal } from './components/ConfirmModal';
import { MemoPreview } from './components/MemoPreview';
import { SavedMemosDrawer } from './components/SavedMemosDrawer';
import { WorkerDirectoryModal } from './components/WorkerDirectoryModal';
import {
  APPROVER_LEVELS,
  APPROVER_NAMES,
  createDefaultFormData,
  createEmptyWorkItem,
  createEmptyWorker,
  createSampleFormData,
  DEFAULT_RATES,
  DEFAULT_WORKER_PRESETS,
  MULTIPLIER_OPTIONS,
  OvertimeFormData,
  RATE_LABEL,
  RATE_SHORT_LABEL,
  SavedMemo,
  SUPERVISOR_LEVELS,
  SUPERVISOR_NAMES,
  WageRates,
  WORKER_TYPES,
  WorkerPeriodMode,
  WorkerPreset,
  WorkerRow,
  WorkerType,
} from './types/overtime';
import { ExcelExportResult, exportMemoToExcel } from './utils/exportExcel';
import {
  bahtText,
  calculateAutoHours,
  calculateWorkerCost,
  formatCurrency,
  getAutoHoursForForm,
  thaiDateFull,
  thaiDayName,
} from './utils/thaiFormat';

const STORAGE_DRAFT_KEY = 'pea_fang_overtime_draft_v1';
const STORAGE_RATES_KEY = 'pea_fang_overtime_rates_v1';
const STORAGE_DEFAULT_RATES_KEY = 'pea_fang_overtime_default_rates_v1';
const STORAGE_SAVED_KEY = 'pea_fang_overtime_saved_v1';
const STORAGE_WORKER_DIRECTORY_KEY = 'pea_fang_overtime_worker_directory_v1';

export default function App() {
  const [formData, setFormData] = useState<OvertimeFormData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<OvertimeFormData>;
        const defaults = createDefaultFormData();
        return {
          ...defaults,
          ...parsed,
          workItems:
            Array.isArray(parsed.workItems) && parsed.workItems.length > 0
              ? parsed.workItems
              : defaults.workItems,
          workers:
            Array.isArray(parsed.workers) && parsed.workers.length > 0
              ? parsed.workers
              : defaults.workers,
        };
      }
    } catch {
      // Ignore invalid local storage
    }
    return createDefaultFormData();
  });

  const [defaultRates, setDefaultRates] = useState<WageRates>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_DEFAULT_RATES_KEY);
      if (raw) {
        return { ...DEFAULT_RATES, ...(JSON.parse(raw) as Partial<WageRates>) };
      }
    } catch {
      // Ignore invalid local storage
    }
    return { ...DEFAULT_RATES };
  });

  const [rates, setRates] = useState<WageRates>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_RATES_KEY);
      if (raw) {
        return { ...DEFAULT_RATES, ...(JSON.parse(raw) as Partial<WageRates>) };
      }
      const rawDefault = localStorage.getItem(STORAGE_DEFAULT_RATES_KEY);
      if (rawDefault) {
        return { ...DEFAULT_RATES, ...(JSON.parse(rawDefault) as Partial<WageRates>) };
      }
    } catch {
      // Ignore invalid local storage
    }
    return { ...DEFAULT_RATES };
  });

  const [savedMemos, setSavedMemos] = useState<SavedMemo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignore invalid local storage
    }
    return [];
  });

  const [workerDirectory, setWorkerDirectory] = useState<WorkerPreset[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_WORKER_DIRECTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore invalid local storage
    }
    return DEFAULT_WORKER_PRESETS;
  });

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workerDirOpen, setWorkerDirOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'both' | 'memo' | 'budget'>('both');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [readyExcel, setReadyExcel] = useState<ExcelExportResult | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(formData));
    } catch {
      // Ignore storage quota errors
    }
  }, [formData]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RATES_KEY, JSON.stringify(rates));
    } catch {
      // Ignore storage quota errors
    }
  }, [rates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DEFAULT_RATES_KEY, JSON.stringify(defaultRates));
    } catch {
      // Ignore storage quota errors
    }
  }, [defaultRates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedMemos));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedMemos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WORKER_DIRECTORY_KEY, JSON.stringify(workerDirectory));
    } catch {
      // Ignore storage quota errors
    }
  }, [workerDirectory]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!readyExcel) return;
    return () => {
      URL.revokeObjectURL(readyExcel.url);
    };
  }, [readyExcel]);

  const autoHours1 = useMemo(
    () => calculateAutoHours(formData.timeStart, formData.timeEnd),
    [formData.timeStart, formData.timeEnd]
  );

  const autoHours2 = useMemo(
    () =>
      formData.useSecondPeriod
        ? calculateAutoHours(formData.timeStart2 ?? '', formData.timeEnd2 ?? '')
        : 0,
    [formData.useSecondPeriod, formData.timeStart2, formData.timeEnd2]
  );

  const autoHours = useMemo(
    () => Math.round((autoHours1 + autoHours2) * 100) / 100,
    [autoHours1, autoHours2]
  );

  const totalCost = useMemo(() => {
    return formData.workers.reduce(
      (sum, w) => sum + calculateWorkerCost(w, rates, getAutoHoursForForm(formData, w.period)),
      0
    );
  }, [formData, rates]);

  const totalBahtText = useMemo(() => bahtText(totalCost), [totalCost]);

  const budgetRemaining = useMemo(() => {
    const val = parseFloat(formData.budgetCarry);
    if (!Number.isFinite(val) || formData.budgetCarry.trim() === '') return null;
    const spent = parseFloat(formData.budgetSpent ?? '') || 0;
    return Math.round((val - spent - totalCost) * 100) / 100;
  }, [formData.budgetCarry, formData.budgetSpent, totalCost]);

  const updateField = <K extends keyof OvertimeFormData>(key: K, value: OvertimeFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateRate = (type: WorkerType, rawValue: string) => {
    const num = rawValue === '' ? 0 : parseFloat(rawValue);
    setRates((prev) => ({
      ...prev,
      [type]: Number.isFinite(num) && num >= 0 ? num : 0,
    }));
  };

  const saveRatesAsDefault = () => {
    setDefaultRates({ ...rates });
    setToastMessage('ตั้งค่าอัตราค่าแรงปัจจุบันเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  const resetRates = () => {
    setRates({ ...defaultRates });
    setToastMessage('คืนค่าอัตราค่าแรงเริ่มต้นเรียบร้อยแล้ว');
  };

  const addWorkItem = () => {
    if (formData.workItems.length >= 4) return;
    updateField('workItems', [...formData.workItems, createEmptyWorkItem()]);
  };

  const updateWorkItem = (index: number, field: 'text' | 'qty', value: string) => {
    const next = formData.workItems.map((it, i) =>
      i === index ? { ...it, [field]: value } : it
    );
    updateField('workItems', next);
  };

  const removeWorkItem = (index: number) => {
    if (formData.workItems.length <= 1) return;
    updateField(
      'workItems',
      formData.workItems.filter((_, i) => i !== index)
    );
  };

  const addWorker = () => {
    if (formData.workers.length >= 30) return;
    updateField('workers', [...formData.workers, createEmptyWorker()]);
  };

  const insertPresetWorkerToTable = (preset: WorkerPreset) => {
    setFormData((prev) => {
      const emptyIdx = prev.workers.findIndex((w) => !w.name.trim());
      if (emptyIdx !== -1) {
        const next = prev.workers.map((w, i) =>
          i === emptyIdx ? { ...w, name: preset.name, type: preset.defaultType } : w
        );
        return { ...prev, workers: next };
      }
      if (prev.workers.length >= 30) return prev;
      return {
        ...prev,
        workers: [
          ...prev.workers,
          { ...createEmptyWorker(), name: preset.name, type: preset.defaultType },
        ],
      };
    });
    setToastMessage(`เพิ่ม ${preset.name} ลงในตารางแล้ว`);
  };

  const handleAddWorkerPreset = (
    name: string,
    defaultType: WorkerType,
    alsoInsertToTable: boolean
  ): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (workerDirectory.some((p) => p.name.trim() === trimmed)) {
      return false;
    }
    const newPreset: WorkerPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      defaultType,
    };
    setWorkerDirectory((prev) => [...prev, newPreset]);
    if (alsoInsertToTable) {
      insertPresetWorkerToTable(newPreset);
    } else {
      setToastMessage(`บันทึกรายชื่อ "${trimmed}" เรียบร้อยแล้ว`);
    }
    return true;
  };

  const handleRemoveWorkerPreset = (id: string) => {
    setWorkerDirectory((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetWorkerPresets = () => {
    setWorkerDirectory(DEFAULT_WORKER_PRESETS);
    setToastMessage('คืนค่ารายชื่อคนงานเริ่มต้นเรียบร้อยแล้ว');
  };

  const updateWorker = <K extends keyof WorkerRow>(index: number, field: K, value: WorkerRow[K]) => {
    const next = formData.workers.map((w, i) => {
      if (i !== index) return w;
      if (field === 'name' && typeof value === 'string') {
        const matched = workerDirectory.find((p) => p.name.trim() === value.trim());
        if (matched && w.name.trim() !== value.trim()) {
          return { ...w, name: value, type: matched.defaultType };
        }
      }
      return { ...w, [field]: value };
    });
    updateField('workers', next);
  };

  const removeWorker = (index: number) => {
    if (formData.workers.length <= 1) return;
    updateField(
      'workers',
      formData.workers.filter((_, i) => i !== index)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      const result = await exportMemoToExcel(formData, rates);
      setReadyExcel(result);
    } catch (err) {
      console.error('Excel export failed:', err);
      setToastMessage('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleSaveMemo = () => {
    const entry: SavedMemo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      savedAt: new Date().toISOString(),
      totalCost,
      data: formData,
      rates,
    };
    setSavedMemos((prev) => [entry, ...prev].slice(0, 30));
    setToastMessage('บันทึกเอกสารเข้าสู่ประวัติในเครื่องแล้ว');
  };

  const handleLoadMemo = (memo: SavedMemo) => {
    setFormData(memo.data);
    setRates(memo.rates);
    setDrawerOpen(false);
    setToastMessage('โหลดข้อมูลบันทึกข้อความเรียบร้อยแล้ว');
  };

  const handleDeleteMemo = (id: string) => {
    setSavedMemos((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLoadSample = () => {
    setFormData(createSampleFormData());
    setToastMessage('โหลดตัวอย่างข้อมูลงานสับเปลี่ยนหม้อแปลงแล้ว');
  };

  const handleConfirmReset = () => {
    setFormData(createDefaultFormData());
    setConfirmResetOpen(false);
    setToastMessage('ล้างข้อมูลในฟอร์มแล้ว (คงอัตราค่าแรงไว้)');
  };

  const inputClass =
    'w-full px-3 py-2 text-[15px] bg-white border border-[#dad1ea] rounded-lg text-[#1f1a29] placeholder:text-[#9c93ad] focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30 focus:border-[#5b2a86] transition-colors';
  const labelClass = 'block text-[13.5px] font-medium text-[#5d546e] mb-1.5';

  return (
    <div className="min-h-screen bg-[#f7f5fa] text-[#1f1a29]">
      {/* Shared datalists */}
      <datalist id="workerNameList">
        {workerDirectory.map((preset) => (
          <option key={preset.id} value={preset.name} />
        ))}
      </datalist>
      <datalist id="supNames">
        {SUPERVISOR_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="supLevels">
        {SUPERVISOR_LEVELS.map((lv) => (
          <option key={lv} value={lv} />
        ))}
      </datalist>
      <datalist id="appNames">
        {APPROVER_NAMES.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="appLevels">
        {APPROVER_LEVELS.map((lv) => (
          <option key={lv} value={lv} />
        ))}
      </datalist>

      {/* Top Bar: 3 zones */}
      <header className="no-print bg-[#5b2a86] text-white border-b border-[#49206d]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-[#e8a33d] text-[#3d1b5c] flex items-center justify-center shrink-0"
            >
              <Zap className="w-5 h-5 fill-current" />
            </span>
            <span className="font-display text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap truncate">
              โปรแกรมทำเอกสารขอล่วงเวลา · ผมต.กฟส.ฝาง
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#ede5f7]">
            <button
              type="button"
              onClick={handleLoadSample}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              โหลดตัวอย่าง
            </button>
            <button
              type="button"
              onClick={handleSaveMemo}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              บันทึกเก็บไว้
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ประวัติ ({savedMemos.length})
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#237a4b] hover:bg-[#1b633c] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile quick toolbar */}
      <div className="no-print md:hidden bg-white border-b border-[#e5dff0] px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={handleLoadSample}
          className="text-xs font-medium text-[#4a216e] hover:underline whitespace-nowrap shrink-0 px-2 py-1"
        >
          โหลดตัวอย่าง
        </button>
        <button
          type="button"
          onClick={handleSaveMemo}
          className="text-xs font-medium text-[#4a216e] hover:underline whitespace-nowrap shrink-0 px-2 py-1"
        >
          บันทึกเก็บไว้
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-xs font-medium text-[#4a216e] hover:underline whitespace-nowrap shrink-0 px-2 py-1"
        >
          ประวัติ ({savedMemos.length})
        </button>
      </div>

      {/* Main Workspace */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FORM */}
          <div className="no-print lg:col-span-6 space-y-5">
            {/* Section 1: ข้อมูลงาน */}
            <section className="bg-white border border-[#e3dcef] rounded-xl p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h2 className="text-base font-semibold text-[#3d1b5c]">1. ข้อมูลงานและวันเวลาปฏิบัติงาน</h2>
                <span className="text-xs text-[#6f6680] whitespace-nowrap">
                  วัน{thaiDayName(formData.workDate)} ที่ {thaiDateFull(formData.workDate)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="jobName" className={labelClass}>
                    ชื่องาน
                  </label>
                  <input
                    id="jobName"
                    type="text"
                    value={formData.jobName}
                    onChange={(e) => updateField('jobName', e.target.value)}
                    placeholder="เช่น สับเปลี่ยนหม้อแปลงชำรุด ดอยป่าคา"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="workDate" className={labelClass}>
                      วันที่ปฏิบัติงาน
                    </label>
                    <input
                      id="workDate"
                      type="date"
                      value={formData.workDate}
                      onChange={(e) => updateField('workDate', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="timeStart" className={labelClass}>
                      {formData.useSecondPeriod ? 'เวลาเริ่ม (ช่วงที่ 1)' : 'เวลาเริ่ม'}
                    </label>
                    <input
                      id="timeStart"
                      type="time"
                      value={formData.timeStart}
                      onChange={(e) => updateField('timeStart', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="timeEnd" className={labelClass}>
                      {formData.useSecondPeriod ? 'เวลาเสร็จ (ช่วงที่ 1)' : 'เวลาเสร็จ'}
                    </label>
                    <input
                      id="timeEnd"
                      type="time"
                      value={formData.timeEnd}
                      onChange={(e) => updateField('timeEnd', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {formData.useSecondPeriod && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end rounded-lg bg-[#faf8fd] border border-[#e8e2f2] p-3">
                    <div>
                      <label htmlFor="timeStart2" className={labelClass}>
                        เวลาเริ่ม (ช่วงที่ 2)
                      </label>
                      <input
                        id="timeStart2"
                        type="time"
                        value={formData.timeStart2 ?? '13:00'}
                        onChange={(e) => updateField('timeStart2', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="timeEnd2" className={labelClass}>
                        เวลาเสร็จ (ช่วงที่ 2)
                      </label>
                      <input
                        id="timeEnd2"
                        type="time"
                        value={formData.timeEnd2 ?? '16:30'}
                        onChange={(e) => updateField('timeEnd2', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 pb-1">
                      <span className="text-xs font-mono-num text-[#5d546e]">
                        ช่วงที่ 2: {autoHours2} ชม.
                      </span>
                      <button
                        type="button"
                        onClick={() => updateField('useSecondPeriod', false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-[#9e475e] hover:bg-[#fdf2f4] border border-[#f2d0d8] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบช่วงที่ 2</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6f6680]">
                  {!formData.useSecondPeriod ? (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          useSecondPeriod: true,
                          timeStart2: prev.timeStart2 || '13:00',
                          timeEnd2: prev.timeEnd2 || '16:30',
                        }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#f4effa] text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#e8ddf7] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มช่วงเวลาที่ 2</span>
                    </button>
                  ) : (
                    <span>วัน (จันทร์–อาทิตย์) คำนวณจากวันที่ปฏิบัติงานให้อัตโนมัติ</span>
                  )}
                  <span className="font-mono-num font-semibold text-[#3d1b5c]">
                    {formData.useSecondPeriod
                      ? `ช่วงที่ 1: ${autoHours1} ชม. + ช่วงที่ 2: ${autoHours2} ชม. = รวม ${autoHours} ชั่วโมง`
                      : `ระยะเวลางาน ${autoHours} ชั่วโมง`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#f0ebf7]">
                  <div>
                    <label htmlFor="docDate" className={labelClass}>
                      วันที่ลงบันทึกข้อความ
                    </label>
                    <input
                      id="docDate"
                      type="date"
                      value={formData.docDate}
                      onChange={(e) => updateField('docDate', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="docNo" className={labelClass}>
                      เลขที่หนังสือ (ที่)
                    </label>
                    <input
                      id="docNo"
                      type="text"
                      value={formData.docNo}
                      onChange={(e) => updateField('docNo', e.target.value)}
                      placeholder="-"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f0ebf7]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13.5px] font-medium text-[#5d546e]">
                      ปริมาณงาน (สูงสุด 4 รายการ)
                    </span>
                    <span className="text-xs text-[#6f6680] tabular-nums">
                      {formData.workItems.length}/4 รายการ
                    </span>
                  </div>

                  <div className="divide-y divide-[#f0ebf7]">
                    {formData.workItems.map((item, idx) => (
                      <div key={item.id} className="py-3 first:pt-1 last:pb-1">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                          <div className="sm:col-span-7">
                            <label htmlFor={`work-item-text-${item.id}`} className={labelClass}>
                              รายการที่ {idx + 1}
                            </label>
                            <input
                              id={`work-item-text-${item.id}`}
                              type="text"
                              value={item.text}
                              onChange={(e) => updateWorkItem(idx, 'text', e.target.value)}
                              placeholder="เช่น รื้อถอนหม้อแปลง TR28-004097"
                              className={inputClass}
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <label htmlFor={`work-item-qty-${item.id}`} className={labelClass}>
                              จำนวน
                            </label>
                            <input
                              id={`work-item-qty-${item.id}`}
                              type="text"
                              value={item.qty}
                              onChange={(e) => updateWorkItem(idx, 'qty', e.target.value)}
                              placeholder="เช่น จำนวน 1 เครื่อง"
                              className={inputClass}
                            />
                          </div>
                          <div className="sm:col-span-1 flex justify-end">
                            {formData.workItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWorkItem(idx)}
                                aria-label={`ลบรายการที่ ${idx + 1}`}
                                className="p-2.5 rounded-lg text-[#9e475e] hover:bg-[#fdf2f4] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.workItems.length < 4 && (
                    <button
                      type="button"
                      onClick={addWorkItem}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#f4effa] text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#e8ddf7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มรายการงาน</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: อ้างอิงงบประมาณ */}
            <section className="bg-white border border-[#e3dcef] rounded-xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-[#3d1b5c] mb-4">2. อ้างอิงงบประมาณ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="wbsCode" className={labelClass}>
                    รหัสโครงข่าย (WBS)
                  </label>
                  <input
                    id="wbsCode"
                    type="text"
                    value={formData.wbsCode}
                    onChange={(e) => updateField('wbsCode', e.target.value)}
                    placeholder="เช่น I-69-C-FANG.01"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label htmlFor="activity" className={labelClass}>
                    กิจกรรม
                  </label>
                  <input
                    id="activity"
                    type="text"
                    value={formData.activity}
                    onChange={(e) => updateField('activity', e.target.value)}
                    placeholder="เช่น OM0120"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label htmlFor="repairNo" className={labelClass}>
                    เลขที่ใบสั่งซ่อม
                  </label>
                  <input
                    id="repairNo"
                    type="text"
                    value={formData.repairNo}
                    onChange={(e) => updateField('repairNo', e.target.value)}
                    placeholder="เช่น 4000891245"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label htmlFor="budgetCarry" className={labelClass}>
                    งบประมาณ / ยกมา (บาท)
                  </label>
                  <input
                    id="budgetCarry"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budgetCarry}
                    onChange={(e) => updateField('budgetCarry', e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label htmlFor="budgetSpent" className={labelClass}>
                    เบิกจ่ายแล้ว (บาท)
                  </label>
                  <input
                    id="budgetSpent"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budgetSpent ?? ''}
                    onChange={(e) => updateField('budgetSpent', e.target.value)}
                    placeholder="0.00 (ไม่บังคับ)"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
                <div>
                  <label htmlFor="approvalRef" className={labelClass}>
                    อนุมัติ / ลว. (ใบตัดงบ)
                  </label>
                  <input
                    id="approvalRef"
                    type="text"
                    value={formData.approvalRef ?? ''}
                    onChange={(e) => updateField('approvalRef', e.target.value)}
                    placeholder="เช่น กฟส.ฝาง 123/2569 (ไม่บังคับ)"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#f0ebf7] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="budgetPeriod" className={labelClass}>
                    ประจำงวดที่ (ใบตัดงบ)
                  </label>
                  <input
                    id="budgetPeriod"
                    type="text"
                    value={formData.budgetPeriod ?? ''}
                    onChange={(e) => updateField('budgetPeriod', e.target.value)}
                    placeholder="ไม่บังคับ"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="budgetMonth" className={labelClass}>
                    เดือน
                  </label>
                  <input
                    id="budgetMonth"
                    type="text"
                    value={formData.budgetMonth ?? ''}
                    onChange={(e) => updateField('budgetMonth', e.target.value)}
                    placeholder="เช่น พฤศจิกายน"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="budgetYear" className={labelClass}>
                    พ.ศ.
                  </label>
                  <input
                    id="budgetYear"
                    type="text"
                    value={formData.budgetYear ?? ''}
                    onChange={(e) => updateField('budgetYear', e.target.value)}
                    placeholder="เช่น 2569"
                    className={`${inputClass} font-mono-num`}
                  />
                </div>
              </div>

              {budgetRemaining !== null && (
                <div className="mt-3 pt-3 border-t border-[#f0ebf7] flex items-center justify-between text-sm">
                  <span className="text-[#5d546e]">งบประมาณคงเหลือหลังหักค่าล่วงเวลาครั้งนี้</span>
                  <span
                    className={`font-mono-num font-semibold ${
                      budgetRemaining < 0 ? 'text-[#b43c57]' : 'text-[#1f7a4c]'
                    }`}
                  >
                    {formatCurrency(budgetRemaining)} บาท
                    {budgetRemaining < 0 ? ' (เกินงบประมาณ)' : ''}
                  </span>
                </div>
              )}
            </section>

            {/* Section 3: อัตราค่าแรงต่อวัน */}
            <section className="bg-white border border-[#e3dcef] rounded-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-semibold text-[#3d1b5c]">
                  3. อัตราค่าแรงต่อวัน (บาท)
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={saveRatesAsDefault}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5b2a86] text-white hover:bg-[#3d1b5c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>ตั้งค่านี้เป็นค่าเริ่มต้น</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetRates}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f4effa] text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#e8ddf7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>คืนค่าเริ่มต้น</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {WORKER_TYPES.map((type) => (
                  <div key={type}>
                    <label htmlFor={`rate-${type}`} className={labelClass}>
                      {RATE_SHORT_LABEL[type]}
                    </label>
                    <input
                      id={`rate-${type}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={rates[type]}
                      onChange={(e) => updateRate(type, e.target.value)}
                      className={`${inputClass} font-mono-num`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs text-[#6f6680]">
                ค่าเริ่มต้นปัจจุบัน: ประเภท 1 = {defaultRates['1']} / 2 = {defaultRates['2']} / 3 = {defaultRates['3']} / พขร. = {defaultRates['พขร.']} บาท — แก้ไขแล้วกด &ldquo;ตั้งค่านี้เป็นค่าเริ่มต้น&rdquo; เพื่อบันทึกถาวร
              </p>
            </section>

            {/* Section 4: รายชื่อคนงาน & คำนวณค่าใช้จ่าย */}
            <section className="bg-white border border-[#e3dcef] rounded-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-base font-semibold text-[#3d1b5c]">
                    4. รายชื่อคนงาน &amp; คำนวณค่าใช้จ่าย
                  </h2>
                  <span className="text-xs text-[#6f6680] tabular-nums">
                    ({formData.workers.length} รายการ)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkerDirOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f4effa] text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#e8ddf7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>จัดการรายชื่อ ({workerDirectory.length})</span>
                </button>
              </div>

              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f4effa] text-[#3d1b5c] border-b border-[#dcd3ea]">
                      <th className="py-2 px-2 text-left font-semibold w-[25%]">ชื่อ-สกุล</th>
                      <th className="py-2 px-1.5 text-left font-semibold w-[16%]">ประเภท</th>
                      {formData.useSecondPeriod && (
                        <th className="py-2 px-1.5 text-center font-semibold w-[13%]">ช่วงเวลา</th>
                      )}
                      <th className="py-2 px-1.5 text-right font-semibold w-[9%]">ค่าแรง/วัน</th>
                      <th className="py-2 px-1.5 text-center font-semibold w-[8%]">วัน</th>
                      <th className="py-2 px-1.5 text-center font-semibold w-[9%]">กี่เท่า</th>
                      <th className="py-2 px-1.5 text-center font-semibold w-[9%]">ชั่วโมง</th>
                      <th className="py-2 px-2 text-right font-semibold w-[11%]">ค่าใช้จ่าย</th>
                      <th className="py-2 px-1 w-[4%]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ebf7]">
                    {formData.workers.map((w, idx) => {
                      const rate = rates[w.type] ?? 0;
                      const workerAutoHours = getAutoHoursForForm(formData, w.period);
                      const cost = calculateWorkerCost(w, rates, workerAutoHours);
                      return (
                        <tr key={w.id} className="align-middle hover:bg-[#faf8fd]">
                          <td className="py-2 pr-1.5">
                            <input
                              type="text"
                              list="workerNameList"
                              value={w.name}
                              onChange={(e) => updateWorker(idx, 'name', e.target.value)}
                              placeholder="ชื่อ-สกุล"
                              aria-label={`ชื่อ-สกุล คนงานที่ ${idx + 1}`}
                              className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#dad1ea] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={w.type}
                              onChange={(e) =>
                                updateWorker(idx, 'type', e.target.value as WorkerType)
                              }
                              aria-label={`ประเภท คนงานที่ ${idx + 1}`}
                              className="w-full px-2 py-1.5 text-sm bg-white border border-[#dad1ea] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
                            >
                              {WORKER_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {RATE_LABEL[t]}
                                </option>
                              ))}
                            </select>
                          </td>
                          {formData.useSecondPeriod && (
                            <td className="py-2 px-1">
                              <select
                                value={w.period ?? 'both'}
                                onChange={(e) =>
                                  updateWorker(idx, 'period', e.target.value as WorkerPeriodMode)
                                }
                                aria-label={`ช่วงเวลา คนงานที่ ${idx + 1}`}
                                className="w-full px-1.5 py-1.5 text-xs bg-white border border-[#dad1ea] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
                              >
                                <option value="both">ทั้ง 2 ช่วง</option>
                                <option value="1">ช่วงที่ 1</option>
                                <option value="2">ช่วงที่ 2</option>
                              </select>
                            </td>
                          )}
                          <td className="py-2 px-1.5 text-right font-mono-num text-xs text-[#625972]">
                            {rate.toFixed(2)}
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={w.days}
                              onChange={(e) => updateWorker(idx, 'days', e.target.value)}
                              aria-label={`จำนวนวัน คนงานที่ ${idx + 1}`}
                              className="w-full px-2 py-1.5 text-sm text-center font-mono-num bg-white border border-[#dad1ea] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={w.mult}
                              onChange={(e) =>
                                updateWorker(
                                  idx,
                                  'mult',
                                  e.target.value as '1' | '1.5' | '2' | '3'
                                )
                              }
                              aria-label={`ตัวคูณกี่เท่า คนงานที่ ${idx + 1}`}
                              className="w-full px-1.5 py-1.5 text-sm text-center font-mono-num bg-white border border-[#dad1ea] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
                            >
                              {MULTIPLIER_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={w.hours}
                              placeholder={String(workerAutoHours)}
                              onChange={(e) => updateWorker(idx, 'hours', e.target.value)}
                              aria-label={`ชั่วโมง คนงานที่ ${idx + 1}`}
                              className="w-full px-2 py-1.5 text-sm text-center font-mono-num bg-white border border-[#dad1ea] rounded-md placeholder:text-[#9c93ad] focus:outline-none focus:ring-2 focus:ring-[#5b2a86]/30"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-mono-num font-semibold text-[#3d1b5c] whitespace-nowrap">
                            {formatCurrency(cost)}
                          </td>
                          <td className="py-2 pl-1 text-center">
                            {formData.workers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWorker(idx)}
                                aria-label={`ลบคนงานที่ ${idx + 1}`}
                                className="p-1.5 rounded-md text-[#9e475e] hover:bg-[#fdf2f4] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addWorker}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#f4effa] text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#e8ddf7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มแถวคนงาน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerDirOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white text-[#3d1b5c] border border-[#dcd3ea] hover:bg-[#f4effa] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>เพิ่มรายชื่อคนงานใหม่ / เลือกจากคลัง</span>
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-[#3d1b5c] text-white px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">รวมค่าใช้จ่ายล่วงเวลา</div>
                  <div className="text-xs text-[#e2d6f3] mt-0.5">{totalBahtText}</div>
                </div>
                <div className="font-mono-num text-2xl font-bold text-[#f0b454]">
                  {formatCurrency(totalCost)} บาท
                </div>
              </div>

              <p className="mt-2.5 text-xs text-[#6f6680]">
                สูตร: (ค่าแรงต่อวัน ÷ 8) × ชั่วโมง × จำนวนเท่า × จำนวนวัน (หากเว้นช่องชั่วโมงไว้ ระบบใช้ {autoHours} ชม. จากเวลาเริ่ม–เสร็จอัตโนมัติ)
              </p>
            </section>

            {/* Section 5: ผู้ควบคุมงานและผู้อนุมัติ */}
            <section className="bg-white border border-[#e3dcef] rounded-xl p-5 sm:p-6">
              <h2 className="text-base font-semibold text-[#3d1b5c] mb-4">
                5. ผู้ควบคุมงานและผู้อนุมัติ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="supName" className={labelClass}>
                    ผู้ควบคุมงาน
                  </label>
                  <input
                    id="supName"
                    type="text"
                    list="supNames"
                    value={formData.supName}
                    onChange={(e) => updateField('supName', e.target.value)}
                    placeholder="นาย..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="supLevel" className={labelClass}>
                    ระดับ
                  </label>
                  <input
                    id="supLevel"
                    type="text"
                    list="supLevels"
                    value={formData.supLevel}
                    onChange={(e) => updateField('supLevel', e.target.value)}
                    placeholder="พชง.6 ผมต.กฟส.ฝาง"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="appName" className={labelClass}>
                    ผู้อนุมัติ
                  </label>
                  <input
                    id="appName"
                    type="text"
                    list="appNames"
                    value={formData.appName}
                    onChange={(e) => updateField('appName', e.target.value)}
                    placeholder="นาย..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="appLevel" className={labelClass}>
                    ระดับ
                  </label>
                  <input
                    id="appLevel"
                    type="text"
                    list="appLevels"
                    value={formData.appLevel}
                    onChange={(e) => updateField('appLevel', e.target.value)}
                    placeholder="หผ.มต.กฟส.ฝาง"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#5b2a86] hover:bg-[#3d1b5c] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>พิมพ์ / บันทึกเป็น PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#237a4b] hover:bg-[#1b633c] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>ส่งออกเอกสารเป็น Excel (2 หน้า)</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-[#3d1b5c] border border-[#5b2a86] hover:bg-[#f4effa] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>ล้างข้อมูลทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE DOCUMENT PREVIEW (2 PAGES) */}
          <div className="lg:col-span-6 lg:sticky lg:top-6">
            <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
              <div className="inline-flex items-center rounded-lg border border-[#dad1ea] bg-white p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewTab('both')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === 'both'
                      ? 'bg-[#5b2a86] text-white'
                      : 'text-[#5d546e] hover:text-[#3d1b5c]'
                  }`}
                >
                  ทั้ง 2 หน้า
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('memo')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === 'memo'
                      ? 'bg-[#5b2a86] text-white'
                      : 'text-[#5d546e] hover:text-[#3d1b5c]'
                  }`}
                >
                  บันทึกข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('budget')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === 'budget'
                      ? 'bg-[#5b2a86] text-white'
                      : 'text-[#5d546e] hover:text-[#3d1b5c]'
                  }`}
                >
                  ใบตัดงบค่าล่วงเวลา
                </button>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#dad1ea] text-[#3d1b5c] hover:bg-[#f4effa] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ / PDF (2 หน้า)</span>
              </button>
            </div>

            <div className={previewTab === 'budget' ? 'hidden print:block' : 'block'}>
              <MemoPreview data={formData} rates={rates} />
            </div>

            <div
              className={
                previewTab === 'memo'
                  ? 'hidden print:block print:break-before-page'
                  : previewTab === 'both'
                    ? 'block mt-6 print:mt-0 print:break-before-page'
                    : 'block print:break-before-page'
              }
            >
              <BudgetDeductionPreview data={formData} rates={rates} />
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal
        open={confirmResetOpen}
        title="ล้างข้อมูลทั้งหมดในฟอร์ม?"
        description="ข้อมูลงาน รายการปฏิบัติงาน รายชื่อคนงาน และผู้ลงนามจะถูกรีเซ็ตกลับเป็นค่าว่าง โดยอัตราค่าแรงต่อวันที่ตั้งค่าไว้จะไม่ถูกล้าง"
        confirmLabel="ล้างข้อมูลทั้งหมด"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetOpen(false)}
      />

      <SavedMemosDrawer
        open={drawerOpen}
        memos={savedMemos}
        onClose={() => setDrawerOpen(false)}
        onLoad={handleLoadMemo}
        onDelete={handleDeleteMemo}
      />

      <WorkerDirectoryModal
        open={workerDirOpen}
        presets={workerDirectory}
        currentWorkers={formData.workers}
        onClose={() => setWorkerDirOpen(false)}
        onAddPreset={handleAddWorkerPreset}
        onRemovePreset={handleRemoveWorkerPreset}
        onInsertWorker={insertPresetWorkerToTable}
        onResetDefaults={handleResetWorkerPresets}
      />

      {readyExcel && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-40 max-w-sm rounded-xl border border-[#dcd3ea] bg-white px-4 py-3.5 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#242030]">สร้างไฟล์ Excel สำเร็จ</div>
              <div className="mt-0.5 text-xs text-[#6f6680] truncate">{readyExcel.filename}</div>
              <p className="mt-1 text-[11.5px] text-[#6f6680]">
                หากเบราว์เซอร์บล็อกดาวน์โหลดอัตโนมัติ ให้กดปุ่มด้านล่างเพื่อบันทึกไฟล์
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReadyExcel(null)}
              aria-label="ปิดหน้าต่างดาวน์โหลด"
              className="p-1 rounded-md text-[#6f6680] hover:bg-[#f4effa] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={readyExcel.url}
              download={readyExcel.filename}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#237a4b] hover:bg-[#1b633c] text-white transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ลงเครื่อง</span>
            </a>
          </div>
        </div>
      )}

      {toastMessage && !readyExcel && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-40 rounded-xl bg-[#242030] text-white px-4 py-3 text-sm font-medium shadow-lg"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
