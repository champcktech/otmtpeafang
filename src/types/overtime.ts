export type WorkerType = '1' | '2' | '3' | 'พขร.';

export type WageRates = Record<WorkerType, number>;

export interface WorkItem {
  id: string;
  text: string;
  qty: string;
}

export type WorkerPeriodMode = 'both' | '1' | '2';

export interface WorkerRow {
  id: string;
  name: string;
  type: WorkerType;
  days: string;
  mult: '1' | '1.5' | '2' | '3';
  hours: string;
  period?: WorkerPeriodMode;
}

export interface OvertimeFormData {
  docNo: string;
  docDate: string;
  jobName: string;
  workDate: string;
  timeStart: string;
  timeEnd: string;
  useSecondPeriod?: boolean;
  timeStart2?: string;
  timeEnd2?: string;
  workItems: WorkItem[];
  wbsCode: string;
  activity: string;
  repairNo: string;
  budgetCarry: string;
  budgetSpent?: string;
  approvalRef?: string;
  budgetPeriod?: string;
  budgetMonth?: string;
  budgetYear?: string;
  workers: WorkerRow[];
  supName: string;
  supLevel: string;
  appName: string;
  appLevel: string;
}

export interface SavedMemo {
  id: string;
  savedAt: string;
  totalCost: number;
  data: OvertimeFormData;
  rates: WageRates;
}

export const WORKER_TYPES: WorkerType[] = ['1', '2', '3', 'พขร.'];

export const DEFAULT_RATES: WageRates = {
  '1': 483,
  '2': 551,
  '3': 631,
  'พขร.': 99.29,
};

export const RATE_LABEL: Record<WorkerType, string> = {
  '1': 'ประเภท 1',
  '2': 'ประเภท 2',
  '3': 'ประเภท 3',
  'พขร.': 'พขร. (พนักงานขับรถ)',
};

export const RATE_SHORT_LABEL: Record<WorkerType, string> = {
  '1': 'ประเภท 1',
  '2': 'ประเภท 2',
  '3': 'ประเภท 3',
  'พขร.': 'พขร.',
};

export const MULTIPLIER_OPTIONS: Array<'1' | '1.5' | '2' | '3'> = ['1', '1.5', '2', '3'];

export interface WorkerPreset {
  id: string;
  name: string;
  defaultType: WorkerType;
}

export const WORKER_NAMES = [
  'นายพิมาน สูนปัน',
  'นายชาญกิจ กิตติวรรณ์',
  'นายจักรพล มลเทียน',
  'นายณัฐวุฒิ สิงห์ใจ',
  'นายธนากร ทิพย์แก้ว',
  'นายทวีศักดิ์ เทียมพล',
  'นายนพดล พรหมมินทร์',
];

export const DEFAULT_WORKER_PRESETS: WorkerPreset[] = [
  { id: 'preset-1', name: 'นายพิมาน สูนปัน', defaultType: '3' },
  { id: 'preset-2', name: 'นายชาญกิจ กิตติวรรณ์', defaultType: '2' },
  { id: 'preset-3', name: 'นายจักรพล มลเทียน', defaultType: '1' },
  { id: 'preset-4', name: 'นายณัฐวุฒิ สิงห์ใจ', defaultType: 'พขร.' },
  { id: 'preset-5', name: 'นายธนากร ทิพย์แก้ว', defaultType: '1' },
  { id: 'preset-6', name: 'นายทวีศักดิ์ เทียมพล', defaultType: '1' },
  { id: 'preset-7', name: 'นายนพดล พรหมมินทร์', defaultType: '1' },
];

export const SUPERVISOR_NAMES = [
  'นายธนพล มณีกุล',
  'นายกิตติพัทธ์ เรือนชัย',
  'นายประสาน เป๋าคำ',
];

export const SUPERVISOR_LEVELS = [
  'พชง.6 ผมต.กฟส.ฝาง',
  'พชง.5 ผมต.กฟส.ฝาง',
  'พชง.4 ผมต.กฟส.ฝาง',
];

export const APPROVER_NAMES = [
  'นายพงค์ศักดิ์ เจ้ยทองศรี',
  'นายอภินันท์ ชุ่มบัวทอง',
  'นายกิตติพัทธ์ เรือนชัย',
];

export const APPROVER_LEVELS = [
  'หผ.มต.กฟส.ฝาง',
  'พชง.7 รักษาการแทน หผ.มต.กฟส.ฝาง',
  'พชง.6 ปฏิบัติงานแทน หผ.มต.กฟส.ฝาง',
  'ชผ.รักษาการแทน หผ.มต.กฟส.ฝาง',
];

export function todayIsoDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export function createEmptyWorkItem(): WorkItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: '',
    qty: '',
  };
}

export function createEmptyWorker(): WorkerRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    type: '1',
    days: '1',
    mult: '1.5',
    hours: '',
  };
}

export function createDefaultFormData(): OvertimeFormData {
  const today = todayIsoDate();
  return {
    docNo: '-',
    docDate: today,
    jobName: '',
    workDate: today,
    timeStart: '19:30',
    timeEnd: '22:30',
    useSecondPeriod: false,
    timeStart2: '13:00',
    timeEnd2: '16:30',
    workItems: [createEmptyWorkItem()],
    wbsCode: '',
    activity: '',
    repairNo: '',
    budgetCarry: '',
    budgetSpent: '',
    approvalRef: '',
    budgetPeriod: '',
    budgetMonth: '',
    budgetYear: '',
    workers: [createEmptyWorker()],
    supName: '',
    supLevel: '',
    appName: '',
    appLevel: '',
  };
}

export function createSampleFormData(): OvertimeFormData {
  const today = todayIsoDate();
  return {
    docNo: '-',
    docDate: today,
    jobName: 'สับเปลี่ยนหม้อแปลงชำรุด ดอยป่าคา',
    workDate: today,
    timeStart: '19:30',
    timeEnd: '22:30',
    useSecondPeriod: false,
    timeStart2: '13:00',
    timeEnd2: '16:30',
    workItems: [
      { id: 'sample-1', text: 'รื้อถอนหม้อแปลง TR28-004097', qty: 'จำนวน 1 เครื่อง' },
      { id: 'sample-2', text: 'ติดตั้งหม้อแปลง 100 kVA ทดแทนพร้อมจ่ายไฟ', qty: 'จำนวน 1 เครื่อง' },
    ],
    wbsCode: 'I-69-C-FANG.01',
    activity: 'OM0120',
    repairNo: '4000891245',
    budgetCarry: '15000',
    budgetSpent: '',
    approvalRef: '',
    budgetPeriod: '',
    budgetMonth: '',
    budgetYear: '',
    workers: [
      { id: 'w-1', name: 'นายพิมาน สูนปัน', type: '3', days: '1', mult: '1.5', hours: '' },
      { id: 'w-2', name: 'นายชาญกิจ กิตติวรรณ์', type: '2', days: '1', mult: '1.5', hours: '' },
      { id: 'w-3', name: 'นายจักรพล มลเทียน', type: '1', days: '1', mult: '1.5', hours: '' },
      { id: 'w-4', name: 'นายณัฐวุฒิ สิงห์ใจ', type: 'พขร.', days: '1', mult: '1.5', hours: '' },
    ],
    supName: 'นายธนพล มณีกุล',
    supLevel: 'พชง.6 ผมต.กฟส.ฝาง',
    appName: 'นายพงค์ศักดิ์ เจ้ยทองศรี',
    appLevel: 'หผ.มต.กฟส.ฝาง',
  };
}
