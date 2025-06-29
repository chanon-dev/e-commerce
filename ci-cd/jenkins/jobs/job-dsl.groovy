// Jenkins Job DSL for E-Commerce Microservices

// Main deployment pipeline
pipelineJob('ecommerce-microservices-deploy') {
    displayName('E-Commerce Microservices Deployment')
    description('Deploy E-Commerce microservices to different environments')
    
    definition {
        cpsScm {
            scm {
                git {
                    remote {
                        url('git@github.com:chanon-dev/e-commerce.git')
                        credentials('github-ssh-key')
                    }
                    branch('*/main')
                }
            }
            scriptPath('ci-cd/jenkins/pipelines/microservices-pipeline.groovy')
        }
    }
    
    parameters {
        choiceParam('SERVICE', [
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
        ], 'Select service to deploy')
        
        choiceParam('ENVIRONMENT', ['dev', 'staging', 'prod'], 'Target environment')
        booleanParam('SKIP_TESTS', false, 'Skip running tests')
        booleanParam('FORCE_DEPLOY', false, 'Force deployment even if no changes')
    }
    
    triggers {
        githubPush()
        cron('H 2 * * *') // Nightly build
    }
    
    properties {
        buildDiscarder {
            strategy {
                logRotator {
                    numToKeepStr('50')
                    daysToKeepStr('30')
                }
            }
        }
    }
}

// Individual service jobs
def services = [
    'api-gateway': 'NestJS API Gateway',
    'auth-service': 'Authentication Service (NestJS)',
    'user-service': 'User Management Service (.NET)',
    'product-service': 'Product Catalog Service (Go)',
    'order-service': 'Order Processing Service (.NET)',
    'payment-service': 'Payment Service (Go)',
    'cart-service': 'Shopping Cart Service (NestJS)',
    'inventory-service': 'Inventory Management Service (Go)',
    'shipping-service': 'Shipping Service (NestJS)',
    'promotion-service': 'Promotion Service (.NET)',
    'review-service': 'Review Service (NestJS)',
    'notification-service': 'Notification Service (Go)',
    'admin-service': 'Admin Service (NestJS)',
    'customer-platform': 'Customer Platform (Next.js)',
    'admin-dashboard': 'Admin Dashboard (Next.js)'
]

services.each { serviceName, description ->
    pipelineJob("ecommerce-${serviceName}") {
        displayName("E-Commerce ${description}")
        description("Deploy ${description} individually")
        
        definition {
            cps {
                script("""
                    pipeline {
                        agent any
                        
                        parameters {
                            choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Target environment')
                            booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests')
                        }
                        
                        stages {
                            stage('Deploy ${serviceName}') {
                                steps {
                                    build job: 'ecommerce-microservices-deploy', parameters: [
                                        string(name: 'SERVICE', value: '${serviceName}'),
                                        string(name: 'ENVIRONMENT', value: params.ENVIRONMENT),
                                        booleanParam(name: 'SKIP_TESTS', value: params.SKIP_TESTS),
                                        booleanParam(name: 'FORCE_DEPLOY', value: true)
                                    ]
                                }
                            }
                        }
                    }
                """)
            }
        }
    }
}

// Environment-specific deployment jobs
['dev', 'staging', 'prod'].each { env ->
    pipelineJob("ecommerce-deploy-${env}") {
        displayName("Deploy to ${env.toUpperCase()}")
        description("Deploy all services to ${env} environment")
        
        definition {
            cps {
                script("""
                    pipeline {
                        agent any
                        
                        parameters {
                            booleanParam(name: 'SKIP_TESTS', defaultValue: ${env == 'prod' ? 'false' : 'true'}, description: 'Skip running tests')
                            booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment')
                        }
                        
                        stages {
                            stage('Deploy to ${env}') {
                                steps {
                                    build job: 'ecommerce-microservices-deploy', parameters: [
                                        string(name: 'SERVICE', value: 'all'),
                                        string(name: 'ENVIRONMENT', value: '${env}'),
                                        booleanParam(name: 'SKIP_TESTS', value: params.SKIP_TESTS),
                                        booleanParam(name: 'FORCE_DEPLOY', value: params.FORCE_DEPLOY)
                                    ]
                                }
                            }
                        }
                        
                        ${env == 'prod' ? '''
                        post {
                            success {
                                emailext (
                                    subject: "✅ Production Deployment Successful",
                                    body: "E-Commerce platform has been successfully deployed to production.",
                                    to: "admin@ecommerce.local"
                                )
                            }
                            failure {
                                emailext (
                                    subject: "❌ Production Deployment Failed",
                                    body: "E-Commerce platform deployment to production has failed. Please check immediately.",
                                    to: "admin@ecommerce.local"
                                )
                            }
                        }
                        ''' : ''}
                    }
                """)
            }
        }
        
        if (env == 'prod') {
            authorization {
                permission('hudson.model.Item.Build', 'admin')
                permission('hudson.model.Item.Cancel', 'admin')
            }
        }
    }
}

