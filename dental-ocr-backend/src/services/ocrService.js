/**
 * OCR Service - Pluggable OCR pipeline with image preprocessing
 *
 * Pipeline: Validate → Preprocess → OCR → Raw Text → Field Extraction → Structured Data
 *
 * Uses Tesseract.js for image OCR and pdf-parse for PDF text extraction.
 * Uses Jimp for image preprocessing (grayscale, contrast, sharpen).
 */

const fs = require('fs');
const path = require('path');

class OCRProvider {
  async process(imagePath) { throw new Error('Subclass must implement process()'); }
}

class TesseractOCRProvider extends OCRProvider {
  async process(imagePath) {
    const Tesseract = require('tesseract.js');
    const ext = path.extname(imagePath).toLowerCase();

    console.log(`[OCR] Starting Tesseract OCR on: ${path.basename(imagePath)}`);

    // Run OCR on original image
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(m.progress * 100);
          if (pct % 20 === 0) console.log(`[OCR] Progress: ${pct}%`);
        }
      },
    });

    let rawText = result.data.text.trim();
    let confidence = result.data.confidence / 100;

    console.log(`[OCR] Initial pass: ${rawText.length} chars, ${(confidence * 100).toFixed(1)}% confidence`);

    // If confidence is low or very little text, try preprocessing
    if (confidence < 0.6 || rawText.length < 50) {
      console.log('[OCR] Low confidence/text, attempting preprocessed pass...');
      try {
        const preprocessed = await this.preprocessImage(imagePath);
        if (preprocessed && fs.existsSync(preprocessed)) {
          const result2 = await Tesseract.recognize(preprocessed, 'eng');
          const text2 = result2.data.text.trim();
          const conf2 = result2.confidence / 100;

          // Use the better result
          if (text2.length > rawText.length || conf2 > confidence) {
            console.log(`[OCR] Preprocessed pass better: ${text2.length} chars, ${(conf2 * 100).toFixed(1)}%`);
            rawText = text2;
            confidence = conf2;
          }

          // Clean up temp file
          try { fs.unlinkSync(preprocessed); } catch {}
        }
      } catch (prepErr) {
        console.log('[OCR] Preprocessing failed, using original result:', prepErr.message);
      }
    }

    console.log(`[OCR] Final: ${rawText.length} chars, ${(confidence * 100).toFixed(1)}% confidence`);

    if (!rawText || rawText.length < 5) {
      console.log('[OCR] Warning: Very little text detected. The image may be unclear.');
    }

    return {
      rawText,
      confidence,
      provider: 'tesseract',
      quality: {
        format: ext,
        width: result.data.width,
        height: result.data.height,
        quality: confidence > 0.7 ? 'good' : confidence > 0.4 ? 'fair' : 'poor',
      },
    };
  }

  async preprocessImage(imagePath) {
    const Jimp = require('jimp');
    const tmpDir = require('os').tmpdir();
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const outputPath = path.join(tmpDir, `${baseName}-preprocessed.png`);

    const image = await Jimp.read(imagePath);

    // Resize if too small (upscale to help OCR)
    if (image.bitmap.width < 1000) {
      const scale = 1000 / image.bitmap.width;
      image.resize(image.bitmap.width * scale, Jimp.AUTO);
    }

    // Convert to grayscale
    image.grayscale();

    // Increase contrast
    image.contrast(0.3);

    // Sharpen
    image.sharpen();

    // Normalize
    image.normalize();

    await image.writeAsync(outputPath);
    console.log(`[OCR] Preprocessed image saved: ${outputPath}`);

    return outputPath;
  }
}

class PDFOCRProvider extends OCRProvider {
  async process(filePath) {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);

    console.log(`[OCR] Starting PDF text extraction: ${path.basename(filePath)}`);

    const data = await pdfParse(dataBuffer, {
      max: 0,
    });

    let rawText = (data.text || '').trim();
    const numPages = data.numpages || 0;

    console.log(`[OCR] PDF extracted. Pages: ${numPages}, Text length: ${rawText.length}`);

    // If PDF has little selectable text, it might be a scanned PDF
    // For now, we return what pdf-parse gives us
    // Converting scanned PDFs to images requires external tools (poppler/imagemagick)
    if (rawText.length < 10 && numPages > 0) {
      console.log('[OCR] PDF has little selectable text. It may be a scanned/image PDF.');
      console.log('[OCR] For scanned PDFs, please convert to image first or install poppler-utils.');
    }

    return {
      rawText,
      confidence: rawText.length > 50 ? 0.8 : 0.3,
      provider: 'pdf-parse',
      quality: {
        format: 'pdf',
        pages: numPages,
        quality: rawText.length > 100 ? 'good' : rawText.length > 10 ? 'fair' : 'poor',
      },
    };
  }
}

let activeProvider = new TesseractOCRProvider();
let pdfProvider = new PDFOCRProvider();

function setOCRProvider(provider) {
  if (!(provider instanceof OCRProvider)) throw new Error('Provider must extend OCRProvider');
  activeProvider = provider;
}

async function processDocument(filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: 'File not found', issues: ['File does not exist'] };
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
    return { success: false, error: 'Unsupported file type', issues: [`Unsupported: ${ext}`] };
  }

  const stats = fs.statSync(filePath);
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
  if (stats.size > maxSize) {
    return { success: false, error: 'File too large', issues: [`Size: ${stats.size}, Max: ${maxSize}`] };
  }

  console.log(`[OCR] Processing file: ${path.basename(filePath)} (${stats.size} bytes, type: ${ext})`);

  try {
    const provider = ext === '.pdf' ? pdfProvider : activeProvider;
    const ocrResult = await provider.process(filePath);
    return {
      success: true,
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidence,
      provider: ocrResult.provider,
      quality: ocrResult.quality,
    };
  } catch (err) {
    console.error('[OCR] Processing failed:', err.message);
    return { success: false, error: err.message, issues: [err.message] };
  }
}

module.exports = { OCRProvider, TesseractOCRProvider, PDFOCRProvider, setOCRProvider, processDocument };
