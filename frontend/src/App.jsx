import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const API_BASE_URL = 'http://192.168.10.191:3000'; // <--- CAMBIAR SOLO AQUÍ
const socket = io(API_BASE_URL);

function App() {
  const [modo, setModo] = useState('menu');
  const [palabraSecreta, setPalabraSecreta] = useState('');
  const [letrasAdivinadas, setLetrasAdivinadas] = useState([]);
  const [vidas, setVidas] = useState(5);
  const [mensaje, setMensaje] = useState('');
  const [nuevaP, setNuevaP] = useState('');
  const [salaId, setSalaId] = useState('');
  const [inputSala, setInputSala] = useState('');
  const [esMiTurno, setEsMiTurno] = useState(false);
  // Nuevo estado para la lista del diccionario
  const [listaPalabras, setListaPalabras] = useState([]);

  const palabraRef = useRef('');
  const letrasRef = useRef([]);

  const filasTeclado = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Z", "X", "C", "V", "B", "N", "M"]
  ];

  useEffect(() => {
    palabraRef.current = palabraSecreta;
    letrasRef.current = letrasAdivinadas;
  }, [palabraSecreta, letrasAdivinadas]);

  // Cargar palabras cuando se entra al modo diccionario
  useEffect(() => {
    if (modo === 'agregar') {
      obtenerPalabras();
    }
  }, [modo]);

  const obtenerPalabras = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/palabras`); // <--- CAMBIAR IP AQUÍ
      const data = await res.json();
      setListaPalabras(data);
    } catch (error) {
      console.error("Error al obtener palabras:", error);
    }
  };

  useEffect(() => {
    socket.on('sala-creada', (data) => {
      setSalaId(data.salaId);
      setPalabraSecreta(data.palabra);
      setModo('esperando');
    });

    socket.on('juego-iniciado', (data) => {
      setPalabraSecreta(data.palabra);
      setSalaId(data.salaId);
      setLetrasAdivinadas([]);
      setVidas(5);
      setModo('multi');
      setEsMiTurno(socket.id === data.idCreador);
      setMensaje('');
    });

    socket.on('actualizar-juego', (data) => {
      const { letra, siguienteTurnoId } = data;
      if (letrasRef.current.includes(letra)) return;

      setLetrasAdivinadas(prev => [...prev, letra]);

      if (!palabraRef.current.includes(letra)) {
        if (socket.id !== siguienteTurnoId) {
          setVidas(v => (v > 0 ? v - 1 : 0));
        }
      }

      setEsMiTurno(socket.id === siguienteTurnoId);
    });

    socket.on('oponente-gano', () => {
      setMensaje("🚩 ¡TU OPONENTE GANÓ!");
      setVidas(0);
    });

    return () => socket.off();
  }, []);

  useEffect(() => {
    if (palabraSecreta && letrasAdivinadas.length > 0) {
      const completa = palabraSecreta.split('').every(l => letrasAdivinadas.includes(l));

      if (vidas === 0) {
        setMensaje("¡HAS PERDIDO! 💀");
      } else if (completa) {
        setMensaje("¡GANASTE! 🎉");
        if (modo === 'multi' && !esMiTurno) socket.emit('gane', salaId);
      }
    }
  }, [letrasAdivinadas, palabraSecreta, vidas, modo, esMiTurno, salaId]);

  const enviarLetra = (l) => {
    if (modo === 'multi') {
      if (!esMiTurno || vidas === 0 || mensaje !== '') return;
      socket.emit('letra-tirada', { salaId, letra: l });
    } else {
      if (letrasAdivinadas.includes(l) || vidas === 0 || mensaje !== '') return;
      setLetrasAdivinadas(prev => [...prev, l]);
      if (!palabraSecreta.includes(l)) setVidas(v => v - 1);
    }
  };

  const iniciarSolo = async () => {
    const res = await fetch(`${API_BASE_URL}/api/palabra-azar`); // <--- CAMBIAR IP AQUÍ
    const data = await res.json();
    setPalabraSecreta(data.palabra);
    setLetrasAdivinadas([]);
    setVidas(5);
    setMensaje('');
    setEsMiTurno(true);
    setModo('jugando');
  };

  const estiloBase = {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #0A192F 0%, #112240 50%, #1B3358 100%)',
    color: '#E0E0E0',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '24px 16px 60px',
    overflowX: 'hidden',
  };

  const estiloTitulo = {
    fontSize: 'clamp(36px, 10vw, 90px)',
    fontWeight: '900',
    color: '#D1D1D1',
    textTransform: 'uppercase',
    margin: '0 0 40px 0',
    letterSpacing: '4px',
    lineHeight: '1',
    textAlign: 'center',
    textShadow: '0 4px 10px rgba(0,0,0,0.35)',
  };

  const estiloBtn = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 24px',
    margin: '8px 0',
    fontSize: 'clamp(16px, 4vw, 20px)',
    fontWeight: 'bold',
    backgroundColor: '#7D92B3',
    color: '#000',
    border: '3px solid #000',
    borderRadius: '35px',
    cursor: 'pointer',
    width: 'min(320px, 85vw)',
    textTransform: 'uppercase',
    boxShadow: '0 5px 12px rgba(0,0,0,0.25)',
  };

  const estiloInput = {
    padding: '12px',
    fontSize: 'clamp(16px, 4vw, 20px)',
    backgroundColor: '#3B4F7D',
    border: '3px solid #000',
    borderRadius: '5px',
    color: '#fff',
    width: 'min(220px, 60vw)',
    fontWeight: 'bold',
    textAlign: 'center',
    boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
  };

  const estiloTecla = (presionada, deshabilitada) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'clamp(28px, 8.5vw, 52px)',
    height: 'clamp(28px, 8.5vw, 52px)',
    margin: 'clamp(1px, 0.6vw, 4px)',
    fontSize: 'clamp(11px, 3.2vw, 18px)',
    fontWeight: 'bold',
    backgroundColor: presionada ? '#111' : '#7D92B3',
    color: presionada ? '#444' : '#000',
    border: '2px solid #000',
    borderRadius: '8px',
    cursor: deshabilitada ? 'default' : 'pointer',
    opacity: deshabilitada ? 0.6 : 1,
    flexShrink: 0,
    padding: 0,
    boxSizing: 'border-box',
    boxShadow: presionada
      ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
      : '0 3px 8px rgba(0,0,0,0.25)',
    transition: 'all 0.2s ease',
  });

  const estiloTeclado = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(2px, 0.8vw, 6px)',
    marginBottom: '24px',
    width: '100%',
  };

  const estiloFila = {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  };

  const estiloPalabra = {
    letterSpacing: 'clamp(4px, 1.5vw, 16px)',
    fontSize: 'clamp(28px, 7vw, 80px)',
    margin: '20px 0',
    fontWeight: 'bold',
    wordBreak: 'break-all',
    textAlign: 'center',
    maxWidth: '95vw',
    textShadow: '0 2px 6px rgba(0,0,0,0.3)',
  };

  const estiloCorazones = {
    display: 'flex',
    gap: 'clamp(6px, 2vw, 14px)',
    marginBottom: '20px',
    justifyContent: 'center',
  };

  const estiloFooter = {
    position: 'fixed',
    bottom: '12px',
    width: '100%',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: '500',
    color: '#8FA6C7',
    letterSpacing: '0.5px',
    pointerEvents: 'none',
  };

  const estiloCajaDiccionario = {
    background: 'rgba(125, 146, 179, 0.12)',
    border: '2px solid rgba(125, 146, 179, 0.35)',
    width: 'min(500px, 90vw)',
    height: '220px',
    overflowY: 'auto',
    marginTop: '14px',
    padding: '14px',
    textAlign: 'left',
    borderRadius: '14px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(6px)',
  };

  return (
    <div style={estiloBase}>

      {/* ── MENÚ ── */}
      {modo === 'menu' && (
        <>
          {/* IMAGEN DEL AHORCADO */}
          <img 
            src="/ahorcado.png" 
            alt="Logo Ahorcado" 
            style={{ 
              width: '120px',   
              height: 'auto', 
              marginBottom: '10px',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' // Sombra para que resalte
            }} 
          />

          <h1 style={estiloTitulo}>AHORCADO</h1>
          <button className="btn-menu" onClick={iniciarSolo}>JUGAR SOLO</button>
          <button className="btn-menu" onClick={() => setModo('menu-multi')}>MULTIJUGADOR</button>
          <button className="btn-menu" onClick={() => setModo('agregar')}>DICCIONARIO</button>
        </>
      )}

      {/* ── MENÚ MULTI ── */}
      {modo === 'menu-multi' && (
        <>
          {/* IMAGEN MULTIJUGADOR */}
          <img 
            src="/multijugador.png" 
            alt="Icono Multijugador" 
            style={{ 
              width: '130px', 
              height: 'auto', 
              marginBottom: '10px',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'
            }} 
          />

          <h1 style={estiloTitulo}>MULTIJUGADOR</h1>
          <button className="btn-menu" onClick={() => socket.emit('crear-sala')}>CREAR SALA</button>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <input style={estiloInput} value={inputSala} onChange={(e) => setInputSala(e.target.value)} placeholder="CÓDIGO" />
          <button className="btn-menu" style={{ width: '160px' }} onClick={() => socket.emit('unirse-sala', inputSala)}>UNIRSE</button>
          </div>
          <button className="btn-menu" onClick={() => setModo('menu')}>VOLVER</button>
        </>
      )}

      {/* ── ESPERANDO ── */}
      {modo === 'esperando' && (
        <>
          <h1 style={estiloTitulo}>SALA CREADA</h1>
          <h2 style={{ fontSize: 'clamp(48px, 14vw, 88px)', color: 'cyan', margin: '16px 0', textAlign: 'center' }}>{salaId}</h2>
          <p style={{ fontSize: 'clamp(16px, 4vw, 22px)', textAlign: 'center' }}>Esperando oponente...</p>
        </>
      )}

      {/* ── JUEGO ── */}
      {(modo === 'jugando' || modo === 'multi') && (
        <>
          {/* IMAGEN DEL AHORCADO PARA LA PANTALLA DE JUEGO */}
          <img 
            src="/ahorcado1.png" 
            alt="Ilustración Ahorcado" 
            style={{ 
              width: '100px',    
              height: 'auto', 
              marginBottom: '10px',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' 
            }} 
          />

          <h1 style={{ ...estiloTitulo, fontSize: 'clamp(28px, 7vw, 65px)', marginBottom: '16px' }}>AHORCADO</h1>

          <div style={estiloCorazones}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ fontSize: 'clamp(28px, 7vw, 56px)', filter: i < vidas ? 'none' : 'grayscale(100%) opacity(0.2)' }}>
                ❤️
              </span>
            ))}
          </div>

          <h2 style={estiloPalabra}>
            {palabraSecreta.split('').map((l, i) => (
              <span key={i} style={{ display: 'inline-block', minWidth: 'clamp(18px, 5vw, 50px)', textAlign: 'center' }}>
                {letrasAdivinadas.includes(l) ? l : '_'}
              </span>
            ))}
          </h2>

          <div style={estiloTeclado}>
            {filasTeclado.map((fila, i) => (
              <div key={i} style={estiloFila}>
                {fila.map(l => (
                  <button
                    key={l}
                    onClick={() => enviarLetra(l)}
                    disabled={(modo === 'multi' && !esMiTurno) || letrasAdivinadas.includes(l) || vidas === 0 || mensaje !== ''}
                    style={estiloTecla(letrasAdivinadas.includes(l), (modo === 'multi' && !esMiTurno) || vidas === 0 || mensaje !== '')}
                  >{l}</button>
                ))}
              </div>
            ))}
          </div>

          {modo === 'multi' && !mensaje && (
            <div style={{ marginBottom: '16px', color: esMiTurno ? '#4CAF50' : '#FF9800', fontWeight: 'bold', fontSize: 'clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
              {esMiTurno ? "● TU TURNO" : "○ ESPERANDO RIVAL..."}
            </div>
          )}

          <h2 style={{ color: vidas > 0 ? '#FFD700' : '#FF4444', fontSize: 'clamp(22px, 5vw, 40px)', margin: '12px 0', fontWeight: 'bold', textAlign: 'center' }}>{mensaje}</h2>
          {vidas === 0 && <h3 style={{ color: '#ff4444', fontSize: 'clamp(14px, 3.5vw, 20px)', marginBottom: '16px', textAlign: 'center' }}>LA PALABRA ERA: {palabraSecreta}</h3>}

          <button className="btn-menu" onClick={() => window.location.reload()}>VOLVER AL MENÚ</button>
        </>
      )}

     {/* ── DICCIONARIO ── */}
{modo === 'agregar' && (
  <>
    {/* IMAGEN DEL DICCIONARIO */}
    <img 
      src="/diccionario.png" 
      alt="Icono Diccionario" 
      style={{ 
        width: '110px',    
        height: 'auto', 
        marginBottom: '10px',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
      }} 
    />

    <h1 style={estiloTitulo}>DICCIONARIO</h1>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '10px 0' }}>
      <input style={estiloInput} value={nuevaP} onChange={(e) => setNuevaP(e.target.value)} placeholder="Palabra..." />
      
      {/* BOTÓN GUARDAR */}
      <button className="btn-menu" style={{ width: 'min(160px, 40vw)', margin: 0 }} onClick={async () => {
        const res = await fetch(`${API_BASE_URL}/api/palabras`, { // <--- USAR TU CONSTANTE DE IP
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nuevaPalabra: nuevaP })
        });
        const d = await res.json(); 
        alert(d.message); 
        setNuevaP('');
        obtenerPalabras(); 
      }}>Guardar</button>
    </div>

    <p style={{ color: '#7D92B3', marginBottom: '5px' }}>Palabras en el diccionario:</p>
    
    <div style={estiloCajaDiccionario}>
      {listaPalabras.map((p, index) => (
        <div key={index} style={{ 
              color: '#E0E0E0',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s ease' }}>
          {p}
        </div>
      ))}
    </div>

    {/* BOTÓN VOLVER:*/}
    <button className="btn-menu" style={{ width: 'min(160px, 40vw)', marginTop: '40px' }} onClick={() => setModo('menu')}>VOLVER</button>
  </>
)}

      <div style={estiloFooter}>
        Desarrollado por: Marvin Asencio - Compiladores 2026
      </div>
    </div>
  );
}

export default App;