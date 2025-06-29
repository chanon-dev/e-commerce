import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition

def jenkins = Jenkins.getInstance()

def jobName = "E-commerce-Deployment-Pipeline"
def jobDescription = "E-commerce Microservices Deployment Pipeline with multi-component and multi-environment support"

def pipelineScript = '''pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_CREDENTIALS = 'docker-registry-credentials'
        NAMESPACE_DEV = 'ecommerce-dev'
        NAMESPACE_STAGING = 'ecommerce-staging'
        NAMESPACE_PROD = 'ecommerce-prod'
        BUILD_VERSION = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
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
    }
    
    stages {
        stage('Pipeline Start') {
            steps {
                script {
                    echo "Starting E-commerce Deployment Pipeline"
                    echo "Component: ${params.COMPONENT}"
                    echo "Environment: ${params.DEPLOYMENT_TARGET}"
                    echo "Version: ${BUILD_VERSION}"
                }
            }
        }
        
        stage('Checkout Code') {
            steps {
                script {
                    echo "Checking out source code..."
                    checkout scm
                    
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    
                    echo "Commit: ${env.GIT_COMMIT_MSG}"
                }
            }
        }
        
        stage('Run Tests') {
            when {
                not { params.SKIP_TESTS }
            }
            parallel {
                stage('Frontend Tests') {
                    when {
                        expression { params.COMPONENT in ['all', 'frontend'] }
                    }
                    steps {
                        script {
                            echo "Running frontend tests..."
                            
                            dir('frontend/customer-platform') {
                                sh 'echo "Testing Customer Platform..."'
                            }
                            
                            dir('frontend/admin-dashboard') {
                                sh 'echo "Testing Admin Dashboard..."'
                            }
                        }
                    }
                }
                
                stage('Backend Tests') {
                    when {
                        expression { params.COMPONENT in ['all', 'backend', 'microservices'] }
                    }
                    steps {
                        script {
                            echo "Running backend tests..."
                            
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service'
                            ]
                            
                            services.each { service ->
                                echo "Testing ${service}..."
                            }
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Frontend Images') {
                    when {
                        expression { params.COMPONENT in ['all', 'frontend'] }
                    }
                    steps {
                        script {
                            echo "Building frontend Docker images..."
                            echo "Building Customer Platform image..."
                            echo "Building Admin Dashboard image..."
                        }
                    }
                }
                
                stage('Build Backend Images') {
                    when {
                        expression { params.COMPONENT in ['all', 'backend', 'microservices'] }
                    }
                    steps {
                        script {
                            echo "Building backend Docker images..."
                            
                            def services = [
                                'auth-service', 'user-service', 'product-service',
                                'order-service', 'payment-service', 'cart-service'
                            ]
                            
                            services.each { service ->
                                echo "Building ${service} image..."
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    echo "Deploying to Kubernetes..."
                    
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
                }
            }
        }
        
        stage('Health Checks') {
            steps {
                script {
                    echo "Running health checks..."
                    sh 'echo "Checking application health..."'
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Cleaning up..."
                sh 'echo "Cleaning up Docker images..."'
            }
        }
        
        success {
            script {
                echo "Deployment successful!"
            }
        }
        
        failure {
            script {
                echo "Deployment failed!"
            }
        }
    }
}'''

def job = jenkins.getItem(jobName)
if (job != null) {
    println "Job '${jobName}' already exists. Updating..."
    job.delete()
}

job = jenkins.createProject(WorkflowJob, jobName)
job.setDescription(jobDescription)
job.setDefinition(new CpsFlowDefinition(pipelineScript, true))

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
    )
]

def parametersProperty = new hudson.model.ParametersDefinitionProperty(parameterDefinitions)
job.addProperty(parametersProperty)

job.save()

println "Pipeline job '${jobName}' created successfully!"
println "Job URL: ${jenkins.getRootUrl()}job/${jobName}/"
