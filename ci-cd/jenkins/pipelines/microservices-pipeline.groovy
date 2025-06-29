pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        KUBECONFIG = credentials('kubeconfig')
        DOCKER_CREDENTIALS = credentials('docker-registry')
        GITHUB_CREDENTIALS = credentials('github-token')
        VAULT_TOKEN = credentials('vault-token')
        ARGOCD_TOKEN = credentials('argocd-token')
    }
    
    parameters {
        choice(
            name: 'SERVICE',
            choices: [
                'all',
                'api-gateway',
                'auth-service',
                'user-service',
                'product-service',
                'order-service',
                'payment-service',
                'cart-service',
                'inventory-service',
                'shipping-service',
                'promotion-service',
                'review-service',
                'notification-service',
                'admin-service',
                'customer-platform',
                'admin-dashboard'
            ],
            description: 'Select service to deploy'
        )
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'prod'],
            description: 'Target environment'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip running tests'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deployment even if no changes'
        )
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.BUILD_TAG = "${env.ENVIRONMENT}-${env.GIT_COMMIT_SHORT}-${env.BUILD_NUMBER}"
                }
            }
        }
        
        stage('Detect Changes') {
            when {
                not { params.FORCE_DEPLOY }
            }
            steps {
                script {
                    def changedServices = []
                    
                    if (params.SERVICE == 'all') {
                        // Check all services for changes
                        def services = [
                            'api-gateway', 'auth-service', 'user-service', 'product-service',
                            'order-service', 'payment-service', 'cart-service', 'inventory-service',
                            'shipping-service', 'promotion-service', 'review-service', 'notification-service',
                            'admin-service', 'customer-platform', 'admin-dashboard'
                        ]
                        
                        services.each { service ->
                            def changes = sh(
                                script: "git diff --name-only HEAD~1 HEAD | grep -E '^(backend/${service}|frontend/${service})/' || true",
                                returnStdout: true
                            ).trim()
                            
                            if (changes) {
                                changedServices.add(service)
                            }
                        }
                    } else {
                        // Check specific service
                        def servicePath = params.SERVICE.contains('platform') || params.SERVICE.contains('dashboard') ? 
                            "frontend/${params.SERVICE}" : "backend/${params.SERVICE}"
                        
                        def changes = sh(
                            script: "git diff --name-only HEAD~1 HEAD | grep -E '^${servicePath}/' || true",
                            returnStdout: true
                        ).trim()
                        
                        if (changes) {
                            changedServices.add(params.SERVICE)
                        }
                    }
                    
                    env.CHANGED_SERVICES = changedServices.join(',')
                    
                    if (changedServices.isEmpty()) {
                        echo "No changes detected. Skipping deployment."
                        currentBuild.result = 'SUCCESS'
                        return
                    }
                    
                    echo "Changed services: ${env.CHANGED_SERVICES}"
                }
            }
        }
        
        stage('Build & Test') {
            parallel {
                stage('Backend Services') {
                    when {
                        expression { 
                            return env.CHANGED_SERVICES?.split(',')?.any { 
                                it.startsWith('backend/') || ['api-gateway', 'auth-service', 'user-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'inventory-service', 'shipping-service', 'promotion-service', 'review-service', 'notification-service', 'admin-service'].contains(it)
                            }
                        }
                    }
                    steps {
                        script {
                            def backendServices = env.CHANGED_SERVICES.split(',').findAll { 
                                ['api-gateway', 'auth-service', 'user-service', 'product-service', 'order-service', 'payment-service', 'cart-service', 'inventory-service', 'shipping-service', 'promotion-service', 'review-service', 'notification-service', 'admin-service'].contains(it)
                            }
                            
                            backendServices.each { service ->
                                buildBackendService(service)
                            }
                        }
                    }
                }
                
                stage('Frontend Applications') {
                    when {
                        expression { 
                            return env.CHANGED_SERVICES?.contains('customer-platform') || env.CHANGED_SERVICES?.contains('admin-dashboard')
                        }
                    }
                    steps {
                        script {
                            if (env.CHANGED_SERVICES.contains('customer-platform')) {
                                buildFrontendApp('customer-platform')
                            }
                            if (env.CHANGED_SERVICES.contains('admin-dashboard')) {
                                buildFrontendApp('admin-dashboard')
                            }
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Container Security') {
                    steps {
                        script {
                            env.CHANGED_SERVICES.split(',').each { service ->
                                sh """
                                    echo "Scanning ${service} for vulnerabilities..."
                                    # Add container security scanning here
                                    # trivy image ${DOCKER_REGISTRY}/${service}:${BUILD_TAG}
                                """
                            }
                        }
                    }
                }
                
                stage('Code Security') {
                    when {
                        not { params.SKIP_TESTS }
                    }
                    steps {
                        sh '''
                            echo "Running security code analysis..."
                            # Add SAST scanning here
                            # sonar-scanner or similar
                        '''
                    }
                }
            }
        }
        
        stage('Deploy to Environment') {
            steps {
                script {
                    env.CHANGED_SERVICES.split(',').each { service ->
                        deployService(service, params.ENVIRONMENT)
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                not { params.SKIP_TESTS }
                expression { params.ENVIRONMENT != 'prod' }
            }
            steps {
                script {
                    sh """
                        echo "Running integration tests for ${params.ENVIRONMENT}..."
                        # Add integration tests here
                        kubectl wait --for=condition=ready pod -l app=${params.SERVICE} -n ecommerce-${params.ENVIRONMENT} --timeout=300s
                        
                        # Health check
                        kubectl get pods -n ecommerce-${params.ENVIRONMENT}
                        
                        # API tests
                        # newman run tests/integration/api-tests.json --env-var baseUrl=http://api-gateway.ecommerce-${params.ENVIRONMENT}.svc.cluster.local:8080
                    """
                }
            }
        }
        
        stage('Update ArgoCD') {
            steps {
                script {
                    env.CHANGED_SERVICES.split(',').each { service ->
                        updateArgoCD(service, params.ENVIRONMENT)
                    }
                }
            }
        }
        
        stage('Notify') {
            steps {
                script {
                    def status = currentBuild.result ?: 'SUCCESS'
                    def color = status == 'SUCCESS' ? 'good' : 'danger'
                    def message = """
                        *E-Commerce Deployment ${status}*
                        
                        *Environment:* ${params.ENVIRONMENT}
                        *Services:* ${env.CHANGED_SERVICES}
                        *Build:* ${env.BUILD_TAG}
                        *Commit:* ${env.GIT_COMMIT_SHORT}
                        
                        *Duration:* ${currentBuild.durationString}
                        *Build URL:* ${env.BUILD_URL}
                    """
                    
                    // Slack notification
                    sh """
                        curl -X POST -H 'Content-type: application/json' \\
                        --data '{"text":"${message}","color":"${color}"}' \\
                        \${SLACK_WEBHOOK_URL} || true
                    """
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed!"
            script {
                // Rollback logic here if needed
                if (params.ENVIRONMENT == 'prod') {
                    echo "🔄 Initiating rollback for production..."
                    // Add rollback steps
                }
            }
        }
    }
}

def buildBackendService(service) {
    dir("backend/${service}") {
        script {
            def dockerfile = fileExists('Dockerfile') ? 'Dockerfile' : '../Dockerfile.template'
            
            // Determine build strategy based on technology
            if (fileExists('package.json')) {
                // Node.js/NestJS service
                sh """
                    echo "Building NestJS service: ${service}"
                    npm ci
                    npm run build
                    npm run test || true
                """
            } else if (fileExists('*.csproj') || fileExists('**/*.csproj')) {
                // .NET service
                sh """
                    echo "Building .NET service: ${service}"
                    dotnet restore
                    dotnet build --configuration Release
                    dotnet test --no-build --configuration Release || true
                """
            } else if (fileExists('go.mod')) {
                // Go service
                sh """
                    echo "Building Go service: ${service}"
                    go mod download
                    go build -o main .
                    go test ./... || true
                """
            }
            
            // Build Docker image
            sh """
                docker build -t ${DOCKER_REGISTRY}/${service}:${BUILD_TAG} -f ${dockerfile} .
                docker push ${DOCKER_REGISTRY}/${service}:${BUILD_TAG}
                docker tag ${DOCKER_REGISTRY}/${service}:${BUILD_TAG} ${DOCKER_REGISTRY}/${service}:latest
                docker push ${DOCKER_REGISTRY}/${service}:latest
            """
        }
    }
}

def buildFrontendApp(app) {
    dir("frontend/${app}") {
        sh """
            echo "Building frontend app: ${app}"
            npm ci
            npm run build
            npm run test || true
            
            # Build Docker image
            docker build -t ${DOCKER_REGISTRY}/${app}:${BUILD_TAG} .
            docker push ${DOCKER_REGISTRY}/${app}:${BUILD_TAG}
            docker tag ${DOCKER_REGISTRY}/${app}:${BUILD_TAG} ${DOCKER_REGISTRY}/${app}:latest
            docker push ${DOCKER_REGISTRY}/${app}:latest
        """
    }
}

def deployService(service, environment) {
    sh """
        echo "Deploying ${service} to ${environment}..."
        
        # Update Kubernetes manifests
        sed -i 's|image: .*/${service}:.*|image: ${DOCKER_REGISTRY}/${service}:${BUILD_TAG}|g' k8s/overlays/${environment}/${service}/deployment.yaml
        
        # Apply Kubernetes manifests
        kubectl apply -k k8s/overlays/${environment}/${service}/
        
        # Wait for rollout
        kubectl rollout status deployment/${service} -n ecommerce-${environment} --timeout=300s
        
        # Verify deployment
        kubectl get pods -n ecommerce-${environment} -l app=${service}
    """
}

def updateArgoCD(service, environment) {
    sh """
        echo "Updating ArgoCD application: ${service}-${environment}"
        
        # Update ArgoCD application
        argocd app sync ${service}-${environment} --auth-token \${ARGOCD_TOKEN}
        argocd app wait ${service}-${environment} --auth-token \${ARGOCD_TOKEN}
        
        # Verify sync status
        argocd app get ${service}-${environment} --auth-token \${ARGOCD_TOKEN}
    """
}