// Database migration job
pipelineJob('ecommerce-db-migration') {
    displayName('Database Migration')
    description('Run database migrations for all services')
    
    definition {
        cps {
            script('''
                pipeline {
                    agent any
                    
                    parameters {
                        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Target environment')
                        choice(name: 'ACTION', choices: ['migrate', 'rollback', 'status'], description: 'Migration action')
                    }
                    
                    stages {
                        stage('Database Migration') {
                            steps {
                                script {
                                    sh """
                                        echo "Running database migration for ${params.ENVIRONMENT}..."
                                        
                                        # Run migrations for each service
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/user-service -- dotnet ef database update
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/order-service -- dotnet ef database update
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/promotion-service -- dotnet ef database update
                                        
                                        # Run Node.js migrations
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/auth-service -- npm run migration:run
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/cart-service -- npm run migration:run
                                        
                                        echo "Database migrations completed successfully!"
                                    """
                                }
                            }
                        }
                    }
                }
            ''')
        }
    }
}

// Monitoring and health check job
pipelineJob('ecommerce-health-check') {
    displayName('Health Check & Monitoring')
    description('Check health of all services and update monitoring')
    
    definition {
        cps {
            script('''
                pipeline {
                    agent any
                    
                    parameters {
                        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Environment to check')
                    }
                    
                    stages {
                        stage('Health Check') {
                            steps {
                                script {
                                    sh """
                                        echo "Checking health of services in ${params.ENVIRONMENT}..."
                                        
                                        # Check all pods
                                        kubectl get pods -n ecommerce-${params.ENVIRONMENT}
                                        
                                        # Check service endpoints
                                        services=("api-gateway" "auth-service" "user-service" "product-service" "order-service" "payment-service" "cart-service" "inventory-service" "shipping-service" "promotion-service" "review-service" "notification-service" "admin-service")
                                        
                                        for service in "\${services[@]}"; do
                                            echo "Checking \$service health..."
                                            kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/\$service -- curl -f http://localhost:8080/health || echo "\$service health check failed"
                                        done
                                        
                                        # Check frontend applications
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/customer-platform -- curl -f http://localhost:3000/api/health || echo "Customer platform health check failed"
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/admin-dashboard -- curl -f http://localhost:3100/api/health || echo "Admin dashboard health check failed"
                                        
                                        echo "Health check completed!"
                                    """
                                }
                            }
                        }
                        
                        stage('Update Monitoring') {
                            steps {
                                sh """
                                    echo "Updating monitoring dashboards..."
                                    # Update Grafana dashboards
                                    # Update Prometheus targets
                                    # Restart monitoring if needed
                                """
                            }
                        }
                    }
                }
            ''')
        }
    }
    
    triggers {
        cron('H/15 * * * *') // Every 15 minutes
    }
}

// Backup job
pipelineJob('ecommerce-backup') {
    displayName('Database Backup')
    description('Backup all databases')
    
    definition {
        cps {
            script('''
                pipeline {
                    agent any
                    
                    parameters {
                        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Environment to backup')
                        choice(name: 'BACKUP_TYPE', choices: ['full', 'incremental'], description: 'Backup type')
                    }
                    
                    stages {
                        stage('Database Backup') {
                            steps {
                                script {
                                    def timestamp = new Date().format('yyyy-MM-dd-HH-mm-ss')
                                    sh """
                                        echo "Starting database backup for ${params.ENVIRONMENT}..."
                                        
                                        # PostgreSQL backup
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/postgresql -- pg_dumpall -U postgres > backup-postgresql-${timestamp}.sql
                                        
                                        # MongoDB backup
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/mongodb -- mongodump --out /backup/mongodb-${timestamp}
                                        
                                        # Redis backup
                                        kubectl exec -n ecommerce-${params.ENVIRONMENT} deployment/redis -- redis-cli BGSAVE
                                        
                                        # Upload to S3 or backup storage
                                        # aws s3 cp backup-postgresql-${timestamp}.sql s3://ecommerce-backups/${params.ENVIRONMENT}/
                                        
                                        echo "Backup completed: ${timestamp}"
                                    """
                                }
                            }
                        }
                    }
                }
            ''')
        }
    }
    
    triggers {
        cron('H 1 * * *') // Daily at 1 AM
    }
}

// Create folder structure
folder('E-Commerce') {
    displayName('E-Commerce Platform')
    description('All jobs related to E-Commerce microservices platform')
}

folder('E-Commerce/Services') {
    displayName('Individual Services')
    description('Deploy individual microservices')
}

folder('E-Commerce/Environments') {
    displayName('Environment Deployments')
    description('Deploy to specific environments')
}

folder('E-Commerce/Maintenance') {
    displayName('Maintenance Jobs')
    description('Database, backup, and monitoring jobs')
}
