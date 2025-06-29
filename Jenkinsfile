pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        KUBECONFIG = credentials('kubeconfig')
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
        SONAR_TOKEN = credentials('sonar-token')
        SNYK_TOKEN = credentials('snyk-token')
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        skipStagesAfterUnstable()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Environment Detection') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.DEPLOY_ENV = 'production'
                        env.NAMESPACE = 'ecommerce-prod'
                    } else if (env.BRANCH_NAME == 'staging') {
                        env.DEPLOY_ENV = 'staging'
                        env.NAMESPACE = 'ecommerce-staging'
                    } else if (env.BRANCH_NAME == 'develop') {
                        env.DEPLOY_ENV = 'development'
                        env.NAMESPACE = 'ecommerce-dev'
                    } else {
                        env.DEPLOY_ENV = 'feature'
                        env.NAMESPACE = "ecommerce-${env.BRANCH_NAME.toLowerCase().replaceAll('/', '-')}"
                    }
                    echo "Deploying to environment: ${env.DEPLOY_ENV}"
                    echo "Kubernetes namespace: ${env.NAMESPACE}"
                }
            }
        }
        
        stage('Code Quality & Security') {
            parallel {
                stage('Lint & Format Check') {
                    steps {
                        script {
                            // Node.js services
                            def nodeServices = ['api-gateway', 'auth-service', 'cart-service', 'shipping-service', 'review-service', 'admin-service']
                            nodeServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'npm ci'
                                    sh 'npm run lint'
                                    sh 'npm run format:check || true'
                                }
                            }
                            
                            // .NET services
                            def dotnetServices = ['user-service', 'order-service', 'promotion-service']
                            dotnetServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'dotnet format --verify-no-changes'
                                }
                            }
                            
                            // Go services
                            def goServices = ['product-service', 'payment-service', 'inventory-service', 'notification-service']
                            goServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'gofmt -l . | tee /tmp/gofmt-output && test ! -s /tmp/gofmt-output'
                                    sh 'go vet ./...'
                                }
                            }
                        }
                    }
                }
                
                stage('SAST - SonarQube') {
                    steps {
                        script {
                            def scannerHome = tool 'SonarQubeScanner'
                            withSonarQubeEnv('SonarQube') {
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \
                                    -Dsonar.projectKey=ecommerce-platform \
                                    -Dsonar.projectName='E-commerce Platform' \
                                    -Dsonar.projectVersion=${env.IMAGE_TAG} \
                                    -Dsonar.sources=. \
                                    -Dsonar.exclusions='**/node_modules/**,**/vendor/**,**/*.test.js,**/*.spec.ts' \
                                    -Dsonar.javascript.lcov.reportPaths='**/coverage/lcov.info' \
                                    -Dsonar.go.coverage.reportPaths='**/coverage.out'
                                """
                            }
                        }
                    }
                }
                
                stage('SCA - Snyk') {
                    steps {
                        script {
                            // Scan Node.js dependencies
                            def nodeServices = ['api-gateway', 'auth-service', 'cart-service', 'shipping-service', 'review-service', 'admin-service']
                            nodeServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'snyk test --severity-threshold=high --json > snyk-results.json || true'
                                    publishHTML([
                                        allowMissing: false,
                                        alwaysLinkToLastBuild: true,
                                        keepAll: true,
                                        reportDir: '.',
                                        reportFiles: 'snyk-results.json',
                                        reportName: "Snyk Report - ${service}"
                                    ])
                                }
                            }
                            
                            // Scan Go dependencies
                            def goServices = ['product-service', 'payment-service', 'inventory-service', 'notification-service']
                            goServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'snyk test --severity-threshold=high --json > snyk-results.json || true'
                                }
                            }
                        }
                    }
                }
                
                stage('Container Security - Trivy') {
                    steps {
                        script {
                            sh 'trivy fs --severity HIGH,CRITICAL --format json --output trivy-fs-results.json .'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: '.',
                                reportFiles: 'trivy-fs-results.json',
                                reportName: 'Trivy Filesystem Scan'
                            ])
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Node.js Tests') {
                    steps {
                        script {
                            def nodeServices = ['api-gateway', 'auth-service', 'cart-service', 'shipping-service', 'review-service', 'admin-service']
                            nodeServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'npm ci'
                                    sh 'npm run test:cov'
                                    publishHTML([
                                        allowMissing: false,
                                        alwaysLinkToLastBuild: true,
                                        keepAll: true,
                                        reportDir: 'coverage/lcov-report',
                                        reportFiles: 'index.html',
                                        reportName: "Coverage Report - ${service}"
                                    ])
                                }
                            }
                        }
                    }
                }
                
                stage('.NET Tests') {
                    steps {
                        script {
                            def dotnetServices = ['user-service', 'order-service', 'promotion-service']
                            dotnetServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults'
                                    publishHTML([
                                        allowMissing: false,
                                        alwaysLinkToLastBuild: true,
                                        keepAll: true,
                                        reportDir: 'TestResults',
                                        reportFiles: '*/coverage.cobertura.xml',
                                        reportName: "Coverage Report - ${service}"
                                    ])
                                }
                            }
                        }
                    }
                }
                
                stage('Go Tests') {
                    steps {
                        script {
                            def goServices = ['product-service', 'payment-service', 'inventory-service', 'notification-service']
                            goServices.each { service ->
                                dir("backend/${service}") {
                                    sh 'go test -v -coverprofile=coverage.out ./...'
                                    sh 'go tool cover -html=coverage.out -o coverage.html'
                                    publishHTML([
                                        allowMissing: false,
                                        alwaysLinkToLastBuild: true,
                                        keepAll: true,
                                        reportDir: '.',
                                        reportFiles: 'coverage.html',
                                        reportName: "Coverage Report - ${service}"
                                    ])
                                }
                            }
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        script {
                            def frontendApps = ['customer-platform', 'admin-dashboard']
                            frontendApps.each { app ->
                                dir("frontend/${app}") {
                                    sh 'npm ci'
                                    sh 'npm run test:coverage'
                                    publishHTML([
                                        allowMissing: false,
                                        alwaysLinkToLastBuild: true,
                                        keepAll: true,
                                        reportDir: 'coverage/lcov-report',
                                        reportFiles: 'index.html',
                                        reportName: "Coverage Report - ${app}"
                                    ])
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build & Push Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", env.DOCKER_CREDENTIALS) {
                        def services = [
                            'api-gateway', 'auth-service', 'user-service', 'product-service',
                            'order-service', 'payment-service', 'cart-service', 'inventory-service',
                            'shipping-service', 'promotion-service', 'review-service',
                            'notification-service', 'admin-service'
                        ]
                        
                        def frontendApps = ['customer-platform', 'admin-dashboard']
                        
                        // Build backend services
                        services.each { service ->
                            dir("backend/${service}") {
                                def image = docker.build("${DOCKER_REGISTRY}/ecommerce-${service}:${env.IMAGE_TAG}")
                                image.push()
                                image.push("latest")
                                
                                // Scan built image
                                sh "trivy image --severity HIGH,CRITICAL ${DOCKER_REGISTRY}/ecommerce-${service}:${env.IMAGE_TAG}"
                            }
                        }
                        
                        // Build frontend applications
                        frontendApps.each { app ->
                            dir("frontend/${app}") {
                                def image = docker.build("${DOCKER_REGISTRY}/ecommerce-${app}:${env.IMAGE_TAG}")
                                image.push()
                                image.push("latest")
                                
                                // Scan built image
                                sh "trivy image --severity HIGH,CRITICAL ${DOCKER_REGISTRY}/ecommerce-${app}:${env.IMAGE_TAG}"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                script {
                    // Start test environment
                    sh '''
                        docker-compose -f docker-compose.test.yml up -d
                        sleep 60  # Wait for services to be ready
                    '''
                    
                    try {
                        // Run integration tests
                        dir('tests/integration') {
                            sh 'npm ci'
                            sh 'npm run test'
                        }
                        
                        // Run API tests
                        dir('tests/api') {
                            sh 'newman run postman-collection.json --environment postman-environment.json --reporters cli,junit --reporter-junit-export newman-results.xml'
                        }
                        
                        // Publish test results
                        publishTestResults testResultsPattern: 'tests/api/newman-results.xml'
                        
                    } finally {
                        // Cleanup test environment
                        sh 'docker-compose -f docker-compose.test.yml down -v'
                    }
                }
            }
        }
        
        stage('Deploy to Environment') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                script {
                    // Update Kubernetes manifests with new image tags
                    sh """
                        find k8s/overlays/${env.DEPLOY_ENV} -name "*.yaml" -exec sed -i 's|image: .*ecommerce-.*:.*|image: ${DOCKER_REGISTRY}/ecommerce-&:${env.IMAGE_TAG}|g' {} \\;
                    """
                    
                    // Apply Kubernetes manifests
                    sh """
                        kubectl apply -k k8s/overlays/${env.DEPLOY_ENV} --namespace=${env.NAMESPACE}
                        kubectl rollout status deployment --namespace=${env.NAMESPACE} --timeout=600s
                    """
                    
                    // Trigger ArgoCD sync
                    sh """
                        argocd app sync ecommerce-${env.DEPLOY_ENV} --prune --force
                        argocd app wait ecommerce-${env.DEPLOY_ENV} --health --timeout 600
                    """
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                script {
                    // Wait for deployment to be ready
                    sleep(30)
                    
                    // Run smoke tests
                    dir('tests/smoke') {
                        sh 'npm ci'
                        sh "ENVIRONMENT=${env.DEPLOY_ENV} npm run test"
                    }
                }
            }
        }
        
        stage('Performance Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                }
            }
            steps {
                script {
                    dir('tests/performance') {
                        sh 'k6 run --out json=results.json load-test.js'
                        publishHTML([
                            allowMissing: false,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: '.',
                            reportFiles: 'results.json',
                            reportName: 'K6 Performance Test Results'
                        ])
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean up workspace
            cleanWs()
            
            // Archive artifacts
            archiveArtifacts artifacts: '**/coverage/**', allowEmptyArchive: true
            archiveArtifacts artifacts: '**/test-results/**', allowEmptyArchive: true
            archiveArtifacts artifacts: '**/trivy-*.json', allowEmptyArchive: true
            archiveArtifacts artifacts: '**/snyk-*.json', allowEmptyArchive: true
        }
        
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    // Send success notification for production deployment
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "✅ Production deployment successful! Build: ${env.BUILD_NUMBER}, Commit: ${env.GIT_COMMIT_SHORT}"
                    )
                }
            }
        }
        
        failure {
            script {
                // Send failure notification
                slackSend(
                    channel: '#deployments',
                    color: 'danger',
                    message: "❌ Build failed! Branch: ${env.BRANCH_NAME}, Build: ${env.BUILD_NUMBER}, Commit: ${env.GIT_COMMIT_SHORT}"
                )
                
                // Create GitHub issue for main branch failures
                if (env.BRANCH_NAME == 'main') {
                    sh """
                        curl -X POST \
                        -H "Authorization: token ${GITHUB_TOKEN}" \
                        -H "Accept: application/vnd.github.v3+json" \
                        https://api.github.com/repos/your-org/ecommerce/issues \
                        -d '{
                            "title": "Production build failure - Build #${env.BUILD_NUMBER}",
                            "body": "Build failed for commit ${env.GIT_COMMIT_SHORT}. Check Jenkins logs for details.",
                            "labels": ["bug", "production", "ci/cd"]
                        }'
                    """
                }
            }
        }
        
        unstable {
            script {
                slackSend(
                    channel: '#deployments',
                    color: 'warning',
                    message: "⚠️ Build unstable! Branch: ${env.BRANCH_NAME}, Build: ${env.BUILD_NUMBER}, Commit: ${env.GIT_COMMIT_SHORT}"
                )
            }
        }
    }
}
