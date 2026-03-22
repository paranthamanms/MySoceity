pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9.12' // Configure in Jenkins: Manage Jenkins -> Tools
        jdk 'Java-25'        // Configure in Jenkins: Manage Jenkins -> Tools
    }
    
    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Build Backend Services') {
            parallel {
                stage('Auth Service') {
                    steps {
                        dir("${BACKEND_DIR}/auth-service") {
                            echo 'Building Auth Service...'
                            bat 'mvn clean compile'
                        }
                    }
                }
                
                stage('User Service') {
                    steps {
                        dir("${BACKEND_DIR}/user-service") {
                            echo 'Building User Service...'
                            bat 'mvn clean compile'
                        }
                    }
                }
            }
        }
        
        stage('Test Backend Services') {
            parallel {
                stage('Test Auth Service') {
                    steps {
                        dir("${BACKEND_DIR}/auth-service") {
                            echo 'Testing Auth Service...'
                            bat 'mvn test'
                        }
                    }
                    post {
                        always {
                            junit "${BACKEND_DIR}/auth-service/target/surefire-reports/*.xml"
                        }
                    }
                }
                
                stage('Test User Service') {
                    steps {
                        dir("${BACKEND_DIR}/user-service") {
                            echo 'Testing User Service...'
                            bat 'mvn test'
                        }
                    }
                    post {
                        always {
                            junit "${BACKEND_DIR}/user-service/target/surefire-reports/*.xml"
                        }
                    }
                }
            }
        }
        
        stage('Package Backend Services') {
            parallel {
                stage('Package Auth Service') {
                    steps {
                        dir("${BACKEND_DIR}/auth-service") {
                            echo 'Packaging Auth Service...'
                            bat 'mvn package -DskipTests'
                        }
                    }
                }
                
                stage('Package User Service') {
                    steps {
                        dir("${BACKEND_DIR}/user-service") {
                            echo 'Packaging User Service...'
                            bat 'mvn package -DskipTests'
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend Applications') {
            parallel {
                stage('Login MFE') {
                    steps {
                        dir("${FRONTEND_DIR}/login-mfe") {
                            echo 'Installing Login MFE dependencies...'
                            bat 'npm install'
                            echo 'Building Login MFE...'
                            bat 'npm run build'
                        }
                    }
                }
                
                stage('Dashboard MFE') {
                    steps {
                        dir("${FRONTEND_DIR}/dashboard-mfe") {
                            echo 'Installing Dashboard MFE dependencies...'
                            bat 'npm install'
                            echo 'Building Dashboard MFE...'
                            bat 'npm run build'
                        }
                    }
                }
                
                stage('Register MFE') {
                    steps {
                        dir("${FRONTEND_DIR}/register-mfe") {
                            echo 'Installing Register MFE dependencies...'
                            bat 'npm install'
                            echo 'Building Register MFE...'
                            bat 'npm run build'
                        }
                    }
                }
                
                stage('Host App') {
                    steps {
                        dir("${FRONTEND_DIR}/host-app") {
                            echo 'Installing Host App dependencies...'
                            bat 'npm install'
                            echo 'Building Host App...'
                            bat 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo 'Archiving build artifacts...'
                archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
                archiveArtifacts artifacts: '**/dist/**', fingerprint: true
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
            emailext(
                subject: "✅ Jenkins Build SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Successful!</h2>
                    <p>Job: ${env.JOB_NAME}</p>
                    <p>Build Number: ${env.BUILD_NUMBER}</p>
                    <p>Build URL: ${env.BUILD_URL}</p>
                """,
                to: '${DEFAULT_RECIPIENTS}',
                mimeType: 'text/html'
            )
        }
        
        failure {
            echo '❌ Pipeline failed!'
            emailext(
                subject: "❌ Jenkins Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>Build Failed!</h2>
                    <p>Job: ${env.JOB_NAME}</p>
                    <p>Build Number: ${env.BUILD_NUMBER}</p>
                    <p>Build URL: ${env.BUILD_URL}</p>
                    <p>Please check the console output for details.</p>
                """,
                to: '${DEFAULT_RECIPIENTS}',
                mimeType: 'text/html'
            )
        }
        
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}
