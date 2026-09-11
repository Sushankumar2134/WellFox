const ocrService = require('../services/ocrService');
const extractionService = require('../services/extractionService');
const { success, error } = require('../utils/response');

exports.processDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded. Please select a JPG, PNG, or PDF file.', 400);
    }

    console.log(`[OCR] Backend received file: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);

    const filePath = req.file.path;
    const ocrResult = await ocrService.processDocument(filePath);

    if (!ocrResult.success) {
      return error(res, ocrResult.error || 'OCR processing failed', 400);
    }

    console.log(`[OCR] Extracted text length: ${ocrResult.rawText.length}`);

    const { fields, structuredData, confidence, warnings } = extractionService.extractFields(ocrResult.rawText);

    console.log('[OCR] ===== EXTRACTION RESULTS =====');
    console.log('[OCR] RAW TEXT (first 500 chars):', ocrResult.rawText.substring(0, 500));
    console.log('[OCR] STRUCTURED DATA:', JSON.stringify(structuredData, null, 2));
    console.log('[OCR] FIELDS:', JSON.stringify(fields, null, 2));
    console.log('[OCR] WARNINGS:', warnings);
    console.log('[OCR] ===== END RESULTS =====');

    success(res, {
      rawText: ocrResult.rawText,
      fields,
      structuredData,
      confidence,
      warnings,
      quality: ocrResult.quality,
      provider: ocrResult.provider,
      uploadedFile: {
        filePath: req.file.path,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
};
