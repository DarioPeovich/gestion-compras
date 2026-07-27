import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import SESLayout from "@/components/ui/layout/SESLayout.jsx";

import ProveedoresList from '../components/proveedores/ProveedoresList.jsx'
import ArticulosList from '../components/articulos/ArticulosList.jsx'
import NuevoComprobante from '../components/comprobantes/NuevoComprobante.jsx'
import UIDesign from '../components/ui/UIDesign.jsx'
import SESConfirmDialog from '../components/ui/feedback/SESConfirmDialog.jsx'
import {
  MOTIVOS_INDISPONIBILIDAD,
  verificarDisponibilidadCompras,
} from '../services/disponibilidadService.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-slate-800 text-white px-6 py-4 shadow">
        <h1 className="text-xl font-bold">
          SES ERP
        </h1>
        <p className="text-sm text-slate-300">
          Módulo de Compras
        </p>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">

          <NavLink
            to="/proveedores"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            Proveedores
          </NavLink>

          <NavLink
            to="/articulos"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            Artículos
          </NavLink>

          <NavLink
            to="/comprobantes"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            Comprobantes
          </NavLink>

          <NavLink
            to="/ui"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            UI
          </NavLink>

        </div>
      </nav>

      <main className="p-6">
        {children}
      </main>

    </div>
  )
}

function ComprobantesPage() {

  const [modo, setModo] = useState('lista')
  const [verificandoPendientes, setVerificandoPendientes] = useState(false)
  const [avisoPendientes, setAvisoPendientes] = useState(null)
  const [avisoDisponibilidad, setAvisoDisponibilidad] = useState(null)

  const verificarPendientes = async () => {
    setVerificandoPendientes(true)
    setAvisoPendientes(null)
    try {
      const disponibilidad = await verificarDisponibilidadCompras()
      if (!disponibilidad.disponible) {
        setAvisoDisponibilidad(disponibilidad.motivo)
        return
      }

      setAvisoDisponibilidad(null)
      const response = await fetch(`${API_URL}/comprobantes/reconciliar-pendientes`)
      let data
      try {
        data = await response.json()
      } catch {
        setAvisoDisponibilidad(MOTIVOS_INDISPONIBILIDAD.RESPUESTA_INVALIDA)
        return
      }

      if (!response.ok || !data.ok) {
        setAvisoDisponibilidad(MOTIVOS_INDISPONIBILIDAD.RESPUESTA_INVALIDA)
        return
      }

      if (!data.hayPendientes) {
        setAvisoPendientes(null)
        setModo('nuevo')
        return
      }

      setAvisoPendientes(data.pendientes || [])
    } catch {
      setAvisoDisponibilidad(MOTIVOS_INDISPONIBILIDAD.BACKEND_NO_DISPONIBLE)
    } finally {
      setVerificandoPendientes(false)
    }
  }

  const detallePendientes = avisoPendientes?.length
    ? avisoPendientes.map((pendiente) =>
        `Comprobante pendiente\n\nID: ${pendiente.id}\nProveedor: ${pendiente.proveedor}\nTipo: ${pendiente.tipo}\nNúmero: ${pendiente.puntoVenta}-${pendiente.numero}\nTotal: $${Number(pendiente.total).toLocaleString('es-AR')}\nOperación: ${pendiente.operacionID}`
      ).join('\n\n')
    : 'No se pudieron obtener los datos del comprobante pendiente.'

  const mensajePendientes = (
    <>
      {`No fue posible confirmar una operación pendiente porque el servicio Gestión Ventas no está respondiendo.\n\nPara preservar la consistencia de la información, el ingreso de nuevos comprobantes permanecerá temporalmente bloqueado hasta verificar el estado de esta operación.\n\n${detallePendientes}\n\nComuníquese con el responsable del sistema.`.split('\n').map((linea, index) => (
        <span key={`${index}-${linea}`}>
          {linea}<br />
        </span>
      ))}
    </>
  )

  const mensajeDisponibilidad = avisoDisponibilidad === MOTIVOS_INDISPONIBILIDAD.DATABASE_NO_DISPONIBLE
    ? 'SES Compras no puede acceder temporalmente a la información del sistema.\n\nLa operación no puede continuar.\n\nComuníquese con el responsable del sistema.'
    : 'No fue posible comunicarse con el servidor de SES Compras.\n\nEl ingreso de nuevos comprobantes no puede continuar mientras el servicio no esté disponible.\n\nVerifique que el servicio se encuentre iniciado o comuníquese con el responsable del sistema.'

  if (modo === 'nuevo') {
    return <NuevoComprobante onCancelar={() => setModo('lista')} />
  }

  return (
    <div className="bg-white rounded-lg shadow">

      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">

        <h2 className="text-lg font-semibold text-gray-700">
          Comprobantes
        </h2>

        <button
          onClick={verificarPendientes}
          disabled={verificandoPendientes}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          {verificandoPendientes ? 'Verificando...' : '+ Nuevo comprobante'}
        </button>

      </div>

      <div className="p-6">
        <p className="text-gray-500 text-sm">
          No hay comprobantes registrados todavía.
        </p>
      </div>

      <SESConfirmDialog
        open={avisoPendientes !== null}
        title="Operación pendiente"
        message={mensajePendientes}
        confirmLabel="Volver a verificar"
        cancelLabel="Cerrar"
        loading={verificandoPendientes}
        onConfirm={verificarPendientes}
        onCancel={() => setAvisoPendientes(null)}
      />

      <SESConfirmDialog
        open={avisoDisponibilidad !== null}
        title="Servicio de Compras no disponible"
        message={mensajeDisponibilidad.split('\n').map((linea, index) => (
          <span key={`${index}-${linea}`}>
            {linea}<br />
          </span>
        ))}
        confirmLabel="Volver a intentar"
        cancelLabel="Cerrar"
        loading={verificandoPendientes}
        onConfirm={verificarPendientes}
        onCancel={() => setAvisoDisponibilidad(null)}
      />

    </div>
  )
}

export default function AppRouter() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <SESLayout>
              <p className="text-gray-500">
                Seleccioná una sección del menú.
              </p>
            </SESLayout>
          }
        />

        <Route
          path="/proveedores"
          element={
            <SESLayout>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Proveedores
                  </h2>
                </div>
                <ProveedoresList />
              </div>
            </SESLayout>
          }
        />

        <Route
          path="/articulos"
          element={
            <SESLayout>
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Catálogo de Artículos
                  </h2>
                </div>
                <ArticulosList />
              </div>
            </SESLayout>
          }
        />

        <Route
          path="/comprobantes"
          element={
            <SESLayout>
              <ComprobantesPage />
            </SESLayout>
          }
        />

        <Route
          path="/ui"
          element={
            <SESLayout>
              <UIDesign />
            </SESLayout>
          }
        />

      </Routes>

    </BrowserRouter>

  )
}
