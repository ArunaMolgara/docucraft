import { PDFDocument, PDFImage } from 'pdf-lib';
import { jsPDF } from 'jspdf';

export interface ProcessingOptions {
  quality?: number;
  format?: string;
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface ProcessingResult {
  success: boolean;
  data?: Blob;
  url?: string;
  filename?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: string;
}

/**
 * Convert images to PDF using pdf-lib (higher quality)
 */
export async function imagesToPDF(
  imageFiles: File[]
): Promise<ProcessingResult> {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      return { success: false, error: 'No images selected' };
    }

    const pdfDoc = await PDFDocument.create();
    
    for (const imageFile of imageFiles) {
      const imageBytes = await imageFile.arrayBuffer();
      let pdfImage: PDFImage;
      
      // Determine image type and embed accordingly
      if (imageFile.type === 'image/png') {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        // For other formats, convert to canvas first
        const convertedImage = await convertImageToJpeg(imageFile);
        pdfImage = await pdfDoc.embedJpg(convertedImage);
      }
      
      // Create page with image dimensions
      const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
      
      // Draw image on page
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    
    return {
      success: true,
      data: pdfBlob,
      url,
      filename: `converted_images_${Date.now()}.pdf`,
    };
  } catch (error) {
    console.error('Error converting images to PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert images to PDF',
    };
  }
}

/**
 * Alternative: Convert images to PDF using jsPDF
 */
export async function imagesToPDFjsPDF(
  imageFiles: File[]
): Promise<ProcessingResult> {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      return { success: false, error: 'No images selected' };
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
    });

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const imageData = await fileToDataURL(imageFile);
      
      // Get image dimensions
      const img = await loadImage(imageData);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calculate aspect ratio to fit image on page
      const imgRatio = img.width / img.height;
      const pageRatio = pageWidth / pageHeight;
      
      let finalWidth = pageWidth;
      let finalHeight = pageHeight;
      
      if (imgRatio > pageRatio) {
        finalHeight = pageWidth / imgRatio;
      } else {
        finalWidth = pageHeight * imgRatio;
      }
      
      // Center the image
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      
      // Add image format based on file type
      const format = imageFile.type === 'image/png' ? 'PNG' : 'JPEG';
      doc.addImage(imageData, format, x, y, finalWidth, finalHeight);
      
      // Add new page for next image (except for the last one)
      if (i < imageFiles.length - 1) {
        doc.addPage();
      }
    }
    
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    return {
      success: true,
      data: pdfBlob,
      url,
      filename: `converted_images_${Date.now()}.pdf`,
    };
  } catch (error) {
    console.error('Error converting images to PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert images to PDF',
    };
  }
}

/**
 * Merge multiple PDF files into one
 */
export async function mergePDFs(
  pdfFiles: File[]
): Promise<ProcessingResult> {
  try {
    if (!pdfFiles || pdfFiles.length === 0) {
      return { success: false, error: 'No PDF files selected' };
    }

    if (pdfFiles.length === 1) {
      return { success: false, error: 'Please select at least 2 PDF files to merge' };
    }

    const mergedPdf = await PDFDocument.create();
    let totalOriginalSize = 0;

    for (const pdfFile of pdfFiles) {
      totalOriginalSize += pdfFile.size;
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfFile = await mergedPdf.save();
    const mergedPdfBlob = new Blob([new Uint8Array(mergedPdfFile)], { type: 'application/pdf' });
    const url = URL.createObjectURL(mergedPdfBlob);

    return {
      success: true,
      data: mergedPdfBlob,
      url,
      filename: `merged_pdf_${Date.now()}.pdf`,
      originalSize: totalOriginalSize,
      compressedSize: mergedPdfBlob.size,
      compressionRatio: ((1 - mergedPdfBlob.size / totalOriginalSize) * 100).toFixed(1),
    };
  } catch (error) {
    console.error('Error merging PDFs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge PDFs',
    };
  }
}

/**
 * Compress PDF file
 */
export async function compressPDF(
  pdfFile: File
): Promise<ProcessingResult> {
  try {
    if (!pdfFile) {
      return { success: false, error: 'No PDF file selected' };
    }

    const pdfBytes = await pdfFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    
    // Save with compression options
    const compressedPdfBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const compressedBlob = new Blob([new Uint8Array(compressedPdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(compressedBlob);

    const compressionRatio = ((1 - compressedBlob.size / pdfFile.size) * 100).toFixed(1);

    return {
      success: true,
      data: compressedBlob,
      url,
      filename: `compressed_${pdfFile.name}`,
      originalSize: pdfFile.size,
      compressedSize: compressedBlob.size,
      compressionRatio,
    };
  } catch (error) {
    console.error('Error compressing PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compress PDF',
    };
  }
}

/**
 * Helper: Convert image file to JPEG ArrayBuffer
 */
async function convertImageToJpeg(imageFile: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then((buffer) => {
            resolve(new Uint8Array(buffer));
          });
        } else {
          reject(new Error('Failed to convert image'));
        }
      }, 'image/jpeg', 0.9);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Helper: Convert File to Data URL
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Load image from URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Download file from blob URL
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
