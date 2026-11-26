import type ExcelJS from 'exceljs';
import ExcelJSBrowser from 'exceljs/dist/exceljs.min.js';
import { OvertimeFormData, WageRates } from '../types/overtime';

function getExcelJS(): typeof ExcelJS {
  const mod = ExcelJSBrowser as unknown as {
    Workbook?: typeof ExcelJS.Workbook;
    default?: typeof ExcelJS;
  };
  if (mod?.Workbook) return mod as unknown as typeof ExcelJS;
  if (mod?.default?.Workbook) return mod.default;
  const win = window as unknown as { ExcelJS?: typeof ExcelJS };
  if (win.ExcelJS?.Workbook) return win.ExcelJS;
  throw new Error('ExcelJS browser bundle failed to load');
}
import {
  bahtText,
  calculateWorkerCost,
  formatCurrency,
  getAutoHoursForForm,
  getWorkerTimeDisplay,
  thaiDateFull,
  thaiDateLongMonth,
  thaiDayName,
} from './thaiFormat';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF1E293B' } },
  left: { style: 'thin', color: { argb: 'FF1E293B' } },
  bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
  right: { style: 'thin', color: { argb: 'FF1E293B' } },
};

const BASE_FONT: Partial<ExcelJS.Font> = {
  name: 'TH SarabunPSK',
  size: 16,
  color: { argb: 'FF111827' },
};

const TABLE_FONT: Partial<ExcelJS.Font> = {
  name: 'TH SarabunPSK',
  size: 16,
  color: { argb: 'FF111827' },
};

function estimateLineCount(text: string, charsPerLine = 95): number {
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

let cachedLogoBuffer: ArrayBuffer | null | undefined;
let logoLoadPromise: Promise<ArrayBuffer | null> | null = null;

let cachedSafetyBuffer: ArrayBuffer | null | undefined;
let safetyLoadPromise: Promise<ArrayBuffer | null> | null = null;

function preloadImageBuffer(
  url: string,
  getCached: () => ArrayBuffer | null | undefined,
  setCached: (buf: ArrayBuffer | null) => void,
  getPromise: () => Promise<ArrayBuffer | null> | null,
  setPromise: (p: Promise<ArrayBuffer | null>) => void
): Promise<ArrayBuffer | null> {
  const cached = getCached();
  if (cached !== undefined) return Promise.resolve(cached);
  let p = getPromise();
  if (!p) {
    p = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => {
        setCached(buf);
        return buf;
      })
      .catch(() => {
        setCached(null);
        return null;
      });
    setPromise(p);
  }
  return p;
}

function preloadPeaLogo(): Promise<ArrayBuffer | null> {
  return preloadImageBuffer(
    '/assets/pea-logo.png',
    () => cachedLogoBuffer,
    (buf) => {
      cachedLogoBuffer = buf;
    },
    () => logoLoadPromise,
    (p) => {
      logoLoadPromise = p;
    }
  );
}

function preloadSafetyImage(): Promise<ArrayBuffer | null> {
  return preloadImageBuffer(
    '/assets/aistudio/image_aac57709.png',
    () => cachedSafetyBuffer,
    (buf) => {
      cachedSafetyBuffer = buf;
    },
    () => safetyLoadPromise,
    (p) => {
      safetyLoadPromise = p;
    }
  );
}

if (typeof window !== 'undefined') {
  void preloadPeaLogo();
  void preloadSafetyImage();
}

export interface ExcelExportResult {
  filename: string;
  url: string;
}

