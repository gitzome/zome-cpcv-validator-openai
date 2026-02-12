# Zome CPCV Validator (OpenAI Edition)

This tool validates a 'Contrato Promessa de Compra e Venda' (CPCV) against source documents using OpenAI's GPT-4o.

## Features
- Support for Identity Documents (Owners & Buyers).
- Support for Property Documents.
- Multimodal support for Images, PDFs, and Word (.doc/.docx).
- Automated cross-referencing and discrepancy reporting.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `OPENAI_API_KEY` in `.env.local` to your OpenAI API key.
3. Run the app:
   `npm run dev`
