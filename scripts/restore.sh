#!/bin/bash

# 🔄 Quick Restoration Script for Mini Store Inventory App
# This script helps restore specific components or entire app to previous states

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Mini Store Inventory App - Restoration Script${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Function to show available versions
show_versions() {
    echo -e "${BLUE}📋 Available versions:${NC}"
    echo
    echo -e "${GREEN}🏷️  Release Tags:${NC}"
    git tag -l "v*" | sort -V | tail -10 | while read tag; do
        tag_date=$(git log -1 --format=%ai "$tag" 2>/dev/null | cut -d' ' -f1)
        echo -e "   ${GREEN}$tag${NC} (${YELLOW}$tag_date${NC})"
    done
    
    echo
    echo -e "${GREEN}💾 Backup Tags:${NC}"
    git tag -l "backup-*" | tail -5 | while read tag; do
        tag_date=$(git log -1 --format=%ai "$tag" 2>/dev/null | cut -d' ' -f1,2)
        echo -e "   ${GREEN}$tag${NC} (${YELLOW}$tag_date${NC})"
    done
    
    echo
    echo -e "${GREEN}📝 Recent Commits:${NC}"
    git log --oneline -5 | while read commit; do
        echo -e "   ${GREEN}$(echo $commit | cut -d' ' -f1)${NC} ${YELLOW}$(echo $commit | cut -d' ' -f2-)${NC}"
    done
    echo
}

# Function to restore specific component
restore_component() {
    local version=$1
    local component=$2
    
    case $component in
        "frontend"|"client")
            echo -e "${BLUE}🔄 Restoring frontend to $version...${NC}"
            git checkout "$version" -- client/
            ;;
        "backend"|"server")
            echo -e "${BLUE}🔄 Restoring backend to $version...${NC}"
            git checkout "$version" -- server/
            ;;
        "pos")
            echo -e "${BLUE}🔄 Restoring POS component to $version...${NC}"
            git checkout "$version" -- client/src/lib/components/EnhancedPOS.svelte
            git checkout "$version" -- server/controllers/salesController.js
            ;;
        "docs")
            echo -e "${BLUE}🔄 Restoring documentation to $version...${NC}"
            git checkout "$version" -- docs/
            ;;
        "config")
            echo -e "${BLUE}🔄 Restoring configuration files to $version...${NC}"
            git checkout "$version" -- package.json
            git checkout "$version" -- client/package.json
            git checkout "$version" -- server/package.json
            ;;
        *)
            echo -e "${RED}❌ Unknown component: $component${NC}"
            echo -e "${YELLOW}Available components: frontend, backend, pos, docs, config${NC}"
            return 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Component restored successfully${NC}"
    echo -e "${YELLOW}📝 Don't forget to commit the restoration:${NC}"
    echo -e "   ${YELLOW}git add .${NC}"
    echo -e "   ${YELLOW}git commit -m \"restore($component): revert to $version\"${NC}"
}

# Function to restore entire app
restore_full() {
    local version=$1
    
    echo -e "${YELLOW}⚠️  Warning: This will restore the entire app to $version${NC}"
    echo -e "${YELLOW}   Any uncommitted changes will be lost!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔄 Restoring entire app to $version...${NC}"
        git checkout "$version"
        echo -e "${GREEN}✅ App restored to $version${NC}"
        echo -e "${YELLOW}📝 You are now in detached HEAD state${NC}"
        echo -e "${YELLOW}   Create a new branch to make changes:${NC}"
        echo -e "   ${YELLOW}git checkout -b hotfix/restore-from-$version${NC}"
    else
        echo -e "${RED}❌ Restoration cancelled${NC}"
    fi
}

# Main menu
echo -e "${BLUE}What would you like to restore?${NC}"
echo
echo -e "${GREEN}1.${NC} Show available versions"
echo -e "${GREEN}2.${NC} Restore specific component"
echo -e "${GREEN}3.${NC} Restore entire app"
echo -e "${GREEN}4.${NC} Emergency restore (go back to latest stable)"
echo -e "${GREEN}5.${NC} Exit"
echo

read -p "Choose an option (1-5): " -n 1 -r
echo
echo

case $REPLY in
    1)
        show_versions
        ;;
    2)
        show_versions
        echo -e "${BLUE}Enter version to restore from:${NC}"
        read -p "Version (tag/commit): " version
        echo -e "${BLUE}Enter component to restore:${NC}"
        echo -e "${YELLOW}Options: frontend, backend, pos, docs, config${NC}"
        read -p "Component: " component
        restore_component "$version" "$component"
        ;;
    3)
        show_versions
        echo -e "${BLUE}Enter version to restore to:${NC}"
        read -p "Version (tag/commit): " version
        restore_full "$version"
        ;;
    4)
        echo -e "${BLUE}🚨 Emergency restore to latest stable version${NC}"
        if git tag -l "v*" | sort -V | tail -1 | read latest_tag; then
            echo -e "${BLUE}Latest stable version: ${GREEN}$latest_tag${NC}"
            restore_full "$latest_tag"
        else
            echo -e "${YELLOW}No release tags found, restoring to main branch${NC}"
            git checkout main
            echo -e "${GREEN}✅ Restored to main branch${NC}"
        fi
        ;;
    5)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo
echo -e "${BLUE}💡 Quick Reference:${NC}"
echo -e "   • View current status: ${YELLOW}git status${NC}"
echo -e "   • See recent changes: ${YELLOW}git log --oneline -5${NC}"
echo -e "   • Return to main: ${YELLOW}git checkout main${NC}"
echo
