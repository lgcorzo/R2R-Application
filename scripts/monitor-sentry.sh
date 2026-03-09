#!/bin/bash

# Sentry Monitoring Script
# Monitors errors and events in Sentry for r2r-dashboard project

ORG="evgeny-pl"
PROJECT="r2r-dashboard"
REGION="https://us.sentry.io"

echo "🔍 Monitoring Sentry for $ORG/$PROJECT"
echo "========================================"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Function to check Sentry issues
check_sentry_issues() {
    echo "📊 Checking Sentry issues..."
    echo ""
    
    gh api "https://sentry.io/api/0/projects/$ORG/$PROJECT/issues/" \
        --jq '.[:5] | .[] | "\(.id) - \(.title) [\(.level)] - Count: \(.count)"' \
        2>/dev/null || echo "⚠️  Could not fetch issues. Make sure you have Sentry API access."
    
    echo ""
    echo "🌐 View in Sentry: https://$ORG.sentry.io/projects/$PROJECT/"
}

# Function to monitor continuously
monitor_continuous() {
    echo "🔄 Starting continuous monitoring (press Ctrl+C to stop)..."
    echo ""
    
    while true; do
        clear
        echo "🕐 $(date '+%Y-%m-%d %H:%M:%S')"
        echo "========================================"
        check_sentry_issues
        echo "Next check in 30 seconds..."
        sleep 30
    done
}

# Main
if [ "$1" == "--continuous" ] || [ "$1" == "-c" ]; then
    monitor_continuous
else
    check_sentry_issues
    echo ""
    echo "💡 Tip: Run with --continuous or -c flag for continuous monitoring"
fi

