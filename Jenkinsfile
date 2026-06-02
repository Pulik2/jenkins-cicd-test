pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
        steps {
            echo 'Checking backend dependencies...'
            dir('backend') {
                script {
                    if (fileExists('node_modules')) {
                        echo 'Backend dependencies already installed. Skipping npm install.'
                    } else {
                        echo 'Installing backend dependencies...'
                        bat 'npm install'
                    }
                }
            }
        }
    }

    stage('Install Frontend Dependencies') {
        steps {
            echo 'Checking frontend dependencies...'
            dir('frontend') {
                script {
                    if (fileExists('node_modules')) {
                        echo 'Frontend dependencies already installed. Skipping npm install.'
                    } else {
                        echo 'Installing frontend dependencies...'
                        bat 'npm install'
                    }
                }
            }
        }
    }

        stage('Test Backend') {
            steps {
                echo 'Running backend tests...'
                dir('backend') {
                    bat 'npm test'
                }
            }
        }

        stage('Test Frontend') {
            steps {
                echo 'Running frontend tests...'
                dir('frontend') {
                    bat 'npm test -- --watchAll=false --passWithNoTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building frontend...'
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deployment stage - build successful!'
                echo "Build #${env.BUILD_NUMBER} completed successfully."
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed. Check logs above.'
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}