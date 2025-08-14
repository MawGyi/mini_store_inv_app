#!/bin/bash

# 🚀 Automated Backup Script for Mini Store Inventory App
# This script creates timestamped backup tags and pushes them to remote

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Mini Store Inventory App - Backup Script${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Get current timestamp
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_TAG="backup-$DATE"

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo -e "${YELLOW}   Consider committing them before backup${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Backup cancelled${NC}"
        exit 1
    fi
fi

# Get current branch and commit info
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")

echo -e "${BLUE}📝 Current Status:${NC}"
echo -e "   Branch: ${GREEN}$CURRENT_BRANCH${NC}"
echo -e "   Commit: ${GREEN}$CURRENT_COMMIT${NC}"
echo -e "   Message: ${GREEN}$COMMIT_MESSAGE${NC}"
echo

# Create backup tag
echo -e "${BLUE}🏷️  Creating backup tag: ${GREEN}$BACKUP_TAG${NC}"
if git tag "$BACKUP_TAG" -m "Automated backup - $DATE

Branch: $CURRENT_BRANCH
Commit: $CURRENT_COMMIT
Message: $COMMIT_MESSAGE

This is an automated backup tag created for easy restoration.
Use: git checkout $BACKUP_TAG
"; then
    echo -e "${GREEN}✅ Backup tag created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create backup tag${NC}"
    exit 1
fi

# Push backup tag to remote
echo -e "${BLUE}📤 Pushing backup tag to remote...${NC}"
if git push origin "$BACKUP_TAG"; then
    echo -e "${GREEN}✅ Backup tag pushed to remote successfully${NC}"
else
    echo -e "${RED}❌ Failed to push backup tag to remote${NC}"
    echo -e "${YELLOW}   Tag created locally but not pushed${NC}"
    exit 1
fi

# Show recent backup tags
echo
echo -e "${BLUE}📋 Recent backup tags:${NC}"
git tag -l "backup-*" | tail -5 | while read tag; do
    tag_date=$(git log -1 --format=%ai "$tag" 2>/dev/null | cut -d' ' -f1,2)
    echo -e "   ${GREEN}$tag${NC} (${YELLOW}$tag_date${NC})"
done

# Success summary
echo
echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
echo -e "${BLUE}📌 Backup Details:${NC}"
echo -e "   Tag Name: ${GREEN}$BACKUP_TAG${NC}"
echo -e "   Location: ${GREEN}Local + Remote${NC}"
echo -e "   Restore Command: ${YELLOW}git checkout $BACKUP_TAG${NC}"
echo
echo -e "${BLUE}💡 Tips:${NC}"
echo -e "   • View all backups: ${YELLOW}git tag -l 'backup-*'${NC}"
echo -e "   • Restore from backup: ${YELLOW}git checkout <backup-tag>${NC}"
echo -e "   • Return to latest: ${YELLOW}git checkout main${NC}"
echo
