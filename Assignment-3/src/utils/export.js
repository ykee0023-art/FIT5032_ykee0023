// Shared CSV/PDF export for the data tables.
// `columns` is a list of { header, value: (row) => cellValue }.

// Cells starting with these characters can be run as formulas by Excel (OWASP "CSV injection")
const FORMULA_PREFIX = /^[=+\-@\t\r]/

function csvCell(value) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (typeof value === 'string' && FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }
  // RFC 4180: quote cells containing a comma, quote or line break, and double any quotes
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows, columns) {
  const lines = [columns.map((c) => csvCell(c.header)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(','))
  }
  // The byte order mark makes Excel open the file as UTF-8 instead of guessing the encoding
  return '﻿' + lines.join('\r\n')
}

// e.g. greenroots-events-2026-10-18.csv (local date)
export function datedFilename(base, extension) {
  return `${base}-${new Date().toLocaleDateString('en-CA')}.${extension}`
}

export function downloadFile(content, filename, mimeType) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportPdf({ title, columns, rows, filename }) {
  // Loaded on demand so the PDF libraries are not part of the initial page bundle
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const exportedAt = new Date().toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })

  doc.setFontSize(16)
  doc.text(`GreenRoots Melbourne - ${title}`, 40, 40)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Exported ${exportedAt} - ${rows.length} rows`, 40, 58)

  autoTable(doc, {
    startY: 72,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.value(row) ?? ''))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [46, 125, 50] },
    margin: { left: 40, right: 40, bottom: 40 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(
      `Page ${page} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 20,
      {
        align: 'right',
      },
    )
  }

  doc.save(filename)
}
