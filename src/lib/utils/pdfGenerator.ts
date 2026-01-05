import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '$lib/stores/settings'
import type { Sale, SaleItem } from '$lib/types'

interface ReceiptSettings {
  storeName: string
  storeAddress: string
  storePhone: string
}

interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export function generateSaleReceipt(
  sale: Sale,
  items: ReceiptItem[],
  settings: ReceiptSettings
): void {
  const doc = new jsPDF()
  const currency = 'USD'
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let yPos = 20

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.storeName, pageWidth / 2, yPos, { align: 'center' })

  yPos += 6
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(settings.storeAddress, pageWidth / 2, yPos, { align: 'center' })

  yPos += 5
  doc.text(settings.storePhone, pageWidth / 2, yPos, { align: 'center' })

  yPos += 8
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  yPos += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SALES RECEIPT', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${sale.invoiceNumber}`, margin, yPos)
  yPos += 6
  doc.text(`Date: ${formatDate(sale.saleDate)}`, margin, yPos)
  if (sale.customerName) {
    yPos += 6
    doc.text(`Customer: ${sale.customerName}`, margin, yPos)
  }

  const paymentLabel = getPaymentMethodLabel(sale.paymentMethod)
  yPos += 6
  doc.text(`Payment: ${paymentLabel}`, margin, yPos)

  yPos += 8
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  const tableData = items.map(item => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, currency),
    formatCurrency(item.totalPrice, currency)
  ])

  autoTable(doc, {
    startY: yPos + 3,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [60, 60, 60],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  yPos = finalY + 8
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  yPos += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: ${formatCurrency(sale.totalAmount, currency)}`, pageWidth - margin, yPos, { align: 'right' })

  yPos += 12
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' })

  const fileName = `${sale.invoiceNumber}.pdf`
  doc.save(fileName)
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    credit: 'Credit',
    mobile_payment: 'Mobile Payment'
  }
  return labels[method] || method
}
