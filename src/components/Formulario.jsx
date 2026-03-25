// src/components/Formulario.jsx
import { useState } from "react";
import "./Formulario.css";

function Formulario() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [respuestaServer, setRespuestaServer] = useState("");

  // ✅ USA LA NUEVA URL DE GOOGLE APPS SCRIPT (SIN PROXY)
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxRlPmlNzgV5ESDD-J1YAgGftZxRCZa3gCschQXurpaKlbZpzqEvcAczOyabMiRIaqEZg/exec";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setRespuestaServer("");

    try {
      setCargando(true);
      setError(null);

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(formData),
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Obtener el texto de la respuesta
      const responseText = await response.text();
      console.log("Respuesta del servidor:", responseText);

      // Intentar parsear como JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Si no es JSON, guardar el texto y mostrar mensaje
        setRespuestaServer(responseText);
        throw new Error("El servidor devolvió una respuesta inesperada" + e.Error);
      }

      setRespuestaServer(JSON.stringify(data));

      // Procesar la respuesta según su contenido
      if (data.success) {
        setEnviado(true);
        setFormData({ nombre: "", email: "", mensaje: "" });
        setTimeout(() => setEnviado(false), 3000);
        console.log("Formulario enviado con éxito");
      } else {
        setError(data.error || "Error desconocido al guardar");
      }
    } catch (err) {
      console.error("Error completo:", err);
      setError(err.message || "Error de conexión");

      // Opcional: Mostrar un mensaje más amigable
      if (err.message.includes("Failed to fetch")) {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="formulario-container">

      {enviado && (
        <div className="mensaje-exito">
          ✅ ¡Formulario enviado con éxito a Google Sheets!
        </div>
      )}

      {error && <div className="mensaje-error">❌ {error}</div>}

      {respuestaServer && (
        <div className="info-depuracion">
          <small>Respuesta del servidor: {respuestaServer}</small>
        </div>
      )}

      <label className="campo">Datos del repuesto</label>

      <form onSubmit={handleSubmit} className="formulario">
        <div className="campo">
          <label>Nombre del usuario:</label>
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

        <button type="submit" className="boton-enviar" disabled={cargando}>
          {cargando ? "⏳ Enviando..." : "📤 Enviar formulario"}
        </button>
      </form>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p>📌 Modo: CORS habilitado (sin proxy, sin no-cors)</p>
      </div>
    </div>
  );
}

export default Formulario;
