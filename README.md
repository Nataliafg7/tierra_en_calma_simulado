# Tierra en Calma — Monitoreo y riego de plantas (IoT)
Este repositorio contiene un sistema IoT diseñado para el *monitoreo en tiempo real de la humedad del suelo* y el *control de riego de plantas*.
El sistema integra *Frontend, Backend, Base de Datos Oracle XE* y soporte de mensajería mediante *MQTT*.

## 1. Tecnologías y versiones utilizadas

| Componente    | Tecnología           | Versión recomendada |
| ------------- | -------------------- | ------------------- |
| Frontend      | Angular              | 17.x (mínimo 16)    |
| Frontend      | Node.js (para build) | 18.x                |
| Frontend      | Chart.js             | 4.x                 |
| Backend       | Node.js              | 18.x                |
| Backend       | Express              | 4.x                 |
| Backend       | oracledb (modo thin) | 6.x                 |
| Backend       | mqtt (paquete npm)   | 4.x                 |
| Base de datos | Oracle XE            | 21c                 |
| Contenedores  | Docker Desktop       | ≥ 4.x               |
| Orquestación  | Docker Compose       | v2                  |

## 2. Estructura del repositorio

```plaintext
tierra_calma_electronica/  
├─ backend/    
│  ├─ node_modules/           # Dependencias instaladas con npm  
│  ├─ .dockerignore           # Archivos/carpetas ignorados en la imagen Docker  
│  ├─ Dockerfile              # Configuración del contenedor Docker del backend  
│  ├─ package-lock.json       # Dependencias bloqueadas del backend  
│  ├─ package.json            # Dependencias y scripts del backend  
│  ├─ server.js               # Punto de entrada del servidor Node.js (Express/MQTT/Oracle)  
│  └─ swagger.yaml            # Documentación de la API en formato Swagger/OpenAPI  
│
├─ frontend/ 
│  ├─ .vscode/                # Configuración de VSCode  
│  ├─ public/                 # Archivos estáticos del frontend  
│  ├─ src/                    # Código fuente de la aplicación Angular  
│  ├─ .dockerignore           # Archivos/carpetas ignorados en la imagen Docker  
│  ├─ .editorconfig           # Reglas de formato de código  
│  ├─ .gitignore              # Archivos ignorados por git  
│  ├─ Dockerfile              # Configuración del contenedor Docker del frontend  
│  ├─ README.md               # Documentación del frontend  
│  ├─ angular.json            # Configuración de Angular CLI  
│  ├─ nginx.conf              # Configuración de Nginx para servir Angular  
│  ├─ package-lock.json       # Dependencias bloqueadas del frontend  
│  ├─ package.json            # Dependencias y scripts del frontend  
│  ├─ tsconfig.app.json       # Configuración de TypeScript para la app  
│  ├─ tsconfig.json           # Configuración global de TypeScript  
│  └─ tsconfig.spec.json      # Configuración de pruebas en TypeScript  
│
│
├─ docker-compose.yml         # Orquestación de servicios (backend, frontend, etc.)  
└─ README.md                  # Documentación general del proyecto        
```

## 3. Descarga del proyecto

Clonar el repositorio desde GitHub:

bash
git clone https://github.com/<usuario>/<repositorio>.git
cd tierra_calma_electronica

También es posible usar imágenes publicadas en Docker Hub:

bash
docker pull <usuario>/tierra-backend:v5
docker pull <usuario>/tierra-frontend:v8

## 4. Requisitos de instalación y ejecución

### 4.1 Ejecución local sin Docker

* Node.js 18 instalado.
* Angular CLI instalado globalmente:

  bash
  npm install -g @angular/cli
  
* Oracle XE 21c instalado localmente o acceso a un Oracle remoto.
* Broker MQTT accesible con credenciales válidas.

### 4.2 Ejecución con Docker

* Docker Desktop instalado.
* Docker Compose v2 instalado.
* Puertos disponibles en el host:

  * 4200 → Frontend
  * 3001 → Backend

## 5. Variables de entorno del Backend

El archivo backend/.env debe contener:


* Configuración MQTT

MQTT_BROKER=mqtt://tierra.cloud.shiftr.io

MQTT_USER=tierra

MQTT_PASS=**************

MQTT_TOPIC=plantas/datos

* Configuración Oracle

ORACLE_USER=tierra_en_calma

ORACLE_PASS=*****

ORACLE_CONN=host.docker.internal:1521/XEPDB1


## 6. Instalación y ejecución local

### 6.1 Backend

bash
cd backend
npm install
npm start

La API queda disponible en http://localhost:3001.

Prueba rápida:

bash
curl http://localhost:3001/api-docs/ -> despliega la interfaz interactiva de Swagger donde se pueden probar todos los endpoints de forma gráfica
curl http://localhost:3001/api/datos -> retorna el último dato recibido por el backend desde el broker MQTT
curl http://localhost:3001/api/historial -> retorna un arreglo con todos los datos recibidos durante la ejecución del backend, útil para análisis o visualización de tendencias.

### 6.2 Frontend

bash
cd frontend
npm install
ng serve -o

La aplicación se abre en http://localhost:4200.

## 7. Ejecución con Docker Compose

1. Construir y levantar los servicios:

   bash
   docker compose up -d --build
   
2. Acceder a los servicios:

   * Frontend → http://localhost:4200
   * Backend → http://localhost:3001

3. Consultar logs para verificar estado:

   bash
   docker compose logs -f backend
   docker compose logs -f frontend

## 8. Inicialización de la base de datos

El backend se conecta directamente a una base de datos Oracle ya existente, no se levanta un contenedor adicional para la BD.
El backend insertará y consultará registros en estas tablas a través de los endpoints /register, /login, /registrar-planta, etc.

Tablas principales:

* USUARIOS(ID_USUARIO, NOMBRE, APELLIDO, TELEFONO, CORREO_ELECTRONICO, CONTRASENA)
* PLANTAS_USUARIO(ID_PLANTA, ID_USUARIO, ESTADO)

## 9. Endpoints principales de la API

* POST /api/register → Registro de usuario.
* POST /api/login → Inicio de sesión.
* POST /api/registrar-planta → Asociación de planta a usuario.
* GET /api/datos → Último dato MQTT recibido.
* GET /api/historial → Historial completo de datos MQTT.

## 10. Flujo de prueba recomendado

1. Levantar el sistema con Docker Compose:

   bash
   docker compose up -d
   
2. Registrar un usuario mediante POST /api/register.
3. Iniciar sesión mediante POST /api/login.
4. Registrar una planta mediante POST /api/registrar-planta.
5. Visualizar datos de humedad y control de riego en el frontend (http://localhost:4200).












