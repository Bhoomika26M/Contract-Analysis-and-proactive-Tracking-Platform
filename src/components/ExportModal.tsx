import { useState } from 'react'
import { X, File, FileText, FileSpreadsheet, Download } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type ExportFormat = 'PDF' | 'CSV' | 'Excel'

export interface ExportColumn<T> {
  header: string
  /** Value for one row. Returning null/undefined/'' renders as an empty cell. */
  value: (row: T) => string | number | null | undefined
  align?: 'left' | 'right'
}

interface ExportModalProps<T> {
  title?: string
  /** Column definitions for the rows being exported. */
  columns: ExportColumn<T>[]
  /** The exact rows currently on screen. Never substitutes sample data. */
  rows: T[]
  fileBaseName?: string
  onClose: () => void
}

const formats: { id: ExportFormat; label: string; desc: string; icon: React.ReactNode; colorKey: 'danger' | 'info' | 'success' }[] = [
  { id: 'PDF', label: 'PDF Report', desc: 'Formatted document with tables', icon: <File size={18} />, colorKey: 'danger' },
  { id: 'CSV', label: 'CSV Export', desc: 'Raw data for spreadsheets & databases', icon: <FileText size={18} />, colorKey: 'info' },
  { id: 'Excel', label: 'Excel Export', desc: 'Formatted workbook with multiple sheets', icon: <FileSpreadsheet size={18} />, colorKey: 'success' },
]

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function isNumeric(value: string | number | null | undefined): value is number {
  return typeof value === 'number'
}

function buildCsv<T>(columns: ExportColumn<T>[], rows: T[]): string {
  const lines = [columns.map(c => escapeCsv(c.header)).join(',')]
  rows.forEach(row => {
    lines.push(columns.map(c => escapeCsv(c.value(row))).join(','))
  })
  return lines.join('\r\n')
}

function buildExcelXml<T>(columns: ExportColumn<T>[], rows: T[], title: string): string {
  const headerCells = columns
    .map(c => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`)
    .join('')
  const bodyRows = rows
    .map(row => {
      const cells = columns
        .map(c => {
          const value = c.value(row)
          const type = isNumeric(value) ? 'Number' : 'String'
          return `<Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>`
        })
        .join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header"><Interior ss:Color="#2D6A4F" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(title).slice(0, 31)}">
    <Table>
      <Row>${headerCells}</Row>
      ${bodyRows}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Summary">
    <Table>
      <Row><Cell><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Generated: ${escapeXml(new Date().toLocaleString('en-US'))}</Data></Cell></Row>
      <Row></Row>
      <Row><Cell><Data ss:Type="String">Rows exported</Data></Cell><Cell><Data ss:Type="Number">${rows.length}</Data></Cell></Row>
    </Table>
  </Worksheet>
</Workbook>`
}

function buildPdf<T>(title: string, columns: ExportColumn<T>[], rows: T[]): string {
  // One text line per row, wrapped to fit the page width.
  const perPage = 42
  const pages: string[][] = []
  const lines: string[] = [
    `Generated: ${new Date().toLocaleString('en-US')}`,
    `Rows: ${rows.length}`,
    '',
    columns.map(c => c.header).join('  |  '),
  ]
  rows.forEach(row => {
    lines.push(
      columns
        .map(c => {
          const value = c.value(row)
          const text = value === null || value === undefined ? '' : String(value)
          return text.length > 22 ? `${text.slice(0, 21)}…` : text.padEnd(22)
        })
        .join('| '),
    )
  })
  for (let i = 0; i < Math.max(1, lines.length); i += perPage) {
    pages.push(lines.slice(i, i + perPage))
  }

  const objects: string[] = []
  const pageIds = pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')

  objects.push('<</Type/Catalog/Pages 2 0 R>>')
  objects.push(`<</Type/Pages/Kids[${pageIds}]/Count ${pages.length}>>`)

  pages.forEach((pageLines, index) => {
    const contentId = 5 + index * 2
    const stream = [
      'BT',
      '/F1 16 Tf',
      '50 750 Td',
      `(${title.replace(/([()\\])/g, '\\$1')}) Tj`,
      '/F1 9 Tf',
      ...pageLines.flatMap((line, i) => [
        `0 -${i === 0 ? 26 : 14} Td`,
        `(${line.replace(/([()\\])/g, '\\$1')}) Tj`,
      ]),
      'ET',
    ].join('\n')
    objects.push(`<</Type/Page/MediaBox[0 0 792 792]/Parent 2 0 R/Resources<</Font<</F1 ${3} 0 R>>>>/Contents ${contentId} 0 R>>`)
    objects.push(`<</Length ${stream.length}>>\nstream\n${stream}\nendstream`)
  })
  objects.push('<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>')

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function ExportModal<T>({
  title = 'Export Report',
  columns,
  rows,
  fileBaseName = 'ContractIQ_Export',
  onClose,
}: ExportModalProps<T>) {
  const { theme: t } = useTheme()
  const [selected, setSelected] = useState<ExportFormat>('CSV')

  const colorOf = (key: 'danger' | 'info' | 'success') => ({
    danger:  { fg: t.danger,  bg: t.dangerBg  },
    info:    { fg: t.info,    bg: t.infoBg    },
    success: { fg: t.success, bg: t.successBg },
  }[key])

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    if (selected === 'CSV') {
      triggerDownload(
        new Blob([buildCsv(columns, rows)], { type: 'text/csv;charset=utf-8;' }),
        `${fileBaseName}_${stamp}.csv`,
      )
    } else if (selected === 'Excel') {
      triggerDownload(
        new Blob([buildExcelXml(columns, rows, title)], { type: 'application/vnd.ms-excel' }),
        `${fileBaseName}_${stamp}.xlsx`,
      )
    } else {
      triggerDownload(
        new Blob([buildPdf(title, columns, rows)], { type: 'application/pdf' }),
        `${fileBaseName}_${stamp}.pdf`,
      )
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          maxWidth: 440,
          background: t.surface,
          borderColor: t.border,
          boxShadow: t.cardShadowHover,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.primaryBg }}>
              <Download size={18} style={{ color: t.primary }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: t.fg }}>{title}</h3>
              <p className="text-xs" style={{ color: t.muted }}>{rows.length} row(s) from the current view</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: t.mutedLight }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Format options */}
        <div className="px-6 py-5 space-y-2.5">
          {formats.map(fmt => {
            const col = colorOf(fmt.colorKey)
            const active = selected === fmt.id
            return (
              <button
                key={fmt.id}
                onClick={() => setSelected(fmt.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all"
                style={{
                  borderColor: active ? t.primary : t.border,
                  background: active ? t.primaryBg : 'transparent',
                  boxShadow: active ? `0 0 0 1px ${t.primary}` : 'none',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = t.bg }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: col.bg, color: col.fg }}
                >
                  {fmt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: t.fg }}>{fmt.label}</div>
                  <div className="text-xs" style={{ color: t.muted }}>{fmt.desc}</div>
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: active ? t.primary : t.border, background: active ? t.primary : 'transparent' }}
                >
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all"
            style={{ borderColor: t.border, color: t.muted }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.surfaceHover)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: t.primary }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primaryHover)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = t.primary)}
          >
            <Download size={15} />
            Export {selected}
          </button>
        </div>
      </div>
    </div>
  )
}