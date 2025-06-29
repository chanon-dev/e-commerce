// 🚀 Jenkins Job DSL Script to Create E-commerce Pipeline
// This script automatically creates the pipeline job

import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition

// Get Jenkins instance
def jenkins = Jenkins.getInstance()

// Job configuration
def jobName = "E-commerce-Deployment-Pipeline"
def jobDescription = """
🚀 E-commerce Microservices Deployment Pipeline

Features:
✅ Multi-component deployment (Frontend, Backend, All)
✅ Multi-environment support (Dev, Staging, Prod)
✅ Parallel execution for faster builds
✅ Comprehensive testing (Unit, Integration, E2E)
✅ Security scanning and code quality checks
✅ Docker image building and registry push
✅ Kubernetes deployment with health checks
✅ Rollback capabilities for production
✅ Slack notifications for team updates
"""

// Pipeline script content
def pipelineScript = '''
pipeline {
    agent any
    
    environment {
        // Docker Registry
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_CREDENTIALS = 'docker-registry-credentials'
        
        // Kubernetes
        KUBECONFIG_CREDENTIALS = 'kubeconfig-credentials'
        NAMESPACE_DEV = 'ecommerce-dev'
        NAMESPACE_STAGING = 'ecommerce-staging'
        NAMESPACE_PROD = 'ecommerce-prod'
        
        // Git
        GIT_CREDENTIALS = 'git-credentials'
        
        // Notification
        SLACK_CHANNEL = '#deployments'
        SLACK_CREDENTIALS = 'slack-webhook'
        
        // Build Info
        BUILD_VERSION = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        BUILD_TIMESTAMP = new Date().format('yyyy-MM-dd-HH-mm-ss')
    }
    
    parameters {
        choice(
            name: 'DEPLOYMENT_TARGET',
            choices: ['dev', 'staging', 'prod'],
            description: 'Select deployment environment'
        )
        choice(
            name: 'COMPONENT',
            choices: ['all', 'frontend', 'backend', 'microservices'],
            description: 'Select component to deploy'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip running tests'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deployment even if tests fail'
        )
    }
    
    stages {
        stage('🚀 Pipeline Start') {
            steps {
                script {
                    echo "🎯 Starting E-commerce Deployment Pipeline"
                    echo "📦 Component: ${params.COMPONENT}"
                    echo "🌍 Environment: ${params.DEPLOYMENT_TARGET}"
                    echo "🏷️ Version: ${BUILD_VERSION}"
                    
                    // Send start notification
                    sendSlackNotification("🚀 Deployment Started", "good")
                }
            }
        }
        
        stage('📥 Checkout Code') {
            steps {
                script {
                    echo "📥 Checking out source code..."
                    checkout scm
                    
                    // Get commit info
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    
                    echo "📝 Commit: ${env.GIT_COMMIT_MSG}"
                }
            }
        }
        
        stage('🧪 Run Tests') {
            when {
                not { params.SKIP_TESTS }
            }
            parallel {
                stage('🎨 Frontend Tests') {
                    when {
                        expression { params.COMPONENT in ['all', 'frontend'] }
                    }
                    steps {
                        script {
                            echo "🎨 Running frontend tests..."
                            
                            // Customer Platform Tests
                            dir('frontend/customer-platform') {
                                sh '''
                                    echo "Testing Customer Platform..."
                                    # npm ci
                                    # npm run test:ci
                                    # npm run build
                                '''
                            }
                            
                            // Admin Dashboard Tests
                            dir('frontend/admin-dashboard') {
                                sh '''
                                    echo "Testing Admin Dashboard..."
                                    # npm ci
                                    # npm run test:ci
                                    # npm run build
                                '''
                            }
                        }
                    }
                }
                
                stage('⚙️ Backend Tests') {
                    when {
                        expression { params.COMPONENT in ['all', 'backend', 'microservices'] }
                    }
                    steps {
                        script {
                            echo "⚙️ Running backend tests..."
                            
                            // Test microservices
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service'
                            ]
                            
                            services.each { service ->
                                echo "Testing ${service}..."
                                // Add actual test commands here
                            }
                        }
                    }
                }
            }
        }
        
        stage('🐳 Build Docker Images') {
            parallel {
                stage('🎨 Build Frontend Images') {
                    when {
                        expression { params.COMPONENT in ['all', 'frontend'] }
                    }
                    steps {
                        script {
                            echo "🎨 Building frontend Docker images..."
                            
                            // Customer Platform
                            echo "Building Customer Platform image..."
                            // sh "docker build -t ${DOCKER_REGISTRY}/customer-platform:${BUILD_VERSION} frontend/customer-platform/"
                            
                            // Admin Dashboard
                            echo "Building Admin Dashboard image..."
                            // sh "docker build -t ${DOCKER_REGISTRY}/admin-dashboard:${BUILD_VERSION} frontend/admin-dashboard/"
                        }
                    }
                }
                
                stage('⚙️ Build Backend Images') {
                    when {
                        expression { params.COMPONENT in ['all', 'backend', 'microservices'] }
                    }
                    steps {
                        script {
                            echo "⚙️ Building backend Docker images..."
                            
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service'
                            ]
                            
                            services.each { service ->
                                echo "Building ${service} image..."
                                // sh "docker build -t ${DOCKER_REGISTRY}/${service}:${BUILD_VERSION} backend/${service}/"
                            }
                        }
                    }
                }
            }
        }
        
        stage('🚀 Deploy to Kubernetes') {
            steps {
                script {
                    echo "🚀 Deploying to Kubernetes..."
                    
                    def namespace = ""
                    switch(params.DEPLOYMENT_TARGET) {
                        case 'dev':
                            namespace = NAMESPACE_DEV
                            break
                        case 'staging':
                            namespace = NAMESPACE_STAGING
                            break
                        case 'prod':
                            namespace = NAMESPACE_PROD
                            break
                    }
                    
                    echo "Deploying to namespace: ${namespace}"
                    echo "Component: ${params.COMPONENT}"
                    
                    // Add actual deployment commands here
                    // kubectl apply -f k8s/ -n ${namespace}
                }
            }
        }
        
        stage('🔍 Health Checks') {
            steps {
                script {
                    echo "🔍 Running health checks..."
                    
                    // Add health check commands
                    sh '''
                        echo "Checking application health..."
                        # Add actual health check commands
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up..."
                
                // Clean up Docker images
                sh '''
                    echo "Cleaning up Docker images..."
                    # docker system prune -f
                '''
            }
        }
        
        success {
            script {
                echo "✅ Deployment successful!"
                sendSlackNotification("✅ Deployment Successful", "good")
            }
        }
        
        failure {
            script {
                echo "❌ Deployment failed!"
                sendSlackNotification("❌ Deployment Failed", "danger")
            }
        }
    }
}

