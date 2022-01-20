const samples = require('../saved_data/sampling_2.json')
const PDFDocument = require('pdfkit')
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra')

// Clearing dir
fsExtra.emptyDirSync(path.join(__dirname, `../sampling_pdf`))

let i = 0

// Writing pdfs
for (const sample of samples) {
    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(path.join(__dirname, `../sampling_pdf/sample_${i}.pdf`)))
    doc.text(JSON.stringify(sample), 100, 100)
    doc.end()

    i++
    
    if (i > 10)
        break
}