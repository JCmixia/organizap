// src/layouts/MainLayout.jsx
import { useState } from 'react'
import Formulario from '../components/Formulario'
import Formulario2 from '../components/Formulario2'
import '../MainLayout.css'

const MainLayout = ({ children }) => {
  // null = no mostrar nada / o el que quieras por defecto
  const [formularioActivo, setFormularioActivo] = useState('formulario2')

  return (
    <div className="app">

      {/* HEADER HORIZONTAL */}
      <div className="header-horizontal">
        <h1>Agricultura de precisión</h1>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="contenedor-flex">

        {/* HEADER VERTICAL */}
        <div className="header-vertical">
          <h2>Inicio</h2>
          <ul>
            <li onClick={() => setFormularioActivo('formulario2')}>
              Entrega de equipos
            </li>
            <li onClick={() => setFormularioActivo(null)}>
              Documentación
            </li>
            <li onClick={() => setFormularioActivo(null)}>
              Personal
            </li>
          </ul>
        </div>

        {/* CONTENIDO DERECHO */}
        <div className="contenido-derecho">
          <div className="main">
            {formularioActivo === 'formulario1' && <Formulario />}
            {formularioActivo === 'formulario2' && <Formulario2 />}
            {children}
          </div>

          <div className="footer">
            © 2026 Mi App
          </div>
        </div>

      </div>

    </div>
  );
};

export default MainLayout;  