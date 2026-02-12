import OpenAI from "openai";
import { UploadedFile, UploadType, ValidationReport } from "../types";
import * as pdfjs from "pdfjs-dist";
import mammoth from "mammoth";

// Initialize PDF.js worker using Vite-compatible URL construction
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const pdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      // In newer pdfjs-dist, both canvasContext and the canvas element itself are often expected or required by types
      await page.render({
        canvasContext: context,
        viewport,
        // @ts-ignore - Some versions/types require the canvas element reference
        canvas: canvas
      }).promise;
      images.push(canvas.toDataURL('image/jpeg', 0.8));
    }
  }
  return images;
};

const docxToText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const validateDocuments = async (files: UploadedFile[]): Promise<ValidationReport> => {
  try {
    const getFileContent = async (f: UploadedFile) => {
      const file = f.file;
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        return [{
          type: "image_url" as const,
          image_url: { url: `data:${file.type};base64,${base64}` }
        }];
      } else if (file.type === 'application/pdf') {
        const images = await pdfToImages(file);
        return images.map(img => ({
          type: "image_url" as const,
          image_url: { url: img }
        }));
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const text = await docxToText(file);
        return [{
          type: "text" as const,
          text: `[Contúdo do Documento ${file.name}]:\n${text}`
        }];
      }
      return [];
    };

    const processFiles = async (type: UploadType) => {
      const typeFiles = files.filter(f => f.type === type);
      const contents = await Promise.all(typeFiles.map(getFileContent));
      return contents.flat();
    };

    const ownerParts = await processFiles(UploadType.OWNER);
    const buyerParts = await processFiles(UploadType.BUYER);
    const propertyParts = await processFiles(UploadType.PROPERTY);
    const cpcvParts = await processFiles(UploadType.CPCV);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a rigid legal auditor for Zome. Be precise. Compare NIFs digit by digit. Report in Portuguese. You must output a JSON object following the required schema."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "DOCUMENTS_CONTEXT: Your task is to validate a 'Contrato Promessa de Compra e Venda' (CPCV) against source documents." },
            { type: "text", text: "--- SECTION 1: OWNER DOCUMENTS ---" },
            ...ownerParts,
            { type: "text", text: "--- SECTION 2: BUYER DOCUMENTS ---" },
            ...buyerParts,
            { type: "text", text: "--- SECTION 3: PROPERTY DOCUMENTS ---" },
            ...propertyParts,
            { type: "text", text: "--- SECTION 4: CPCV ---" },
            ...cpcvParts,
            {
              type: "text", text: `
                INSTRUCTIONS:
                1. Extract data from the Source Documents (Owners, Buyers, Property).
                2. Extract data from the CPCV.
                3. Cross-reference the data. Verify:
                   - Are all Owners listed in the CPCV correct (Names, NIFs, Marital Status)?
                   - Are all Buyers listed in the CPCV correct?
                    - Does the Property description match the Property Documents?
                    - Check for typos in NIFs.
                    ***CRITICAL: When comparing identification numbers (NIF, CC, NIC, IBAN), IGNORE ALL SPACES. Treat "123 456 789" as EQUAL to "123456789".***
                   5. CRITICAL: Identify any data found in the CPCV (ESPECIALLY IBANs, specific IDs, Marriage Certificates) that CANNOT be verified because the corresponding source document is missing. List these clearly in 'missingDocumentsData'.
                4. Output the result strictly in JSON with this structure:
                {
                  "overallStatus": "VALID" | "INVALID" | "REVIEW_NEEDED",
                  "summary": "string in Portuguese",
                  "missingDocumentsData": ["string (e.g., 'IBAN PT50... no CPCV sem comprovativo', 'Certidão de Casamento em falta', 'Cartão de Cidadão caducado')"],
                  "entities": {
                    "owners": { "status": "MATCH" | "MISMATCH" | "MISSING", "notes": "string" },
                    "buyers": { "status": "MATCH" | "MISMATCH" | "MISSING", "notes": "string" },
                    "property": { "status": "MATCH" | "MISMATCH" | "MISSING", "notes": "string" }
                  },
                  "discrepancies": [
                    { "severity": "CRITICAL" | "WARNING" | "INFO", "field": "string", "sourceDocValue": "string", "cpcvValue": "string", "description": "string in Portuguese" }
                  ],
                  "detailedComparison": {
                    "owners": [
                      // LIST ALL FIELDS FOUND (Name, NIF, CC, Marital Status, Address, etc.), even if they MATCH.
                      { "field": "Nome (Ex: João Silva)", "sourceValue": "string", "cpcvValue": "string", "status": "MATCH" | "MISMATCH" | "MISSING_SOURCE" | "MISSING_CPCV" },
                      { "field": "NIF (Ex: 123456789)", "sourceValue": "string", "cpcvValue": "string", "status": "MATCH" | "MISMATCH" | "MISSING_SOURCE" | "MISSING_CPCV" }
                    ],
                    "buyers": [
                       // LIST ALL FIELDS FOUND (Name, NIF, CC, Marital Status, Address, etc.), even if they MATCH.
                       { "field": "Nome", "sourceValue": "string", "cpcvValue": "string", "status": "MATCH" | "MISMATCH" | "MISSING_SOURCE" | "MISSING_CPCV" },
                       { "field": "NIF", "sourceValue": "string", "cpcvValue": "string", "status": "MATCH" | "MISMATCH" | "MISSING_SOURCE" | "MISSING_CPCV" }
                    ],
                    "property": [
                      // LIST ALL FIELDS FOUND (Matrix Art., Fraction, Address, Description, Areas, etc.), even if they MATCH.
                      { "field": "Artigo Matricial", "sourceValue": "string", "cpcvValue": "string", "status": "MATCH" | "MISMATCH" | "MISSING_SOURCE" | "MISSING_CPCV" },
                      { "field": "Fração", "sourceValue": "string", "cpcvValue": "string", "status": "MATCH" | "MISMATCH" | "MISSING_SOURCE" | "MISSING_CPCV" }
                    ]
                  }
                }
             ` }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from AI");

    const report = JSON.parse(content) as ValidationReport;
    return postProcessReport(report);

  } catch (error) {
    console.error("Error validating documents:", error);
    throw error;
  }
};

