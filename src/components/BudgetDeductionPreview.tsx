import React from 'react';
import { OvertimeFormData, WageRates } from '../types/overtime';
import {
  calculateWorkerCost,
  formatCurrency,
  getAutoHoursForForm,
} from '../utils/thaiFormat';

interface BudgetDeductionPreviewProps {
  data: OvertimeFormData;
  rates: WageRates;
}

interface QuadrantProps {
  jobName?: string;
  approvalRef?: string;
  repairNo?: string;
  carryText?: string;
  spentText?: string;
  availBeforeText?: string;
  payThisTimeText?: string;
  remainingAfterText?: string;
  wbsCode?: string;
  activity?: string;
}

function formatSignedCurrency(val: number): string {
  if (val < 0) {
    return `-  ${formatCurrency(Math.abs(val))}`;
  }
  return formatCurrency(val);
}

const QuadrantBlock: React.FC<QuadrantProps> = ({
  jobName = '',
  approvalRef = '',
  repairNo = '',
  carryText = '',
  spentText = '',
  availBeforeText = '',
  payThisTimeText = '',
  remainingAfterText = '',
  wbsCode = '',
  activity = '',
}) => {
  return (
    <div className="px-3 py-2.5 text-[12.5px] leading-[1.45] text-[#111827] flex flex-col justify-between min-h-[255px]">
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="w-[74px] shrink-0">ชื่องาน</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 px-1 truncate">
            {jobName}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-[74px] shrink-0">อนุมัติ / ลว.</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 px-1 truncate">
            {approvalRef}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-[74px] shrink-0">หมายเลขงาน</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 px-1 font-mono-num text-[11.5px] truncate">
            {repairNo}
          </span>
        </div>
      </div>

      <div className="my-2.5 space-y-1 tabular-nums">
        <div className="flex items-baseline gap-2">
          <span className="w-[96px] shrink-0">งบประมาณ / ยกมา</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 text-right pr-1.5">
            {carryText}
          </span>
          <span className="w-[26px] shrink-0 text-right">บาท</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-[96px] shrink-0">เบิกจ่ายแล้ว</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 text-right pr-1.5">
            {spentText}
          </span>
          <span className="w-[26px] shrink-0 text-right">บาท</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-[96px] shrink-0">คงเหลือ</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 text-right pr-1.5">
            {availBeforeText}
          </span>
          <span className="w-[26px] shrink-0 text-right">บาท</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-[96px] shrink-0">จ่ายครั้งนี้</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 text-right pr-1.5 font-medium">
            {payThisTimeText}
          </span>
          <span className="w-[26px] shrink-0 text-right">บาท</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="w-[96px] shrink-0">คงเหลือ</span>
          <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 text-right pr-1.5 font-medium">
            {remainingAfterText}
          </span>
          <span className="w-[26px] shrink-0 text-right">บาท</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 pt-0.5">
        <span className="shrink-0">รหัสโครงข่าย</span>
        <span className="flex-1 min-h-[18px] border-b border-dotted border-slate-700 px-1 font-mono-num text-[11px] truncate">
          {wbsCode}
        </span>
        <span className="shrink-0">กิจกรรม</span>
        <span className="w-[64px] shrink-0 min-h-[18px] border-b border-dotted border-slate-700 px-1 font-mono-num text-[11px] truncate">
          {activity}
        </span>
      </div>
    </div>
  );
};

