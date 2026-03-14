// src/components/Formulario.jsx
import { useState } from 'react';
import './Formulario.css';

function Formulario() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  });
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [respuestaServer, setRespuestaServer] = useState('');

  // ✅ USA LA NUEVA URL DE GOOGLE APPS SCRIPT (SIN PROXY)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxRlPmlNzgV5ESDD-J1YAgGftZxRCZa3gCschQXurpaKlbZpzqEvcAczOyabMiRIaqEZg/exec';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setRespuestaServer('');
    
    try {
      // Opción A: Enviar como JSON (recomendado)
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors', // ← NO USAR no-cors
        headers: {
          'Content-Type': 'application/json', // ← Importante
        },
        body: JSON.stringify(formData) // ← Enviar como JSON
      });
      
      // Intentar leer la respuesta
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      setRespuestaServer(JSON.stringify(data));
      
      if (data.success) {
        setEnviado(true);
        setFormData({ nombre: '', email: '', mensaje: '' });
        setTimeout(() => setEnviado(false), 3000);
      } else {
        setError('Error: ' + (data.error || 'No se pudo guardar'));
      }
      
    } catch (err) {
      console.error('Error completo:', err);
      setError('Error de conexión: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="formulario-container">
      <h1>Formulario de Contacto</h1>
      
      {enviado && (
        <div className="mensaje-exito">
          ✅ ¡Formulario enviado con éxito a Google Sheets!
        </div>
      )}
      
      {error && (
        <div className="mensaje-error">
          ❌ {error}
        </div>
      )}
      
      {respuestaServer && (
        <div className="info-depuracion">
          <small>Respuesta del servidor: {respuestaServer}</small>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="formulario">
        <div className="campo">
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={cargando}
            required
          />
        </div>

        <div className="campo">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={cargando}
            required
          />
        </div>

        <div className="campo">
          <label>Mensaje:</label>
          <textarea
            name="mensaje"
            value={formData.mensaje}
            onChange={handleChange}
            rows="4"
            disabled={cargando}
            required
          />
        </div>

        <button 
          type="submit" 
          className="boton-enviar"
          disabled={cargando}
        >
          {cargando ? '⏳ Enviando...' : '📤 Enviar formulario'}
        </button>
      </form>
      
      <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
        <p>📌 Modo: CORS habilitado (sin proxy, sin no-cors)</p>
      </div>
    </div>
  );
}

export default Formulario;