// src/components/Formulario.jsx
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../../public/logo.png";
import { SimpleSignature } from "react-simple-signature";


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
  });
  //Inicio Firma recibido
  const [firmaBase64, setFirmaBase64] = useState("");
  const signatureRef = useRef(null);

  // Función que se ejecuta cada vez que el usuario firma
  const handleSignature = (blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFirmaBase64(reader.result); // Guardamos el Base64 de la firma
    };
    reader.readAsDataURL(blob);
  };

  const [items, setItems] = useState([{ ...itemVacio }]);

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

  const limpiarFirma = () => {
    signatureRef.current?.clear();
    setFirmaBase64("");
  };
  // Fin Firma recibido

  // Inicio firma entrega
  // --- Firma de quien entrega ---
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

  // Fin Firma entrega

  const agregarItem = () => {
    setItems((prev) => [...prev, { ...itemVacio }]);
  };

  const eliminarItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Carga una imagen local (public/) como base64 + dimensiones originales
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

    const doc = new jsPDF();

    // --- Cargar logo (objeto con base64 + medidas) ---
    const logo = await cargarImagenLocal(logoUrl);
    console.log("🖼️ logo object:", logo);
    console.log("🖼️ logo base64 length:", logo?.base64?.length);
    console.log("🖼️ logo width/height:", logo?.width, logo?.height);

    if (!logo) {
      console.warn(
        "⚠️ No se encontró /logo.png o falló al cargar. Revisa que esté en public/logo.png"
      );
    }

    // --- Encabezado (tabla de 3 columnas) ---
    autoTable(doc, {
      startY: 10,
      margin: { left: 14, right: 14 },
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: "middle",
        minCellHeight: 30,
      },
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
        if (
          data.section === "body" &&
          data.column.index === 0 &&
          logo &&
          logo.base64
        ) {
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
            "Gestión de Tecnología\nde Información",
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height - padding - 7,
            { align: "center", maxWidth: data.cell.width - padding * 2 }
          );
        }
      },
    });

    // --- Desde aquí continúa tu contenido normal ---
    const startY = doc.lastAutoTable.finalY + 10;


    doc.setFontSize(10);
    doc.setFont("helvetica", "bold")
    doc.text(`${fechaEnLetras(boleta.fecha)}`, 14, startY);
    doc.text(`Para:`, 14, startY + 10);
    doc.text(`Carné:`, 14, startY + 16);
    doc.text(`De:`, 14, startY + 22);
    doc.text(`Asunto:`, 14, startY + 28);

    doc.setFont("helvetica", "normal")
    doc.text(`${boleta.colaborador}`, 24, startY + 10);
    doc.text(`${boleta.carne}`, 26, startY + 16);
    doc.text(`Departamento de Agricultura de Precisión`, 20, startY + 22);
    doc.text(`Asignación de equipo`, 28, startY + 28);


    const parrafo = `Por medio de la presente se le informa que se le asigna el siguiente material para el resguardo y transferencia de información relacionada con sus activides laborales.`;
    const lineas = doc.splitTextToSize(parrafo, 180);
    const yParrafo = startY + 32;

    doc.text("____________________________________________________________________________________________", 14, yParrafo);
    doc.text(lineas, 14, yParrafo + 6);
    doc.text(`A continuación, se detallan los datos del equipo asignado:`, 14, yParrafo + 18);

    const yTabla = yParrafo + lineas.length * 10;

    //Tabla de materiales
    autoTable(doc, {
      startY: yTabla,
      head: [["No.", "Descripción", "Marca", "Cantidad", "Observación"]],
      body: items.map((it, i) => [
        i + 1,
        it.descripcion,
        it.marca,
        it.cantidad,
        it.observacion,
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 12, halign: "center" }, // No.
        3: { cellWidth: 20, halign: "center" }, // Cantidad (más angosta)
        4: { cellWidth: 65 },                   // Observación (más ancha)
        //4: { halign: "center", cellWidth: 22 },
      },
    });

    // --- Pie: firma ---
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    const texto = `Favor de firmar de recibido en el presente memorándum, confirmando la asignación del equipo. Cualquier inconveniente o daño, comunicarse inmediatamente con el departamento de Agricultura de Precisión`
    const textoF = doc.splitTextToSize(parrafo, 180);
    doc.text(textoF, 14, finalY);
    doc.text(`OBSERVACIÓN`, 14, finalY + 10);
    doc.text(`-El equipo es de uso exclusivo para actividades de la empresa`, 16, finalY + 14);

    //doc.text("Entregado por: _____________________________", 14, finalY + 50);
    //doc.text("Firma: ____________________", 120, finalY + 50);
    if (firmaBase64) {
      // Ajusta las coordenadas X (28) e Y (finalY + 10) según dónde quieras la firma
      // El tamaño sugerido es 50mm de ancho por 20mm de alto
      doc.addImage(firmaBase64, "PNG", 50, finalY + 20, 50, 20);
    } else {
      // Si no firmaron, dejas la línea en blanco como respaldo
      doc.text("_____________________________", 28, finalY + 25);
    }

    // --- NUEVA: Firma de quien entrega (a la derecha) ---
    // Usamos X = 120 para moverla al lado derecho
    if (firmaEntregaBase64) {
      doc.addImage(firmaEntregaBase64, "PNG", 50, finalY + 40, 50, 20);
    } else {
      doc.text("_____________________________", 50, finalY + 40);
    }
    doc.text("Firma de quien entrega", 50, finalY + 50);

    doc.save(`boleta-${Date.now()}.pdf`);

  };

  return (
    <div>
      <h2>Carta de Responsabilidad de Materiales</h2>

      <form onSubmit={generarPDF}>
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
              <label>Descripción</label>
              <input
                type="text"
                value={item.descripcion}
                onChange={(e) =>
                  handleItemChange(index, "descripcion", e.target.value)
                }
                placeholder="Ej. Memoria USB"
                required
              />
            </div>

            <div>
              <label>Marca</label>
              <input
                type="text"
                value={item.marca}
                onChange={(e) =>
                  handleItemChange(index, "marca", e.target.value)
                }
                placeholder="Ej. hp"
                required
              />
            </div>
            <div>
              <label>Cantidad</label>
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
            <div>
              <label>Observación</label>
              <input
                type="text"
                value={item.observacion}
                onChange={(e) =>
                  handleItemChange(index, "observacion", e.target.value)
                }
                placeholder="Ej. Nuevo"
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
        </div>
        <div style={{ marginBottom: "20px", padding: "12px", border: "1px solid #ccc" }}>
          <legend><strong>Firma del colaborador</strong></legend>
          <SimpleSignature
            ref={signatureRef}
            onChange={handleSignature}
            width={400}
            height={150}
            strokeColor="#000"
            className="border border-gray-300"
          />
          <button type="button" onClick={limpiarFirma}>Limpiar firma</button>
        </div>
        {/* NUEVO: Firma de quien entrega */}
        <div style={{ marginBottom: "20px", padding: "12px", border: "1px solid #ccc" }}>
          <legend><strong>Firma de quien entrega</strong></legend>
          <SimpleSignature
            ref={signatureEntregaRef}
            onChange={handleSignatureEntrega}
            width={400}
            height={150}
            strokeColor="#000"
          />
          <button type="button" onClick={limpiarFirmaEntrega}>Limpiar firma</button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
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