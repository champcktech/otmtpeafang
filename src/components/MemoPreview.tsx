import React from 'react';
import { OvertimeFormData, WageRates } from '../types/overtime';
import {
  bahtText,
  calculateWorkerCost,
  formatCurrency,
  getAutoHoursForForm,
  getWorkerTimeDisplay,
  thaiDateFull,
  thaiDateLongMonth,
  thaiDayName,
} from '../utils/thaiFormat';

interface MemoPreviewProps {
  data: OvertimeFormData;
  rates: WageRates;
}

export const MemoPreview: React.FC<MemoPreviewProps> = ({ data, rates }) => {
  const [logoError, setLogoError] = React.useState(false);
  const jobName = data.jobName.trim() || '-';
  const dayName = thaiDayName(data.workDate);
  const dateFull = thaiDateFull(data.workDate);
  const docDateLong = thaiDateLongMonth(data.docDate);
  const docNoDisplay = data.docNo.trim() === '-' ? '' : data.docNo.trim();

  const filledItems = data.workItems.filter((it) => it.text.trim() || it.qty.trim());
  const filledWorkers = data.workers.filter((w) => w.name.trim());

  const totalCost = filledWorkers.reduce(
    (sum, w) => sum + calculateWorkerCost(w, rates, getAutoHoursForForm(data, w.period)),
    0
  );

  const supName = data.supName.trim() || '-';
  const supLevel = data.supLevel.trim() || '-';
  const appName = data.appName.trim() || '-';
  const appLevel = data.appLevel.trim() || '-';

  return (
    <div className="print-only-sheet bg-white border border-[#e3dcef] rounded-sm px-8 py-8 text-[15px] leading-[1.7] text-[#1c1826] shadow-sm min-h-[680px]">
      {/* Real PEA Memo Header */}
      <div className="mb-3">
        <div className="mb-2">
          {!logoError ? (
            <img
              src="/assets/pea-logo.png"
              alt="การไฟฟ้าส่วนภูมิภาค Provincial Electricity Authority"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-[92px] w-auto object-contain"
            />
          ) : (
            <div className="py-1">
              <div className="text-[18px] font-bold leading-tight text-[#1c1826]">
                การไฟฟ้าส่วนภูมิภาค
              </div>
              <div className="text-[10.5px] tracking-wider text-[#4b4558]">
                PROVINCIAL ELECTRICITY AUTHORITY
              </div>
            </div>
          )}
        </div>

        <table className="w-full border-collapse text-[15px]">
          <tbody>
            <tr>
              <td className="py-1 pr-2 w-[11%] align-middle whitespace-nowrap">จาก</td>
              <td className="py-1 px-2 w-[47%] align-middle">
                ผมต.กฟส.ฝาง
              </td>
              <td className="py-1 px-2.5 w-[10%] align-middle whitespace-nowrap">
                ถึง
              </td>
              <td className="py-1 pl-3 w-[32%] align-middle">ผจก.กฟส.ฝาง</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 align-middle whitespace-nowrap">เลขที่</td>
              <td className="py-1 px-2 align-middle font-mono-num">
                {docNoDisplay}
              </td>
              <td className="py-1 px-2.5 align-middle whitespace-nowrap">
                วันที่
              </td>
              <td className="py-1 pl-3 align-middle whitespace-nowrap">{docDateLong}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-2.5 flex items-baseline text-[15px]">
          <span className="w-[11%] shrink-0">เรื่อง</span>
          <span>ขออนุมัติให้คนงานรายวัน บริษัทฯ ปฏิบัติงานล่วงเวลา</span>
        </div>
      </div>

      <p className="indent-8 text-[15px] mb-2">
        ผมต.กฟส.ฝาง มีความประสงค์ให้คนงาน ปฏิบัติงานล่วงเวลา {jobName} เพื่อให้งานแล้วเสร็จตามกำหนดในวัน
        {dayName} ที่ {dateFull} โดยมีปริมาณงานดังนี้
      </p>

      <ol className="list-decimal ml-10 my-2 space-y-0.5 text-[14.5px]">
        {filledItems.length > 0 ? (
          filledItems.map((it) => (
            <li key={it.id}>
              {it.text}
              {it.qty ? ` — ${it.qty}` : ''}
            </li>
          ))
        ) : (
          <li className="text-slate-400 list-none -ml-4">— ยังไม่ได้ระบุปริมาณงาน —</li>
        )}
      </ol>

      <p className="mt-3 text-[14.5px]">
        ปฏิบัติงานสำหรับงานซ่อมบำรุงรักษา เลขที่ใบสั่งซ่อม{' '}
        <span className="font-mono-num">{data.repairNo.trim() || '-'}</span>
        {'  |  '}รหัสโครงข่าย{' '}
        <span className="font-mono-num">{data.wbsCode.trim() || '-'}</span> กิจกรรม{' '}
        <span className="font-mono-num">{data.activity.trim() || '-'}</span>
      </p>

      <p className="mt-4 mb-2 text-center text-[14.5px]">
        รายละเอียดค่าใช้จ่ายการปฏิบัติงานล่วงเวลา คนงานบริษัท เพาเวอร์เทคโนโลยี ดีเวลลอปเมนท์ จำกัด
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] tabular-nums">
          <thead>
            <tr className="bg-white">
              <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 font-normal text-center align-middle">
                ที่
              </th>
              <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 font-normal text-center align-middle">
                ชื่อ-สกุล
              </th>
              <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 font-normal text-center align-middle leading-tight">
                ประเภท
                <br />
                คนงาน
              </th>
              <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 font-normal text-center align-middle whitespace-nowrap">
                ค่าแรงรายวัน
              </th>
              <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 font-normal text-center align-middle">
                ว.ด.ป.
              </th>
              <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 font-normal text-center align-middle leading-tight">
                จำนวน
                <br />
                (วัน)
              </th>
              <th colSpan={2} className="border border-slate-800 px-1.5 py-1 font-normal text-center align-middle">
                เวลาปฏิบัติงาน
              </th>
              <th colSpan={2} className="border border-slate-800 px-1.5 py-1 font-normal text-center align-middle">
                ปฏิบัติงาน
              </th>
              <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 font-normal text-center align-middle leading-tight">
                ค่าใช้จ่าย
                <br />
                (บาท)
              </th>
            </tr>
            <tr className="bg-white">
              <th className="border border-slate-800 px-1.5 py-1 font-normal text-center whitespace-nowrap">จาก - ถึง</th>
              <th className="border border-slate-800 px-1.5 py-1 font-normal text-center">รวม</th>
              <th className="border border-slate-800 px-1.5 py-1 font-normal text-center">เท่า</th>
              <th className="border border-slate-800 px-1.5 py-1 font-normal text-center whitespace-nowrap">รวมช.ม.</th>
            </tr>
          </thead>
          <tbody>
            {filledWorkers.length > 0 ? (
              filledWorkers.map((w, idx) => {
                const rate = rates[w.type] ?? 0;
                const timeInfo = getWorkerTimeDisplay(w, data);
                const cost = calculateWorkerCost(
                  w,
                  rates,
                  getAutoHoursForForm(data, w.period)
                );
                return (
                  <tr key={w.id}>
                    <td className="border border-slate-800 px-1.5 py-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-800 px-2 py-1 text-left whitespace-nowrap">
                      {w.name}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center">
                      {w.type}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-right">
                      {rate.toFixed(2)}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center whitespace-nowrap">
                      {dateFull}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center">
                      {w.days || 0}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center whitespace-nowrap leading-snug">
                      {timeInfo.ranges.map((r, i) => (
                        <div key={i}>{r}</div>
                      ))}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center leading-snug">
                      {timeInfo.hourItems.map((h, i) => (
                        <div key={i}>{h}</div>
                      ))}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center">{w.mult}</td>
                    <td className="border border-slate-800 px-1.5 py-1 text-center">
                      {timeInfo.totalHours}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1 text-right font-medium">
                      {formatCurrency(cost)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="border border-slate-800 px-2 py-3 text-center text-slate-400"
                >
                  — ยังไม่ได้ระบุรายชื่อคนงาน —
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={10}
                className="border border-slate-800 px-2 py-1.5 text-right font-semibold"
              >
                รวมค่าใช้จ่าย
              </td>
              <td className="border border-slate-800 px-1.5 py-1.5 text-right font-bold">
                {formatCurrency(totalCost)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-[15px]">
        ค่าใช้จ่ายในการปฏิบัติงานล่วงเวลาเป็นเงิน{' '}
        <span className="font-semibold tabular-nums">{formatCurrency(totalCost)}</span> บาท ({' '}
        {bahtText(totalCost)} ) โดยให้
      </p>
      <p className="text-[15px]">
        {supName} {supLevel} เป็นผู้ควบคุมการปฏิบัติงาน
      </p>
      <p className="mt-1 text-[15px]">จึงเรียนเพื่อโปรดพิจารณาอนุมัติ</p>

      <div className="mt-10 flex justify-end text-center text-[14.5px]">
        <div className="w-1/2 px-4">
          <div className="border-b border-dotted border-slate-500 h-7 mb-1.5" />
          <div>( {appName} )</div>
          <div className="text-slate-700">{appLevel}</div>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <p className="text-[12.5px] text-slate-500">ผมต.กฟส.ฝาง &nbsp; 14448</p>
        <img
          src="/assets/aistudio/image_aac57709.png"
          alt="ปลอดภัยไว้ก่อน SAFETY FIRST การไฟฟ้าส่วนภูมิภาค"
          className="h-[62px] w-auto object-contain shrink-0"
        />
      </div>
    </div>
  );
};
