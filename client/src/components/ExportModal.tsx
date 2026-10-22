import { useState } from 'react'
import { X, File, FileText, FileSpreadsheet, Download } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

type ExportFormat = 'PDF' | 'CSV' | 'Excel'

interface ExportModalProps {
  title?: string
  onClose: () => void
}

const formats: { id: ExportFormat; label: string; desc: string; icon: React.ReactNode; colorKey: 'danger' | 'info' | 'success' }[] = [
  { id: 'PDF',   label: 'PDF Report',   desc: 'Formatted document with charts & tables', icon: <File size={18} />,            colorKey: 'danger'  },
  { id: 'CSV',   label: 'CSV Export',   desc: 'Raw data for spreadsheets & databases',   icon: <FileText size={18} />,        colorKey: 'info'    },
  { id: 'Excel', label: 'Excel Export', desc: 'Formatted workbook with multiple sheets',  icon: <FileSpreadsheet size={18} />, colorKey: 'success' },
]

// Generate realistic file content for each format
function generateBlob(format: ExportFormat): { blob: Blob; filename: string } {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  if (format === 'CSV') {
    const csv = [
      'Contract ID,Contract Name,Counterparty,Type,Status,Value,Start Date,End Date,Owner,Obligations',
      'CTR-2024-001,Software License Agreement,Acme Corp,License,Active,"$240,000",2024-01-15,2025-01-14,Sarah Chen,12',
      'CTR-2024-002,Service Level Agreement,TechVentures Inc,SLA,Active,"$85,000",2024-02-01,2025-01-31,James Wilson,8',
      'CTR-2024-003,Non-Disclosure Agreement,GlobalParts Ltd,NDA,Active,"$0",2024-03-10,2027-03-09,Emily Rodriguez,3',
      'CTR-2024-004,Vendor Supply Contract,Meridian Supplies,Supply,Under Review,"$1,200,000",2024-04-01,2026-03-31,Michael Torres,21',
      'CTR-2024-005,Consulting Services Agreement,Apex Consulting,Services,Active,"$320,000",2024-05-15,2024-11-14,Lisa Park,7',
      'CTR-2024-006,Master Service Agreement,DataBridge LLC,MSA,Expired,"$450,000",2023-06-01,2024-05-31,Chris Nguyen,15',
      'CTR-2024-007,Employment Contract,N/A,Employment,Active,"$95,000",2024-07-01,2025-06-30,HR Department,5',
      'CTR-2024-008,Real Estate Lease,Parkview Properties,Lease,Active,"$180,000",2024-08-01,2027-07-31,Facilities,4',
      '',
      `Report generated: ${dateStr}`,
      'ContractIQ — Enterprise Contract Management',
    ].join('\n')
    return { blob: new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename: 'Contract_Report.csv' }
  }

  if (format === 'Excel') {
    // Simple XML Spreadsheet (SpreadsheetML) — opens natively in Excel
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#2D6A4F" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style>
    <Style ss:ID="date"><NumberFormat ss:Format="Short Date"/></Style>
  </Styles>
  <Worksheet ss:Name="Contract Report">
    <Table>
      <Row>
        <Cell ss:StyleID="header"><Data ss:Type="String">Contract ID</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Contract Name</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Counterparty</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Type</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Status</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Value (USD)</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Start Date</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">End Date</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Owner</Data></Cell>
        <Cell ss:StyleID="header"><Data ss:Type="String">Obligations</Data></Cell>
      </Row>
      <Row><Cell><Data ss:Type="String">CTR-2024-001</Data></Cell><Cell><Data ss:Type="String">Software License Agreement</Data></Cell><Cell><Data ss:Type="String">Acme Corp</Data></Cell><Cell><Data ss:Type="String">License</Data></Cell><Cell><Data ss:Type="String">Active</Data></Cell><Cell><Data ss:Type="Number">240000</Data></Cell><Cell><Data ss:Type="String">2024-01-15</Data></Cell><Cell><Data ss:Type="String">2025-01-14</Data></Cell><Cell><Data ss:Type="String">Sarah Chen</Data></Cell><Cell><Data ss:Type="Number">12</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">CTR-2024-002</Data></Cell><Cell><Data ss:Type="String">Service Level Agreement</Data></Cell><Cell><Data ss:Type="String">TechVentures Inc</Data></Cell><Cell><Data ss:Type="String">SLA</Data></Cell><Cell><Data ss:Type="String">Active</Data></Cell><Cell><Data ss:Type="Number">85000</Data></Cell><Cell><Data ss:Type="String">2024-02-01</Data></Cell><Cell><Data ss:Type="String">2025-01-31</Data></Cell><Cell><Data ss:Type="String">James Wilson</Data></Cell><Cell><Data ss:Type="Number">8</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">CTR-2024-003</Data></Cell><Cell><Data ss:Type="String">Non-Disclosure Agreement</Data></Cell><Cell><Data ss:Type="String">GlobalParts Ltd</Data></Cell><Cell><Data ss:Type="String">NDA</Data></Cell><Cell><Data ss:Type="String">Active</Data></Cell><Cell><Data ss:Type="Number">0</Data></Cell><Cell><Data ss:Type="String">2024-03-10</Data></Cell><Cell><Data ss:Type="String">2027-03-09</Data></Cell><Cell><Data ss:Type="String">Emily Rodriguez</Data></Cell><Cell><Data ss:Type="Number">3</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">CTR-2024-004</Data></Cell><Cell><Data ss:Type="String">Vendor Supply Contract</Data></Cell><Cell><Data ss:Type="String">Meridian Supplies</Data></Cell><Cell><Data ss:Type="String">Supply</Data></Cell><Cell><Data ss:Type="String">Under Review</Data></Cell><Cell><Data ss:Type="Number">1200000</Data></Cell><Cell><Data ss:Type="String">2024-04-01</Data></Cell><Cell><Data ss:Type="String">2026-03-31</Data></Cell><Cell><Data ss:Type="String">Michael Torres</Data></Cell><Cell><Data ss:Type="Number">21</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">CTR-2024-005</Data></Cell><Cell><Data ss:Type="String">Consulting Services Agreement</Data></Cell><Cell><Data ss:Type="String">Apex Consulting</Data></Cell><Cell><Data ss:Type="String">Services</Data></Cell><Cell><Data ss:Type="String">Active</Data></Cell><Cell><Data ss:Type="Number">320000</Data></Cell><Cell><Data ss:Type="String">2024-05-15</Data></Cell><Cell><Data ss:Type="String">2024-11-14</Data></Cell><Cell><Data ss:Type="String">Lisa Park</Data></Cell><Cell><Data ss:Type="Number">7</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">CTR-2024-006</Data></Cell><Cell><Data ss:Type="String">Master Service Agreement</Data></Cell><Cell><Data ss:Type="String">DataBridge LLC</Data></Cell><Cell><Data ss:Type="String">MSA</Data></Cell><Cell><Data ss:Type="String">Expired</Data></Cell><Cell><Data ss:Type="Number">450000</Data></Cell><Cell><Data ss:Type="String">2023-06-01</Data></Cell><Cell><Data ss:Type="String">2024-05-31</Data></Cell><Cell><Data ss:Type="String">Chris Nguyen</Data></Cell><Cell><Data ss:Type="Number">15</Data></Cell></Row>
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Summary">
    <Table>
      <Row><Cell><Data ss:Type="String">ContractIQ — Contract Report</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Generated: ${dateStr}</Data></Cell></Row>
      <Row></Row>
      <Row><Cell><Data ss:Type="String">Total Contracts</Data></Cell><Cell><Data ss:Type="Number">6</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Active</Data></Cell><Cell><Data ss:Type="Number">4</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Expired</Data></Cell><Cell><Data ss:Type="Number">1</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Under Review</Data></Cell><Cell><Data ss:Type="Number">1</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Total Value (USD)</Data></Cell><Cell><Data ss:Type="Number">2295000</Data></Cell></Row>
    </Table>
  </Worksheet>
</Workbook>`
    return { blob: new Blob([xml], { type: 'application/vnd.ms-excel' }), filename: 'Contract_Report.xlsx' }
  }

  // PDF — minimal valid PDF with report content
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 480>>
stream
BT
/F1 18 Tf
50 740 Td
(ContractIQ - Contract Obligation Report) Tj
/F1 11 Tf
0 -30 Td
(Generated: ${dateStr}) Tj
0 -40 Td
(EXECUTIVE SUMMARY) Tj
/F1 10 Tf
0 -20 Td
(Total Contracts: 124) Tj
0 -16 Td
(Active Contracts: 89) Tj
0 -16 Td
(Expiring within 30 days: 7) Tj
0 -16 Td
(Overdue obligations: 3) Tj
0 -16 Td
(Total Contract Value: $4,285,000) Tj
0 -40 Td
(TOP CONTRACTS BY VALUE) Tj
/F1 10 Tf
0 -20 Td
(CTR-2024-004  Vendor Supply Contract    Meridian Supplies    $1,200,000) Tj
0 -16 Td
(CTR-2024-006  Master Service Agreement  DataBridge LLC       $450,000) Tj
0 -16 Td
(CTR-2024-005  Consulting Services       Apex Consulting      $320,000) Tj
0 -16 Td
(CTR-2024-001  Software License          Acme Corp            $240,000) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000353 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
884
%%EOF`
  return { blob: new Blob([pdf], { type: 'application/pdf' }), filename: 'Contract_Report.pdf' }
}

function triggerDownload(format: ExportFormat) {
  const { blob, filename } = generateBlob(format)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function ExportModal({ title = 'Export Report', onClose }: ExportModalProps) {
  const { theme: t } = useTheme()
  const [selected, setSelected] = useState<ExportFormat>('PDF')

  const colorOf = (key: 'danger' | 'info' | 'success') => ({
    danger:  { fg: t.danger,  bg: t.dangerBg  },
    info:    { fg: t.info,    bg: t.infoBg    },
    success: { fg: t.success, bg: t.successBg },
  }[key])

  const handleExport = () => {
    triggerDownload(selected)
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
              <p className="text-xs" style={{ color: t.muted }}>Choose a format to download</p>
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
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
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
