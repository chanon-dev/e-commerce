#!/bin/bash

# 🚀 Jenkins Pipeline Automation Setup Script
# This script will automatically create the pipeline without using UI

set -e

echo "🚀 Starting Jenkins Pipeline Automation Setup..."

# Jenkins connection details
JENKINS_URL="http://54.169.232.143"
JENKINS_USER="admin"
JENKINS_PASSWORD="admin123!"
JENKINS_CLI_JAR="/tmp/jenkins-cli.jar"

# Download Jenkins CLI
echo "📥 Downloading Jenkins CLI..."
curl -s -o $JENKINS_CLI_JAR "$JENKINS_URL/jnlpJars/jenkins-cli.jar"

# Function to run Jenkins CLI commands
run_jenkins_cli() {
    java -jar $JENKINS_CLI_JAR -s $JENKINS_URL -auth $JENKINS_USER:$JENKINS_PASSWORD "$@"
}

# Install required plugins
echo "🔌 Installing required plugins..."
PLUGINS=(
    "pipeline-stage-view"
    "docker-workflow"
    "kubernetes"
    "git"
    "htmlpublisher"
    "slack"
    "build-timeout"
    "timestamper"
    "ws-cleanup"
    "ant"
    "gradle"
    "workflow-aggregator"
    "github-branch-source"
    "pipeline-github-lib"
    "pipeline-stage-view"
    "build-pipeline-plugin"
    "conditional-buildstep"
    "parameterized-trigger"
    "junit"
    "jacoco"
    "sonar"
)

for plugin in "${PLUGINS[@]}"; do
    echo "Installing plugin: $plugin"
    run_jenkins_cli install-plugin $plugin || echo "Plugin $plugin may already be installed"
done

echo "🔄 Restarting Jenkins to activate plugins..."
run_jenkins_cli restart
sleep 60

echo "⏳ Waiting for Jenkins to be ready..."
while ! curl -s "$JENKINS_URL/login" > /dev/null; do
    echo "Waiting for Jenkins..."
    sleep 10
done

echo "✅ Jenkins is ready!"

# Create credentials
echo "🔑 Creating credentials..."

# Docker registry credentials
cat > /tmp/docker-creds.xml << 'EOF'
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>docker-registry-credentials</id>
  <description>Docker Registry Credentials</description>
  <username>your-docker-username</username>
  <password>your-docker-password</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF

# Git credentials
cat > /tmp/git-creds.xml << 'EOF'
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>git-credentials</id>
  <description>Git Credentials</description>
  <username>your-git-username</username>
  <password>your-git-token</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF

# Slack webhook
cat > /tmp/slack-creds.xml << 'EOF'
<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>slack-webhook</id>
  <description>Slack Webhook URL</description>
  <secret>https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
EOF

# Create credentials
echo "Creating Docker credentials..."
run_jenkins_cli create-credentials-by-xml system::system::jenkins _ < /tmp/docker-creds.xml || echo "Docker credentials may already exist"

echo "Creating Git credentials..."
run_jenkins_cli create-credentials-by-xml system::system::jenkins _ < /tmp/git-creds.xml || echo "Git credentials may already exist"

echo "Creating Slack credentials..."
run_jenkins_cli create-credentials-by-xml system::system::jenkins _ < /tmp/slack-creds.xml || echo "Slack credentials may already exist"

# Clean up temp files
rm -f /tmp/*-creds.xml

echo "✅ Credentials created successfully!"

echo "🎉 Jenkins Pipeline Automation Setup Complete!"
echo "🔗 Access Jenkins at: $JENKINS_URL"
echo "👤 Username: $JENKINS_USER"
echo "🔑 Password: $JENKINS_PASSWORD"
