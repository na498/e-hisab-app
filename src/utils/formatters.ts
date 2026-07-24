import { Transaction } from '../types';

// Bengali digit conversion helper
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string, useBengali = true): string {
  if (num === null || num === undefined) return '০';
  const str = String(num);
  if (!useBengali) return str;

  return str.replace(/\d/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

export function formatCurrency(amount: number, useBengali = true): string {
  const numStr = useBengali ? toBengaliNumber(Math.abs(amount).toLocaleString('en-US'), true) : Math.abs(amount).toLocaleString('en-US');
  const sign = amount < 0 ? '-' : '';
  return `${sign}৳ ${numStr}`;
}

export function formatSimpleDate(dateStr: string, useBengali = true): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const monthsBn = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];

  const day = date.getDate();
  const monthName = monthsBn[date.getMonth()];
  const year = date.getFullYear();

  const dayStr = toBengaliNumber(day, useBengali);
  const yearStr = toBengaliNumber(year, useBengali);

  return `${dayStr} ${monthName}, ${yearStr}`;
}

export function formatTime(timeStr?: string, createdAt?: number, useBengali = true): string {
  if (timeStr) {
    return useBengali ? toBengaliNumber(timeStr, true) : timeStr;
  }
  if (createdAt) {
    const d = new Date(createdAt);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? (useBengali ? 'অপরাহ্ন' : 'PM') : (useBengali ? 'পূর্বাহ্ন' : 'AM');
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const timeFormatted = `${hours}:${minStr} ${ampm}`;
    return useBengali ? toBengaliNumber(timeFormatted, true) : timeFormatted;
  }
  return '';
}

export function formatDateTime(dateStr: string, timeStr?: string, createdAt?: number, useBengali = true): string {
  const formattedDate = formatSimpleDate(dateStr, useBengali);
  const formattedTime = formatTime(timeStr, createdAt, useBengali);
  if (formattedTime) {
    return `${formattedDate} (${formattedTime})`;
  }
  return formattedDate;
}

export function formatMonthYear(dateStr: string, useBengali = true): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;

  const yearNum = parts[0];
  const monthNum = parseInt(parts[1], 10) - 1;

  const monthsBn = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];

  const monthName = monthsBn[monthNum] || '';
  const yearStr = toBengaliNumber(yearNum, useBengali);

  return `${monthName} ${yearStr}`;
}

// Format date into short Bengali tag like "মে - ২৭" or "জুন - ০৩"
export function formatShortMonthDay(dateStr: string, useBengali = true): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;

  const monthNum = parseInt(parts[1], 10) - 1;
  const dayNum = parseInt(parts[2], 10);

  const monthsBnShort = [
    'জানু',
    'ফেব্রু',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টে',
    'অক্টো',
    'নভে',
    'ডিসে',
  ];

  const mName = monthsBnShort[monthNum] || '';
  const dStr = toBengaliNumber(dayNum < 10 ? `০${dayNum}` : dayNum, useBengali);

  return `${mName}-${dStr}`;
}

