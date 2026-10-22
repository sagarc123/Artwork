import 'server-only'
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer'
import { amountInWords, hsnSummary } from '@/lib/gst'
import type { Invoice } from '@/payload-types'

// ponytail: English only, built-in Helvetica (no ₹ sign, no Devanagari). Register a Noto Sans Devanagari TTF if buyers' names need it.
const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#1e1b18' },
  h1: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#555' },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  box: { width: '48%' },
  th: { flexDirection: 'row', borderBottom: '1pt solid #1e1b18', paddingVertical: 4, fontFamily: 'Helvetica-Bold' },
  tr: { flexDirection: 'row', borderBottom: '0.5pt solid #bbb', paddingVertical: 4 },
  section: { marginTop: 14 },
})

const money = (n: number | null | undefined) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

type Col = { label: string; width: string; right?: boolean }
function Table({ cols, rows, bold }: { cols: Col[]; rows: (string | number)[][]; bold?: number }) {
  return (
    <View>
      <View style={s.th}>
        {cols.map((c) => (
          <Text key={c.label} style={{ width: c.width, textAlign: c.right ? 'right' : 'left', paddingRight: 4 }}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[s.tr, i === bold ? s.bold : {}]} wrap={false}>
          {r.map((cell, j) => (
            <Text key={j} style={{ width: cols[j].width, textAlign: cols[j].right ? 'right' : 'left', paddingRight: 4 }}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function InvoiceDoc({ inv }: { inv: Invoice }) {
  const taxed = inv.documentType === 'tax_invoice'
  const lines = (inv.lines ?? []).map((l) => ({ ...l, hsn: l.hsn ?? '', rate: l.rate ?? 0, taxable: l.taxable ?? 0, cgst: l.cgst ?? 0, sgst: l.sgst ?? 0, igst: l.igst ?? 0, total: l.total ?? 0 }))
  const t = inv.totals
  const intra = (t?.igst ?? 0) === 0
  const taxCols: Col[] = taxed ? (intra ? [{ label: 'CGST', width: '10%', right: true }, { label: 'SGST', width: '10%', right: true }] : [{ label: 'IGST', width: '20%', right: true }]) : []
  const taxCells = (l: { cgst: number; sgst: number; igst: number }) => (taxed ? (intra ? [money(l.cgst), money(l.sgst)] : [money(l.igst)]) : [])
  const descWidth = taxed ? '32%' : '52%'

  return (
    <Document title={inv.number} author={inv.seller?.legalName ?? undefined}>
      <Page size="A4" style={s.page}>
        <View style={s.between}>
          <View style={s.box}>
            <Text style={s.h1}>{inv.seller?.legalName}</Text>
            <Text>{inv.seller?.address}</Text>
            <Text>State: {inv.seller?.state}</Text>
            {inv.seller?.gstin ? <Text style={s.bold}>GSTIN: {inv.seller.gstin}</Text> : null}
          </View>
          <View style={[s.box, { alignItems: 'flex-end' }]}>
            <Text style={s.h1}>{taxed ? 'TAX INVOICE' : 'BILL OF SUPPLY'}</Text>
            <Text>Invoice no: {inv.number}</Text>
            <Text>Date: {date(inv.issuedAt)}</Text>
            <Text>Place of supply: {inv.buyer?.state}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.bold}>Bill to / Ship to</Text>
          {inv.buyer?.businessName ? <Text>{inv.buyer.businessName}</Text> : null}
          <Text>{inv.buyer?.name}</Text>
          <Text>{inv.buyer?.address}</Text>
          <Text>State: {inv.buyer?.state}</Text>
          {inv.buyer?.gstin ? <Text style={s.bold}>GSTIN: {inv.buyer.gstin}</Text> : null}
        </View>

        <View style={s.section}>
          <Table
            cols={[
              { label: '#', width: '4%' },
              { label: 'Description', width: descWidth },
              { label: 'HSN/SAC', width: '10%' },
              { label: 'Qty', width: '6%', right: true },
              { label: 'Taxable value', width: '14%', right: true },
              ...(taxed ? [{ label: 'Rate', width: '6%', right: true }] : []),
              ...taxCols,
              { label: 'Total', width: '14%', right: true },
            ]}
            rows={[
              ...lines.map((l, i) => [i + 1, l.description ?? '', l.hsn, l.qty ?? 1, money(l.taxable), ...(taxed ? [`${l.rate}%`] : []), ...taxCells(l), money(l.total)]),
              ['', 'Total', '', '', money(t?.taxable), ...(taxed ? [''] : []), ...taxCells({ cgst: t?.cgst ?? 0, sgst: t?.sgst ?? 0, igst: t?.igst ?? 0 }), money(t?.total)],
            ]}
            bold={lines.length}
          />
        </View>

        {taxed && (
          <View style={s.section}>
            <Text style={[s.bold, { marginBottom: 4 }]}>HSN-wise summary</Text>
            <Table
              cols={[{ label: 'HSN/SAC', width: '20%' }, { label: 'Rate', width: '12%', right: true }, { label: 'Taxable value', width: '24%', right: true }, ...taxCols.map((c) => ({ ...c, width: intra ? '14%' : '28%' })), { label: 'Total tax', width: '16%', right: true }]}
              rows={hsnSummary(lines).map((h) => [h.hsn, `${h.rate}%`, money(h.taxable), ...taxCells(h), money(h.cgst + h.sgst + h.igst)])}
            />
          </View>
        )}

        <View style={s.section}>
          <Text style={s.bold}>Amount payable: Rs. {money(t?.total)}</Text>
          <Text>{amountInWords(t?.total ?? 0)}</Text>
          {!taxed && <Text style={s.muted}>Supplier not registered under GST; no tax charged.</Text>}
          <Text style={s.muted}>Prices include GST where applicable. Amounts in Indian Rupees.</Text>
        </View>

        <Text style={[s.muted, { position: 'absolute', bottom: 30, left: 36, right: 36, textAlign: 'center' }]} fixed>
          This is a computer-generated invoice and needs no signature.
        </Text>
      </Page>
    </Document>
  )
}

export const renderInvoicePdf = (inv: Invoice) => renderToBuffer(<InvoiceDoc inv={inv} />)
