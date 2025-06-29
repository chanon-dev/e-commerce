#!/bin/bash

# Migration Generation Script for E-commerce Platform
# This script generates TypeORM migrations for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[MIGRATION]${NC} $1"
}

# Configuration
SERVICES=("auth-service" "user-service" "order-service")
MIGRATION_NAME=${1:-"InitialMigration"}
ENVIRONMENT=${2:-"development"}

# Function to generate migration for a service
generate_migration() {
    local service=$1
    local migration_name=$2
    
    print_header "Generating migration for $service"
    
    cd "backend/$service"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_warning "No package.json found in $service, skipping..."
        cd ../..
        return
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $service..."
        npm install
    fi
    
    # Generate migration
    if [ -f "src/database/data-source.ts" ]; then
        print_status "Generating TypeORM migration: $migration_name"
        
        # Set environment variables
        export NODE_ENV=$ENVIRONMENT
        
        # Generate migration
        npx typeorm-ts-node-commonjs migration:generate \
            -d src/database/data-source.ts \
            src/database/migrations/$migration_name
        
        if [ $? -eq 0 ]; then
            print_status "✅ Migration generated successfully for $service"
        else
            print_error "❌ Failed to generate migration for $service"
        fi
    else
        print_warning "No TypeORM data source found for $service"
    fi
    
    cd ../..
}

# Function to generate .NET migration
generate_dotnet_migration() {
    local service=$1
    local migration_name=$2
    
    print_header "Generating .NET migration for $service"
    
    cd "backend/$service"
    
    # Check if it's a .NET project
    if [ ! -f "*.csproj" ] && [ ! -f "src/*.csproj" ]; then
        print_warning "No .NET project found in $service, skipping..."
        cd ../..
        return
    fi
    
    # Find the project file
    PROJECT_FILE=$(find . -name "*.csproj" | head -1)
    
    if [ -z "$PROJECT_FILE" ]; then
        print_warning "No .csproj file found in $service"
        cd ../..
        return
    fi
    
    print_status "Generating EF Core migration: $migration_name"
    
    # Generate migration
    dotnet ef migrations add $migration_name \
        --project $PROJECT_FILE \
        --startup-project $PROJECT_FILE \
        --context UserDbContext \
        --output-dir Infrastructure/Data/Migrations
    
    if [ $? -eq 0 ]; then
        print_status "✅ .NET migration generated successfully for $service"
    else
        print_error "❌ Failed to generate .NET migration for $service"
    fi
    
    cd ../..
}

# Function to generate Go migration
generate_go_migration() {
    local service=$1
    local migration_name=$2
    
    print_header "Generating Go migration for $service"
    
    cd "backend/$service"
    
    # Check if it's a Go project
    if [ ! -f "go.mod" ]; then
        print_warning "No Go project found in $service, skipping..."
        cd ../..
        return
    fi
    
    # Create migrations directory if it doesn't exist
    mkdir -p database/migrations
    
    # Generate timestamp
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    
    # Create migration files
    UP_FILE="database/migrations/${TIMESTAMP}_${migration_name}.up.sql"
    DOWN_FILE="database/migrations/${TIMESTAMP}_${migration_name}.down.sql"
    
    # Create up migration file
    cat > $UP_FILE << EOF
-- Migration: $migration_name
-- Created: $(date)

-- Add your up migration SQL here

EOF

    # Create down migration file
    cat > $DOWN_FILE << EOF
-- Migration: $migration_name (Rollback)
-- Created: $(date)

-- Add your down migration SQL here

EOF

    print_status "✅ Go migration files created:"
    print_status "  - $UP_FILE"
    print_status "  - $DOWN_FILE"
    
    cd ../..
}

