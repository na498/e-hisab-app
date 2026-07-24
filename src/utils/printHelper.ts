/**
 * Universal print helper supporting standard Cash Memo and 80mm POS Thermal Invoices
 */
export function handlePrint(elementId: string, title: string = 'ক্যাশ মেমো') {
  const printEl = document.getElementById(elementId);
  if (!printEl) {
    alert('প্রিন্ট করার কোনো উপাদান পাওয়া যায়নি!');
    return;
  }

  const originalTitle = document.title;
  document.title = title;
  const printContent = printEl.outerHTML;

  // Attempt window.open printing
  let win: Window | null = null;
  try {
    win = window.open('', '_blank', 'height=800,width=650');
  } catch (e) {
    win = null;
  }

  if (win) {
    win.document.write('<html><head><title>' + title + '</title>');

    if (elementId === 'printable-thermal-memo') {
      // 80mm Thermal Receipt CSS
      win.document.write(`
        <base href="${window.location.origin}/">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 0; size: auto; }
          body {
            margin: 0;
            padding: 5px;
            font-family: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            background-color: #fff;
            color: #000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .printer-container {
            width: 72mm; /* 80mm thermal paper printable area */
            margin: 0 auto;
            padding: 5px;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .header { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #000; }
          .logo { max-width: 40px; height: auto; display: block; margin: 0 auto 2px auto; }
          .shop-name { font-size: 14px; font-weight: bold; margin: 0; }
          .shop-meta { font-size: 9px; margin: 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          th { border-bottom: 1px solid #000; font-weight: bold; font-size: 9px; text-align: left; padding: 2px 0; }
          td { border-bottom: 1px dashed #ccc; font-size: 10px; padding: 2px 0; vertical-align: top; }
          .col-qty { width: 15%; text-align: center; }
          .col-rate { width: 20%; text-align: right; }
          .col-total { width: 20%; text-align: right; }
          .totals-section { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 1px; }
          .grand-total { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 0; font-size: 12px; font-weight: bold; margin: 2px 0; }
          .footer { margin-top: 8px; text-align: center; font-size: 9px; border-top: 1px dotted #ccc; padding-top: 4px; }
          .no-print, button { display: none !important; }
        </style>
      `);
      win.document.write('</head><body>');
      win.document.write('<div class="printer-container">');
      win.document.write(printContent);
      win.document.write('</div>');
    } else {
      // Standard Cash Memo / Monthly Sheet (A4 Page Size)
      let stylesHtml = `<base href="${window.location.origin}/"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">`;
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((styleNode) => {
        stylesHtml += styleNode.outerHTML;
      });
      win.document.write(stylesHtml);
      win.document.write(`
        <style>
          @page {
            size: A4 portrait;
            margin: 0 !important; /* Removes browser top/bottom headers & footers (URL, title, page numbers) */
          }
          @media print {
            body {
              background: white !important;
              color: black !important;
              padding: 8mm 10mm !important;
              margin: 0 !important;
              width: 100% !important;
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, .print\\:hidden, [data-print-hide="true"], button { display: none !important; }
            #printable-memo, #printable-monthly-sheet {
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
          body {
            font-family: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif !important;
            background: white;
            color: black;
            padding: 8mm 10mm;
            margin: 0;
            box-sizing: border-box;
          }
          .no-print, .print\\:hidden, [data-print-hide="true"], button { display: none !important; }
          
          /* Forced table borders for hosted and printed output */
          table,
          #printable-monthly-sheet table,
          #printable-memo table {
            width: 100% !important;
            border-collapse: collapse !important;
            border-spacing: 0 !important;
            border: 2px solid #000000 !important;
            font-size: 11px !important;
            margin-top: 4px !important;
            margin-bottom: 4px !important;
          }
          
          th, td,
          #printable-monthly-sheet th, #printable-monthly-sheet td,
          #printable-memo th, #printable-memo td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            padding: 4px 5px !important;
            line-height: 1.25 !important;
            box-sizing: border-box !important;
          }
          
          tr,
          #printable-monthly-sheet tr,
          #printable-memo tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      `);
      win.document.write('</head><body>');
      win.document.write('<div>' + printContent + '</div>');
    }

    win.document.write('</body></html>');
    win.document.close();

    setTimeout(() => {
      if (win) {
        win.focus();
        win.print();
        setTimeout(() => {
          win?.close();
          document.title = originalTitle;
        }, 300);
      }
    }, 400);

  } else {
    // Popup Blocked / Sandbox fallback: Use hidden iframe printing
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    printIframe.style.visibility = 'hidden';

    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentWindow?.document;
    if (iframeDoc) {
      let stylesHtml = '';
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((s) => {
        stylesHtml += s.outerHTML;
      });

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="bn">
          <head>
            <base href="${window.location.origin}/">
            <title>${title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
            ${stylesHtml}
            <style>
              @page {
                size: ${elementId === 'printable-thermal-memo' ? 'auto' : 'A4 portrait'};
                margin: 0 !important; /* Removes browser page URL, title, date, page numbers */
              }
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: ${elementId === 'printable-thermal-memo' ? '5px' : '8mm 10mm'} !important;
                font-family: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif !important;
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print, .print\\:hidden, [data-print-hide="true"], button { display: none !important; }
              ${elementId === 'printable-thermal-memo' ? `
                .printer-container { width: 72mm; margin: 0 auto; padding: 5px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border-bottom: 1px dashed #ccc; padding: 2px 0; font-size: 10px; }
              ` : `
                #printable-memo, #printable-monthly-sheet {
                  width: 100% !important;
                  max-width: 100% !important;
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                table, #printable-monthly-sheet table, #printable-memo table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  border-spacing: 0 !important;
                  border: 2px solid #000000 !important;
                  font-size: 11px !important;
                  margin-top: 4px !important;
                  margin-bottom: 4px !important;
                }
                th, td, #printable-monthly-sheet th, #printable-monthly-sheet td, #printable-memo th, #printable-memo td {
                  border: 1px solid #000000 !important;
                  color: #000000 !important;
                  padding: 4px 5px !important;
                  line-height: 1.25 !important;
                  box-sizing: border-box !important;
                }
                tr, #printable-monthly-sheet tr, #printable-memo tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              `}
            </style>
          </head>
          <body>
            <div class="${elementId === 'printable-thermal-memo' ? 'printer-container' : ''}">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (err) {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
            document.title = originalTitle;
          }, 1000);
        }
      }, 300);
    } else {
      window.print();
      document.title = originalTitle;
    }
  }
}

export const printElement = handlePrint;