export async function exportMemoToExcel(
  data: OvertimeFormData,
  rates: WageRates
): Promise<ExcelExportResult> {
  const Excel = getExcelJS();
  const wb = new Excel.Workbook();
  wb.creator = 'ผมต.กฟส.ฝาง';
  wb.created = new Date();

  const ws = wb.addWorksheet('บันทึกข้อความ', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
    views: [{ state: 'normal', style: 'pageLayout', showGridLines: true }],
  });

  // 11 columns (A..K) calibrated to fit inside 1 A4 portrait page width
  ws.columns = [
    { width: 3.5 },  // A: ที่
    { width: 14 },   // B: ชื่อ-สกุล
    { width: 6 },    // C: ประเภท คนงาน
    { width: 7 },    // D: ค่าแรงรายวัน
    { width: 8 },    // E: ว.ด.ป.
    { width: 5 },    // F: จำนวน (วัน)
    { width: 8.5 },  // G: จาก - ถึง
    { width: 4.5 },  // H: รวม
    { width: 4.5 },  // I: เท่า
    { width: 6 },    // J: รวมช.ม.
    { width: 8 },    // K: ค่าใช้จ่าย (บาท)
  ];

  const jobName = data.jobName.trim() || '-';
  const dayName = thaiDayName(data.workDate);
  const dateFull = thaiDateFull(data.workDate);
  const docDateLong = thaiDateLongMonth(data.docDate);
  const docNoDisplay = data.docNo.trim() === '-' ? '' : data.docNo.trim();

  const filledItems = data.workItems.filter((it) => it.text.trim() || it.qty.trim());
  const filledWorkers = data.workers.filter((w) => w.name.trim());

  // Logo space (Rows 1-4)
  const logoBuffer =
    cachedLogoBuffer !== undefined ? cachedLogoBuffer : await preloadPeaLogo();
  for (let r = 1; r <= 4; r++) {
    ws.getRow(r).height = 22;
  }
  let imageAdded = false;
  if (logoBuffer) {
    try {
      const imgId = wb.addImage({
        buffer: logoBuffer,
        extension: 'png',
      });
      ws.addImage(imgId, {
        tl: { col: 0, row: 0 },
        ext: { width: 145, height: 100 },
      });
      imageAdded = true;
    } catch {
      imageAdded = false;
    }
  }
  if (!imageAdded) {
    ws.mergeCells('A1:D2');
    const c1 = ws.getCell('A1');
    c1.value = 'การไฟฟ้าส่วนภูมิภาค\nPROVINCIAL ELECTRICITY AUTHORITY';
    c1.font = { ...BASE_FONT, size: 16, bold: true };
    c1.alignment = { vertical: 'middle', wrapText: true };
  }

  // Header info rows (Rows 5-7) — clean borderless layout
  let rowIdx = 5;
  const rFrom = ws.getRow(rowIdx);
  rFrom.height = 25;
  ws.getCell(`A${rowIdx}`).value = 'จาก';
  ws.getCell(`A${rowIdx}`).font = BASE_FONT;
  ws.mergeCells(`B${rowIdx}:F${rowIdx}`);
  ws.getCell(`B${rowIdx}`).value = 'ผมต.กฟส.ฝาง';
  ws.getCell(`B${rowIdx}`).font = BASE_FONT;
  ws.getCell(`G${rowIdx}`).value = 'ถึง';
  ws.getCell(`G${rowIdx}`).font = BASE_FONT;
  ws.mergeCells(`H${rowIdx}:K${rowIdx}`);
  ws.getCell(`H${rowIdx}`).value = 'ผจก.กฟส.ฝาง';
  ws.getCell(`H${rowIdx}`).font = BASE_FONT;

  rowIdx++;
  const rDoc = ws.getRow(rowIdx);
  rDoc.height = 25;
  ws.getCell(`A${rowIdx}`).value = 'เลขที่';
  ws.getCell(`A${rowIdx}`).font = BASE_FONT;
  ws.mergeCells(`B${rowIdx}:F${rowIdx}`);
  ws.getCell(`B${rowIdx}`).value = docNoDisplay;
  ws.getCell(`B${rowIdx}`).font = BASE_FONT;
  ws.getCell(`G${rowIdx}`).value = 'วันที่';
  ws.getCell(`G${rowIdx}`).font = BASE_FONT;
  ws.mergeCells(`H${rowIdx}:K${rowIdx}`);
  ws.getCell(`H${rowIdx}`).value = docDateLong;
  ws.getCell(`H${rowIdx}`).font = BASE_FONT;

  rowIdx++;
  const rSubj = ws.getRow(rowIdx);
  rSubj.height = 25;
  ws.getCell(`A${rowIdx}`).value = 'เรื่อง';
  ws.getCell(`A${rowIdx}`).font = BASE_FONT;
  ws.mergeCells(`B${rowIdx}:K${rowIdx}`);
  ws.getCell(`B${rowIdx}`).value = 'ขออนุมัติให้คนงานรายวัน บริษัทฯ ปฏิบัติงานล่วงเวลา';
  ws.getCell(`B${rowIdx}`).font = BASE_FONT;

  // Blank spacer
  rowIdx++;
  ws.getRow(rowIdx).height = 10;

  // Intro paragraph
  rowIdx++;
  const introText = `        ผมต.กฟส.ฝาง มีความประสงค์ให้คนงาน ปฏิบัติงานล่วงเวลา ${jobName} เพื่อให้งานแล้วเสร็จตามกำหนดในวัน${dayName} ที่ ${dateFull} โดยมีปริมาณงานดังนี้`;
  ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
  const introCell = ws.getCell(`A${rowIdx}`);
  introCell.value = introText;
  introCell.font = BASE_FONT;
  introCell.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(rowIdx).height = Math.max(25, estimateLineCount(introText, 68) * 23);

  // Work items
  if (filledItems.length > 0) {
    filledItems.forEach((it, idx) => {
      rowIdx++;
      const line = `${idx + 1}. ${it.text}${it.qty ? ` — ${it.qty}` : ''}`;
      ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
      const cell = ws.getCell(`A${rowIdx}`);
      cell.value = line;
      cell.font = BASE_FONT;
      cell.alignment = { vertical: 'middle', wrapText: true, indent: 2 };
      ws.getRow(rowIdx).height = Math.max(24, estimateLineCount(line, 66) * 22);
    });
  }

  // Blank spacer
  rowIdx++;
  ws.getRow(rowIdx).height = 8;

  // Repair / WBS / Activity line
  rowIdx++;
  const refLine = `ปฏิบัติงานสำหรับงานซ่อมบำรุงรักษา เลขที่ใบสั่งซ่อม ${data.repairNo.trim() || '-'}   |   รหัสโครงข่าย ${data.wbsCode.trim() || '-'}   กิจกรรม ${data.activity.trim() || '-'}`;
  ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
  const refCell = ws.getCell(`A${rowIdx}`);
  refCell.value = refLine;
  refCell.font = BASE_FONT;
  refCell.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(rowIdx).height = Math.max(25, estimateLineCount(refLine, 68) * 22);

  // Blank spacer
  rowIdx++;
  ws.getRow(rowIdx).height = 8;

  // Table Title (centered across A..K)
  rowIdx++;
  ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
  const tblTitleCell = ws.getCell(`A${rowIdx}`);
  tblTitleCell.value =
    'รายละเอียดค่าใช้จ่ายการปฏิบัติงานล่วงเวลา คนงานบริษัท เพาเวอร์เทคโนโลยี ดีเวลลอปเมนท์ จำกัด';
  tblTitleCell.font = BASE_FONT;
  tblTitleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws.getRow(rowIdx).height = 26;

  // 2-row 11-column Table Header (A..K)
  const h1 = rowIdx + 1;
  const h2 = rowIdx + 2;
  ws.getRow(h1).height = 25;
  ws.getRow(h2).height = 24;

  const singleHeaders: Array<{ col: string; label: string }> = [
    { col: 'A', label: 'ที่' },
    { col: 'B', label: 'ชื่อ-สกุล' },
    { col: 'C', label: 'ประเภท\nคนงาน' },
    { col: 'D', label: 'ค่าแรง\nรายวัน' },
    { col: 'E', label: 'ว.ด.ป.' },
    { col: 'F', label: 'จำนวน\n(วัน)' },
    { col: 'K', label: 'ค่าใช้จ่าย\n(บาท)' },
  ];

  singleHeaders.forEach(({ col, label }) => {
    ws.mergeCells(`${col}${h1}:${col}${h2}`);
    const cell = ws.getCell(`${col}${h1}`);
    cell.value = label;
    cell.font = TABLE_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  ws.mergeCells(`G${h1}:H${h1}`);
  ws.getCell(`G${h1}`).value = 'เวลาปฏิบัติงาน';
  ws.getCell(`G${h1}`).font = TABLE_FONT;
  ws.getCell(`G${h1}`).alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells(`I${h1}:J${h1}`);
  ws.getCell(`I${h1}`).value = 'ปฏิบัติงาน';
  ws.getCell(`I${h1}`).font = TABLE_FONT;
  ws.getCell(`I${h1}`).alignment = { horizontal: 'center', vertical: 'middle' };

  const subHeaders: Array<{ col: string; label: string }> = [
    { col: 'G', label: 'จาก - ถึง' },
    { col: 'H', label: 'รวม' },
    { col: 'I', label: 'เท่า' },
    { col: 'J', label: 'รวมช.ม.' },
  ];
  subHeaders.forEach(({ col, label }) => {
    const cell = ws.getCell(`${col}${h2}`);
    cell.value = label;
    cell.font = TABLE_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Apply borders to all cells in header rows h1 and h2
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  for (const r of [h1, h2]) {
    for (const c of cols) {
      ws.getCell(`${c}${r}`).border = THIN_BORDER;
    }
  }

  rowIdx = h2;
  const firstDataRow = rowIdx + 1;
  let total = 0;

  if (filledWorkers.length > 0) {
    filledWorkers.forEach((w, idx) => {
      rowIdx++;
      const rate = rates[w.type] ?? 0;
      const workerAutoHours = getAutoHoursForForm(data, w.period);
      const timeInfo = getWorkerTimeDisplay(w, data);
      const days = parseFloat(w.days) || 0;
      const mult = parseFloat(w.mult) || 0;
      const cost = calculateWorkerCost(w, rates, workerAutoHours);
      total += cost;

      const row = ws.getRow(rowIdx);
      row.height = timeInfo.isTwoLines ? 38 : 24;

      ws.getCell(`A${rowIdx}`).value = idx + 1;
      ws.getCell(`B${rowIdx}`).value = w.name;
      ws.getCell(`C${rowIdx}`).value = w.type;
      ws.getCell(`D${rowIdx}`).value = rate;
      ws.getCell(`E${rowIdx}`).value = dateFull;
      ws.getCell(`F${rowIdx}`).value = days;
      if (timeInfo.isTwoLines) {
        ws.getCell(`G${rowIdx}`).value = `${timeInfo.ranges[0]}\n${timeInfo.ranges[1]}`;
        ws.getCell(`H${rowIdx}`).value = `${timeInfo.hourItems[0]}\n${timeInfo.hourItems[1]}`;
        ws.getCell(`J${rowIdx}`).value = timeInfo.totalHours;
      } else {
        ws.getCell(`G${rowIdx}`).value = timeInfo.ranges[0];
        ws.getCell(`H${rowIdx}`).value = timeInfo.totalHours;
        ws.getCell(`J${rowIdx}`).value = { formula: `H${rowIdx}`, result: timeInfo.totalHours };
      }
      ws.getCell(`I${rowIdx}`).value = mult;
      ws.getCell(`K${rowIdx}`).value = {
        formula: `ROUND((D${rowIdx}/8)*J${rowIdx}*I${rowIdx}*F${rowIdx},2)`,
        result: cost,
      };

      cols.forEach((c) => {
        const cell = ws.getCell(`${c}${rowIdx}`);
        cell.font = TABLE_FONT;
        cell.border = THIN_BORDER;
        if (c === 'B') {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (c === 'D' || c === 'K') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
        } else {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: timeInfo.isTwoLines && (c === 'G' || c === 'H'),
          };
        }
      });
    });
  } else {
    rowIdx++;
    ws.getRow(rowIdx).height = 22;
    ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
    const emptyCell = ws.getCell(`A${rowIdx}`);
    emptyCell.value = '— ยังไม่ได้ระบุรายชื่อคนงาน —';
    emptyCell.font = { ...TABLE_FONT, color: { argb: 'FF9CA3AF' } };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    cols.forEach((c) => {
      ws.getCell(`${c}${rowIdx}`).border = THIN_BORDER;
    });
  }

  const lastDataRow = rowIdx;
  const roundedTotal = Math.round(total * 100) / 100;

  // Total row
  rowIdx++;
  const memoTotalRow = rowIdx;
  ws.getRow(rowIdx).height = 25;
  ws.mergeCells(`A${rowIdx}:J${rowIdx}`);
  const totalLabelCell = ws.getCell(`A${rowIdx}`);
  totalLabelCell.value = 'รวมค่าใช้จ่าย';
  totalLabelCell.font = { ...TABLE_FONT, bold: true };
  totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalValueCell = ws.getCell(`K${rowIdx}`);
  totalValueCell.value =
    filledWorkers.length > 0
      ? { formula: `SUM(K${firstDataRow}:K${lastDataRow})`, result: roundedTotal }
      : 0;
  totalValueCell.font = { ...TABLE_FONT, bold: true };
  totalValueCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalValueCell.numFmt = '#,##0.00';

  cols.forEach((c) => {
    ws.getCell(`${c}${rowIdx}`).border = THIN_BORDER;
  });

  // Blank spacer
  rowIdx++;
  ws.getRow(rowIdx).height = 10;

  // Cost summary sentence
  rowIdx++;
  const costSentence = `ค่าใช้จ่ายในการปฏิบัติงานล่วงเวลาเป็นเงิน ${formatCurrency(roundedTotal)} บาท ( ${bahtText(roundedTotal)} ) โดยให้`;
  ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
  const costCell = ws.getCell(`A${rowIdx}`);
  costCell.value = costSentence;
  costCell.font = BASE_FONT;
  costCell.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(rowIdx).height = Math.max(25, estimateLineCount(costSentence, 68) * 22);

  // Supervisor line
  rowIdx++;
  const supSentence = `${data.supName.trim() || '-'} ${data.supLevel.trim() || '-'} เป็นผู้ควบคุมการปฏิบัติงาน`;
  ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
  const supCell = ws.getCell(`A${rowIdx}`);
  supCell.value = supSentence;
  supCell.font = BASE_FONT;
  supCell.alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(rowIdx).height = 24;

  // Closing line
  rowIdx++;
  ws.mergeCells(`A${rowIdx}:K${rowIdx}`);
  const closingCell = ws.getCell(`A${rowIdx}`);
  closingCell.value = 'จึงเรียนเพื่อโปรดพิจารณาอนุมัติ';
  closingCell.font = BASE_FONT;
  closingCell.alignment = { vertical: 'middle' };
  ws.getRow(rowIdx).height = 25;

  // Signature spacing + Approver only (right-aligned half)
  rowIdx += 2;
  ws.getRow(rowIdx).height = 25;
  ws.mergeCells(`F${rowIdx}:K${rowIdx}`);
  const dotCell = ws.getCell(`F${rowIdx}`);
  dotCell.value = '......................................................';
  dotCell.font = BASE_FONT;
  dotCell.alignment = { horizontal: 'center', vertical: 'bottom' };

  rowIdx++;
  ws.getRow(rowIdx).height = 24;
  ws.mergeCells(`F${rowIdx}:K${rowIdx}`);
  const appNameCell = ws.getCell(`F${rowIdx}`);
  appNameCell.value = `( ${data.appName.trim() || '-'} )`;
  appNameCell.font = BASE_FONT;
  appNameCell.alignment = { horizontal: 'center', vertical: 'middle' };

  rowIdx++;
  ws.getRow(rowIdx).height = 24;
  ws.mergeCells(`F${rowIdx}:K${rowIdx}`);
  const appLevelCell = ws.getCell(`F${rowIdx}`);
  appLevelCell.value = data.appLevel.trim() || '-';
  appLevelCell.font = BASE_FONT;
  appLevelCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Footer (left text + bottom-right safety banner)
  rowIdx += 1;
  ws.getRow(rowIdx).height = 14;
  rowIdx += 1;
  ws.getRow(rowIdx).height = 24;
  rowIdx += 1;
  ws.getRow(rowIdx).height = 24;

  ws.mergeCells(`A${rowIdx}:D${rowIdx}`);
  const footerCell = ws.getCell(`A${rowIdx}`);
  footerCell.value = 'ผมต.กฟส.ฝาง   14448';
  footerCell.font = { ...BASE_FONT, color: { argb: 'FF64748B' } };
  footerCell.alignment = { vertical: 'bottom' };

  const safetyBuffer =
    cachedSafetyBuffer !== undefined ? cachedSafetyBuffer : await preloadSafetyImage();
  if (safetyBuffer) {
    try {
      const safetyImgId = wb.addImage({
        buffer: safetyBuffer,
        extension: 'png',
      });
      ws.addImage(safetyImgId, {
        tl: { col: 6.2, row: rowIdx - 2 },
        ext: { width: 224, height: 57 },
      });
    } catch {
      // Ignore if image embedding fails
    }
  }

  // Sheet 2: ใบตัดงบค่าล่วงเวลา
  buildBudgetDeductionSheet(wb, data, roundedTotal, filledWorkers.length > 0, memoTotalRow);

  // Generate buffer and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const safeName = (data.jobName.trim() || 'เอกสารล่วงเวลา')
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 40);
  const fileDate = data.workDate || new Date().toISOString().slice(0, 10);
  const filename = `บันทึกข้อความ_${safeName}_${fileDate}.xlsx`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  return { filename, url };
}

function colLetter(colIdx1Based: number): string {
  return String.fromCharCode(64 + colIdx1Based);
}

function applyBoxBorder(
  ws: ExcelJS.Worksheet,
  r1: number,
  r2: number,
  c1: number,
  c2: number
) {
  const solid: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF111827' } };
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c);
      const prev = cell.border || {};
      cell.border = {
        ...prev,
        top: r === r1 ? solid : prev.top,
        bottom: r === r2 ? solid : prev.bottom,
        left: c === c1 ? solid : prev.left,
        right: c === c2 ? solid : prev.right,
      };
    }
  }
}

