#!/bin/bash

# DocuCraft GitHub Pages Deployment Script
# Usage: ./deploy.sh YOUR_GITHUB_USERNAME

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if username is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide your GitHub username${NC}"
    echo "Usage: ./deploy.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

USERNAME=$1
REPO_NAME="docucraft"

echo -e "${YELLOW}=================================${NC}"
echo -e "${YELLOW}  DocuCraft Deployment Script${NC}"
echo -e "${YELLOW}=================================${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit"
else
    echo -e "${GREEN}Git repository already initialized${NC}"
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}Adding GitHub remote...${NC}"
    git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"
else
    echo -e "${GREEN}Remote already configured${NC}"
fi

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Check if repository exists on GitHub
echo -e "${YELLOW}Checking GitHub repository...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "https://github.com/$USERNAME/$REPO_NAME" | grep -q "404"; then
    echo -e "${RED}Repository not found on GitHub!${NC}"
    echo "Please create a repository first:"
    echo "1. Go to https://github.com/new"
    echo "2. Repository name: $REPO_NAME"
    echo "3. Make it Public"
    echo "4. Click Create repository"
    exit 1
fi

# Push to main branch
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git add .
git commit -m "Deploy update - $(date)" || echo "No changes to commit"
git branch -M main
git push -u origin main

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "Your app will be live at:"
echo -e "${YELLOW}https://$USERNAME.github.io/$REPO_NAME/${NC}"
echo ""
echo "Note: It may take 2-3 minutes for the site to be available."
echo "If this is your first deployment, make sure GitHub Actions is enabled:"
echo "1. Go to https://github.com/$USERNAME/$REPO_NAME/actions"
echo "2. Click 'I understand my workflows, go ahead and enable them'"
echo ""
