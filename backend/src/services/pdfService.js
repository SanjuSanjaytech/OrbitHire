const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Extract text from a PDF file using pdf-parse
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    
    const data = await pdfParse(dataBuffer, {
      // Normalize whitespace
      normalizeWhitespace: true,
    });

    const text = cleanExtractedText(data.text);
    
    logger.info(`PDF extracted: ${data.numpages} pages, ${text.length} characters`);
    
    return {
      text,
      pages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    logger.error('PDF extraction error:', error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
};

/**
 * Clean up extracted text
 */
const cleanExtractedText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[^\x20-\x7E\n\u00C0-\u024F]/g, '') // Keep ASCII + Latin extended
    .trim();
};

/**
 * Delete uploaded file after processing
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`Deleted file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error);
  }
};

module.exports = { extractTextFromPDF, cleanExtractedText, deleteFile };
