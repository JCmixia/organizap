// src/components/Formulario.jsx
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Plantilla de un ítem (solo datos del equipo)
const itemVacio = {
  tipoEquipo: "",
  codigo: "",
  marca: "",
  cantidad: 1,
};

function Formulario() {
  // Datos de la boleta (una sola vez)
  const [boleta, setBoleta] = useState({
    fecha: "",
    colaborador: "",
    carne: "",
  });

  // Ítems de la boleta (uno o varios)
  const [items, setItems] = useState([{ ...itemVacio }]);

  // --- Handlers de boleta ---
  const handleBoletaChange = (e) => {
    const { name, value } = e.target;
    setBoleta((prev) => ({ ...prev, [name]: value }));
  };

  // --- Handlers de ítems ---
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [field]: value };
      return copia;
    });
  };

  const agregarItem = () => {
    setItems((prev) => [...prev, { ...itemVacio }]);
  };

  const eliminarItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Convierte "2026-08-13" → "13 DE AGOSTO DEL 2026"
  function fechaEnLetras(fechaISO) {
    if (!fechaISO) return "";

    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
    ];

    // Separamos manualmente para evitar desfases por zona horaria
    // (new Date("2026-08-13") puede interpretarse como UTC y restar un día)
    const [anio, mes, dia] = fechaISO.split("-");
    const mesNombre = meses[Number(mes) - 1];

    return `${Number(dia)} DE ${mesNombre} DEL ${anio}`;
  }

  // --- Generar PDF ---
  const generarPDF = (e) => {
    e.preventDefault();

    // Validación mínima
    if (!boleta.fecha || !boleta.colaborador || !boleta.carne) {
      alert("Completa Fecha, Colaborador y Carné antes de generar la boleta.");
      return;
    }
    const hayItems = items.some(
      (it) => it.tipoEquipo || it.codigo || it.marca
    );
    if (!hayItems) {
      alert("Agrega al menos un ítem con datos.");
      return;
    }

    // nueva validación de cantidades
    const cantidadesValidas = items.every(
      (it) => Number(it.cantidad) >= 1
    );
    if (!cantidadesValidas) {
      alert("Cada ítem debe tener una cantidad mayor o igual a 1.");
      return;
    }

    const doc = new jsPDF();

    // --- Encabezado ---
    doc.setFontSize(16);
    doc.text("Carta de Responsabilidad de Materiales", 14, 20);

    // --- Datos de la boleta ---
    doc.setFontSize(10);
    //doc.text(`Fecha: ${boleta.fecha}`, 14, 30);
    doc.text(`${fechaEnLetras(boleta.fecha)}`, 14, 30);
    //doc.text(`${boleta.colaborador}, `, 14, 36);
    //doc.text(`Carné: ${boleta.carne}`, 14, 42);

    // --- Párrafo de aceptación ---
    const parrafo = `A través de este documento yo, ${boleta.colaborador}, quién me identifico con el número de carné ${boleta.carne} acepto que recibo en buen estado el equipo detallado a continuación:`;

    // doc.splitTextToSize ajusta el texto al ancho de la página (A4 ≈ 210mm, márgenes 14mm → ~182mm útiles)
    const lineas = doc.splitTextToSize(parrafo, 180);

    // Imprime el bloque a partir de y=52
    doc.text(lineas, 14, 36);

    // Y calculamos dónde empieza la tabla (debajo del párrafo)
    const yTabla = 36 + lineas.length * 6 + 4;  // 6mm por línea aprox + margen

    // --- Tabla de ítems ---
    autoTable(doc, {
      startY: 50,
      head: [["#", "Tipo de equipo", "Código", "Marca", "Cantidad"]],
      body: items.map((it, i) => [
        i + 1,
        it.tipoEquipo,
        it.codigo,
        it.marca,
        it.cantidad,
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
      columnStyles: {
        4: { halign: "center", cellWidth: 22 },  // 👈 centrar la columna Cantidad
      },
    });

    // --- Pie: firma ---
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("_____________________________", 14, finalY);
    doc.text("Firma del colaborador", 14, finalY + 6);

    // --- Guardar ---
    doc.save(`boleta-${Date.now()}.pdf`);
  };

  return (
    <div>
      <h2>Carta de Responsabilidad de Materiales</h2>

      <form onSubmit={generarPDF}>
        {/* --- Datos de la boleta --- */}
        <fieldset
          style={{
            marginBottom: "20px",
            padding: "12px",
            border: "1px solid #999",
          }}
        >
          <legend>
            <strong>Datos de la boleta</strong>
          </legend>

          <div>
            <label>Fecha: </label>
            <input
              type="date"
              name="fecha"
              value={boleta.fecha}
              onChange={handleBoletaChange}
              required
            />
          </div>

          <div>
            <label>Colaborador: </label>
            <input
              type="text"
              name="colaborador"
              value={boleta.colaborador}
              onChange={handleBoletaChange}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div>
            <label>Carné: </label>
            <input
              type="text"
              name="carne"
              value={boleta.carne}
              onChange={handleBoletaChange}
              placeholder="Carné"
              required
            />
          </div>
        </fieldset>

        {/* --- Ítems --- */}
        <h3>Equipos entregados</h3>

        {items.map((item, index) => (
          <fieldset
            key={index}
            style={{
              marginBottom: "16px",
              padding: "12px",
              border: "1px solid #ccc",
            }}
          >
            <legend>
              <strong>Ítem #{index + 1}</strong>
            </legend>

            <div>
              <label>Tipo de equipo: </label>
              <input
                type="text"
                value={item.tipoEquipo}
                onChange={(e) =>
                  handleItemChange(index, "tipoEquipo", e.target.value)
                }
                placeholder="Ej. Memoria USB"
                required
              />
            </div>

            <div>
              <label>Código: </label>
              <input
                type="text"
                value={item.codigo}
                onChange={(e) =>
                  handleItemChange(index, "codigo", e.target.value)
                }
                placeholder="Código"
                required
              />
            </div>

            <div>
              <label>Marca: </label>
              <input
                type="text"
                value={item.marca}
                onChange={(e) =>
                  handleItemChange(index, "marca", e.target.value)
                }
                placeholder="Marca"
                required
              />
            </div>
            <div>
              <label>Cantidad: </label>
              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) =>
                  handleItemChange(index, "cantidad", e.target.value)
                }
                style={{ width: "80px" }}
                required
              />
            </div>

            <button
              type="button"
              onClick={() => eliminarItem(index)}
              disabled={items.length === 1}
              style={{ marginTop: "8px" }}
            >
              🗑️ Eliminar este ítem
            </button>
          </fieldset>
        ))}

        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button type="button" onClick={agregarItem}>
            ➕ Agregar otro elemento
          </button>

          <button type="submit">
            📄 Generar boleta PDF ({items.length} ítem
            {items.length !== 1 ? "s" : ""})
          </button>
        </div>
      </form>
    </div>
  );
}

export default Formulario;