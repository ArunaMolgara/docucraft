import imageCompression from 'browser-image-compression';
import type { ProcessingOptions, ProcessingResult } from './pdfUtils';

/**
 * Compress image file with quality settings
 */
export async function compressImage(
  imageFile: File,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  try {
    if (!imageFile) {
      return { success: false, error: 'No image file selected' };
    }

    const quality = options.quality || 0.7;
    const maxWidthOrHeight = options.format === 'original' ? undefined : 1920;

    const compressionOptions = {
      maxSizeMB: quality * 10, // Approximate MB limit
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: imageFile.type,
      initialQuality: quality,
      alwaysKeepResolution: false,
      preserveExif: false,
    };

    const compressedFile = await imageCompression(imageFile, compressionOptions);
    
    const url = URL.createObjectURL(compressedFile);
    const compressionRatio = ((1 - compressedFile.size / imageFile.size) * 100).toFixed(1);

    return {
      success: true,
      data: compressedFile,
      url,
      filename: `compressed_${imageFile.name}`,
      originalSize: imageFile.size,
      compressedSize: compressedFile.size,
      compressionRatio,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compress image',
    };
  }
}

/**
 * Compress multiple images
 */
export async function compressMultipleImages(
  imageFiles: File[],
  options: ProcessingOptions = {}
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  for (const imageFile of imageFiles) {
    const result = await compressImage(imageFile, options);
    results.push(result);
  }
  
  return results;
}

/**
 * Merge multiple images into one image (collage/grid)
 */
export async function mergeImages(
  imageFiles: File[],
  options: {
    layout?: 'horizontal' | 'vertical' | 'grid';
    spacing?: number;
    backgroundColor?: string;
    maxWidth?: number;
  } = {}
): Promise<ProcessingResult> {
  try {
    if (!imageFiles || imageFiles.length === 0) {
      return { success: false, error: 'No images selected' };
    }

    if (imageFiles.length === 1) {
      return { success: false, error: 'Please select at least 2 images to merge' };
    }

    const layout = options.layout || 'vertical';
    const spacing = options.spacing || 10;
    const backgroundColor = options.backgroundColor || '#ffffff';
    const maxWidth = options.maxWidth || 1200;

    // Load all images
    const images = await Promise.all(
      imageFiles.map((file) => loadImageFromFile(file))
    );

    // Calculate canvas dimensions
    let canvasWidth = 0;
    let canvasHeight = 0;

    if (layout === 'horizontal') {
      const totalWidth = images.reduce((sum, img) => sum + img.width, 0);
      const maxHeight = Math.max(...images.map((img) => img.height));
      const scale = Math.min(1, maxWidth / totalWidth);
      
      canvasWidth = (totalWidth + spacing * (images.length - 1)) * scale;
      canvasHeight = maxHeight * scale;
    } else if (layout === 'vertical') {
      const maxImgWidth = Math.max(...images.map((img) => img.width));
      const scale = Math.min(1, maxWidth / maxImgWidth);
      const totalHeight = images.reduce((sum, img) => sum + img.height, 0);
      
      canvasWidth = maxImgWidth * scale;
      canvasHeight = (totalHeight + spacing * (images.length - 1)) * scale;
    } else {
      // Grid layout
      const cols = Math.ceil(Math.sqrt(images.length));
      const rows = Math.ceil(images.length / cols);
      const maxImgWidth = Math.max(...images.map((img) => img.width));
      const maxImgHeight = Math.max(...images.map((img) => img.height));
      const scale = Math.min(1, maxWidth / (maxImgWidth * cols));
      
      canvasWidth = (maxImgWidth * cols + spacing * (cols - 1)) * scale;
      canvasHeight = (maxImgHeight * rows + spacing * (rows - 1)) * scale;
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(canvasWidth);
    canvas.height = Math.floor(canvasHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { success: false, error: 'Could not create canvas context' };
    }

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw images
    let x = 0;
    let y = 0;

    if (layout === 'horizontal') {
      const scale = canvas.height / Math.max(...images.map((img) => img.height));
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetY = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(img, x, offsetY, scaledWidth, scaledHeight);
        x += scaledWidth + spacing;
      }
    } else if (layout === 'vertical') {
      const maxImgWidth = Math.max(...images.map((img) => img.width));
      const scale = canvas.width / maxImgWidth;
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        
        ctx.drawImage(img, offsetX, y, scaledWidth, scaledHeight);
        y += scaledHeight + spacing;
      }
    } else {
      // Grid layout
      const cols = Math.ceil(Math.sqrt(images.length));
      const maxImgWidth = Math.max(...images.map((img) => img.width));
      const maxImgHeight = Math.max(...images.map((img) => img.height));
      const scale = canvas.width / (maxImgWidth * cols + spacing * (cols - 1));

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        x = col * (maxImgWidth * scale + spacing);
        y = row * (maxImgHeight * scale + spacing);
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      }
    }

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob'));
        },
        'image/png',
        0.95
      );
    });

    const url = URL.createObjectURL(blob);

    return {
      success: true,
      data: blob,
      url,
      filename: `merged_images_${Date.now()}.png`,
    };
  } catch (error) {
    console.error('Error merging images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge images',
    };
  }
}

/**
 * Crop image with specified coordinates
 */
export async function cropImage(
  imageFile: File,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<ProcessingResult> {
  try {
    if (!imageFile) {
      return { success: false, error: 'No image file selected' };
    }

    if (cropArea.width === 0 || cropArea.height === 0) {
      return { success: false, error: 'Invalid crop area' };
    }

    const img = await loadImageFromFile(imageFile);
    
    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { success: false, error: 'Could not create canvas context' };
    }

    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create cropped image'));
        },
        imageFile.type,
        0.95
      );
    });

    const url = URL.createObjectURL(blob);

    return {
      success: true,
      data: blob,
      url,
      filename: `cropped_${imageFile.name}`,
    };
  } catch (error) {
    console.error('Error cropping image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to crop image',
    };
  }
}

/**
 * Convert image format
 */
export async function convertImageFormat(
  imageFile: File,
  targetFormat: 'jpeg' | 'png' | 'webp'
): Promise<ProcessingResult> {
  try {
    if (!imageFile) {
      return { success: false, error: 'No image file selected' };
    }

    const img = await loadImageFromFile(imageFile);
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { success: false, error: 'Could not create canvas context' };
    }

    // Fill white background for JPEG (to handle transparency)
    if (targetFormat === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    const mimeType = `image/${targetFormat}`;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert image format'));
        },
        mimeType,
        0.95
      );
    });

    const url = URL.createObjectURL(blob);
    const originalName = imageFile.name.split('.')[0];

    return {
      success: true,
      data: blob,
      url,
      filename: `${originalName}_converted.${targetFormat}`,
    };
  } catch (error) {
    console.error('Error converting image format:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert image format',
    };
  }
}

/**
 * Helper: Load image from File
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImageFromFile(file);
  return { width: img.width, height: img.height };
}

/**
 * Create thumbnail preview
 */
export async function createThumbnail(
  file: File,
  maxSize: number = 200
): Promise<string> {
  const img = await loadImageFromFile(file);
  
  const canvas = document.createElement('canvas');
  const scale = Math.min(maxSize / img.width, maxSize / img.height);
  
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL('image/jpeg', 0.7);
}
