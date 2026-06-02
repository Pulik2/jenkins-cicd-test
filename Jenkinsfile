pipeline {
agent any

```
tools {
    nodejs 'NodeJS-22'
}

environment {
    CI = 'true'
    BACKEND_CHANGED = 'false'
    FRONTEND_CHANGED = 'false'
    BACKEND_PACKAGE_CHANGED = 'false'
    FRONTEND_PACKAGE_CHANGED = 'false'
}

stages {

    stage('Checkout') {
        steps {
            echo 'Checking out source code...'
            checkout scm
        }
    }

    stage('Detect Changes') {
        steps {
            script {

                def changedFiles = bat(
                    script: '@git diff --name-only HEAD~1 HEAD',
                    returnStdout: true
                ).trim()

                echo "Changed files:"
                echo changedFiles

                def files = changedFiles.split("\\r?\\n")

                files.each { file ->

                    file = file.trim()

                    if (file.startsWith('backend/')) {
                        env.BACKEND_CHANGED = 'true'
                    }

                    if (file.startsWith('frontend/')) {
                        env.FRONTEND_CHANGED = 'true'
                    }

                    if (file == 'backend/package.json' ||
                        file == 'backend/package-lock.json') {
                        env.BACKEND_PACKAGE_CHANGED = 'true'
                    }

                    if (file == 'frontend/package.json' ||
                        file == 'frontend/package-lock.json') {
                        env.FRONTEND_PACKAGE_CHANGED = 'true'
                    }
                }

                echo "BACKEND_CHANGED=${env.BACKEND_CHANGED}"
                echo "FRONTEND_CHANGED=${env.FRONTEND_CHANGED}"
                echo "BACKEND_PACKAGE_CHANGED=${env.BACKEND_PACKAGE_CHANGED}"
                echo "FRONTEND_PACKAGE_CHANGED=${env.FRONTEND_PACKAGE_CHANGED}"
            }
        }
    }

    stage('Install Backend Dependencies') {
        when {
            expression {
                env.BACKEND_CHANGED == 'true'
            }
        }
        steps {
            dir('backend') {
                script {

                    if (!fileExists('node_modules') ||
                        env.BACKEND_PACKAGE_CHANGED == 'true') {

                        echo 'Installing backend dependencies...'
                        bat 'npm install'

                    } else {

                        echo 'Backend dependencies unchanged. Skipping npm install.'
                    }
                }
            }
        }
    }

    stage('Install Frontend Dependencies') {
        when {
            expression {
                env.FRONTEND_CHANGED == 'true'
            }
        }
        steps {
            dir('frontend') {
                script {

                    if (!fileExists('node_modules') ||
                        env.FRONTEND_PACKAGE_CHANGED == 'true') {

                        echo 'Installing frontend dependencies...'
                        bat 'npm install'

                    } else {

                        echo 'Frontend dependencies unchanged. Skipping npm install.'
                    }
                }
            }
        }
    }

    stage('Test Backend') {
        when {
            expression {
                env.BACKEND_CHANGED == 'true'
            }
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
            expression {
                env.FRONTEND_CHANGED == 'true'
            }
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
            expression {
                env.FRONTEND_CHANGED == 'true'
            }
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
            expression {
                env.BACKEND_CHANGED == 'true' ||
                env.FRONTEND_CHANGED == 'true'
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
```

}