function buildBudgetDeductionSheet(
  wb: ExcelJS.Workbook,
  data: OvertimeFormData,
  roundedTotal: number,
  hasWorkers: boolean,
  memoTotalRow: number
) {
  const ws = wb.addWorksheet('ใบตัดงบค่าล่วงเวลา', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
    },
    views: [{ state: 'normal', style: 'pageLayout', showGridLines: false }],
  });

  // 12 symmetric columns (A..F left half, G..L right half)
  ws.columns = [
    { width: 10.5 }, // A
    { width: 5 },    // B
    { width: 6.5 },  // C
    { width: 5.5 },  // D
    { width: 8 },    // E
    { width: 4 },    // F
    { width: 10.5 }, // G
    { width: 5 },    // H
    { width: 6.5 },  // I
    { width: 5.5 },  // J
    { width: 8 },    // K
    { width: 4 },    // L
  ];

  const sheetFont: Partial<ExcelJS.Font> = {
    name: 'TH SarabunPSK',
    size: 15,
    color: { argb: 'FF111827' },
  };
  const dottedBottom: Partial<ExcelJS.Border> = {
    style: 'dotted',
    color: { argb: 'FF334155' },
  };

  // Row 1: Title
  ws.getRow(1).height = 28;
  ws.mergeCells('A1:L1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ใบตัดงบค่าล่วงเวลา';
  titleCell.font = { ...sheetFont, size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  applyBoxBorder(ws, 1, 1, 1, 12);

  // Rows 2-3: Office & Period
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;

  ws.mergeCells('A2:B2');
  ws.getCell('A2').value = 'การไฟฟ้าส่วนภูมิภาค';
  ws.getCell('A2').font = sheetFont;
  ws.getCell('A2').alignment = { vertical: 'middle' };

  ws.mergeCells('C2:F2');
  ws.getCell('C2').value = 'กฟส.ฝาง';
  ws.getCell('C2').font = sheetFont;
  ws.getCell('C2').alignment = { horizontal: 'center', vertical: 'middle' };

  ws.getCell('A3').value = 'กฟฟ. เขต';
  ws.getCell('A3').font = sheetFont;
  ws.getCell('A3').alignment = { vertical: 'middle' };
  ws.getCell('B3').value = 'น.1';
  ws.getCell('B3').font = sheetFont;
  ws.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('C3').value = 'ภาค';
  ws.getCell('C3').font = sheetFont;
  ws.getCell('C3').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells('D3:F3');
  ws.getCell('D3').value = 'เหนือ';
  ws.getCell('D3').font = sheetFont;
  ws.getCell('D3').alignment = { vertical: 'middle' };
  applyBoxBorder(ws, 2, 3, 1, 6);

  ws.getCell('G2').value = 'ประจำงวดที่';
  ws.getCell('G2').font = sheetFont;
  ws.getCell('G2').alignment = { vertical: 'middle' };
  ws.mergeCells('H2:L2');
  ws.getCell('H2').value = (data.budgetPeriod ?? '').trim();
  ws.getCell('H2').font = sheetFont;
  ws.getCell('H2').alignment = { vertical: 'middle' };

  ws.getCell('G3').value = 'เดือน';
  ws.getCell('G3').font = sheetFont;
  ws.getCell('G3').alignment = { vertical: 'middle' };
  ws.mergeCells('H3:I3');
  ws.getCell('H3').value = (data.budgetMonth ?? '').trim();
  ws.getCell('H3').font = sheetFont;
  ws.getCell('H3').alignment = { vertical: 'middle' };
  ws.getCell('J3').value = 'พ.ศ.';
  ws.getCell('J3').font = sheetFont;
  ws.getCell('J3').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells('K3:L3');
  ws.getCell('K3').value = (data.budgetYear ?? '').trim();
  ws.getCell('K3').font = sheetFont;
  ws.getCell('K3').alignment = { vertical: 'middle' };
  applyBoxBorder(ws, 2, 3, 7, 12);

  const carryRaw = (data.budgetCarry ?? '').trim();
  const spentRaw = (data.budgetSpent ?? '').trim();
  const hasCarry = carryRaw !== '' && Number.isFinite(parseFloat(carryRaw));
  const carryVal = hasCarry ? parseFloat(carryRaw) : 0;
  const hasSpent = spentRaw !== '' && Number.isFinite(parseFloat(spentRaw));
  const spentVal = hasSpent ? parseFloat(spentRaw) : 0;
  const availBefore = Math.round((carryVal - spentVal) * 100) / 100;
  const remainingAfter = Math.round((availBefore - roundedTotal) * 100) / 100;

  const drawQuadrant = (startRow: number, startCol: number, filled: boolean) => {
    const c0 = startCol;
    const c1 = startCol + 1;
    const c2 = startCol + 2;
    const c3 = startCol + 3;
    const c4 = startCol + 4;
    const c5 = startCol + 5;

    const L0 = colLetter(c0);
    const L1 = colLetter(c1);
    const L2 = colLetter(c2);
    const L3 = colLetter(c3);
    const L4 = colLetter(c4);
    const L5 = colLetter(c5);

    const setDottedRange = (row: number, fromCol: number, toCol: number) => {
      for (let col = fromCol; col <= toCol; col++) {
        const cell = ws.getCell(row, col);
        cell.border = { ...(cell.border || {}), bottom: dottedBottom };
      }
    };

    // Row +0: ชื่องาน
    const rJob = startRow;
    ws.getRow(rJob).height = 22;
    ws.getCell(`${L0}${rJob}`).value = 'ชื่องาน';
    ws.getCell(`${L0}${rJob}`).font = sheetFont;
    ws.getCell(`${L0}${rJob}`).alignment = { vertical: 'middle' };
    ws.mergeCells(`${L1}${rJob}:${L5}${rJob}`);
    ws.getCell(`${L1}${rJob}`).value = filled ? data.jobName.trim() : '';
    ws.getCell(`${L1}${rJob}`).font = sheetFont;
    ws.getCell(`${L1}${rJob}`).alignment = { vertical: 'middle' };
    setDottedRange(rJob, c1, c5);

    // Row +1: อนุมัติ / ลว.
    const rApp = startRow + 1;
    ws.getRow(rApp).height = 22;
    ws.getCell(`${L0}${rApp}`).value = 'อนุมัติ / ลว.';
    ws.getCell(`${L0}${rApp}`).font = sheetFont;
    ws.getCell(`${L0}${rApp}`).alignment = { vertical: 'middle' };
    ws.mergeCells(`${L1}${rApp}:${L5}${rApp}`);
    ws.getCell(`${L1}${rApp}`).value = filled ? (data.approvalRef ?? '').trim() : '';
    ws.getCell(`${L1}${rApp}`).font = sheetFont;
    ws.getCell(`${L1}${rApp}`).alignment = { vertical: 'middle' };
    setDottedRange(rApp, c1, c5);

    // Row +2: หมายเลขงาน
    const rNum = startRow + 2;
    ws.getRow(rNum).height = 22;
    ws.getCell(`${L0}${rNum}`).value = 'หมายเลขงาน';
    ws.getCell(`${L0}${rNum}`).font = sheetFont;
    ws.getCell(`${L0}${rNum}`).alignment = { vertical: 'middle' };
    ws.mergeCells(`${L1}${rNum}:${L5}${rNum}`);
    ws.getCell(`${L1}${rNum}`).value = filled ? data.repairNo.trim() : '';
    ws.getCell(`${L1}${rNum}`).font = sheetFont;
    ws.getCell(`${L1}${rNum}`).alignment = { vertical: 'middle' };
    setDottedRange(rNum, c1, c5);

    // Row +3: spacer
    ws.getRow(startRow + 3).height = 8;

    const moneyFmt = '#,##0.00;"- "#,##0.00;0.00';
    const moneyRows: Array<{ offset: number; label: string }> = [
      { offset: 4, label: 'งบประมาณ / ยกมา' },
      { offset: 5, label: 'เบิกจ่ายแล้ว' },
      { offset: 6, label: 'คงเหลือ' },
      { offset: 7, label: 'จ่ายครั้งนี้' },
      { offset: 8, label: 'คงเหลือ' },
    ];

    moneyRows.forEach(({ offset, label }) => {
      const r = startRow + offset;
      ws.getRow(r).height = 22;
      ws.mergeCells(`${L0}${r}:${L1}${r}`);
      ws.getCell(`${L0}${r}`).value = label;
      ws.getCell(`${L0}${r}`).font = sheetFont;
      ws.getCell(`${L0}${r}`).alignment = { vertical: 'middle' };

      ws.mergeCells(`${L2}${r}:${L4}${r}`);
      const valCell = ws.getCell(`${L2}${r}`);
      valCell.font = sheetFont;
      valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      valCell.numFmt = moneyFmt;
      setDottedRange(r, c2, c4);

      ws.getCell(`${L5}${r}`).value = 'บาท';
      ws.getCell(`${L5}${r}`).font = sheetFont;
      ws.getCell(`${L5}${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    if (filled) {
      const rCarry = startRow + 4;
      const rSpent = startRow + 5;
      const rAvail = startRow + 6;
      const rPay = startRow + 7;
      const rRem = startRow + 8;

      if (hasCarry) {
        ws.getCell(`${L2}${rCarry}`).value = carryVal;
        if (hasSpent) {
          ws.getCell(`${L2}${rSpent}`).value = spentVal;
        }
        ws.getCell(`${L2}${rAvail}`).value = {
          formula: `${L2}${rCarry}-${L2}${rSpent}`,
          result: availBefore,
        };
      }
      if (hasWorkers || roundedTotal > 0) {
        ws.getCell(`${L2}${rPay}`).value = {
          formula: `'บันทึกข้อความ'!K${memoTotalRow}`,
          result: roundedTotal,
        };
      }
      if (hasCarry) {
        ws.getCell(`${L2}${rRem}`).value = {
          formula: `${L2}${rAvail}-${L2}${rPay}`,
          result: remainingAfter,
        };
      }
    }

    // Row +9: spacer
    ws.getRow(startRow + 9).height = 8;

    // Row +10: รหัสโครงข่าย + กิจกรรม
    const rWbs = startRow + 10;
    ws.getRow(rWbs).height = 22;
    ws.getCell(`${L0}${rWbs}`).value = 'รหัสโครงข่าย';
    ws.getCell(`${L0}${rWbs}`).font = sheetFont;
    ws.getCell(`${L0}${rWbs}`).alignment = { vertical: 'middle' };

    ws.mergeCells(`${L1}${rWbs}:${L2}${rWbs}`);
    ws.getCell(`${L1}${rWbs}`).value = filled ? data.wbsCode.trim() : '';
    ws.getCell(`${L1}${rWbs}`).font = sheetFont;
    ws.getCell(`${L1}${rWbs}`).alignment = { vertical: 'middle' };
    setDottedRange(rWbs, c1, c2);

    ws.getCell(`${L3}${rWbs}`).value = 'กิจกรรม';
    ws.getCell(`${L3}${rWbs}`).font = sheetFont;
    ws.getCell(`${L3}${rWbs}`).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(`${L4}${rWbs}:${L5}${rWbs}`);
    ws.getCell(`${L4}${rWbs}`).value = filled ? data.activity.trim() : '';
    ws.getCell(`${L4}${rWbs}`).font = sheetFont;
    ws.getCell(`${L4}${rWbs}`).alignment = { vertical: 'middle' };
    setDottedRange(rWbs, c4, c5);

    // Row +11: bottom padding
    ws.getRow(startRow + 11).height = 8;

    applyBoxBorder(ws, startRow, startRow + 11, startCol, startCol + 5);
  };

  // 2x2 Quadrants
  drawQuadrant(4, 1, true);   // Top-left (populated)
  drawQuadrant(4, 7, false);  // Top-right (blank template)
  drawQuadrant(16, 1, false); // Bottom-left (blank template)
  drawQuadrant(16, 7, false); // Bottom-right (blank template)

  // Bottom Signature Block (Rows 28-31)
  for (let r = 28; r <= 31; r++) {
    ws.getRow(r).height = 23;
  }

  ws.mergeCells('A29:F29');
  ws.getCell('A29').value = '(ลงชื่อ)....................................................';
  ws.getCell('A29').font = sheetFont;
  ws.getCell('A29').alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('A30:F30');
  ws.getCell('A30').value = data.supName.trim();
  ws.getCell('A30').font = sheetFont;
  ws.getCell('A30').alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('A31:F31');
  ws.getCell('A31').value = data.supLevel.trim();
  ws.getCell('A31').font = sheetFont;
  ws.getCell('A31').alignment = { horizontal: 'center', vertical: 'middle' };
  applyBoxBorder(ws, 28, 31, 1, 6);

  ws.mergeCells('G28:L28');
  ws.getCell('G28').value = 'ตัดงบแล้วเล่มที่ ............................... หน้า ..................';
  ws.getCell('G28').font = sheetFont;
  ws.getCell('G28').alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('G29:L29');
  ws.getCell('G29').value = '(ลงชื่อ)......................................... พบช.ผู้ตัดงบ';
  ws.getCell('G29').font = sheetFont;
  ws.getCell('G29').alignment = { horizontal: 'center', vertical: 'middle' };

  ws.mergeCells('G30:L30');
  ws.getCell('G30').value = '(                                                )';
  ws.getCell('G30').font = sheetFont;
  ws.getCell('G30').alignment = { horizontal: 'center', vertical: 'middle' };
  applyBoxBorder(ws, 28, 31, 7, 12);

  // Spacer + Footer Notes outside border
  ws.getRow(32).height = 8;
  const notes = [
    '- ตัวจริงเก็บเข้าแฟ้มงานก่อสร้างของ ผบก.กบข.',
    '- สำเนาเก็บเข้าแฟ้มงาน พชง. เพื่อเป็นหลักฐาน',
    '- สำหรับ พชง. ผู้ควบคุมงานเป็นผู้ดำเนินการเขียนด้านหลัง',
  ];
  notes.forEach((line, idx) => {
    const r = 33 + idx;
    ws.getRow(r).height = 20;
    if (idx === 0) {
      ws.getCell(`B${r}`).value = 'หมายเหตุ';
      ws.getCell(`B${r}`).font = sheetFont;
      ws.getCell(`B${r}`).alignment = { vertical: 'middle' };
    }
    ws.mergeCells(`C${r}:L${r}`);
    ws.getCell(`C${r}`).value = line;
    ws.getCell(`C${r}`).font = sheetFont;
    ws.getCell(`C${r}`).alignment = { vertical: 'middle' };
  });
}
