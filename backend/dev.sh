#!/bin/bash

# RoadGuard Backend Development Helper Script
# This script provides common development tasks for the RoadGuard backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success ".env file created. Please update it with your configurations."
        else
            print_error ".env.example file not found. Please create .env manually."
            exit 1
        fi
    fi
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully!"
}

# Start development server
start_dev() {
    print_status "Starting development server..."
    npm run dev
}

# Start production server
start_prod() {
    print_status "Starting production server..."
    npm start
}

# Seed database
seed_db() {
    print_status "Seeding database with demo data..."
    node seed.js
    print_success "Database seeded successfully!"
}

# Clear database
clear_db() {
    print_warning "This will clear all data from the database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Clearing database..."
        node -e "
            const mongoose = require('mongoose');
            require('dotenv').config();
            const connectDB = require('./src/config/db');
            
            (async () => {
                try {
                    await connectDB();
                    await mongoose.connection.db.dropDatabase();
                    console.log('Database cleared successfully!');
                    process.exit(0);
                } catch (error) {
                    console.error('Error clearing database:', error);
                    process.exit(1);
                }
            })();
        "
        print_success "Database cleared!"
    else
        print_status "Database clear cancelled."
    fi
}

# Reset database (clear + seed)
reset_db() {
    print_status "Resetting database (clear + seed)..."
    clear_db
    if [ $? -eq 0 ]; then
        seed_db
        print_success "Database reset completed!"
    fi
}

# Check application health
health_check() {
    print_status "Checking application health..."
    
    # Check if MongoDB is accessible
    if node -e "
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadguard')
            .then(() => {
                console.log('✓ MongoDB connection successful');
                process.exit(0);
            })
            .catch(() => {
                console.log('✗ MongoDB connection failed');
                process.exit(1);
            });
    " 2>/dev/null; then
        print_success "MongoDB connection: OK"
    else
        print_error "MongoDB connection: FAILED"
    fi
    
    # Check environment variables
    if [ -f .env ]; then
        print_success ".env file: OK"
    else
        print_error ".env file: MISSING"
    fi
    
    # Check if server can start
    timeout 10s node -e "
        require('dotenv').config();
        const app = require('./server');
        console.log('✓ Server can start successfully');
        process.exit(0);
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Server startup: OK"
    else
        print_error "Server startup: FAILED"
    fi
}

# Show API endpoints
show_endpoints() {
    print_status "RoadGuard API Endpoints:"
    echo ""
    echo "🔐 Authentication:"
    echo "  POST   /api/auth/register"
    echo "  POST   /api/auth/login"
    echo "  POST   /api/auth/refresh"
    echo "  POST   /api/auth/logout"
    echo ""
    echo "👤 Customer APIs:"
    echo "  GET    /api/customer/profile"
    echo "  PUT    /api/customer/profile"
    echo "  POST   /api/customer/request"
    echo "  GET    /api/customer/requests"
    echo ""
    echo "🔧 Mechanic APIs:"
    echo "  GET    /api/mechanic/profile"
    echo "  PUT    /api/mechanic/profile"
    echo "  GET    /api/mechanic/requests"
    echo "  PUT    /api/mechanic/request/:id/accept"
    echo ""
    echo "👑 Admin APIs:"
    echo "  GET    /api/admin/dashboard"
    echo "  GET    /api/admin/users"
    echo "  GET    /api/admin/analytics"
    echo ""
    echo "💳 Payment APIs:"
    echo "  POST   /api/payment/create-order"
    echo "  POST   /api/payment/verify"
    echo "  GET    /api/payment/history"
    echo ""
    echo "📚 Documentation: http://localhost:5000/api-docs"
}

# Show demo credentials
show_credentials() {
    print_status "Demo User Credentials:"
    echo ""
    echo "👑 Admin:"
    echo "  Email: admin@roadguard.com"
    echo "  Password: Admin123!"
    echo ""
    echo "👤 Customers:"
    echo "  Email: john@example.com | Password: Customer123!"
    echo "  Email: sarah@example.com | Password: Customer123!"
    echo "  Email: mike@example.com | Password: Customer123!"
    echo ""
    echo "🔧 Mechanics:"
    echo "  Email: rajesh@roadguard.com | Password: Mechanic123!"
    echo "  Email: amit@roadguard.com | Password: Mechanic123!"
    echo "  Email: pradeep@roadguard.com | Password: Mechanic123!"
    echo "  Email: vikram@roadguard.com | Password: Mechanic123!"
}

# Show help
show_help() {
    echo "RoadGuard Backend Development Helper"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install      Install dependencies"
    echo "  dev          Start development server"
    echo "  start        Start production server"
    echo "  seed         Seed database with demo data"
    echo "  clear        Clear all database data"
    echo "  reset        Reset database (clear + seed)"
    echo "  health       Check application health"
    echo "  endpoints    Show API endpoints"
    echo "  credentials  Show demo user credentials"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh install     # Install dependencies"
    echo "  ./dev.sh seed        # Seed demo data"
    echo "  ./dev.sh dev         # Start development server"
}

# Main script logic
case ${1:-help} in
    install)
        check_env_file
        install_deps
        ;;
    dev)
        check_env_file
        start_dev
        ;;
    start)
        check_env_file
        start_prod
        ;;
    seed)
        check_env_file
        seed_db
        ;;
    clear)
        check_env_file
        clear_db
        ;;
    reset)
        check_env_file
        reset_db
        ;;
    health)
        check_env_file
        health_check
        ;;
    endpoints)
        show_endpoints
        ;;
    credentials)
        show_credentials
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