// Official Monthly Excel / Spreadsheet Export matching exact user image layout
export function exportOfficialMonthlyExcel(
  shopName: string,
  branchName: string,
  monthName: string,
  transactions: Transaction[],
  useBengali = true
) {
  // Determine year and month from transactions or current date
  let selectedYear = new Date().getFullYear();
  let selectedMonth = new Date().getMonth(); // 0-indexed

  if (transactions.length > 0 && transactions[0].date) {
    const parts = transactions[0].date.split('-');
    if (parts.length >= 2) {
      selectedYear = parseInt(parts[0], 10) || selectedYear;
      selectedMonth = (parseInt(parts[1], 10) - 1);
      if (isNaN(selectedMonth)) selectedMonth = new Date().getMonth();
    }
  }

  // Get total days in month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Group transactions by date YYYY-MM-DD
  const dateMap: Record<string, Transaction[]> = {};
  transactions.forEach((tx) => {
    const dKey = tx.date;
    if (dKey) {
      if (!dateMap[dKey]) dateMap[dKey] = [];
      dateMap[dKey].push(tx);
    }
  });

  const monthsBnShort = [
    'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
  ];
  const currentMonthBn = monthsBnShort[selectedMonth] || 'মে';

  let runningCash = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  // Build daily table rows for every day of the month (1 to daysInMonth)
  let tableBodyRows = '';

  for (let day = 1; day <= daysInMonth; day++) {
    const monthPadded = String(selectedMonth + 1).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');
    const dKey = `${selectedYear}-${monthPadded}-${dayPadded}`;

    const dayTxs = dateMap[dKey] || [];
    let dayInc = 0;
    let dayExp = 0;
    const descParts: string[] = [];

    dayTxs.forEach((tx) => {
      if (tx.type === 'income') {
        dayInc += Number(tx.amount || 0);
      } else {
        dayExp += Number(tx.amount || 0);
      }
      if (tx.description) {
        descParts.push(tx.description);
      } else if (tx.category) {
        descParts.push(tx.category);
      }
    });

    totalIncome += dayInc;
    totalExpense += dayExp;
    runningCash += (dayInc - dayExp);

    const dayStrBn = toBengaliNumber(dayPadded, useBengali);
    const dateLabel = `${currentMonthBn} -${dayStrBn}`;
    const incStr = dayInc > 0 ? toBengaliNumber(dayInc, useBengali) : '';
    const expStr = dayExp > 0 ? toBengaliNumber(dayExp, useBengali) : '';
    const cashStr = (runningCash !== 0 || dayInc > 0 || dayExp > 0) ? toBengaliNumber(runningCash, useBengali) : '';
    const descStr = descParts.join(' এবং ');

    tableBodyRows += `
      <tr style="height: 22px;">
        <td style="border: 1px solid #000000; text-align: center; font-size: 10pt;">${dateLabel}</td>
        <td style="border: 1px solid #000000; text-align: right; font-size: 10pt; padding-right: 6px;">${incStr}</td>
        <td style="border: 1px solid #000000; text-align: right; font-size: 10pt; padding-right: 6px;">${expStr}</td>
        <td style="border: 1px solid #000000; text-align: right; font-size: 10pt; padding-right: 6px;">${cashStr}</td>
        <td style="border: 1px solid #000000; text-align: left; font-size: 10pt; padding-left: 6px;">${descStr}</td>
        <td style="border: 1px solid #000000; text-align: center; font-size: 10pt;"></td>
      </tr>`;
  }

  // Summary Row
  const totalIncStr = toBengaliNumber(totalIncome, useBengali);
  const totalExpStr = toBengaliNumber(totalExpense, useBengali);

  const summaryRow = `
    <tr style="height: 24px; font-weight: bold; background-color: #f2f2f2;">
      <td style="border: 1px solid #000000; text-align: center; font-size: 10pt;">সর্বমোট</td>
      <td style="border: 1px solid #000000; text-align: right; font-size: 10pt; padding-right: 6px;">${totalIncStr}</td>
      <td style="border: 1px solid #000000; text-align: right; font-size: 10pt; padding-right: 6px;">${totalExpStr}</td>
      <td style="border: 1px solid #000000;"></td>
      <td style="border: 1px solid #000000;"></td>
      <td style="border: 1px solid #000000;"></td>
    </tr>`;

  // Full HTML Spreadsheet output compatible with MS Excel
  const excelHTML = `
    <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>মাসিক রিপোর্ট</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          td, th { font-family: 'Vrinda', 'Kalpurush', 'SolaimanLipi', Arial, sans-serif; }
        </style>
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
          <tr><td colspan="6"></td></tr>
          <tr><td colspan="6"></td></tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 16pt; font-weight: bold; padding: 6px;">
              ${shopName || 'ই-সেন্টার'} এর মাসিক আয় ব্যয়ের বিবরণী
            </td>
          </tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 11pt; font-weight: bold; padding: 4px;">
              শাখা অফিসের নাম : ${branchName || 'চাম্পাফুল'}
            </td>
          </tr>
          <tr>
            <td colspan="6" style="text-align: center; font-size: 11pt; font-weight: bold; padding: 4px;">
              মাসের নাম : ${monthName || 'মে ২০২৬'}
            </td>
          </tr>
          <tr><td colspan="6"></td></tr>

          <!-- Header Table Row -->
          <tr style="background-color: #ffffff; height: 26px; font-weight: bold;">
            <th style="border: 1px solid #000000; width: 100px; text-align: center;">তারিখ</th>
            <th style="border: 1px solid #000000; width: 90px; text-align: center;">আয়</th>
            <th style="border: 1px solid #000000; width: 90px; text-align: center;">ব্যয়</th>
            <th style="border: 1px solid #000000; width: 90px; text-align: center;">ক্যাশ</th>
            <th style="border: 1px solid #000000; width: 250px; text-align: center;">খরচের বিবরণ</th>
            <th style="border: 1px solid #000000; width: 90px; text-align: center;">মন্তব্য</th>
          </tr>

          <!-- Numbering Row -->
          <tr style="height: 20px; font-size: 9pt; text-align: center;">
            <td style="border: 1px solid #000000;">০১</td>
            <td style="border: 1px solid #000000;">০২</td>
            <td style="border: 1px solid #000000;">০৩</td>
            <td style="border: 1px solid #000000;">০৪</td>
            <td style="border: 1px solid #000000;">০৫</td>
            <td style="border: 1px solid #000000;">০৬</td>
          </tr>

          <!-- Data Rows -->
          ${tableBodyRows}

          <!-- Summary Row -->
          ${summaryRow}

          <tr><td colspan="6"></td></tr>
          <tr><td colspan="6"></td></tr>
          <tr><td colspan="6"></td></tr>

          <!-- Signature Section -->
          <tr>
            <td colspan="2" style="text-align: center; font-weight: bold; font-size: 10pt; padding-top: 20px;">
              দোকান পরিচালকের স্বাক্ষর
            </td>
            <td colspan="2"></td>
            <td colspan="2" style="text-align: center; font-weight: bold; font-size: 10pt; padding-top: 20px;">
              দোকান মালিকের স্বাক্ষর
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const sanitizedMonth = monthName.replace(/[^a-zA-Z0-9-_\u0980-\u09FF]/g, '_');
  const filename = `${shopName || 'E-Center'}_Monthly_Report_${sanitizedMonth}.xls`;

  const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    '\uFEFF' +
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            const rawVal = (row as Record<string, unknown>)[k] ?? '';
            let strVal = rawVal instanceof Date ? rawVal.toLocaleString() : String(rawVal);
            strVal = strVal.replace(/"/g, '""');
            if (strVal.search(/("|,|\n)/g) >= 0) {
              strVal = `"${strVal}"`;
            }
            return strVal;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
