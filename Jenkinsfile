pipeline {
    agent any
    tools { nodejs 'NodeJS-22' }

    environment {
        CI                 = 'true'
        DEV_BACKEND_PORT   = '5000'
        DEV_FRONTEND_PORT  = '3000'
        TEST_BACKEND_PORT  = '5001'
        TEST_FRONTEND_PORT = '3001'
        PROD_BACKEND_PORT  = '5002'
        PROD_FRONTEND_PORT = '3002'
        NOTIFY_EMAIL       = 'pulikpatel1@gmail.com'
        LAST_GOOD_TAG      = 'last-good-build'   // ← git tag tracking last success
    }

    stages {

        // ─── CHECKOUT ────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
                // Save the current commit SHA so we can rollback to it if needed
                script {
                    env.CURRENT_COMMIT = bat(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim().readLines().last()
                    echo "Current commit: ${env.CURRENT_COMMIT}"

                    // Try to get the last known good commit from the git tag
                    try {
                        env.LAST_GOOD_COMMIT = bat(
                            script: "git rev-parse ${LAST_GOOD_TAG}",
                            returnStdout: true
                        ).trim().readLines().last()
                        echo "Last good commit: ${env.LAST_GOOD_COMMIT}"
                    } catch (err) {
                        echo "No previous good build tag found — this may be the first run."
                        env.LAST_GOOD_COMMIT = ''
                    }
                }
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
                        <p>Commit: <code>${env.CURRENT_COMMIT}</code></p>
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
                        <p>Commit: <code>${env.CURRENT_COMMIT}</code></p>
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
                // ── In a real setup you would run your start/pm2/docker commands here ──
                // e.g.: bat "pm2 restart backend"
                //       bat "serve -s frontend/build -l ${PROD_FRONTEND_PORT}"
                echo "Build #${env.BUILD_NUMBER} deployed to Production."
            }
        }

        stage('Production — Smoke Test') {
            steps {
                script {
                    try {
                        echo "Running smoke test..."
                        // bat "exit 1"   ← make sure this is COMMENTED OUT
                        echo "Smoke test passed (demo mode — skipping real HTTP check)."
                    } catch (err) {
                        echo "Smoke test FAILED. Triggering rollback..."
                        performRollback()
                        error("Smoke test failed — rolled back to ${env.LAST_GOOD_COMMIT}")
                    }
                }
            }
        }

        // ─── TAG LAST GOOD BUILD ─────────────────────────────────────
        // Only runs if everything above succeeded
        stage('Tag Last Good Build') {
            steps {
                script {
                    echo "Tagging commit ${env.CURRENT_COMMIT} as last-good-build..."
                    // Delete old tag locally and remotely, then recreate
                    bat "git tag -d ${LAST_GOOD_TAG} || echo 'No existing local tag to delete'"
                    bat "git push origin :refs/tags/${LAST_GOOD_TAG} || echo 'No remote tag to delete'"
                    bat "git tag ${LAST_GOOD_TAG} ${env.CURRENT_COMMIT}"
                    bat "git push origin ${LAST_GOOD_TAG}"
                    echo "Successfully tagged ${env.CURRENT_COMMIT} as ${LAST_GOOD_TAG}"
                }
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
                    <p>Commit: <code>${env.CURRENT_COMMIT}</code></p>
                    <p><a href="${env.BUILD_URL}">View build</a></p>
                """,
                mimeType: 'text/html'
            )
            echo 'Pipeline succeeded!'
        }
        failure {
            script {
                // Check if rollback is needed (only if we got past Testing stage)
                if (env.ROLLBACK_PERFORMED == 'true') {
                    emailext(
                        from: 'pulikpatel1@gmail.com',
                        to: "${NOTIFY_EMAIL}",
                        subject: "[Build #${env.BUILD_NUMBER}] Pipeline FAILED — ROLLBACK EXECUTED",
                        body: """
                            <h2>⚠️ Pipeline failed — Rollback Executed</h2>
                            <p>Build <b>#${env.BUILD_NUMBER}</b> failed at Production smoke test.</p>
                            <p>Rolled back to: <code>${env.LAST_GOOD_COMMIT}</code></p>
                            <p><a href="${env.BUILD_URL}console">View console output</a></p>
                        """,
                        mimeType: 'text/html'
                    )
                } else {
                    emailext(
                        from: 'pulikpatel1@gmail.com',
                        to: "${NOTIFY_EMAIL}",
                        subject: "[Build #${env.BUILD_NUMBER}] Pipeline FAILED",
                        body: """
                            <h2>Pipeline failure</h2>
                            <p>Build <b>#${env.BUILD_NUMBER}</b> failed. Check the logs:</p>
                            <p>Failed commit: <code>${env.CURRENT_COMMIT}</code></p>
                            <p><a href="${env.BUILD_URL}console">View console output</a></p>
                        """,
                        mimeType: 'text/html'
                    )
                }
            }
            echo 'Pipeline failed.'
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}

// ─── ROLLBACK FUNCTION ───────────────────────────────────────────────────────
// Called when smoke test fails after production deploy
def performRollback() {
    script {
        if (!env.LAST_GOOD_COMMIT || env.LAST_GOOD_COMMIT == '') {
            echo "WARNING: No last-good-build tag found. Cannot rollback — manual intervention required."
            env.ROLLBACK_PERFORMED = 'false'
            return
        }

        echo "=== ROLLBACK STARTING ==="
        echo "Rolling back FROM: ${env.CURRENT_COMMIT}"
        echo "Rolling back TO:   ${env.LAST_GOOD_COMMIT}"

        // Checkout the last known good commit
        bat "git checkout ${env.LAST_GOOD_COMMIT}"

        // Reinstall dependencies from the good commit
        dir('backend')  { bat 'npm install' }
        dir('frontend') { bat 'npm install' }
        dir('frontend') { bat 'npm run build' }

        // Re-deploy from the good commit
        // In real setup: bat "pm2 restart backend"
        echo "Re-deployed from last good commit: ${env.LAST_GOOD_COMMIT}"

        env.ROLLBACK_PERFORMED = 'true'
        echo "=== ROLLBACK COMPLETE ==="
    }
}