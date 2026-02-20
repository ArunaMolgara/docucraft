# Deploy DocuCraft to GitHub Pages

This guide will walk you through deploying DocuCraft to GitHub Pages.

## Method 1: Automatic Deployment with GitHub Actions (Recommended)

This method automatically deploys your app every time you push to the main branch.

### Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Repository name: `docucraft` (or any name you prefer)
3. Make it **Public** (required for GitHub Pages free hosting)
4. Click **Create repository**

### Step 2: Upload Your Code

```bash
# Navigate to your project folder
cd /mnt/okcomputer/output/app

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/docucraft.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The workflow file is already in `.github/workflows/deploy.yml`

### Step 4: Deploy

1. Go to **Actions** tab in your repository
2. You should see the "Deploy to GitHub Pages" workflow
3. Click on it, then click **Run workflow**
4. Wait for the deployment to complete (2-3 minutes)

### Step 5: Access Your Site

Your app will be live at:
```
https://YOUR_USERNAME.github.io/docucraft/
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Method 2: Manual Deployment with gh-pages CLI

Use this method if you want to deploy manually from your local machine.

### Step 1: Install gh-pages

```bash
cd /mnt/okcomputer/output/app
npm install --save-dev gh-pages
```

### Step 2: Update vite.config.ts

Make sure your `vite.config.ts` has the correct base path:

```typescript
export default defineConfig({
  base: '/docucraft/',  // Must match your repository name
  // ... rest of config
});
```

### Step 3: Create GitHub Repository

Same as Method 1, Step 1.

### Step 4: Push to GitHub

Same as Method 1, Step 2.

### Step 5: Deploy

```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Step 6: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select **Deploy from a branch**
5. Select **gh-pages** branch and **/(root)** folder
6. Click **Save**

Your app will be live at `https://YOUR_USERNAME.github.io/docucraft/`

---

## Method 3: Deploy dist folder directly (Quickest)

If you just want to deploy the built files without setting up CI/CD:

### Step 1: Create Repository and Push

```bash
cd /mnt/okcomputer/output/app

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/docucraft.git
git branch -M main
git push -u origin main
```

### Step 2: Build and Deploy dist folder

```bash
# Build the project
npm run build

# Create a new branch for gh-pages
git checkout --orphan gh-pages

# Remove all files except dist
git rm -rf .
cp -r dist/* .

# Add and commit
git add .
git commit -m "Deploy to GitHub Pages"

# Push to gh-pages branch
git push origin gh-pages

# Go back to main branch
git checkout main
```

### Step 3: Enable Pages

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: gh-pages, folder: /(root)
4. Click Save

---

## Troubleshooting

### 404 Error or Blank Page

1. Check that `base: '/docucraft/'` in `vite.config.ts` matches your repository name
2. Make sure GitHub Pages is enabled in repository settings
3. Wait 2-3 minutes after deployment for changes to propagate

### Assets Not Loading

The `base` path in vite.config.ts must match your repository name exactly:
- Repository: `docucraft` → base: `/docucraft/`
- Repository: `my-app` → base: `/my-app/`

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Updating Your App

### With GitHub Actions (Method 1):

Just push changes to main branch:
```bash
git add .
git commit -m "Update app"
git push origin main
```

The site will automatically redeploy!

### Manual Methods:

Repeat the build and deploy steps after making changes.

---

## Custom Domain (Optional)

1. Go to repository Settings → Pages
2. Under "Custom domain", enter your domain
3. Add a CNAME file to your repository with your domain
4. Configure DNS with your domain provider

---

## Files Included for Deployment

The following files are already configured for GitHub Pages:

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vite.config.ts` - Vite config with base path
- `package.json` - Deploy script

Your app will be built and deployed automatically!
