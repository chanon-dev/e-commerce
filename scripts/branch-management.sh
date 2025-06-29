#!/bin/bash

# E-Commerce Branch Management Script
# This script helps manage branches according to our branching strategy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to create feature branch
create_feature_branch() {
    local feature_name=$1
    if [ -z "$feature_name" ]; then
        print_error "Feature name is required"
        echo "Usage: $0 feature <feature-name>"
        exit 1
    fi
    
    print_header "Creating Feature Branch"
    git checkout develop
    git pull origin develop
    git checkout -b "feature/$feature_name"
    git push -u origin "feature/$feature_name"
    print_status "Feature branch 'feature/$feature_name' created and pushed"
}

# Function to create bugfix branch
create_bugfix_branch() {
    local bug_name=$1
    if [ -z "$bug_name" ]; then
        print_error "Bug name is required"
        echo "Usage: $0 bugfix <bug-description>"
        exit 1
    fi
    
    print_header "Creating Bugfix Branch"
    git checkout develop
    git pull origin develop
    git checkout -b "bugfix/$bug_name"
    git push -u origin "bugfix/$bug_name"
    print_status "Bugfix branch 'bugfix/$bug_name' created and pushed"
}

# Function to create hotfix branch
create_hotfix_branch() {
    local hotfix_name=$1
    if [ -z "$hotfix_name" ]; then
        print_error "Hotfix name is required"
        echo "Usage: $0 hotfix <hotfix-description>"
        exit 1
    fi
    
    print_header "Creating Hotfix Branch"
    git checkout main
    git pull origin main
    git checkout -b "hotfix/$hotfix_name"
    git push -u origin "hotfix/$hotfix_name"
    print_status "Hotfix branch 'hotfix/$hotfix_name' created and pushed"
    print_warning "Remember to merge hotfix to both main and develop branches"
}

# Function to create release branch
create_release_branch() {
    local version=$1
    if [ -z "$version" ]; then
        print_error "Version is required"
        echo "Usage: $0 release <version> (e.g., v1.2.0)"
        exit 1
    fi
    
    print_header "Creating Release Branch"
    git checkout develop
    git pull origin develop
    git checkout -b "release/$version"
    git push -u origin "release/$version"
    print_status "Release branch 'release/$version' created and pushed"
}

# Function to finish feature branch
finish_feature_branch() {
    local current_branch=$(git branch --show-current)
    
    if [[ ! $current_branch == feature/* ]]; then
        print_error "You must be on a feature branch to finish it"
        exit 1
    fi
    
    print_header "Finishing Feature Branch"
    print_status "Current branch: $current_branch"
    
    # Push current changes
    git push origin "$current_branch"
    
    # Switch to develop and update
    git checkout develop
    git pull origin develop
    
    print_status "Feature branch '$current_branch' is ready for PR to develop"
    print_warning "Create a Pull Request on GitHub to merge '$current_branch' into 'develop'"
}

# Function to sync with develop
sync_with_develop() {
    local current_branch=$(git branch --show-current)
    
    print_header "Syncing with Develop Branch"
    print_status "Current branch: $current_branch"
    
    git fetch origin
    git checkout develop
    git pull origin develop
    git checkout "$current_branch"
    git merge develop
    
    print_status "Branch '$current_branch' synced with develop"
}

# Function to list all branches
list_branches() {
    print_header "Branch Overview"
    
    echo -e "${BLUE}Local Branches:${NC}"
    git branch
    
    echo -e "\n${BLUE}Remote Branches:${NC}"
    git branch -r
    
    echo -e "\n${BLUE}Current Branch:${NC}"
    git branch --show-current
}

# Function to clean up merged branches
cleanup_branches() {
    print_header "Cleaning Up Merged Branches"
    
    # Switch to develop
    git checkout develop
    git pull origin develop
    
    # Delete merged feature branches
    git branch --merged | grep -E "feature/|bugfix/" | xargs -n 1 git branch -d
    
    # Prune remote tracking branches
    git remote prune origin
    
    print_status "Cleanup completed"
}

# Function to show help
show_help() {
    echo "E-Commerce Branch Management Script"
    echo ""
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "Commands:"
    echo "  feature <name>     Create a new feature branch"
    echo "  bugfix <name>      Create a new bugfix branch"
    echo "  hotfix <name>      Create a new hotfix branch"
    echo "  release <version>  Create a new release branch"
    echo "  finish             Finish current feature/bugfix branch"
    echo "  sync               Sync current branch with develop"
    echo "  list               List all branches"
    echo "  cleanup            Clean up merged branches"
    echo "  help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 feature user-authentication"
    echo "  $0 bugfix cart-calculation-error"
    echo "  $0 hotfix critical-security-patch"
    echo "  $0 release v1.2.0"
    echo "  $0 finish"
    echo "  $0 sync"
}

# Main script logic
case "$1" in
    "feature")
        create_feature_branch "$2"
        ;;
    "bugfix")
        create_bugfix_branch "$2"
        ;;
    "hotfix")
        create_hotfix_branch "$2"
        ;;
    "release")
        create_release_branch "$2"
        ;;
    "finish")
        finish_feature_branch
        ;;
    "sync")
        sync_with_develop
        ;;
    "list")
        list_branches
        ;;
    "cleanup")
        cleanup_branches
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
