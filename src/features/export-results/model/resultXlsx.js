import { sourceLabel } from '@/entities/image';
import { formatBytes } from '@/shared/lib/format.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B5BDB' } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };
const GOOD = { fill: 'FFE6F4EA', font: 'FF2B8A3E' };
const BAD = { fill: 'FFFCE8E6', font: 'FFC92A2A' };

function styleHeader(row) {
  row.font = HEADER_FONT;
  row.fill = HEADER_FILL;
  row.alignment = { vertical: 'middle' };
}

export async function encodeResultXlsx({ image, result }) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const defect = result.label === 'defect';
  const sheet = workbook.addWorksheet('Результат');
  sheet.columns = [
    { header: 'Параметр', key: 'name', width: 34 },
    { header: 'Значення', key: 'value', width: 44 },
  ];
  styleHeader(sheet.getRow(1));

  const rows = [
    ['Дата збереження', new Date().toLocaleString('uk-UA', { hour12: false })],
    ['Файл', image.name],
    ['Розмір файлу', `${formatBytes(image.size)} (${image.size} Б)`],
    ['Роздільність', `${result.width} × ${result.height} px`],
    ['Джерело', sourceLabel(image.source)],
    ['Модель', result.modelName ?? '—'],
    ['Вердикт', defect ? 'Виявлено дефект' : 'Дефектів не виявлено'],
    ['Впевненість мережі', result.scores[result.label]],
    ['Ймовірність «Без дефекту»', result.scores.normal],
    ['Ймовірність «Дефект»', result.scores.defect],
    ['Час розпізнавання всього, мс', result.totalMs],
    ['Декодування та масштабування, мс', result.steps.decode],
    ['Кумулятивна гістограма, мс', result.steps.histogram],
    ['Робота мережі, мс', result.steps.predict],
  ];
  rows.forEach((values) => sheet.addRow(values));

  [9, 10, 11].forEach((n) => {
    sheet.getRow(n).getCell(2).numFmt = '0.0%';
    sheet.getRow(n).getCell(2).alignment = { horizontal: 'left' };
  });
  [12, 13, 14, 15].forEach((n) => {
    sheet.getRow(n).getCell(2).numFmt = '0.00';
    sheet.getRow(n).getCell(2).alignment = { horizontal: 'left' };
  });
  sheet.getColumn(1).font = { bold: true };

  const palette = defect ? BAD : GOOD;
  const verdictCell = sheet.getRow(8).getCell(2);
  verdictCell.font = { bold: true, color: { argb: palette.font } };
  verdictCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.fill } };

  const histogram = workbook.addWorksheet('Гістограма');
  histogram.columns = [
    { header: 'Корзина', width: 12 },
    { header: 'Яскравість від', width: 16 },
    { header: 'Яскравість до', width: 16 },
    { header: 'Кумулятивна частка', width: 22 },
  ];
  styleHeader(histogram.getRow(1));
  const step = 256 / result.cumulative.length;
  result.cumulative.forEach((value, k) => {
    const row = histogram.addRow([k + 1, Math.round(k * step), Math.round((k + 1) * step) - 1, value]);
    row.getCell(4).numFmt = '0.0000';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME });
}
