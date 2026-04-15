// src/layouts/MainLayout.jsx
import Formulario from '../components/Formulario'
import '../MainLayout.css'

const MainLayout = ({ children }) => {
  
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
            <li>Inventario</li>
            <li>Actividades</li>
            <li>Documentación</li>
            <li>Personal</li>
          </ul>
        </div>

        {/* CONTENIDO DERECHO */}
        <div className="contenido-derecho">
          <div className="main">
            <Formulario />
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