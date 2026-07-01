import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proveedoresService, syncService } from '../../services/api.js'

export default function ProveedoresList() {
  const queryClient = useQueryClient()

  const { data: proveedores, isLoading, isError, error } = useQuery({
    queryKey: ['proveedores'],
    queryFn: proveedoresService.getAll
  })

  const sincronizarMutation = useMutation({
    mutationFn: syncService.sincronizarProveedores,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] })
    }
  })

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <p className="text-gray-500">Cargando proveedores...</p>
    </div>
  )

  if (isError) return (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <p className="text-red-600">Error: {error.message}</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-500">{proveedores.length} proveedores</p>
        <button
          onClick={() => sincronizarMutation.mutate()}
          disabled={sincronizarMutation.isPending}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {sincronizarMutation.isPending ? 'Sincronizando...' : 'Actualizar proveedores'}
        </button>
      </div>

      {sincronizarMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mx-4 mt-3">
          <p className="text-red-600 text-sm">Error: {sincronizarMutation.error.message}</p>
        </div>
      )}

      {sincronizarMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mx-4 mt-3">
          <p className="text-green-700 text-sm">
            {sincronizarMutation.data.sincronizados} proveedores sincronizados correctamente.
          </p>
        </div>
      )}

      {proveedores.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 m-4">
          <p className="text-yellow-700">No hay proveedores cargados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Razón Social</th>
                <th className="px-4 py-3">CUIT</th>
                <th className="px-4 py-3">Condición de Pago</th>
                <th className="px-4 py-3">Días</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">{p.id}</td>
                  <td className="px-4 py-3 font-medium">{p.razon_social}</td>
                  <td className="px-4 py-3">{p.cuit || '-'}</td>
                  <td className="px-4 py-3">{p.condicion_pago || '-'}</td>
                  <td className="px-4 py-3">{p.dias_pago}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}