const normalizeString = (str: string): string => {
  if (!str) return '';
  // Remove all spaces and convert to lowercase for comparison
  return str.replace(/\s+/g, '').toLowerCase();
};


const postProcessReport = (report: ValidationReport): ValidationReport => {
  if (!report.detailedComparison) return report;

  const processItems = (items: any[]) => {
    return items.map(item => {
      if (item.status === 'MISMATCH' && item.sourceValue && item.cpcvValue) {
        if (normalizeString(item.sourceValue) === normalizeString(item.cpcvValue)) {
          console.log(`[Auto-Correction] Fixed false mismatch for field '${item.field}': ${item.sourceValue} vs ${item.cpcvValue}`);
          return { ...item, status: 'MATCH' };
        }
      }
      return item;
    });
  };

  report.detailedComparison.owners = processItems(report.detailedComparison.owners || []);
  report.detailedComparison.buyers = processItems(report.detailedComparison.buyers || []);
  report.detailedComparison.property = processItems(report.detailedComparison.property || []);

  // Filter out false discrepancies from the main list
  if (report.discrepancies) {
    report.discrepancies = report.discrepancies.filter(d => {
      const isFalsePositive = normalizeString(d.sourceDocValue) === normalizeString(d.cpcvValue);
      if (isFalsePositive) {
         console.log(`[Auto-Correction] Removed false discrepancy: ${d.field} (${d.sourceDocValue} vs ${d.cpcvValue})`);
      }
      return !isFalsePositive;
    });
  }

  return report;
};
