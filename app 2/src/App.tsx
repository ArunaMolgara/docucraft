import { useState, useRef, useCallback } from 'react';
import { 
  FileImage, 
  FileText, 
  Images, 
  Crop, 
  Merge, 
  FileDown, 
  Download,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Image as ImageIcon,
  Minimize2,
  Menu,
  Star,
  Zap,
  Shield,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toaster, toast } from 'sonner';
import { imagesToPDF, mergePDFs, compressPDF, downloadFile, formatFileSize } from './utils/pdfUtils';
import type { ProcessingResult } from './utils/pdfUtils';
import { compressImage, mergeImages, cropImage, createThumbnail } from './utils/imageUtils';
import './App.css';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  result: ProcessingResult | null;
  error: string | null;
}

function App() {
  const [activeTab, setActiveTab] = useState('image-to-pdf');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    result: null,
    error: null,
  });
  const [quality, setQuality] = useState(80);
  const [layout, setLayout] = useState<'horizontal' | 'vertical' | 'grid'>('vertical');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<FileWithPreview | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];
    
    for (const file of Array.from(selectedFiles)) {
      const fileWithPreview = Object.assign(file, { id: generateId() }) as FileWithPreview;
      
      if (file.type.startsWith('image/')) {
        try {
          fileWithPreview.preview = await createThumbnail(file, 150);
        } catch (error) {
          console.error('Error creating preview:', error);
        }
      }
      
      newFiles.push(fileWithPreview);
    }

    setFiles((prev) => [...prev, ...newFiles]);
    
    setProcessing({
      isProcessing: false,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setProcessing({
      isProcessing: false,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setProcessing({
      isProcessing: false,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  const processImageToPDF = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setProcessing({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        throw new Error('No valid image files selected');
      }

      setProcessing((prev) => ({ ...prev, progress: 30 }));
      
      const result = await imagesToPDF(imageFiles);
      
      setProcessing((prev) => ({ ...prev, progress: 100 }));
      
      if (result.success) {
        setProcessing({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });
        toast.success('Images converted to PDF successfully!');
      } else {
        throw new Error(result.error || 'Conversion failed');
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const processPDFCompression = async () => {
    if (files.length === 0) {
      toast.error('Please select a PDF file');
      return;
    }

    if (files.length > 1) {
      toast.error('Please select only one PDF file at a time');
      return;
    }

    const file = files[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file');
      return;
    }

    setProcessing({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      setProcessing((prev) => ({ ...prev, progress: 40 }));
      
      const result = await compressPDF(file);
      
      setProcessing((prev) => ({ ...prev, progress: 100 }));
      
      if (result.success) {
        setProcessing({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });
        toast.success('PDF compressed successfully!');
      } else {
        throw new Error(result.error || 'Compression failed');
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const processImageCompression = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setProcessing({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        throw new Error('No valid image files selected');
      }

      setProcessing((prev) => ({ ...prev, progress: 30 }));
      
      const result = await compressImage(imageFiles[0], { quality: quality / 100 });
      
      setProcessing((prev) => ({ ...prev, progress: 100 }));
      
      if (result.success) {
        setProcessing({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });
        toast.success('Image compressed successfully!');
      } else {
        throw new Error(result.error || 'Compression failed');
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const processPDFMerge = async () => {
    if (files.length < 2) {
      toast.error('Please select at least 2 PDF files to merge');
      return;
    }

    const pdfFiles = files.filter((f) => f.type === 'application/pdf');
    if (pdfFiles.length < 2) {
      toast.error('Please select at least 2 valid PDF files');
      return;
    }

    setProcessing({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      setProcessing((prev) => ({ ...prev, progress: 40 }));
      
      const result = await mergePDFs(pdfFiles);
      
      setProcessing((prev) => ({ ...prev, progress: 100 }));
      
      if (result.success) {
        setProcessing({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });
        toast.success('PDFs merged successfully!');
      } else {
        throw new Error(result.error || 'Merge failed');
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const processImageMerge = async () => {
    if (files.length < 2) {
      toast.error('Please select at least 2 images to merge');
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length < 2) {
      toast.error('Please select at least 2 valid image files');
      return;
    }

    setProcessing({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      setProcessing((prev) => ({ ...prev, progress: 40 }));
      
      const result = await mergeImages(imageFiles, { layout });
      
      setProcessing((prev) => ({ ...prev, progress: 100 }));
      
      if (result.success) {
        setProcessing({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });
        toast.success('Images merged successfully!');
      } else {
        throw new Error(result.error || 'Merge failed');
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const processImageCrop = async () => {
    if (!selectedImageForCrop) {
      toast.error('Please select an image to crop');
      return;
    }

    if (cropArea.width === 0 || cropArea.height === 0) {
      toast.error('Please select a crop area');
      return;
    }

    setProcessing({ isProcessing: true, progress: 10, result: null, error: null });

    try {
      setProcessing((prev) => ({ ...prev, progress: 50 }));
      
      const result = await cropImage(selectedImageForCrop, cropArea);
      
      setProcessing((prev) => ({ ...prev, progress: 100 }));
      
      if (result.success) {
        setProcessing({
          isProcessing: false,
          progress: 100,
          result,
          error: null,
        });
        setShowCropDialog(false);
        toast.success('Image cropped successfully!');
      } else {
        throw new Error(result.error || 'Crop failed');
      }
    } catch (error) {
      setProcessing({
        isProcessing: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleProcess = () => {
    switch (activeTab) {
      case 'image-to-pdf':
        processImageToPDF();
        break;
      case 'compress-pdf':
        processPDFCompression();
        break;
      case 'compress-image':
        processImageCompression();
        break;
      case 'merge-pdf':
        processPDFMerge();
        break;
      case 'merge-image':
        processImageMerge();
        break;
      case 'crop-image':
        if (files.length > 0) {
          setSelectedImageForCrop(files[0]);
          setShowCropDialog(true);
        } else {
          toast.error('Please select an image to crop');
        }
        break;
      default:
        break;
    }
  };

  const getAcceptedFileTypes = () => {
    switch (activeTab) {
      case 'image-to-pdf':
      case 'compress-image':
      case 'merge-image':
      case 'crop-image':
        return 'image/*';
      case 'compress-pdf':
      case 'merge-pdf':
        return '.pdf';
      default:
        return '*';
    }
  };

  const getTabInfo = () => {
    switch (activeTab) {
      case 'image-to-pdf':
        return {
          title: 'Image to PDF',
          description: 'Convert multiple images to a single PDF document',
          icon: FileImage,
          buttonText: 'Convert to PDF',
          multiple: true,
        };
      case 'compress-pdf':
        return {
          title: 'Compress PDF',
          description: 'Reduce PDF file size without losing quality',
          icon: FileDown,
          buttonText: 'Compress PDF',
          multiple: false,
        };
      case 'compress-image':
        return {
          title: 'Compress Image',
          description: 'Optimize JPEG and PNG files',
          icon: Minimize2,
          buttonText: 'Compress Image',
          multiple: false,
        };
      case 'merge-pdf':
        return {
          title: 'Merge PDFs',
          description: 'Combine multiple PDF documents into one',
          icon: Merge,
          buttonText: 'Merge PDFs',
          multiple: true,
        };
      case 'merge-image':
        return {
          title: 'Merge Images',
          description: 'Join images together with flexible layouts',
          icon: Images,
          buttonText: 'Merge Images',
          multiple: true,
        };
      case 'crop-image':
        return {
          title: 'Crop Image',
          description: 'Precision cropping for your images',
          icon: Crop,
          buttonText: 'Crop Image',
          multiple: false,
        };
      default:
        return {
          title: 'Image to PDF',
          description: 'Convert images to PDF',
          icon: FileImage,
          buttonText: 'Convert',
          multiple: true,
        };
    }
  };

  const tabInfo = getTabInfo();
  const TabIcon = tabInfo.icon;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e0e0e0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ff6b35] rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2d2d2d]">DocuCraft</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-[#666666] hover:text-[#2d2d2d] transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#666666] hover:text-[#2d2d2d] transition-colors">How It Works</a>
              <a href="#faq" className="text-[#666666] hover:text-[#2d2d2d] transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="hidden sm:flex text-[#666666]">
                Sign In
              </Button>
              <Button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white">
                Get Started
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#e0e0e0] py-4">
            <div className="px-4 space-y-3">
              <a href="#features" className="block py-2 text-[#666666]">Features</a>
              <a href="#how-it-works" className="block py-2 text-[#666666]">How It Works</a>
              <a href="#faq" className="block py-2 text-[#666666]">FAQ</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] mb-6">
              Transform Your
              <span className="text-[#ff6b35]"> Documents</span>
              <br />With Ease
            </h1>
            <p className="text-lg md:text-xl text-[#666666] max-w-2xl mx-auto">
              Professional-grade tools to convert, compress, merge, and customize your files. 
              All processing happens locally on your device - 100% private and secure.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#ff6b35] text-[#ff6b35]" />
                ))}
              </div>
              <span className="text-[#666666]">Trusted by 50,000+ users worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8 bg-white p-2 rounded-xl">
              <TabsTrigger value="image-to-pdf" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                <FileImage className="w-5 h-5" />
                <span className="text-xs">Image to PDF</span>
              </TabsTrigger>
              <TabsTrigger value="compress-pdf" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                <FileDown className="w-5 h-5" />
                <span className="text-xs">Compress PDF</span>
              </TabsTrigger>
              <TabsTrigger value="compress-image" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                <Minimize2 className="w-5 h-5" />
                <span className="text-xs">Compress Img</span>
              </TabsTrigger>
              <TabsTrigger value="merge-pdf" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                <Merge className="w-5 h-5" />
                <span className="text-xs">Merge PDFs</span>
              </TabsTrigger>
              <TabsTrigger value="merge-image" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                <Images className="w-5 h-5" />
                <span className="text-xs">Merge Images</span>
              </TabsTrigger>
              <TabsTrigger value="crop-image" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-[#ff6b35] data-[state=active]:text-white">
                <Crop className="w-5 h-5" />
                <span className="text-xs">Crop Image</span>
              </TabsTrigger>
            </TabsList>

            <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#ff6b35] rounded-lg flex items-center justify-center">
                    <TabIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{tabInfo.title}</CardTitle>
                    <p className="text-sm text-gray-400">{tabInfo.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* File Upload Area */}
                <div 
                  className="border-2 border-dashed border-[#e0e0e0] rounded-xl p-8 text-center hover:border-[#ff6b35] hover:bg-[#fff5f2] transition-all cursor-pointer mb-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptedFileTypes()}
                    multiple={tabInfo.multiple}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-[#ff6b35]" />
                  </div>
                  <p className="text-lg font-medium text-[#2d2d2d] mb-2">
                    Click to upload files
                  </p>
                  <p className="text-sm text-[#666666]">
                    Supports: {activeTab.includes('pdf') ? 'PDF' : 'JPG, PNG, WebP'}
                  </p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-[#2d2d2d]">
                        Selected Files ({files.length})
                      </h3>
                      <Button variant="ghost" size="sm" onClick={clearFiles} className="text-red-500">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    <ScrollArea className="h-48 rounded-lg border border-[#e0e0e0]">
                      <div className="p-3 space-y-2">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-2 bg-[#f5f5f5] rounded-lg"
                          >
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-[#e0e0e0] rounded flex items-center justify-center">
                                <FileText className="w-5 h-5 text-[#666666]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#2d2d2d] truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-[#666666]">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(file.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Settings */}
                {(activeTab === 'image-to-pdf' || activeTab.includes('compress')) && (
                  <div className="mb-6 p-4 bg-[#f5f5f5] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-[#666666]" />
                      <span className="font-medium text-[#2d2d2d]">Quality Settings</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-sm text-[#666666]">Quality</Label>
                          <span className="text-sm font-medium text-[#ff6b35]">{quality}%</span>
                        </div>
                        <Slider
                          value={[quality]}
                          onValueChange={(value) => setQuality(value[0])}
                          min={10}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-1 text-xs text-[#666666]">
                          <span>Smaller File</span>
                          <span>Better Quality</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Layout Selection for Image Merge */}
                {activeTab === 'merge-image' && (
                  <div className="mb-6 p-4 bg-[#f5f5f5] rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-4 h-4 text-[#666666]" />
                      <span className="font-medium text-[#2d2d2d]">Layout</span>
                    </div>
                    <RadioGroup
                      value={layout}
                      onValueChange={(value) => setLayout(value as 'horizontal' | 'vertical' | 'grid')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="vertical" id="vertical" />
                        <Label htmlFor="vertical" className="flex items-center gap-1">
                          <div className="w-4 h-6 border border-current rounded-sm" />
                          Vertical
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="horizontal" id="horizontal" />
                        <Label htmlFor="horizontal" className="flex items-center gap-1">
                          <div className="w-6 h-4 border border-current rounded-sm" />
                          Horizontal
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="grid" id="grid" />
                        <Label htmlFor="grid" className="flex items-center gap-1">
                          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                            <div className="bg-current rounded-sm" />
                            <div className="bg-current rounded-sm" />
                            <div className="bg-current rounded-sm" />
                            <div className="bg-current rounded-sm" />
                          </div>
                          Grid
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Processing Progress */}
                {processing.isProcessing && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#2d2d2d]">Processing...</span>
                      <span className="text-sm text-[#666666]">{processing.progress}%</span>
                    </div>
                    <Progress value={processing.progress} className="h-2" />
                  </div>
                )}

                {/* Error Display */}
                {processing.error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{processing.error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Result */}
                {processing.result?.success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Processing Complete!</span>
                    </div>
                    
                    {processing.result.originalSize && processing.result.compressedSize && (
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-[#666666]">Original</p>
                          <p className="font-medium">{formatFileSize(processing.result.originalSize)}</p>
                        </div>
                        <div>
                          <p className="text-[#666666]">Compressed</p>
                          <p className="font-medium">{formatFileSize(processing.result.compressedSize)}</p>
                        </div>
                        <div>
                          <p className="text-[#666666]">Saved</p>
                          <p className="font-medium text-green-600">{processing.result.compressionRatio}%</p>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => processing.result?.url && downloadFile(processing.result.url, processing.result.filename || 'download')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}

                {/* Process Button */}
                <Button
                  onClick={handleProcess}
                  disabled={files.length === 0 || processing.isProcessing}
                  className="w-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white py-6 text-lg font-semibold"
                >
                  {processing.isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <TabIcon className="w-5 h-5" />
                      {tabInfo.buttonText}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#ff6b35] font-medium">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-2 mb-4">
              Everything You Need
            </h2>
            <p className="text-[#666666] max-w-2xl mx-auto">
              Powerful tools designed for professionals, built for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileImage,
                title: 'Image to PDF',
                description: 'Convert multiple images to a single PDF document with customizable settings',
              },
              {
                icon: FileDown,
                title: 'Compress PDFs',
                description: 'Reduce file size without losing quality. Perfect for sharing and storage',
              },
              {
                icon: ImageIcon,
                title: 'Compress Images',
                description: 'Optimize JPEG and PNG files while maintaining visual clarity',
              },
              {
                icon: Merge,
                title: 'Merge PDFs',
                description: 'Combine multiple PDF documents into one seamless file',
              },
              {
                icon: Images,
                title: 'Merge Images',
                description: 'Join images together with flexible layout options and spacing',
              },
              {
                icon: Crop,
                title: 'Crop Images',
                description: 'Precision cropping tools to frame your images perfectly',
              },
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#fff5f2] rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[#ff6b35]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">{feature.title}</h3>
                  <p className="text-[#666666]">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#ff6b35] font-medium">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-2 mb-4">
              Simple Steps, Powerful Results
            </h2>
            <p className="text-[#666666] max-w-2xl mx-auto">
              Get started in seconds with our intuitive workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Select Your File',
                description: 'Choose any image or PDF file from your device. We support all major formats including JPG, PNG, and PDF.',
              },
              {
                step: '02',
                title: 'Customize Settings',
                description: 'Adjust quality, size, and format options to match your specific needs and requirements.',
              },
              {
                step: '03',
                title: 'Process & Download',
                description: 'Get your optimized file in seconds. Download instantly or save to your preferred cloud storage.',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#ff6b35] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-[#2d2d2d] mb-2">{item.title}</h3>
                <p className="text-[#666666]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#fff5f2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-[#ff6b35]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">100% Private</h3>
              <p className="text-[#666666]">All processing happens locally on your device. Your files never leave your computer.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-[#fff5f2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-[#ff6b35]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">Lightning Fast</h3>
              <p className="text-[#666666]">Process files in seconds with our optimized algorithms and client-side processing.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-[#fff5f2] rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-[#ff6b35]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">Works Offline</h3>
              <p className="text-[#666666]">No internet connection required. Use the app anytime, anywhere, completely offline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#ff6b35] font-medium">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-2 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-[#666666]">Everything you need to know about DocuCraft</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What file formats are supported?',
                a: 'We support all major image formats including JPG, PNG, WebP, and HEIC, as well as PDF files. You can convert between these formats seamlessly.',
              },
              {
                q: 'Is there a file size limit?',
                a: 'You can process files up to 100MB each. For larger files, we recommend splitting them or using the compression feature first.',
              },
              {
                q: 'How secure is my data?',
                a: 'All file processing happens locally on your device using JavaScript. We never upload your files to external servers, ensuring complete privacy and security.',
              },
              {
                q: 'Can I use this offline?',
                a: 'Yes! Once loaded, DocuCraft works completely offline. No internet connection required for any processing features.',
              },
              {
                q: 'Is this service free?',
                a: 'Yes! All features are completely free to use. No hidden fees, no subscriptions, no credit card required.',
              },
            ].map((faq, index) => (
              <div key={index} className="border border-[#e0e0e0] rounded-lg p-4">
                <h3 className="font-semibold text-[#2d2d2d] mb-2">{faq.q}</h3>
                <p className="text-[#666666]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#2d2d2d]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Documents?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join 50,000+ users who trust DocuCraft for their document processing needs. 
            Start using it now - completely free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#ff6b35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg">
              Start Processing Now
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Free to use
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> No registration
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Works offline
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#ff6b35] rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">DocuCraft</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional document processing made simple. Convert, compress, merge, and customize your files with ease.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <Separator className="bg-gray-700" />
          <div className="pt-8 text-center text-sm text-gray-400">
            © 2024 DocuCraft. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedImageForCrop && (
              <div className="relative bg-[#f5f5f5] rounded-lg overflow-hidden">
                <img
                  src={selectedImageForCrop.preview || URL.createObjectURL(selectedImageForCrop)}
                  alt="Crop preview"
                  className="max-h-96 mx-auto"
                />
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <p className="text-sm text-[#666666] mb-4">
                    Set crop coordinates (in pixels):
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>X Position</Label>
                      <input
                        type="number"
                        value={cropArea.x}
                        onChange={(e) => setCropArea({ ...cropArea, x: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Y Position</Label>
                      <input
                        type="number"
                        value={cropArea.y}
                        onChange={(e) => setCropArea({ ...cropArea, y: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Width</Label>
                      <input
                        type="number"
                        value={cropArea.width}
                        onChange={(e) => setCropArea({ ...cropArea, width: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <input
                        type="number"
                        value={cropArea.height}
                        onChange={(e) => setCropArea({ ...cropArea, height: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowCropDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={processImageCrop} className="flex-1 bg-[#ff6b35] hover:bg-[#e55a2b]">
                Apply Crop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
