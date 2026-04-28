// =============================================================
//  TIERRA EN CALMA — Jenkinsfile
//  Pipeline CI/CD para monorepo (Backend Express + Frontend Angular)
//
//  Imagen Jenkins base: jenkins/jenkins:lts (sin Node.js)
//  → Node.js 22.15.0 se instala vía nvm en la etapa "Setup Node.js"
//    y se reutiliza en todas las etapas exportando NVM_DIR al PATH.
//
//  Secrets requeridos en Jenkins (Manage Jenkins → Credentials):
//   - DOCKER_CREDENTIALS_ID : Username/Password de Docker Hub
//   - SONAR_TOKEN_ID        : Token de SonarQube (secret text)
// =============================================================

pipeline {
    agent any

    // ── Variables globales ──────────────────────────────────────────────────────
    environment {
        NODE_OPTIONS          = '--max-old-space-size=4096'
        NODE_VERSION          = '22.15.0'

        // Ruta donde nvm instala Node (persiste en el workspace del agente)
        NVM_DIR               = '/root/.nvm'

        // Docker Hub
        DOCKER_BACKEND_IMAGE  = 'nataliaflorezg/tierra-backend'
        DOCKER_FRONTEND_IMAGE = 'nataliaflorezg/tierra-frontend'
        DOCKER_TAG            = "v${env.BUILD_NUMBER}"

        // SonarQube
        SONAR_HOST            = 'http://sonarqube:9000'
        SONAR_PROJECT_BACKEND = 'tierra-en-calma-backend'
        SONAR_PROJECT_FRONT   = 'tierra-front-monstera'

        // Umbrales de cobertura (porcentaje mínimo)
        COVERAGE_THRESHOLD    = '80'

        // k6
        K6_BASE_URL           = 'http://localhost:3000'

        // CI flag para Playwright y Angular
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
                echo 'Clonando repositorio...'
                checkout scm
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 2: Instalar Node.js via nvm
        //   Si nvm ya está instalado y la versión pedida ya existe,
        //   los comandos son idempotentes y terminan en segundos.
        // ──────────────────────────────────────────────────────────────────────
        stage('Setup: Node.js via nvm') {
            steps {
                sh '''
                    # Instalar nvm si no existe
                    if [ ! -d "$NVM_DIR" ]; then
                        echo ">>> Instalando nvm..."
                        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
                    fi

                    # Cargar nvm e instalar la version requerida
                    export NVM_DIR="$NVM_DIR"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}
                    nvm alias default ${NODE_VERSION}

                    echo "Node: $(node --version)"
                    echo "npm:  $(npm --version)"
                '''
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 3: Backend — Instalación y pruebas unitarias
        // ──────────────────────────────────────────────────────────────────────
        stage('Backend: Install & Unit Tests') {
            steps {
                dir('backend') {
                    echo 'Instalando dependencias del backend...'
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        if [ -f package.json ]; then
                            # Usamos npm install (no npm ci) para que regenere
                            # el lock file si hay nuevas dependencias sin commitear
                            npm install
                        else
                            echo "No backend package.json, skipping"
                        fi
                    '''

                    echo 'Ejecutando pruebas unitarias del backend (Jest)...'
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        NODE_ENV=test \
                        GMAIL_USER=test@tierraencalma.com \
                        GMAIL_PASS=dummy \
                        JUNIT_REPORT_PATH=junit.xml \
                        npm test -- --runInBand \
                                   --forceExit \
                                   --coverage \
                                   --coverageReporters=lcov \
                                   --coverageReporters=text-summary
                    '''
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/junit.xml'
                    // Archivar reporte de cobertura HTML del backend
                    archiveArtifacts artifacts: 'backend/coverage/lcov-report/**',
                                     allowEmptyArchive: true
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 4: Frontend — Instalación y pruebas unitarias
        // ──────────────────────────────────────────────────────────────────────
        stage('Frontend: Install & Unit Tests') {
            steps {
                dir('frontend') {
                    echo 'Instalando dependencias del frontend...'
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        if [ -f package.json ]; then
                            # npm install en lugar de npm ci para regenerar
                            # el lock si hay dependencias nuevas sin commitear
                            npm install
                        else
                            echo "No frontend package.json, skipping"
                        fi
                    '''

                    echo 'Ejecutando pruebas unitarias del frontend (Karma/Jasmine)...'
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        npm run test:coverage
                    '''
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'frontend/test-results/**/*.xml'
                    // Archivar reporte de cobertura HTML del frontend
                    archiveArtifacts artifacts: 'frontend/coverage/frontend/lcov-report/**',
                                     allowEmptyArchive: true
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 5: Validación de cobertura mínima (>= 80 %)
        //   Se ejecuta ANTES de SonarQube para fallar rápido y ahorrar tiempo.
        // ──────────────────────────────────────────────────────────────────────
        stage('Coverage Gate: >= 80%') {
            steps {
                script {
                    def backendLcov  = 'backend/coverage/lcov.info'
                    def frontendLcov = 'frontend/coverage/frontend/lcov.info'

                    def backendCov  = parseLcovCoverage(backendLcov)
                    def frontendCov = parseLcovCoverage(frontendLcov)

                    echo "Backend  coverage : ${backendCov}%"
                    echo "Frontend coverage : ${frontendCov}%"

                    def threshold = env.COVERAGE_THRESHOLD.toInteger()

                    if (backendCov < threshold) {
                        error("Backend coverage ${backendCov}% esta por debajo del minimo requerido (${threshold}%)")
                    }
                    if (frontendCov < threshold) {
                        error("Frontend coverage ${frontendCov}% esta por debajo del minimo requerido (${threshold}%)")
                    }

                    echo "Cobertura OK — Backend: ${backendCov}% | Frontend: ${frontendCov}%"
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 6: SonarQube — Análisis de calidad de código
        //   Requiere sonar-scanner en el PATH del agente Jenkins.
        //   Instalación: https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
        // ──────────────────────────────────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'SONAR_TOKEN_ID', variable: 'SONAR_TOKEN')]) {

                        echo 'Analizando Backend con SonarQube...'
                        dir('backend') {
                            sh """
                                sonar-scanner \\
                                  -Dsonar.projectKey=${SONAR_PROJECT_BACKEND} \\
                                  -Dsonar.projectName="Tierra en Calma - Backend" \\
                                  -Dsonar.sources=. \\
                                  -Dsonar.inclusions=app.js,server.js,SimuladorSensor.js,mqttService.js,pkgCentralService.js,cuidadosService.js \\
                                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \\
                                  -Dsonar.test.inclusions=__tests__/**/*.test.js \\
                                  -Dsonar.host.url=${SONAR_HOST} \\
                                  -Dsonar.token=\${SONAR_TOKEN} \\
                                  -Dsonar.sourceEncoding=UTF-8
                            """
                        }

                        echo 'Analizando Frontend con SonarQube...'
                        dir('frontend') {
                            sh """
                                sonar-scanner \\
                                  -Dsonar.projectKey=${SONAR_PROJECT_FRONT} \\
                                  -Dsonar.projectName="Tierra en Calma - Frontend" \\
                                  -Dsonar.sources=src \\
                                  -Dsonar.inclusions=src/app/app.ts,src/app/guards/auth-guard.ts,src/app/pages/login/login.ts,src/app/pages/login/auth.service.ts,src/app/pages/registrar-plantas/registrar-plantas.ts,src/app/pages/mis-plantas/mis-plantas.ts,src/app/pages/monstera/monstera.ts,src/app/services/mqtt-data.service.ts,src/app/layouts/public-layout.ts \\
                                  -Dsonar.javascript.lcov.reportPaths=coverage/frontend/lcov.info \\
                                  -Dsonar.test.inclusions=**/*.spec.ts \\
                                  -Dsonar.host.url=${SONAR_HOST} \\
                                  -Dsonar.token=\${SONAR_TOKEN} \\
                                  -Dsonar.sourceEncoding=UTF-8
                            """
                        }
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 7: SonarQube Quality Gate
        //   Espera el webhook de SonarQube → Jenkins antes de continuar.
        //   Configurar en SQ: Administration → Webhooks → http://<jenkins>:8080/sonarqube-webhook/
        // ──────────────────────────────────────────────────────────────────────
        stage('SonarQube Quality Gate') {
            steps {
                echo 'Esperando Quality Gate de SonarQube...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 8: Build Angular
        // ──────────────────────────────────────────────────────────────────────
        stage('Frontend: Build Angular') {
            steps {
                dir('frontend') {
                    echo 'Compilando aplicacion Angular...'
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        npm run build
                    '''
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 9: Docker — Build & Push (Backend + Frontend)
        // ──────────────────────────────────────────────────────────────────────
        stage('Docker: Build & Push') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId   : 'DOCKER_CREDENTIALS_ID',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'

                        echo 'Build & Push Backend...'
                        sh """
                            docker build \\
                              -t ${DOCKER_BACKEND_IMAGE}:${DOCKER_TAG} \\
                              -t ${DOCKER_BACKEND_IMAGE}:latest \\
                              -f backend/Dockerfile \\
                              ./backend
                            docker push ${DOCKER_BACKEND_IMAGE}:${DOCKER_TAG}
                            docker push ${DOCKER_BACKEND_IMAGE}:latest
                        """

                        echo 'Build & Push Frontend...'
                        sh """
                            docker build \\
                              -t ${DOCKER_FRONTEND_IMAGE}:${DOCKER_TAG} \\
                              -t ${DOCKER_FRONTEND_IMAGE}:latest \\
                              -f frontend/Dockerfile \\
                              ./frontend
                            docker push ${DOCKER_FRONTEND_IMAGE}:${DOCKER_TAG}
                            docker push ${DOCKER_FRONTEND_IMAGE}:latest
                        """

                        sh 'docker logout'
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 10: k6 — Pruebas de rendimiento (smoke)
        //   Levanta el backend en background, ejecuta los 5 scripts k6
        //   en modo smoke, luego apaga el servidor.
        //   Requiere k6 instalado en el agente.
        //   Instalación: https://grafana.com/docs/k6/latest/set-up/install-k6/
        // ──────────────────────────────────────────────────────────────────────
        stage('Performance Tests: k6') {
            steps {
                script {
                    echo 'Levantando backend para pruebas de rendimiento...'
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        cd backend
                        NODE_ENV=test GMAIL_USER=test@tierraencalma.com GMAIL_PASS=dummy node server.js &
                        echo $! > /tmp/backend_pid.txt
                        sleep 6
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

                    k6Scripts.each { testScript ->
                        def baseName = testScript.replace('.test.js', '')
                        echo "Ejecutando k6: ${testScript} (smoke)..."
                        def result = sh(
                            returnStatus: true,
                            script: """
                                mkdir -p backend/k6/results
                                k6 run \\
                                  -e SCENARIO=smoke \\
                                  -e K6_BASE_URL=${K6_BASE_URL} \\
                                  --out json=backend/k6/results/${baseName}_results.json \\
                                  backend/k6/${testScript}
                            """
                        )
                        if (result != 0) {
                            echo "k6: ${testScript} reporto fallos en umbrales de SLA"
                            k6Failed = true
                        }
                    }

                    sh '''
                        if [ -f /tmp/backend_pid.txt ]; then
                            kill $(cat /tmp/backend_pid.txt) 2>/dev/null || true
                            rm /tmp/backend_pid.txt
                        fi
                    '''

                    if (k6Failed) {
                        unstable('Una o mas pruebas k6 no superaron los umbrales de SLA definidos.')
                    } else {
                        echo 'Todas las pruebas k6 pasaron los umbrales de rendimiento.'
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend/k6/results/*.json', allowEmptyArchive: true
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // ETAPA 11: Playwright — Pruebas de regresión E2E
        //   Levanta backend + frontend (dist servido con npx serve),
        //   ejecuta los 5 specs en Chromium headless, luego apaga los servicios.
        // ──────────────────────────────────────────────────────────────────────
        stage('Regression Tests: Playwright E2E') {
            steps {
                script {
                    echo 'Levantando servicios para pruebas E2E...'

                    // Backend
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        cd backend
                        NODE_ENV=test GMAIL_USER=test@tierraencalma.com GMAIL_PASS=dummy node server.js &
                        echo $! > /tmp/e2e_backend_pid.txt
                        sleep 5
                    '''

                    // Frontend (sirve el build de Angular)
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        cd frontend
                        npx --yes serve -s dist/frontend -l 4200 &
                        echo $! > /tmp/e2e_frontend_pid.txt
                        sleep 8
                    '''

                    // Instalar navegadores Playwright
                    sh '''
                        export NVM_DIR="$NVM_DIR"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        cd frontend
                        npx playwright install --with-deps chromium
                    '''

                    // Ejecutar pruebas E2E (solo Chromium en CI)
                    def e2eResult = sh(
                        returnStatus: true,
                        script: '''
                            export NVM_DIR="$NVM_DIR"
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            nvm use ${NODE_VERSION}

                            cd frontend
                            CI=true npx playwright test \\
                              --project=chromium \\
                              --reporter=html,junit \\
                              --output=test-results
                        '''
                    )

                    // Apagar servicios
                    sh '''
                        for PID_FILE in /tmp/e2e_backend_pid.txt /tmp/e2e_frontend_pid.txt; do
                            if [ -f "$PID_FILE" ]; then
                                kill $(cat "$PID_FILE") 2>/dev/null || true
                                rm "$PID_FILE"
                            fi
                        done
                    '''

                    if (e2eResult != 0) {
                        error('Las pruebas de regresion Playwright fallaron. Revisa el reporte HTML.')
                    } else {
                        echo 'Todas las pruebas de regresion Playwright pasaron correctamente.'
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'frontend/test-results/**/*.xml'
                    // Archivar reporte HTML de Playwright y evidencias de fallos
                    archiveArtifacts artifacts: 'frontend/playwright-report/**',
                                     allowEmptyArchive: true
                    archiveArtifacts artifacts: 'frontend/test-results/**/*.png,frontend/test-results/**/*.webm',
                                     allowEmptyArchive: true
                }
            }
        }

    } // end stages

    // ── Post pipeline global ───────────────────────────────────────────────────
    post {
        success {
            echo "PIPELINE OK — Build #${env.BUILD_NUMBER} | Backend: ${DOCKER_BACKEND_IMAGE}:${DOCKER_TAG} | Frontend: ${DOCKER_FRONTEND_IMAGE}:${DOCKER_TAG}"
        }
        failure {
            echo 'El pipeline fallo. Revisa los logs y los reportes publicados.'
        }
        unstable {
            echo 'El pipeline termino en estado UNSTABLE (umbrales k6).'
        }
        always {
            cleanWs()
        }
    }

} // end pipeline

// =============================================================
//  FUNCION UTILITARIA: parseLcovCoverage
//  Lee un archivo lcov.info y retorna el porcentaje de lineas
//  cubiertas: round(LH / LF * 100)
// =============================================================
def parseLcovCoverage(String lcovPath) {
    def lf = 0
    def lh = 0

    if (!fileExists(lcovPath)) {
        echo "No se encontro el archivo de cobertura: ${lcovPath}"
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
