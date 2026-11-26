import { OvertimeFormData, WageRates, WorkerPeriodMode, WorkerRow } from '../types/overtime';

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_MONTHS_ABBR = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];
const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export function calculateAutoHours(timeStart: string, timeEnd: string): number {
  if (!timeStart || !timeEnd) return 0;
  const [sh, sm] = timeStart.split(':').map(Number);
  const [eh, em] = timeEnd.split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) {
    return 0;
  }
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function getAutoHoursForForm(
  data: Pick<OvertimeFormData, 'timeStart' | 'timeEnd' | 'useSecondPeriod' | 'timeStart2' | 'timeEnd2'>,
  periodMode: WorkerPeriodMode = 'both'
): number {
  const h1 = calculateAutoHours(data.timeStart, data.timeEnd);
  if (!data.useSecondPeriod) return h1;
  const h2 = calculateAutoHours(data.timeStart2 ?? '', data.timeEnd2 ?? '');
  if (periodMode === '1') return h1;
  if (periodMode === '2') return h2;
  return Math.round((h1 + h2) * 100) / 100;
}

export interface WorkerTimeDisplay {
  ranges: string[];
  hourItems: number[];
  totalHours: number;
  isTwoLines: boolean;
  hasManualOverride: boolean;
}

export function getWorkerTimeDisplay(
  worker: WorkerRow,
  data: Pick<OvertimeFormData, 'timeStart' | 'timeEnd' | 'useSecondPeriod' | 'timeStart2' | 'timeEnd2'>
): WorkerTimeDisplay {
  const h1 = calculateAutoHours(data.timeStart, data.timeEnd);
  const h2 = data.useSecondPeriod ? calculateAutoHours(data.timeStart2 ?? '', data.timeEnd2 ?? '') : 0;
  const mode: WorkerPeriodMode = data.useSecondPeriod ? (worker.period ?? 'both') : '1';
  const autoVal = getAutoHoursForForm(data, mode);
  const hasManualOverride = worker.hours.trim() !== '';
  const totalHours = getEffectiveHours(worker, autoVal);

  if (!data.useSecondPeriod || mode === '1') {
    return {
      ranges: [`${data.timeStart || '-'} - ${data.timeEnd || '-'}`],
      hourItems: [totalHours],
      totalHours,
      isTwoLines: false,
      hasManualOverride,
    };
  }

  if (mode === '2') {
    return {
      ranges: [`${data.timeStart2 || '-'} - ${data.timeEnd2 || '-'}`],
      hourItems: [totalHours],
      totalHours,
      isTwoLines: false,
      hasManualOverride,
    };
  }

  return {
    ranges: [
      `${data.timeStart || '-'} - ${data.timeEnd || '-'}`,
      `${data.timeStart2 || '-'} - ${data.timeEnd2 || '-'}`,
    ],
    hourItems: [h1, h2],
    totalHours,
    isTwoLines: true,
    hasManualOverride,
  };
}

export function getEffectiveHours(worker: WorkerRow, autoHoursValue: number): number {
  if (worker.hours.trim() === '') return autoHoursValue;
  const parsed = parseFloat(worker.hours);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateWorkerCost(
  worker: WorkerRow,
  rates: WageRates,
  autoHoursValue: number
): number {
  const rate = rates[worker.type] ?? 0;
  const hours = getEffectiveHours(worker, autoHoursValue);
  const days = worker.days.trim() === '' ? 0 : parseFloat(worker.days);
  const mult = parseFloat(worker.mult);
  if (!Number.isFinite(rate) || !Number.isFinite(hours) || !Number.isFinite(days) || !Number.isFinite(mult)) {
    return 0;
  }
  const cost = (rate / 8) * hours * mult * days;
  return Number.isFinite(cost) ? Math.round(cost * 100) / 100 : 0;
}

export function thaiDateFull(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const mon = THAI_MONTHS_ABBR[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${day} ${mon} ${yearBE}`;
}

export function thaiDateLongMonth(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const mon = THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${day} ${mon} ${yearBE}`;
}

export function thaiDayName(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '-';
  return THAI_DAYS[d.getDay()];
}

export function formatCurrency(num: number): string {
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function bahtText(num: number): string {
  const rounded = Math.round((num || 0) * 100) / 100;
  if (rounded === 0) return 'ศูนย์บาทถ้วน';
  const neg = rounded < 0;
  const abs = Math.abs(rounded);
  const [intPartStr, decPartStr] = abs.toFixed(2).split('.');
  const digitTh = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const posTh = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertGroup(numStr: string): string {
    let out = '';
    const len = numStr.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(numStr[i], 10);
      const posFromRight = len - i - 1;
      if (d === 0) continue;
      if (posFromRight === 0 && d === 1 && len > 1) {
        out += 'เอ็ด';
      } else if (posFromRight === 1 && d === 1) {
        out += 'สิบ';
      } else if (posFromRight === 1 && d === 2) {
        out += 'ยี่สิบ';
      } else {
        out += digitTh[d] + posTh[posFromRight];
      }
    }
    return out;
  }

  function convertInt(s: string): string {
    let clean = s.replace(/^0+(?=\d)/, '');
    if (clean === '0') return 'ศูนย์';
    let out = '';
    while (clean.length > 6) {
      const chunk = clean.slice(0, clean.length - 6);
      out += `${convertGroup(chunk)}ล้าน`;
      clean = clean.slice(clean.length - 6);
    }
    out += convertGroup(clean);
    return out;
  }

  let result = '';
  if (parseInt(intPartStr, 10) > 0) {
    result += `${convertInt(intPartStr)}บาท`;
    if (decPartStr === '00') {
      result += 'ถ้วน';
    } else {
      result += `${convertGroup(decPartStr.replace(/^0+(?=\d)/, ''))}สตางค์`;
    }
  } else {
    result += `${convertGroup(decPartStr.replace(/^0+(?=\d)/, ''))}สตางค์`;
  }

  return (neg ? 'ลบ' : '') + result;
}
