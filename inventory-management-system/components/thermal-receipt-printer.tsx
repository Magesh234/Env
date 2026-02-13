/**
 * THERMAL RECEIPT PRINTER - COMPACT SUPERMARKET STYLE
 * 
 * Professional thermal receipt matching real supermarket format
 * Now with proper table spacing and QR code generation
 */

import React from 'react'

interface ThermalReceiptItem {
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  discount_amount: number
  total: number
}

interface ThermalReceiptData {
  // Business Info (dynamically fetched)
  businessName?: string
  businessPhone?: string
  businessEmail?: string
  
  // Sale Info
  invoice_number: string
  invoice_date: string
  client_name: string
  payment_method?: { String: string; Valid: boolean }
  
  // Financial
  total_amount: number
  amount_paid: number
  balance_due: number
  
  // Items
  items: ThermalReceiptItem[]
  
  // Additional
  served_by?: string
}

/**
 * COMPACT PRINT FUNCTION FOR THERMAL RECEIPT
 * Optimized for 80mm thermal printers with proper table spacing and QR codes
 */
export const printThermalReceipt = (data: ThermalReceiptData, width: '58mm' | '80mm' = '80mm') => {
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    alert('Please allow pop-ups to print receipt')
    return
  }

  const maxChars = width === '58mm' ? 32 : 42

  // Helper functions
  const padLine = (left: string, right: string): string => {
    const totalLen = left.length + right.length
    const padding = maxChars - totalLen
    return left + ' '.repeat(Math.max(0, padding)) + right
  }

  const centerText = (text: string): string => {
    const padding = Math.floor((maxChars - text.length) / 2)
    return ' '.repeat(Math.max(0, padding)) + text
  }

  const divider = (char: string = '-'): string => char.repeat(maxChars)

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-TZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const d = new Date(dateString)
    const date = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    return { date, time }
  }

  const getPaymentMethod = (): string => {
    if (data.payment_method?.Valid && data.payment_method.String) {
      return data.payment_method.String.replace(/_/g, ' ').toUpperCase()
    }
    return 'CASH'
  }

  const { date: receiptDate, time: receiptTime } = formatDateTime(data.invoice_date)

  // Build compact receipt HTML with QR code
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${data.invoice_number}</title>
        <meta charset="UTF-8">
        <!-- QR Code Library -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: ${width} auto;
            margin: 0;
          }
          
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10px;
            line-height: 1.3;
            width: ${width};
            margin: 0;
            padding: 3mm 2mm;
            background: white;
            color: #000;
          }
          
          .line { margin: 2px 0; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 12px; }
          .small { font-size: 8px; }
          
          /* Table styling for items */
          .items-table {
            width: 100%;
            margin: 3px 0;
          }
          .items-table th {
            text-align: left;
            font-weight: bold;
            padding-bottom: 2px;
          }
          .items-table td {
            padding: 1px 0;
          }
          .items-table .item-name {
            width: 50%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .items-table .item-qty {
            width: 20%;
            text-align: right;
            padding-right: 8px;
          }
          .items-table .item-price {
            width: 30%;
            text-align: right;
          }
          
          /* QR Code styling */
          #qrcode {
            margin: 5px auto;
            text-align: center;
          }
          #qrcode canvas,
          #qrcode img {
            margin: 0 auto;
            display: block;
          }
          
          @media print {
            body { width: ${width}; }
          }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="center bold large">${data.businessName || 'RETAIL STORE'}</div>
        ${data.businessPhone ? `<div class="center small">Tel: ${data.businessPhone}</div>` : ''}
        ${data.businessEmail ? `<div class="center small">${data.businessEmail}</div>` : ''}
        <div class="line">${divider('=')}</div>
        
        <!-- RECEIPT INFO -->
        <div class="line">${padLine('Receipt:', data.invoice_number)}</div>
        <div class="line">${padLine('Date:', `${receiptDate} ${receiptTime}`)}</div>
        ${data.served_by ? `<div class="line">${padLine('Cashier:', data.served_by)}</div>` : ''}
        ${data.client_name && data.client_name !== 'Walk-in Customer' ? `<div class="line">Customer: ${data.client_name}</div>` : ''}
        <div class="line">${divider('-')}</div>
        
        <!-- ITEMS TABLE -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="item-name">ITEM</th>
              <th class="item-qty">QTY</th>
              <th class="item-price">PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item) => {
              const maxNameLen = 18
              const name = item.product_name.length > maxNameLen 
                ? item.product_name.substring(0, maxNameLen - 2) + '..' 
                : item.product_name
              
              return `
                <tr>
                  <td class="item-name">${name}</td>
                  <td class="item-qty">${item.quantity}</td>
                  <td class="item-price">${formatCurrency(item.total)}</td>
                </tr>
                ${item.discount_amount > 0 ? `
                <tr>
                  <td colspan="2" class="small" style="padding-left: 10px;">Discount</td>
                  <td class="item-price small">-${formatCurrency(item.discount_amount)}</td>
                </tr>` : ''}
              `
            }).join('')}
          </tbody>
        </table>
        
        <div class="line">${divider('=')}</div>
        
        <!-- TOTALS -->
        <div class="line bold">${padLine('TOTAL:', formatCurrency(data.total_amount))}</div>
        <div class="line">${padLine(getPaymentMethod() + ':', formatCurrency(data.amount_paid))}</div>
        ${data.balance_due > 0 ? 
          `<div class="line bold">${padLine('BALANCE DUE:', formatCurrency(data.balance_due))}</div>` :
          data.amount_paid > data.total_amount ?
          `<div class="line">${padLine('CHANGE:', formatCurrency(data.amount_paid - data.total_amount))}</div>` :
          `<div class="line">${padLine('CHANGE:', '0')}</div>`
        }
        
        <div class="line">${divider('=')}</div>
        
        <!-- QR CODE -->
        <div id="qrcode"></div>
        <div class="center small" style="margin-top: 3px;">Scan to view invoice</div>
        
        <div class="line" style="margin-top: 5px;">${divider('-')}</div>
        
        <!-- FOOTER -->
        <div class="center bold" style="margin-top: 3px;">THANK YOU!</div>
        <div class="center small">Please Come Again</div>
        <div class="line" style="margin-top: 3px;">${divider('-')}</div>
        <div class="center small">Powered by Duka</div>
        <div class="line" style="margin-top: 3px;">${divider('-')}</div>
        <div class="center small">~ CUT HERE ~</div>
        
        <script>
          // Generate QR Code with invoice number
          window.onload = () => {
            new QRCode(document.getElementById("qrcode"), {
              text: "Invoice: ${data.invoice_number}",
              width: 100,
              height: 100,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.M
            });
            
            // Trigger print after QR code is generated
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `

  printWindow.document.write(receiptHTML)
  printWindow.document.close()
}

export default printThermalReceipt