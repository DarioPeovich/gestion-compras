import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import SESLayout from "@/components/ui/layout/SESLayout.jsx";

import ProveedoresList from '../components/proveedores/ProveedoresList.jsx'
import ArticulosList from '../components/articulos/ArticulosList.jsx'
import NuevoComprobante from '../components/comprobantes/NuevoComprobante.jsx'
import UIDesign from '../components/ui/UIDesign.jsx'

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
          onClick={() => setModo('nuevo')}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Nuevo comprobante
        </button>

      </div>

      <div className="p-6">
        <p className="text-gray-500 text-sm">
          No hay comprobantes registrados todavía.
        </p>
      </div>

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