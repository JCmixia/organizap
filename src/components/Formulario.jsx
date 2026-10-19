// src/components/Formulario.jsx
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../../public/logo.png";
import { SimpleSignature } from "react-simple-signature";
import "./Formulario.css"; // IMPORTAMOS LOS ESTILOS

// COMPONENTE AISLADO PARA LAS FIRMAS
function PadFirma({ titulo, signatureRef, onChange, onLimpiar }) {
  return (
    <div className="card signature-pad">
      <legend>{titulo}</legend>
      <SimpleSignature
        ref={signatureRef}
        onChange={onChange}
        width={400}
        height={150}
        strokeColor="#000"
      />
      <div style={{ marginTop: "10px" }}>
        <button type="button" className="btn btn-clear" onClick={onLimpiar}>
          Limpiar firma
        </button>
      </div>
    </div>
  );
}

const itemVacio = {
  descripcion: "",
  marca: "",
  cantidad: 1,
  observacion: "",
};

function Formulario() {
  const [boleta, setBoleta] = useState({
    fecha: "",
    colaborador: "",
    carne: "",
    nombreRecibe: "",
    nombreEntrega: "",
  });

  const [items, setItems] = useState([{ ...itemVacio }]);

  // --- Firma Recibe ---
  const [firmaBase64, setFirmaBase64] = useState("");
  const signatureRef = useRef(null);

  const handleSignature = (blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFirmaBase64(reader.result);
    };
    reader.readAsDataURL(blob);
  };

  const limpiarFirma = () => {
    signatureRef.current?.clear();
    setFirmaBase64("");
  };

  // --- Firma Entrega ---
  const [firmaEntregaBase64, setFirmaEntregaBase64] = useState("");
  const signatureEntregaRef = useRef(null);

  const handleSignatureEntrega = (blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFirmaEntregaBase64(reader.result);
    };
    reader.readAsDataURL(blob);
  };

  const limpiarFirmaEntrega = () => {
    signatureEntregaRef.current?.clear();
    setFirmaEntregaBase64("");
  };

  // --- Handlers ---
  const handleBoletaChange = (e) => {
    const { name, value } = e.target;
    setBoleta((prev) => ({ ...prev, [name]: value }));
  };

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

  // --- Utilidades ---
  function fechaEnLetras(fechaISO) {
    if (!fechaISO) return "";
    const meses = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
    ];
    const [anio, mes, dia] = fechaISO.split("-");
    const mesNombre = meses[Number(mes) - 1];
    return `${Number(dia)} DE ${mesNombre} DEL ${anio}`;
  }

  function cargarImagenLocal(ruta) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve({
          base64: canvas.toDataURL("image/png"),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => resolve(null);
      img.src = ruta;
    });
  }

  // --- Generación del PDF ---
  const generarPDF = async (e) => {
    e.preventDefault();

    if (!boleta.fecha || !boleta.colaborador || !boleta.carne) {
      alert("Completa Fecha, Colaborador y Carné antes de generar la boleta.");
      return;
    }
    const hayItems = items.some(
      (it) => it.descripcion || it.marca || it.cantidad || it.observacion
    );
    if (!hayItems) {
      alert("Agrega al menos un ítem con datos.");
      return;
    }
    const cantidadesValidas = items.every((it) => Number(it.cantidad) >= 1);
    if (!cantidadesValidas) {
      alert("Cada ítem debe tener una cantidad mayor o igual a 1.");
      return;
    }

    if (!firmaBase64 || !firmaEntregaBase64) {
      if (!window.confirm("Faltan firmas. ¿Deseas generar el PDF de todos modos?")) {
        return;
      }
    }

    const doc = new jsPDF();
    const logo = await cargarImagenLocal(logoUrl);

    if (!logo) {
      console.warn("⚠️ No se pudo cargar el logo.");
    }

    // --- Encabezado ---
    autoTable(doc, {
      startY: 10,
      margin: { left: 14, right: 14 },
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, valign: "middle", minCellHeight: 30 },
      head: [],
      body: [
        [
          "",
          {
            content: "Memorándum de Asignación de Equipo",
            styles: { halign: "center", fontStyle: "bold", fontSize: 10 },
          },
          "Código: RE-TDI-OTI-018\nVersión: 002\nPágina: 1 de 1",
        ],
      ],
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 35 },
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 0 && logo && logo.base64) {
          const padding = 2;
          const maxW = data.cell.width - padding * 2;
          const maxH = data.cell.height / 2 - padding;
          const ratio = logo.width / logo.height;
          let w = maxW;
          let h = w / ratio;
          if (h > maxH) {
            h = maxH;
            w = h * ratio;
          }
          const x = data.cell.x + (data.cell.width - w) / 2;
          const y = data.cell.y + padding;
          doc.addImage(logo.base64, "PNG", x, y, w, h);

          doc.setFontSize(8);
          doc.text(
            "Agricultura\nde Precisición",
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height - padding - 7,
            { align: "center", maxWidth: data.cell.width - padding * 2 }
          );
        }
      },
    });

    // --- Datos de la boleta ---
    const startY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${fechaEnLetras(boleta.fecha)}`, 14, startY);
    doc.text(`Para:`, 14, startY + 10);
    doc.text(`Carné:`, 14, startY + 16);
    doc.text(`De:`, 14, startY + 22);
    doc.text(`Asunto:`, 14, startY + 28);

    doc.setFont("helvetica", "normal");
    doc.text(`${boleta.colaborador}`, 24, startY + 10);
    doc.text(`${boleta.carne}`, 26, startY + 16);
    doc.text(`Departamento de Agricultura de Precisión`, 20, startY + 22);
    doc.text(`Asignación de equipo`, 28, startY + 28);

    const parrafo = `Por medio de la presente se le informa que se le asigna el siguiente material para el resguardo y transferencia de información relacionada con sus actividades laborales.`;
    const lineas = doc.splitTextToSize(parrafo, 180);
    const yParrafo = startY + 32;

    doc.text("____________________________________________________________________________________________", 14, yParrafo);
    doc.text(lineas, 14, yParrafo + 6);
    doc.text(`A continuación, se detallan los datos del equipo asignado:`, 14, yParrafo + 18);

    const yTabla = yParrafo + lineas.length * 10;

    // --- Tabla de materiales ---
    autoTable(doc, {
      startY: yTabla,
      head: [["No.", "Descripción", "Marca", "Cantidad", "Observación"]],
      body: items.map((it, i) => [i + 1, it.descripcion, it.marca, it.cantidad, it.observacion]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 65 },
      },
    });

    // --- Pie del documento ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    const texto = `Favor de firmar de recibido en el presente memorándum, confirmando la asignación del equipo. Cualquier inconveniente o daño, comunicarse inmediatamente con el departamento de Agricultura de Precisión.`;
    const textoF = doc.splitTextToSize(texto, 180);
    doc.text(textoF, 14, finalY);

    doc.setFont("helvetica", "bold");
    doc.text(`OBSERVACIÓN`, 14, finalY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(`-El equipo es de uso exclusivo para actividades de la empresa`, 16, finalY + 16);

    // --- Firmas ---
    const yFirmas = finalY + 30;

    if (firmaBase64) {
      doc.addImage(firmaBase64, "PNG", 10, yFirmas, 50, 20);
    } else {
      doc.text("_____________________________", 10, yFirmas + 15);
    }

    if (boleta.nombreRecibe) {
      doc.setFont("helvetica", "bold");
      doc.text(boleta.nombreRecibe, 20, yFirmas + 20);
      doc.setFont("helvetica", "normal");
      doc.text("Firma de quien recibe", 20, yFirmas + 25);
    } else {
      doc.text("Firma de quien recibe", 20, yFirmas + 25);
    }

    if (firmaEntregaBase64) {
      doc.addImage(firmaEntregaBase64, "PNG", 105, yFirmas, 50, 20);
    } else {
      doc.text("_____________________________", 105, yFirmas + 15);
    }

    if (boleta.nombreEntrega) {
      doc.setFont("helvetica", "bold");
      doc.text(boleta.nombreEntrega, 120, yFirmas + 20);
      doc.setFont("helvetica", "normal");
      doc.text("Firma de quien entrega", 120, yFirmas + 25);
    } else {
      doc.text("Firma de quien entrega", 120, yFirmas + 25);
    }

    doc.save(`boleta-${Date.now()}.pdf`);
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Carta de Responsabilidad de Materiales</h2>

      <form onSubmit={generarPDF}>
        {/* --- Datos de la boleta --- */}
        <fieldset className="card">
          <legend>Datos de la boleta</legend>

          <div className="form-group">
            <label>Fecha:</label>
            <input type="date" name="fecha" value={boleta.fecha} onChange={handleBoletaChange} required />
          </div>

          <div className="form-group">
            <label>Colaborador:</label>
            <input type="text" name="colaborador" value={boleta.colaborador} onChange={handleBoletaChange} placeholder="Nombre completo" required />
          </div>

          <div className="form-group">
            <label>Carné:</label>
            <input type="text" name="carne" value={boleta.carne} onChange={handleBoletaChange} placeholder="Carné" required />
          </div>
          
          <div className="form-group">
            <label>Nombre de quien recibe:</label>
            <input type="text" name="nombreRecibe" value={boleta.nombreRecibe} onChange={handleBoletaChange} placeholder="Nombre" />
          </div>

          <div className="form-group">
            <label>Nombre de quien entrega:</label>
            <input type="text" name="nombreEntrega" value={boleta.nombreEntrega} onChange={handleBoletaChange} placeholder="Nombre" />
          </div>
        </fieldset>

        <h3 className="section-title">Equipos entregados</h3>

        {items.map((item, index) => (
          <fieldset key={index} className="card">
            <legend>Ítem #{index + 1}</legend>

            <div className="grid-4">
              <div className="form-group">
                <label>Descripción:</label>
                <input type="text" value={item.descripcion} onChange={(e) => handleItemChange(index, "descripcion", e.target.value)} placeholder="Ej. Memoria USB" required />
              </div>

              <div className="form-group">
                <label>Marca:</label>
                <input type="text" value={item.marca} onChange={(e) => handleItemChange(index, "marca", e.target.value)} placeholder="Ej. hp" required />
              </div>

              <div className="form-group">
                <label>Cantidad:</label>
                <input type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(index, "cantidad", e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Observación:</label>
                <input type="text" value={item.observacion} onChange={(e) => handleItemChange(index, "observacion", e.target.value)} placeholder="Ej. Nuevo" required />
              </div>
            </div>

            <button type="button" className="btn btn-danger" onClick={() => eliminarItem(index)} disabled={items.length === 1} style={{ marginTop: "8px" }}>
              🗑️ Eliminar este ítem
            </button>
          </fieldset>
        ))}

        <div className="actions-row">
          <button type="button" className="btn btn-outline-blue" onClick={agregarItem}>
            ➕ Agregar otro elemento
          </button>
        </div>

        <PadFirma titulo="Firma del colaborador (Recibe)" signatureRef={signatureRef} onChange={handleSignature} onLimpiar={limpiarFirma} />
        <PadFirma titulo="Firma de quien entrega" signatureRef={signatureEntregaRef} onChange={handleSignatureEntrega} onLimpiar={limpiarFirmaEntrega} />

        <button type="submit" className="btn btn-primary-green">
          📄 Generar boleta PDF ({items.length} ítem{items.length !== 1 ? "s" : ""})
        </button>
      </form>
    </div>
  );
}

export default Formulario;