# DocuCraft - Document Processing App

A fully functional offline document processing app that converts, compresses, merges PDFs and images. 100% client-side processing for complete privacy and security.

## Features

- **Image to PDF Conversion** - Convert multiple images to a single PDF document
- **PDF Compression** - Reduce PDF file size without losing quality
- **Image Compression** - Optimize JPEG and PNG files
- **PDF Merging** - Combine multiple PDF documents into one
- **Image Merging** - Join images together with flexible layouts (vertical, horizontal, grid)
- **Image Cropping** - Precision cropping with custom coordinates

## Key Benefits

- **100% Private** - All processing happens locally on your device
- **Works Offline** - No internet connection required
- **Free to Use** - No subscriptions, no hidden fees
- **Fast Processing** - Client-side processing with optimized algorithms
- **Secure** - Your files never leave your device

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- pdf-lib - PDF manipulation
- jspdf - PDF generation
- browser-image-compression - Image compression
- Capacitor - Mobile app wrapper

## Web Deployment

The web app is deployed and ready to use at:
https://b7p64n35hinz2.ok.kimi.link

## Mobile App Deployment

### Prerequisites

- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS - macOS only)
- Capacitor CLI

### Build for Production

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync
```

### Android Deployment

```bash
# Add Android platform
npx cap add android

# Sync changes
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK/AAB in Android Studio
# Go to Build > Build Bundle(s) / APK(s)
```

To publish on Google Play Store:
1. Create a Google Play Developer account
2. Generate a signed APK/AAB in Android Studio
3. Upload to Google Play Console
4. Fill in app details and submit for review

### iOS Deployment (macOS only)

```bash
# Add iOS platform
npx cap add ios

# Sync changes
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and archive in Xcode
# Go to Product > Archive
```

To publish on App Store:
1. Create an Apple Developer account ($99/year)
2. Create App ID and provisioning profiles
3. Archive the app in Xcode
4. Upload to App Store Connect
5. Fill in app details and submit for review

## PWA Features

The app is configured as a Progressive Web App (PWA):
- Works offline with service worker
- Installable on home screen
- Responsive design for all devices
- App manifest for native-like experience

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## File Structure

```
src/
  utils/
    pdfUtils.ts      - PDF processing functions
    imageUtils.ts    - Image processing functions
  App.tsx            - Main application component
  App.css            - Custom styles
public/
  icons/             - PWA icons
  manifest.json      - PWA manifest
```

## Error Handling

The app includes comprehensive error handling:
- File type validation
- Size limit checks
- Processing error messages
- User-friendly toast notifications

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - Free to use and modify.

## Support

For issues or feature requests, please contact support.
