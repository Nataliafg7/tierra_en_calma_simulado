// =============================================================
//  TIERRA EN CALMA — Jenkinsfile
//  Pipeline CI/CD para monorepo (Backend Express + Frontend Angular)
//
//  Etapas:
//   1. Checkout
//   2. Install & Unit Tests → Backend (Jest + cobertura)
//   3. Install & Unit Tests → Frontend (Karma + cobertura)
//   4. Quality Gate → SonarQube + validación 80 % de cobertura
//   5. Build → Angular
//   6. Build & Push Docker → Backend
//   7. Build & Push Docker → Frontend
//   8. Performance Tests → k6 (smoke sobre cada endpoint)
//   9. Regression Tests → Playwright E2E
//
//  Secrets requeridos en Jenkins (Manage Credentials):
//   - DOCKER_CREDENTIALS_ID : Usuario/Password de Docker Hub
//   - SONAR_TOKEN_ID        : Token de SonarQube (secret text)
// =============================================================

pipeline {
    agent any

    // ── Variables globales ──────────────────────────────────────────────────────
    environment {
        NODE_OPTIONS          = '--max-old-space-size=4096'
        NODE_VERSION          = '22.15.0'

        // Docker Hub
        DOCKER_REGISTRY       = 'docker.io'
        DOCKER_BACKEND_IMAGE  = 'nataliaflorezg/tierra-backend'
        DOCKER_FRONTEND_IMAGE = 'nataliaflorezg/tierra-frontend'
        DOCKER_TAG            = "v${env.BUILD_NUMBER}"   // tag versionado por build

        // SonarQube
        SONAR_HOST            = 'http://localhost:9000'
        SONAR_PROJECT_BACKEND = 'tierra-en-calma-backend'
        SONAR_PROJECT_FRONT   = 'tierra-front-monstera'

        // Umbrales de cobertura (porcentaje mínimo)
        COVERAGE_THRESHOLD    = '80'

        // k6
        K6_BASE_URL           = 'http://localhost:3000'

        // Playwright
        PLAYWRIGHT_BASE_URL   = 'http://localhost:4200'
        CI                    = 'true'
    }

    // ── Opciones del pipeline ──────────────────────────────────────────────────
    options {
        timestamps()
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 1: Checkout
        // ──────────────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Clonando repositorio...'
                checkout scm
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 2: Backend — Instalación y pruebas unitarias
        // ──────────────────────────────────────────────────────────────────────
        stage('Backend: Install & Unit Tests') {
            steps {
                dir('backend') {
                    echo '📦 Instalando dependencias del backend...'
                    sh '''
                        if [ -f package-lock.json ]; then
                            npm ci
                        elif [ -f package.json ]; then
                            npm install
                        else
                            echo "No backend package.json, skipping"
                            exit 0
                        fi
                    '''

                    echo '🧪 Ejecutando pruebas unitarias del backend (Jest)...'
                    sh '''
                        if [ -f package.json ]; then
                            NODE_ENV=test \
                            GMAIL_USER=test@tierraencalma.com \
                            GMAIL_PASS=dummy \
                            npm test -- --runInBand \
                                       --forceExit \
                                       --coverage \
                                       --coverageReporters=lcov \
                                       --coverageReporters=text-summary
                        else
                            echo "No backend project to test"
                        fi
                    '''
                }
            }
            post {
                always {
                    // Publicar resultados JUnit si Jest genera XML
                    junit allowEmptyResults: true,
                          testResults: 'backend/junit.xml'
                    // Publicar reporte de cobertura HTML
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'backend/coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Backend Coverage Report'
                    ])
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 3: Frontend — Instalación, pruebas unitarias y build
        // ──────────────────────────────────────────────────────────────────────
        stage('Frontend: Install & Unit Tests') {
            steps {
                dir('frontend') {
                    echo '📦 Instalando dependencias del frontend...'
                    sh '''
                        if [ -f package-lock.json ]; then
                            npm ci
                        elif [ -f package.json ]; then
                            npm install
                        else
                            echo "No frontend package.json, skipping"
                            exit 0
                        fi
                    '''

                    echo '🧪 Ejecutando pruebas unitarias del frontend (Karma/Jasmine)...'
                    sh '''
                        if [ -f package.json ]; then
                            npm run test:coverage
                        else
                            echo "No frontend project to test"
                        fi
                    '''
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'frontend/test-results/**/*.xml'
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'frontend/coverage/frontend/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Frontend Coverage Report'
                    ])
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 4: Validación de cobertura mínima (80 %)
        //          Se ejecuta ANTES de SonarQube para fallar rápido
        // ──────────────────────────────────────────────────────────────────────
        stage('Coverage Gate: ≥ 80 %') {
            steps {
                echo '🔍 Validando cobertura mínima del ${COVERAGE_THRESHOLD}%...'
                script {
                    // ── Backend: parsear lcov.info ──────────────────────────
                    def backendLcov = 'backend/coverage/lcov.info'
                    def backendCov  = parseLcovCoverage(backendLcov)
                    echo "Backend coverage: ${backendCov}%"
                    if (backendCov < env.COVERAGE_THRESHOLD.toInteger()) {
                        error("❌ Backend coverage ${backendCov}% está por debajo del mínimo requerido (${COVERAGE_THRESHOLD}%)")
                    }

                    // ── Frontend: parsear lcov.info ──────────────────────────
                    def frontendLcov = 'frontend/coverage/frontend/lcov.info'
                    def frontendCov  = parseLcovCoverage(frontendLcov)
                    echo "Frontend coverage: ${frontendCov}%"
                    if (frontendCov < env.COVERAGE_THRESHOLD.toInteger()) {
                        error("❌ Frontend coverage ${frontendCov}% está por debajo del mínimo requerido (${COVERAGE_THRESHOLD}%)")
                    }

                    echo "✅ Cobertura OK — Backend: ${backendCov}% | Frontend: ${frontendCov}%"
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 5: SonarQube — Análisis de calidad de código
        // ──────────────────────────────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'SONAR_TOKEN_ID', variable: 'SONAR_TOKEN')]) {

                        // ── Análisis del Backend ────────────────────────────
                        echo '📊 Analizando Backend con SonarQube...'
                        dir('backend') {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=${SONAR_PROJECT_BACKEND} \
                                  -Dsonar.projectName='Tierra en Calma - Backend' \
                                  -Dsonar.sources=. \
                                  -Dsonar.inclusions=app.js,server.js,SimuladorSensor.js,mqttService.js,pkgCentralService.js,cuidadosService.js \
                                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                  -Dsonar.test.inclusions=__tests__/**/*.test.js \
                                  -Dsonar.host.url=${SONAR_HOST} \
                                  -Dsonar.token=\${SONAR_TOKEN} \
                                  -Dsonar.sourceEncoding=UTF-8
                            """
                        }

                        // ── Análisis del Frontend ───────────────────────────
                        echo '📊 Analizando Frontend con SonarQube...'
                        dir('frontend') {
                            sh """
                                sonar-scanner \
                                  -Dsonar.projectKey=${SONAR_PROJECT_FRONT} \
                                  -Dsonar.projectName='Tierra en Calma - Frontend' \
                                  -Dsonar.sources=src \
                                  -Dsonar.inclusions=\
src/app/app.ts,\
src/app/guards/auth-guard.ts,\
src/app/pages/login/login.ts,\
src/app/pages/login/auth.service.ts,\
src/app/pages/registrar-plantas/registrar-plantas.ts,\
src/app/pages/mis-plantas/mis-plantas.ts,\
src/app/pages/monstera/monstera.ts,\
src/app/services/mqtt-data.service.ts,\
src/app/layouts/public-layout.ts \
                                  -Dsonar.javascript.lcov.reportPaths=coverage/frontend/lcov.info \
                                  -Dsonar.test.inclusions=**/*.spec.ts \
                                  -Dsonar.host.url=${SONAR_HOST} \
                                  -Dsonar.token=\${SONAR_TOKEN} \
                                  -Dsonar.sourceEncoding=UTF-8
                            """
                        }
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 6: SonarQube Quality Gate (espera al webhook de SQ)
        // ──────────────────────────────────────────────────────────────────────
        stage('SonarQube Quality Gate') {
            steps {
                echo '⏳ Esperando Quality Gate de SonarQube...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 7: Build Angular
        // ──────────────────────────────────────────────────────────────────────
        stage('Frontend: Build Angular') {
            steps {
                dir('frontend') {
                    echo '🔨 Compilando aplicación Angular...'
                    sh '''
                        if [ -f package.json ]; then
                            npm run build
                        else
                            echo "No frontend project to build"
                        fi
                    '''
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 8: Docker — Login, Build & Push (Backend + Frontend)
        // ──────────────────────────────────────────────────────────────────────
        stage('Docker: Build & Push') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId : 'DOCKER_CREDENTIALS_ID',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'

                        // ── Backend ─────────────────────────────────────────
                        echo '🐳 Build & Push → Backend...'
                        sh """
                            docker buildx build \
                              --platform linux/amd64 \
                              --push \
                              -t ${DOCKER_BACKEND_IMAGE}:${DOCKER_TAG} \
                              -t ${DOCKER_BACKEND_IMAGE}:latest \
                              -f backend/Dockerfile \
                              ./backend
                        """

                        // ── Frontend ────────────────────────────────────────
                        echo '🐳 Build & Push → Frontend...'
                        sh """
                            docker buildx build \
                              --platform linux/amd64 \
                              --push \
                              -t ${DOCKER_FRONTEND_IMAGE}:${DOCKER_TAG} \
                              -t ${DOCKER_FRONTEND_IMAGE}:latest \
                              -f frontend/Dockerfile \
                              ./frontend
                        """

                        sh 'docker logout'
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 9: k6 — Pruebas de rendimiento
        //
        //  Se levanta el backend temporalmente, se ejecutan los 5 scripts en
        //  modo "smoke" (rápido) y luego se detiene el servidor.
        //  Requiere que k6 esté instalado en el agente Jenkins.
        // ──────────────────────────────────────────────────────────────────────
        stage('Performance Tests: k6') {
            steps {
                script {
                    echo '🚀 Iniciando backend para pruebas de rendimiento...'
                    // Levanta el backend en background
                    sh '''
                        cd backend
                        NODE_ENV=test \
                        GMAIL_USER=test@tierraencalma.com \
                        GMAIL_PASS=dummy \
                        node server.js &
                        echo $! > /tmp/backend_pid.txt
                        # Esperar que el servidor arranque
                        sleep 5
                        echo "Backend PID: $(cat /tmp/backend_pid.txt)"
                    '''

                    def k6Scripts = [
                        '01_contacto.test.js',
                        '02_sensor_datos.test.js',
                        '03_monitorear.test.js',
                        '04_verificar_condiciones.test.js',
                        '05_simulador_flujo_completo.test.js'
                    ]

                    def k6Failed = false

                    k6Scripts.each { script ->
                        echo "  ⚡ Ejecutando k6: ${script} (modo smoke)..."
                        def result = sh(
                            returnStatus: true,
                            script: """
                                k6 run \
                                  -e SCENARIO=smoke \
                                  -e K6_BASE_URL=${K6_BASE_URL} \
                                  --out json=backend/k6/results/${script.replace('.test.js', '_results.json')} \
                                  backend/k6/${script}
                            """
                        )
                        if (result != 0) {
                            echo "⚠️  k6: ${script} reportó fallos en umbrales de rendimiento"
                            k6Failed = true
                        }
                    }

                    // Detener backend
                    sh '''
                        if [ -f /tmp/backend_pid.txt ]; then
                            kill $(cat /tmp/backend_pid.txt) 2>/dev/null || true
                            rm /tmp/backend_pid.txt
                        fi
                    '''

                    if (k6Failed) {
                        unstable('⚠️ Una o más pruebas k6 no superaron los umbrales de SLA definidos.')
                    } else {
                        echo '✅ Todas las pruebas k6 pasaron los umbrales de rendimiento.'
                    }
                }
            }
            post {
                always {
                    // Archivar resultados JSON de k6
                    archiveArtifacts artifacts: 'backend/k6/results/*.json',
                                     allowEmptyArchive: true
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 10: Playwright — Pruebas de regresión E2E
        //
        //  Levanta backend + frontend, ejecuta los 5 specs en modo headless
        //  con un solo worker (comportamiento CI), luego detiene los servicios.
        // ──────────────────────────────────────────────────────────────────────
        stage('Regression Tests: Playwright E2E') {
            steps {
                script {
                    echo '🎭 Levantando servicios para pruebas E2E...'

                    // Levantar Backend
                    sh '''
                        cd backend
                        NODE_ENV=test \
                        GMAIL_USER=test@tierraencalma.com \
                        GMAIL_PASS=dummy \
                        node server.js &
                        echo $! > /tmp/e2e_backend_pid.txt
                        sleep 5
                    '''

                    // Levantar Frontend en modo producción (sirve el dist/)
                    sh '''
                        cd frontend
                        # Instalar serve si no está disponible
                        npx --yes serve -s dist/frontend -l 4200 &
                        echo $! > /tmp/e2e_frontend_pid.txt
                        sleep 8
                        echo "Frontend PID: $(cat /tmp/e2e_frontend_pid.txt)"
                    '''

                    // Instalar navegadores Playwright si es necesario
                    sh '''
                        cd frontend
                        npx playwright install --with-deps chromium
                    '''

                    // Ejecutar pruebas de regresión (solo Chromium en CI)
                    def e2eResult = sh(
                        returnStatus: true,
                        script: '''
                            cd frontend
                            CI=true \
                            npx playwright test \
                              --project=chromium \
                              --reporter=html,junit \
                              --output=test-results
                        '''
                    )

                    // Detener servicios E2E
                    sh '''
                        for PID_FILE in /tmp/e2e_backend_pid.txt /tmp/e2e_frontend_pid.txt; do
                            if [ -f "$PID_FILE" ]; then
                                kill $(cat "$PID_FILE") 2>/dev/null || true
                                rm "$PID_FILE"
                            fi
                        done
                    '''

                    if (e2eResult != 0) {
                        error("❌ Las pruebas de regresión Playwright fallaron. Revisa el reporte HTML.")
                    } else {
                        echo '✅ Todas las pruebas de regresión Playwright pasaron correctamente.'
                    }
                }
            }
            post {
                always {
                    // Publicar reporte JUnit de Playwright
                    junit allowEmptyResults: true,
                          testResults: 'frontend/test-results/**/*.xml'

                    // Publicar reporte HTML de Playwright
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'frontend/playwright-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Playwright E2E Report'
                    ])

                    // Archivar screenshots y videos de fallos
                    archiveArtifacts artifacts: 'frontend/test-results/**/*.{png,webm}',
                                     allowEmptyArchive: true
                }
            }
        }

    } // end stages

    // ── Post pipeline global ───────────────────────────────────────────────────
    post {
        success {
            echo """
╔══════════════════════════════════════════════════╗
║  ✅  PIPELINE COMPLETADO CON ÉXITO               ║
║  Build #${env.BUILD_NUMBER} — Tierra en Calma    ║
║  Backend  → ${DOCKER_BACKEND_IMAGE}:${DOCKER_TAG} ║
║  Frontend → ${DOCKER_FRONTEND_IMAGE}:${DOCKER_TAG}║
╚══════════════════════════════════════════════════╝
            """.stripIndent()
        }
        failure {
            echo '❌ El pipeline falló. Revisa los logs y los reportes publicados.'
        }
        unstable {
            echo '⚠️  El pipeline terminó en estado UNSTABLE (umbrales k6 o cobertura límite).'
        }
        always {
            cleanWs()
        }
    }

} // end pipeline

// =============================================================
//  FUNCIÓN UTILITARIA: parseLcovCoverage
//  Lee un archivo lcov.info y calcula el porcentaje de líneas
//  cubiertas (LH / LF * 100).
// =============================================================
def parseLcovCoverage(String lcovPath) {
    def lf = 0  // Lines Found
    def lh = 0  // Lines Hit

    if (!fileExists(lcovPath)) {
        echo "⚠️  No se encontró el archivo de cobertura: ${lcovPath}"
        return 0
    }

    def content = readFile(lcovPath)
    content.eachLine { line ->
        if (line.startsWith('LF:')) {
            lf += line.replace('LF:', '').trim().toInteger()
        } else if (line.startsWith('LH:')) {
            lh += line.replace('LH:', '').trim().toInteger()
        }
    }

    if (lf == 0) return 0
    return Math.round((lh / lf) * 100)
}
