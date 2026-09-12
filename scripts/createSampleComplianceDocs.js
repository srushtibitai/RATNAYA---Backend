import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Minimal valid PDF binary string
const generateSamplePdf = (docTitle) => `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 120 >> stream
BT /F1 18 Tf 50 720 Td (RATNAYA GOVT COMPLIANCE DOCUMENT) Tj ET
BT /F1 14 Tf 50 680 Td (${docTitle}) Tj ET
BT /F1 12 Tf 50 640 Td (Verified Status: ACTIVE & VALIDATED) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000248 00000 n 
0000000325 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
496
%%EOF`;

// Base default document names
const filesToCreate = [
  { name: 'GST_Certificate.pdf', content: generateSamplePdf('Official GSTIN Registration Certificate') },
  { name: 'BIS_Hallmark_License.pdf', content: generateSamplePdf('BIS Hallmarking Jewellery License') },
  { name: 'VR_Jeweller_GST_Certificate.pdf', content: generateSamplePdf('VR Jeweller - GSTIN Certificate (24AAAAA0000A1Z5)') },
  { name: 'VR_Jeweller_PAN_Card.pdf', content: generateSamplePdf('VR Jeweller - Business PAN Card Proof') },
  { name: 'VR_Jeweller_BIS_Hallmark_License.pdf', content: generateSamplePdf('VR Jeweller - BIS Hallmark License Certificate') },
  { name: 'Kundan_Atelier_GST_Certificate.pdf', content: generateSamplePdf('Kundan Atelier - GSTIN Certificate') },
  { name: 'Kundan_Atelier_PAN_Card.pdf', content: generateSamplePdf('Kundan Atelier - PAN Card Proof') },
  { name: 'Kundan_Atelier_BIS_Hallmark_License.pdf', content: generateSamplePdf('Kundan Atelier - BIS Hallmark License') }
];

filesToCreate.forEach(({ name, content }) => {
  const filePath = path.join(uploadsDir, name);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created sample compliance doc: ${name}`);
});

// Copy avatar.jpg to PAN_Card.jpg & VR_Jeweller_PAN_Card.jpg if avatar.jpg exists
const avatarPath = path.join(uploadsDir, 'avatar.jpg');
const panPath = path.join(uploadsDir, 'PAN_Card.jpg');
const vrPanPath = path.join(uploadsDir, 'VR_Jeweller_PAN_Card.jpg');

if (fs.existsSync(avatarPath)) {
  fs.copyFileSync(avatarPath, panPath);
  fs.copyFileSync(avatarPath, vrPanPath);
  console.log('✅ Created PAN_Card.jpg and VR_Jeweller_PAN_Card.jpg sample images');
}

console.log('🎉 All sample compliance documents created successfully in backend/public/uploads!');
