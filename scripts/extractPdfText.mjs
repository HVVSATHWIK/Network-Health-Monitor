import fs from 'fs';
import pdf from 'pdf-parse';

const filePath = process.argv.slice(2).join(' ');
if (!filePath) {
  console.error('Usage: node extractPdfText.mjs <pdf path>');
  process.exit(2);
}

const buf = fs.readFileSync(filePath);
const out = await pdf(buf);
const text = out.text ? out.text : '';
console.log('pages', out.numpages);
console.log('textLen', text.length);
console.log(text);