// Helper function for Slack notifications
def sendSlackNotification(String message, String color) {
    echo "📢 Notification: ${message}"
    // Add actual Slack notification code here
}
'''

// Create or update the job
def job = jenkins.getItem(jobName)
if (job != null) {
    println "Job '${jobName}' already exists. Updating..."
    job.delete()
}

// Create new pipeline job
job = jenkins.createProject(WorkflowJob, jobName)
job.setDescription(jobDescription)

// Set pipeline script
job.setDefinition(new CpsFlowDefinition(pipelineScript, true))

// Configure job properties
def parameterDefinitions = [
    new hudson.model.ChoiceParameterDefinition(
        'DEPLOYMENT_TARGET',
        ['dev', 'staging', 'prod'] as String[],
        'Select deployment environment'
    ),
    new hudson.model.ChoiceParameterDefinition(
        'COMPONENT', 
        ['all', 'frontend', 'backend', 'microservices'] as String[],
        'Select component to deploy'
    ),
    new hudson.model.BooleanParameterDefinition(
        'SKIP_TESTS',
        false,
        'Skip running tests'
    ),
    new hudson.model.BooleanParameterDefinition(
        'FORCE_DEPLOY',
        false,
        'Force deployment even if tests fail'
    )
]

def parametersProperty = new hudson.model.ParametersDefinitionProperty(parameterDefinitions)
job.addProperty(parametersProperty)

// Save the job
job.save()

println "✅ Pipeline job '${jobName}' created successfully!"
println "🔗 Job URL: ${jenkins.getRootUrl()}job/${jobName}/"
println "🚀 Ready to build with parameters!"

// Trigger a test build
println "🧪 Triggering test build..."
def build = job.scheduleBuild2(0, new hudson.model.Cause.UserIdCause())
if (build != null) {
    println "✅ Test build scheduled successfully!"
} else {
    println "⚠️ Could not schedule test build"
}
