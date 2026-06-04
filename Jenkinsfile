pipeline {
    agent any
    tools { nodejs 'NodeJS-22' }

    environment {
        CI = 'true'
        DEV_BACKEND_PORT   = '5000'
        DEV_FRONTEND_PORT  = '3000'
        TEST_BACKEND_PORT  = '5001'
        TEST_FRONTEND_PORT = '3001'
        PROD_BACKEND_PORT  = '5002'
        PROD_FRONTEND_PORT = '3002'
        NOTIFY_EMAIL       = 'pulikpatel1@gmail.com'
    }

    stages {

        // ─── CHECKOUT ────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        // ─── INSTALL ─────────────────────────────────────────────────
        stage('Install Backend Dependencies') {
            when {
                anyOf {
                    changeset 'backend/package.json'
                    changeset 'backend/package-lock.json'
                    expression { !fileExists('backend/node_modules') }
                }
            }
            steps {
                dir('backend') { bat 'npm install' }
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
                dir('frontend') { bat 'npm install' }
            }
        }

        // ─── DEVELOPMENT ─────────────────────────────────────────────
        stage('Dev — Test Backend') {
            when { changeset 'backend/**' }
            steps {
                echo "Running backend tests on port ${DEV_BACKEND_PORT}..."
                dir('backend') {
                    withEnv(["PORT=${DEV_BACKEND_PORT}"]) {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Dev — Test Frontend') {
            when { changeset 'frontend/**' }
            steps {
                echo "Running frontend tests on port ${DEV_FRONTEND_PORT}..."
                dir('frontend') {
                    withEnv(["PORT=${DEV_FRONTEND_PORT}"]) {
                        bat 'npm test -- --watchAll=false --passWithNoTests'
                    }
                }
            }
        }

        stage('Dev — Build Frontend') {
            when { changeset 'frontend/**' }
            steps {
                dir('frontend') { bat 'npm run build' }
            }
        }

        // ─── APPROVAL 1 ──────────────────────────────────────────────
        stage('Approve: Dev → Testing') {
            when {
                anyOf {
                    changeset 'backend/**'
                    changeset 'frontend/**'
                }
            }
            steps {
                emailext(
                    from: 'pulikpatel1@gmail.com',
                    to: "${NOTIFY_EMAIL}",
                    subject: "[Build #${env.BUILD_NUMBER}] Dev passed - approve for Testing?",
                    body: """
                        <h2>Development stage passed</h2>
                        <p>Build <b>#${env.BUILD_NUMBER}</b> completed Dev successfully.</p>
                        <p><a href="${env.BUILD_URL}input">Open Approval in Jenkins</a></p>
                    """,
                    mimeType: 'text/html'
                )
                timeout(time: 1, unit: 'HOURS') {
                    input message: 'Dev tests passed. Promote to Testing environment?',
                          ok: 'Yes, promote to Testing'
                }
            }
        }

        // ─── TESTING ─────────────────────────────────────────────────
        stage('Testing — Backend') {
            when { changeset 'backend/**' }
            steps {
                echo "Running integration tests on port ${TEST_BACKEND_PORT}..."
                dir('backend') {
                    withEnv(["PORT=${TEST_BACKEND_PORT}"]) {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Testing — Frontend') {
            when { changeset 'frontend/**' }
            steps {
                echo "Running regression tests on port ${TEST_FRONTEND_PORT}..."
                dir('frontend') {
                    withEnv(["PORT=${TEST_FRONTEND_PORT}"]) {
                        bat 'npm test -- --watchAll=false --passWithNoTests'
                    }
                }
            }
        }

        // ─── APPROVAL 2 ──────────────────────────────────────────────
        stage('Approve: Testing → Production') {
            when {
                anyOf {
                    changeset 'backend/**'
                    changeset 'frontend/**'
                }
            }
            steps {
                emailext(
                    from: 'pulikpatel1@gmail.com',
                    to: "${NOTIFY_EMAIL}",
                    subject: "[Build #${env.BUILD_NUMBER}] Testing passed - approve for Production?",
                    body: """
                        <h2>Testing stage passed</h2>
                        <p>Build <b>#${env.BUILD_NUMBER}</b> completed all Testing checks.</p>
                        <p><a href="${env.BUILD_URL}input">Open Approval in Jenkins</a></p>
                    """,
                    mimeType: 'text/html'
                )
                timeout(time: 1, unit: 'HOURS') {
                    input message: 'Testing passed. Promote to Production?',
                          ok: 'Yes, deploy to Production'
                }
            }
        }

        // ─── PRODUCTION ──────────────────────────────────────────────
        stage('Production — Deploy') {
            steps {
                echo "Deploying to Production on ports ${PROD_FRONTEND_PORT} / ${PROD_BACKEND_PORT}..."
                echo "Build #${env.BUILD_NUMBER} deployed to Production."
            }
        }

        stage('Production — Smoke Test') {
            steps {
                bat "curl -f http://localhost:${PROD_BACKEND_PORT}/ || exit 1"
            }
        }
    }

    // ─── NOTIFICATIONS ───────────────────────────────────────────────
    post {
        success {
            emailext(
                from: 'pulikpatel1@gmail.com',
                to: "${NOTIFY_EMAIL}",
                subject: "[Build #${env.BUILD_NUMBER}] Production deploy succeeded!",
                body: """
                    <h2>Production deployment successful</h2>
                    <p>Build <b>#${env.BUILD_NUMBER}</b> is live in Production.</p>
                    <p><a href="${env.BUILD_URL}">View build</a></p>
                """,
                mimeType: 'text/html'
            )
            echo 'Pipeline succeeded!'
        }
        failure {
            emailext(
                from: 'pulikpatel1@gmail.com',
                to: "${NOTIFY_EMAIL}",
                subject: "[Build #${env.BUILD_NUMBER}] Pipeline FAILED",
                body: """
                    <h2>Pipeline failure</h2>
                    <p>Build <b>#${env.BUILD_NUMBER}</b> failed. Check the logs:</p>
                    <p><a href="${env.BUILD_URL}console">View console output</a></p>
                """,
                mimeType: 'text/html'
            )
            echo 'Pipeline failed.'
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}