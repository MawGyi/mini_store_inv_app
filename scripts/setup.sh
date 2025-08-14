#!/bin/bash

# Development Setup Script
# This script sets up the development environment

echo "🚀 Setting up Mini Store Inventory Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Setup environment files
echo "⚙️ Setting up environment files..."

if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "✅ Created server/.env from template"
    echo "⚠️  Please update server/.env with your MongoDB connection string"
else
    echo "✅ server/.env already exists"
fi

# Create uploads directory
mkdir -p server/uploads
echo "✅ Created uploads directory"

# Create logs directory  
mkdir -p server/logs
echo "✅ Created logs directory"

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update server/.env with your MongoDB connection string"
echo "2. Start MongoDB server"
echo "3. Run 'npm run dev' to start the development servers"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start both client and server in development mode"
echo "  npm run dev:client   - Start only the client development server" 
echo "  npm run dev:server   - Start only the server development server"
echo "  npm run build        - Build the client for production"
echo "  npm test             - Run tests for both client and server"
echo ""
