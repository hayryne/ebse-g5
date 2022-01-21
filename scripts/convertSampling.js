const fs = require('fs');

var html_to_pdf = require('html-pdf-node')
const url = require('url')
process.setMaxListeners(0)
for (let i = 1; i <= 10; i++) {
    const x = url.pathToFileURL(__dirname + `/../saved_data/sample/item_${i}.html`).href

    let options = { format: 'A4', margin: { top: '30px', bottom: '30px', left: '30px', right: '30px' } };

    html_to_pdf.generatePdf({ url: x }, options).then(pdfBuffer => {
      fs.writeFileSync(__dirname + `/../saved_data/sample_pdf/item_${i}.pdf`, pdfBuffer, 'binary')
    });
}
