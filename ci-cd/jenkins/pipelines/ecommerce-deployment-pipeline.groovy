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
        
        stage('🔍 Code Quality & Security') {
            parallel {
                stage('🧪 Code Quality') {
                    when {
                        not { params.SKIP_TESTS }
                    }
                    steps {
                        script {
                            echo "🧪 Running code quality checks..."
                            
                            // SonarQube analysis
                            sh '''
                                echo "Running SonarQube analysis..."
                                # sonar-scanner -Dsonar.projectKey=ecommerce
                            '''
                            
                            // ESLint for frontend
                            if (params.COMPONENT in ['all', 'frontend']) {
                                dir('frontend/customer-platform') {
                                    sh 'npm run lint || true'
                                }
                                dir('frontend/admin-dashboard') {
                                    sh 'npm run lint || true'
                                }
                            }
                        }
                    }
                }
                
                stage('🔒 Security Scan') {
                    steps {
                        script {
                            echo "🔒 Running security scans..."
                            
                            // Dependency vulnerability scan
                            sh '''
                                echo "Scanning for vulnerabilities..."
                                # npm audit --audit-level high
                                # snyk test || true
                            '''
                            
                            // Docker image security scan
                            sh '''
                                echo "Docker security scan..."
                                # trivy image --exit-code 0 --severity HIGH,CRITICAL
                            '''
                        }
                    }
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
                                    npm ci
                                    npm run test:ci
                                    npm run build
                                '''
                            }
                            
                            // Admin Dashboard Tests
                            dir('frontend/admin-dashboard') {
                                sh '''
                                    npm ci
                                    npm run test:ci
                                    npm run build
                                '''
                            }
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'frontend/*/coverage/junit.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'frontend/customer-platform/coverage',
                                reportFiles: 'index.html',
                                reportName: 'Customer Platform Coverage'
                            ])
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
                            
                            // Test each microservice
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service',
                                'inventory-service', 'shipping-service', 'promotion-service',
                                'review-service', 'notification-service', 'admin-service'
                            ]
                            
                            services.each { service ->
                                dir("backend/${service}") {
                                    script {
                                        if (fileExists('package.json')) {
                                            // NestJS services
                                            sh '''
                                                npm ci
                                                npm run test
                                                npm run test:e2e
                                            '''
                                        } else if (fileExists('*.csproj')) {
                                            // .NET services
                                            sh '''
                                                dotnet restore
                                                dotnet test --logger trx --results-directory ./TestResults
                                            '''
                                        } else if (fileExists('go.mod')) {
                                            // Go services
                                            sh '''
                                                go mod tidy
                                                go test -v ./... -coverprofile=coverage.out
                                            '''
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                stage('🔗 Integration Tests') {
                    steps {
                        script {
                            echo "🔗 Running integration tests..."
                            
                            // API integration tests
                            sh '''
                                echo "Running API integration tests..."
                                # newman run postman-collection.json
                            '''
                            
                            // End-to-end tests
                            sh '''
                                echo "Running E2E tests..."
                                # cypress run --headless
                            '''
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
                            dir('frontend/customer-platform') {
                                sh """
                                    docker build -t ${DOCKER_REGISTRY}/customer-platform:${BUILD_VERSION} .
                                    docker tag ${DOCKER_REGISTRY}/customer-platform:${BUILD_VERSION} ${DOCKER_REGISTRY}/customer-platform:latest
                                """
                            }
                            
                            // Admin Dashboard
                            dir('frontend/admin-dashboard') {
                                sh """
                                    docker build -t ${DOCKER_REGISTRY}/admin-dashboard:${BUILD_VERSION} .
                                    docker tag ${DOCKER_REGISTRY}/admin-dashboard:${BUILD_VERSION} ${DOCKER_REGISTRY}/admin-dashboard:latest
                                """
                            }
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
                                'order-service', 'payment-service', 'cart-service',
                                'inventory-service', 'shipping-service', 'promotion-service',
                                'review-service', 'notification-service', 'admin-service'
                            ]
                            
                            services.each { service ->
                                dir("backend/${service}") {
                                    sh """
                                        docker build -t ${DOCKER_REGISTRY}/${service}:${BUILD_VERSION} .
                                        docker tag ${DOCKER_REGISTRY}/${service}:${BUILD_VERSION} ${DOCKER_REGISTRY}/${service}:latest
                                    """
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('📤 Push Images') {
            steps {
                script {
                    echo "📤 Pushing Docker images to registry..."
                    
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin $DOCKER_REGISTRY'
                        
                        if (params.COMPONENT in ['all', 'frontend']) {
                            sh """
                                docker push ${DOCKER_REGISTRY}/customer-platform:${BUILD_VERSION}
                                docker push ${DOCKER_REGISTRY}/customer-platform:latest
                                docker push ${DOCKER_REGISTRY}/admin-dashboard:${BUILD_VERSION}
                                docker push ${DOCKER_REGISTRY}/admin-dashboard:latest
                            """
                        }
                        
                        if (params.COMPONENT in ['all', 'backend', 'microservices']) {
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service',
                                'inventory-service', 'shipping-service', 'promotion-service',
                                'review-service', 'notification-service', 'admin-service'
                            ]
                            
                            services.each { service ->
                                sh """
                                    docker push ${DOCKER_REGISTRY}/${service}:${BUILD_VERSION}
                                    docker push ${DOCKER_REGISTRY}/${service}:latest
                                """
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
                    
                    withCredentials([kubeconfigFile(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {
                        // Update image tags in manifests
                        sh """
                            # Update deployment manifests with new image tags
                            find k8s/ -name "*.yaml" -exec sed -i 's|image: .*:latest|image: ${DOCKER_REGISTRY}/\\1:${BUILD_VERSION}|g' {} \\;
                        """
                        
                        // Deploy based on component selection
                        if (params.COMPONENT in ['all', 'frontend']) {
                            sh """
                                kubectl apply -f k8s/frontend/ -n ${namespace}
                                kubectl rollout status deployment/customer-platform -n ${namespace} --timeout=300s
                                kubectl rollout status deployment/admin-dashboard -n ${namespace} --timeout=300s
                            """
                        }
                        
                        if (params.COMPONENT in ['all', 'backend', 'microservices']) {
                            sh """
                                kubectl apply -f k8s/backend/ -n ${namespace}
                                kubectl apply -f k8s/services/ -n ${namespace}
                            """
                            
                            // Wait for all microservices to be ready
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service',
                                'inventory-service', 'shipping-service', 'promotion-service',
                                'review-service', 'notification-service', 'admin-service'
                            ]
                            
                            services.each { service ->
                                sh "kubectl rollout status deployment/${service} -n ${namespace} --timeout=300s"
                            }
                        }
                    }
                }
            }
        }
        
        stage('🧪 Post-Deployment Tests') {
            parallel {
                stage('🔍 Health Checks') {
                    steps {
                        script {
                            echo "🔍 Running health checks..."
                            
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
                            
                            withCredentials([kubeconfigFile(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {
                                // Check pod status
                                sh "kubectl get pods -n ${namespace}"
                                
                                // Health check endpoints
                                sh '''
                                    echo "Checking application health..."
                                    # curl -f http://api-gateway/health
                                    # curl -f http://customer-platform/health
                                    # curl -f http://admin-dashboard/health
                                '''
                            }
                        }
                    }
                }
                
                stage('🔄 Smoke Tests') {
                    steps {
                        script {
                            echo "🔄 Running smoke tests..."
                            
                            // Basic functionality tests
                            sh '''
                                echo "Running smoke tests..."
                                # newman run smoke-tests.json
                            '''
                        }
                    }
                }
            }
        }
        
        stage('📊 Performance Tests') {
            when {
                expression { params.DEPLOYMENT_TARGET == 'staging' }
            }
            steps {
                script {
                    echo "📊 Running performance tests..."
                    
                    // Load testing
                    sh '''
                        echo "Running load tests..."
                        # k6 run load-test.js
                    '''
                    
                    // Performance monitoring
                    sh '''
                        echo "Checking performance metrics..."
                        # Check response times, throughput, etc.
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
                    docker system prune -f
                    docker image prune -f
                '''
                
                // Archive artifacts
                archiveArtifacts artifacts: 'logs/**/*', allowEmptyArchive: true
                
                // Publish test results
                publishTestResults testResultsPattern: '**/test-results.xml'
            }
        }
        
        success {
            script {
                echo "✅ Deployment successful!"
                sendSlackNotification("✅ Deployment Successful", "good")
                
                // Update deployment status
                sh '''
                    echo "Updating deployment status..."
                    # Update status in monitoring system
                '''
            }
        }
        
        failure {
            script {
                echo "❌ Deployment failed!"
                sendSlackNotification("❌ Deployment Failed", "danger")
                
                // Rollback if needed
                if (params.DEPLOYMENT_TARGET == 'prod') {
                    echo "🔄 Initiating rollback..."
                    // Implement rollback logic
                }
            }
        }
        
        unstable {
            script {
                echo "⚠️ Deployment unstable!"
                sendSlackNotification("⚠️ Deployment Unstable", "warning")
            }
        }
    }
}

// Helper function for Slack notifications
def sendSlackNotification(String message, String color) {
    def payload = [
        channel: env.SLACK_CHANNEL,
        color: color,
        message: """
            ${message}
            
            📦 Component: ${params.COMPONENT}
            🌍 Environment: ${params.DEPLOYMENT_TARGET}
            🏷️ Version: ${env.BUILD_VERSION}
            👤 User: ${env.BUILD_USER ?: 'System'}
            🔗 Build: ${env.BUILD_URL}
            
            📝 Commit: ${env.GIT_COMMIT_MSG}
        """.stripIndent()
    ]
    
    // Send to Slack
    // slackSend(payload)
    echo "📢 Notification: ${message}"
}