# Main execution
main() {
    print_header "E-commerce Platform Migration Generator"
    print_status "Migration name: $MIGRATION_NAME"
    print_status "Environment: $ENVIRONMENT"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Generate migrations for each service
    for service in "${SERVICES[@]}"; do
        if [ -d "backend/$service" ]; then
            print_header "Processing $service"
            
            # Determine service type and generate appropriate migration
            if [ -f "backend/$service/package.json" ]; then
                generate_migration $service $MIGRATION_NAME
            elif [ -f "backend/$service"/*.csproj ] || [ -f "backend/$service/src"/*.csproj ]; then
                generate_dotnet_migration $service $MIGRATION_NAME
            elif [ -f "backend/$service/go.mod" ]; then
                generate_go_migration $service $MIGRATION_NAME
            else
                print_warning "Unknown service type for $service"
            fi
        else
            print_warning "Service directory not found: $service"
        fi
    done
    
    print_status "✅ Migration generation completed!"
}

# Function to run migrations
run_migrations() {
    print_header "Running Migrations"
    
    for service in "${SERVICES[@]}"; do
        if [ -d "backend/$service" ]; then
            print_status "Running migrations for $service"
            
            cd "backend/$service"
            
            if [ -f "package.json" ] && [ -f "src/database/data-source.ts" ]; then
                # TypeORM migration
                export NODE_ENV=$ENVIRONMENT
                npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
            elif [ -f "*.csproj" ] || [ -f "src/*.csproj" ]; then
                # .NET EF Core migration
                PROJECT_FILE=$(find . -name "*.csproj" | head -1)
                dotnet ef database update --project $PROJECT_FILE
            elif [ -f "go.mod" ]; then
                # Go migration (using golang-migrate)
                if command -v migrate &> /dev/null; then
                    migrate -path database/migrations -database "postgres://localhost/ecommerce_$service?sslmode=disable" up
                else
                    print_warning "golang-migrate not installed, skipping Go migrations"
                fi
            fi
            
            cd ../..
        fi
    done
}

# Function to revert migrations
revert_migrations() {
    print_header "Reverting Last Migration"
    
    for service in "${SERVICES[@]}"; do
        if [ -d "backend/$service" ]; then
            print_status "Reverting migration for $service"
            
            cd "backend/$service"
            
            if [ -f "package.json" ] && [ -f "src/database/data-source.ts" ]; then
                # TypeORM migration revert
                export NODE_ENV=$ENVIRONMENT
                npx typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts
            elif [ -f "*.csproj" ] || [ -f "src/*.csproj" ]; then
                # .NET EF Core migration revert
                PROJECT_FILE=$(find . -name "*.csproj" | head -1)
                dotnet ef migrations remove --project $PROJECT_FILE
            elif [ -f "go.mod" ]; then
                # Go migration revert
                if command -v migrate &> /dev/null; then
                    migrate -path database/migrations -database "postgres://localhost/ecommerce_$service?sslmode=disable" down 1
                fi
            fi
            
            cd ../..
        fi
    done
}

# Function to show migration status
show_migration_status() {
    print_header "Migration Status"
    
    for service in "${SERVICES[@]}"; do
        if [ -d "backend/$service" ]; then
            print_status "Migration status for $service:"
            
            cd "backend/$service"
            
            if [ -f "package.json" ] && [ -f "src/database/data-source.ts" ]; then
                # TypeORM migration status
                export NODE_ENV=$ENVIRONMENT
                npx typeorm-ts-node-commonjs migration:show -d src/database/data-source.ts
            elif [ -f "*.csproj" ] || [ -f "src/*.csproj" ]; then
                # .NET EF Core migration status
                PROJECT_FILE=$(find . -name "*.csproj" | head -1)
                dotnet ef migrations list --project $PROJECT_FILE
            elif [ -f "go.mod" ]; then
                # Go migration status
                if command -v migrate &> /dev/null; then
                    migrate -path database/migrations -database "postgres://localhost/ecommerce_$service?sslmode=disable" version
                fi
            fi
            
            cd ../..
            echo ""
        fi
    done
}

# Script usage
usage() {
    echo "Usage: $0 [migration_name] [environment] [command]"
    echo ""
    echo "Commands:"
    echo "  generate  Generate new migrations (default)"
    echo "  run       Run pending migrations"
    echo "  revert    Revert last migration"
    echo "  status    Show migration status"
    echo ""
    echo "Examples:"
    echo "  $0 InitialMigration development"
    echo "  $0 AddUserTable production run"
    echo "  $0 '' development status"
}

# Handle command line arguments
COMMAND=${3:-"generate"}

case $COMMAND in
    "generate")
        main
        ;;
    "run")
        run_migrations
        ;;
    "revert")
        revert_migrations
        ;;
    "status")
        show_migration_status
        ;;
    "--help"|"-h")
        usage
        exit 0
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac
