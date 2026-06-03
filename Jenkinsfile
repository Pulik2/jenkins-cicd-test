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
            when {
                anyOf {
                    changeset 'backend/package.json'
                    changeset 'backend/package-lock.json'
                    expression { !fileExists('backend/node_modules') }
                }
            }
            steps {
                dir('backend') {
                    echo 'Installing backend dependencies...'
                    bat 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            when {
                anyOf {
                    changeset 'frontend/package.json'
                    changeset 'frontend/package-lock.json'
                    expression { !fileExists('frontend/node_modules') }
                }
            }
            steps {
                dir('frontend') {
                    echo 'Installing frontend dependencies...'
                    bat 'npm install'
                }
            }
        }

        stage('Test Backend') {
            when {
                changeset 'backend/**'
            }
            steps {
                echo 'Running backend tests...'
                dir('backend') {
                    bat 'npm test'
                }
            }
        }

        stage('Test Frontend') {
            when {
                changeset 'frontend/**'
            }
            steps {
                echo 'Running frontend tests...'
                dir('frontend') {
                    bat 'npm test -- --watchAll=false --passWithNoTests'
                }
            }
        }

        stage('Build Frontend') {
            when {
                changeset 'frontend/**'
            }
            steps {
                echo 'Building frontend...'
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    changeset 'backend/**'
                    changeset 'frontend/**'
                }
            }
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