export const BudgetDeductionPreview: React.FC<BudgetDeductionPreviewProps> = ({
  data,
  rates,
}) => {
  const filledWorkers = data.workers.filter((w) => w.name.trim());
  const totalCost =
    Math.round(
      filledWorkers.reduce(
        (sum, w) => sum + calculateWorkerCost(w, rates, getAutoHoursForForm(data, w.period)),
        0
      ) * 100
    ) / 100;

  const carryRaw = (data.budgetCarry ?? '').trim();
  const spentRaw = (data.budgetSpent ?? '').trim();
  const hasCarry = carryRaw !== '' && Number.isFinite(parseFloat(carryRaw));
  const carryVal = hasCarry ? parseFloat(carryRaw) : 0;
  const hasSpent = spentRaw !== '' && Number.isFinite(parseFloat(spentRaw));
  const spentVal = hasSpent ? parseFloat(spentRaw) : 0;

  const availBefore = hasCarry ? Math.round((carryVal - spentVal) * 100) / 100 : null;
  const remainingAfter =
    availBefore !== null ? Math.round((availBefore - totalCost) * 100) / 100 : null;

  const supName = data.supName.trim();
  const supLevel = data.supLevel.trim();

  return (
    <div className="print-only-sheet bg-white border border-[#e3dcef] rounded-sm px-7 py-7 text-[#111827] shadow-sm">
      {/* Main bordered table frame */}
      <div className="border border-slate-900">
        {/* Title row */}
        <div className="border-b border-slate-900 py-2 text-center text-[18px] font-bold tracking-wide">
          ใบตัดงบค่าล่วงเวลา
        </div>

        {/* Office & Period Row */}
        <div className="grid grid-cols-2 border-b border-slate-900 text-[13px]">
          <div className="border-r border-slate-900 px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between pr-8">
              <span>การไฟฟ้าส่วนภูมิภาค</span>
              <span>กฟส.ฝาง</span>
            </div>
            <div className="flex items-center gap-6">
              <span>กฟฟ. เขต</span>
              <span>น.1</span>
              <span>ภาค</span>
              <span>เหนือ</span>
            </div>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0">ประจำงวดที่</span>
              <span className="flex-1">{data.budgetPeriod?.trim() || ''}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span>เดือน</span>
              <span className="min-w-[88px] inline-block">{data.budgetMonth?.trim() || ''}</span>
              <span>พ.ศ.</span>
              <span>{data.budgetYear?.trim() || ''}</span>
            </div>
          </div>
        </div>

        {/* Row 1 of 2x2 Quadrants */}
        <div className="grid grid-cols-2 border-b border-slate-900">
          <div className="border-r border-slate-900">
            <QuadrantBlock
              jobName={data.jobName.trim()}
              approvalRef={(data.approvalRef ?? '').trim()}
              repairNo={data.repairNo.trim()}
              carryText={hasCarry ? formatCurrency(carryVal) : ''}
              spentText={hasSpent ? formatCurrency(spentVal) : ''}
              availBeforeText={availBefore !== null ? formatSignedCurrency(availBefore) : ''}
              payThisTimeText={filledWorkers.length > 0 || totalCost > 0 ? formatCurrency(totalCost) : ''}
              remainingAfterText={
                remainingAfter !== null ? formatSignedCurrency(remainingAfter) : ''
              }
              wbsCode={data.wbsCode.trim()}
              activity={data.activity.trim()}
            />
          </div>
          <div>
            <QuadrantBlock />
          </div>
        </div>

        {/* Row 2 of 2x2 Quadrants */}
        <div className="grid grid-cols-2 border-b border-slate-900">
          <div className="border-r border-slate-900">
            <QuadrantBlock />
          </div>
          <div>
            <QuadrantBlock />
          </div>
        </div>

        {/* Bottom Signature Row */}
        <div className="grid grid-cols-2 text-[12.5px]">
          <div className="border-r border-slate-900 px-4 py-4 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="w-full flex items-baseline justify-center gap-1">
              <span className="shrink-0">(ลงชื่อ)</span>
              <span className="w-[175px] border-b border-dotted border-slate-700 inline-block" />
            </div>
            <div className="pt-1 min-h-[18px]">{supName || '\u00A0'}</div>
            <div className="min-h-[18px]">{supLevel || '\u00A0'}</div>
          </div>

          <div className="px-4 py-3.5 space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="shrink-0">ตัดงบแล้วเล่มที่</span>
              <span className="flex-1 border-b border-dotted border-slate-700 inline-block" />
              <span className="shrink-0">หน้า</span>
              <span className="w-[56px] border-b border-dotted border-slate-700 inline-block" />
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="shrink-0">(ลงชื่อ)</span>
              <span className="flex-1 border-b border-dotted border-slate-700 inline-block" />
              <span className="shrink-0">พบช.ผู้ตัดงบ</span>
            </div>
            <div className="text-center tracking-widest pt-0.5">
              (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note outside main border */}
      <div className="mt-3 flex items-start gap-6 px-6 text-[12px] leading-relaxed text-[#111827]">
        <span className="shrink-0">หมายเหตุ</span>
        <div className="space-y-0.5">
          <div>- ตัวจริงเก็บเข้าแฟ้มงานก่อสร้างของ ผบก.กบข.</div>
          <div>- สำเนาเก็บเข้าแฟ้มงาน พชง. เพื่อเป็นหลักฐาน</div>
          <div>- สำหรับ พชง. ผู้ควบคุมงานเป็นผู้ดำเนินการเขียนด้านหลัง</div>
        </div>
      </div>
    </div>
  );
};
