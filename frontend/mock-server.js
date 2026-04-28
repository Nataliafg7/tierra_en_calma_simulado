const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Configurar CORS para que Angular lo acepte
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Rutas mockeadas según las necesidades de los tests de Katalon
  if (req.url.includes('/api/contacto')) {
    res.writeHead(200);
    res.end(JSON.stringify({ message: 'Mensaje enviado' }));
    
  } else if (req.url.includes('/api/login')) {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      user: { ID_USUARIO: 1, NOMBRE: 'Natalia', CORREO_ELECTRONICO: 'test@test.com' } 
    }));
    
  } else if (req.url.includes('/api/mis-plantas')) {
    res.writeHead(200);
    res.end(JSON.stringify([
      { ID_PLANTA_USUARIO: 1, NOMBRE_COMUN: 'Helecho' }
    ]));
    
  } else if (req.url.includes('/api/monitorear')) {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, id_sensor: 'TEST-SENSOR-123' }));
    
  } else if (req.url.includes('/api/datos')) {
    res.writeHead(200);
    res.end(JSON.stringify({ dato: 'T:22.0, H:45.0' })); // o T:25.0, H:60.0 según el test
    
  } else if (req.url.includes('/api/historial')) {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      historial: [{ TEMPERATURA: 22, HUMEDAD: 45, FECHA_HORA: new Date().toISOString() }] 
    }));
    
  } else if (req.url.includes('/api/verificar-condiciones')) {
    res.writeHead(200);
    // Para el test 2 de F5 puedes cambiar esto a "Riego automático..." si lo necesitas
    res.end(JSON.stringify({ ok: true, mensaje: 'Verificación exitosa' }));
    
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint no encontrado en el mock server' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Mock server corriendo en http://localhost:${PORT}`);
  console.log('Este servidor no requiere dependencias y responde a las siguientes rutas:');
  console.log('  POST /api/contacto');
  console.log('  POST /api/login');
  console.log('  GET  /api/mis-plantas');
  console.log('  POST /api/monitorear');
  console.log('  GET  /api/datos');
  console.log('  GET  /api/historial');
  console.log('  POST /api/verificar-condiciones\n');
});
