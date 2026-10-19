import { useForm, useFieldArray } from "react-hook-form";

export default function BoletaForm() {
    
  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      // Aquí definimos la estructura inicial de la lista de repuestos
      repuestos: [{ tipo: "", cantidad: 1, descripcion: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "repuestos" // Nombre del campo en el formulario
  });

  const onSubmit = (data) => {
    console.log("Datos de la boleta:", data);
    // Aquí puedes enviar los datos a tu backend
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>Lista de Repuestos</h3>
      
      {fields.map((field, index) => (
        <div key={field.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          {/* Campo para el tipo de repuesto (USB, Adaptador, etc.) */}
          <select {...register(`repuestos.${index}.tipo`)}>
            <option value="">Seleccione...</option>
            <option value="USB">USB</option>
            <option value="Adaptador">Adaptador</option>
            <option value="Otro">Otro</option>
          </select>

          {/* Campo para la cantidad */}
          <input
            type="number"
            placeholder="Cantidad"
            {...register(`repuestos.${index}.cantidad`)}
          />

          {/* Campo para una descripción adicional */}
          <input
            type="text"
            placeholder="Descripción"
            {...register(`repuestos.${index}.descripcion`)}
          />

          {/* Botón para eliminar este repuesto */}
          <button type="button" onClick={() => remove(index)}>
            Eliminar
          </button>
        </div>
      ))}

      {/* Botón para agregar un nuevo repuesto */}
      <button
        type="button"
        onClick={() => append({ tipo: "", cantidad: 1, descripcion: "" })}
      >
        + Agregar Repuesto
      </button>

      <hr />
      <button type="submit">Generar Boleta</button>
    </form>
  );
}