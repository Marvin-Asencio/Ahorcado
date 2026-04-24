const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const lexer = require('./lexer'); 
const parser = require('./parser'); 

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ==========================================
// CONFIGURACIÓN DE SQLITE 
// ==========================================
const dbPath = 'E:/Ingeniería en Sistemas/VII Semestre/Compiladores/ahorcado.db';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error al abrir la BD:", err.message);
    else console.log("Conectado a SQLite en:", dbPath);
});

// Crear tabla y migrar datos iniciales
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS diccionario (id INTEGER PRIMARY KEY AUTOINCREMENT, palabra TEXT UNIQUE)");
    
    const WORDS_FILE = path.join(__dirname, 'words.json');
    if (fs.existsSync(WORDS_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(WORDS_FILE, 'utf8'));
            const stmt = db.prepare("INSERT OR IGNORE INTO diccionario (palabra) VALUES (?)");
            data.forEach(w => {
                if (w) stmt.run(w.trim().toUpperCase()); // Normalización en migración
            });
            stmt.finalize();
        } catch (e) { console.log("Nota: JSON ya procesado."); }
    }
});

const salas = {}; 

// ==========================================
// ENDPOINTS DE LA API
// ==========================================

// 1. Obtener palabras en ORDEN ALFABÉTICO
app.get('/api/palabras', (req, res) => {
    // "ORDER BY palabra ASC" garantiza el orden de la A a la Z
    db.all("SELECT palabra FROM diccionario ORDER BY palabra ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => row.palabra));
    });
});

// 2. Palabra al azar para el juego
app.get('/api/palabra-azar', (req, res) => {
    db.get("SELECT palabra FROM diccionario ORDER BY RANDOM() LIMIT 1", (err, row) => {
        if (err || !row) return res.json({ palabra: "AHORCADO" });
        res.json({ palabra: row.palabra });
    });
});

// 3. Guardar palabra (Validada y en MAYÚSCULAS)
app.post('/api/palabras', (req, res) => {
    const { nuevaPalabra } = req.body;
    
    // Normalización inmediata
    const palabraLimpia = nuevaPalabra?.trim().toUpperCase();

    if (!palabraLimpia) return res.status(400).json({ message: "La palabra no puede estar vacía" });

    // Lógica de Compiladores (Lexer y Parser)
    const tokens = lexer.tokenize(palabraLimpia);
    if (tokens.error) return res.status(400).json({ message: tokens.error });
    
    const verificacion = parser.parse(tokens, palabraLimpia);
    if (verificacion.error) return res.status(400).json({ message: verificacion.error });

    // Guardar en la BD
    db.run("INSERT INTO diccionario (palabra) VALUES (?)", [palabraLimpia], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ message: "Esa palabra ya existe en el diccionario" });
            return res.status(500).json({ message: "Error interno al guardar" });
        }
        res.json({ message: "Palabra guardada correctamente" });
    });
});

// ==========================================
// SOCKET.IO
// ==========================================
io.on('connection', (socket) => {
    socket.on('crear-sala', () => {
        const salaId = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        db.get("SELECT palabra FROM diccionario ORDER BY RANDOM() LIMIT 1", (err, row) => {
            const palabra = row ? row.palabra : "AHORCADO";
            socket.join(salaId);
            salas[salaId] = { palabra, jugadores: [socket.id], turnoActual: socket.id };
            socket.emit('sala-creada', { salaId, palabra });
        });
    });

    socket.on('unirse-sala', (idRecibido) => {
        const id = idRecibido?.toUpperCase().trim();
        const sala = salas[id];
        if (sala && sala.jugadores.length < 2) {
            socket.join(id);
            if (!sala.jugadores.includes(socket.id)) sala.jugadores.push(socket.id);
            io.to(id).emit('juego-iniciado', { 
                palabra: sala.palabra, 
                idCreador: sala.jugadores[0],
                salaId: id
            });
        } else { socket.emit('error-sala', 'Sala no válida o llena'); }
    });

    socket.on('letra-tirada', ({ salaId, letra }) => {
        const sala = salas[salaId];
        if (sala && socket.id === sala.turnoActual) {
            const siguienteId = sala.jugadores.find(id => id !== socket.id);
            sala.turnoActual = siguienteId;
            io.to(salaId).emit('actualizar-juego', { letra, siguienteTurnoId: siguienteId });
        }
    });

    socket.on('gane', (salaId) => { socket.to(salaId).emit('oponente-gano'); });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor con SQLite corriendo en puerto 3000');
});