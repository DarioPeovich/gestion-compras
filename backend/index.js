import express from 'express'
import cors from 'cors'
import proveedoresRouter from './src/routes/proveedores.routes.js'
import articulosRouter from './src/routes/articulos.routes.js'
import comprobantesRouter from './src/routes/comprobantes.routes.js'
import sucursalesRoutes from './src/routes/sucursales.routes.js'
import ivaTiposRouter from './src/routes/iva-tipos.routes.js'
import syncRouter from './src/routes/sync.routes.js'
import { inicializarArticulos } from './src/jobs/cargaArticulos.js'

import testRouter from './src/routes/test.routes.js'    //Solo para pruebas


import { errorHandler } from './src/middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/proveedores', proveedoresRouter)
app.use('/api/sync', syncRouter)
app.use('/api/test', testRouter)
app.use('/api/articulos', articulosRouter)
app.use('/api/comprobantes', comprobantesRouter)
app.use('/api/sucursales', sucursalesRoutes)
app.use('/api/iva-tipos', ivaTiposRouter)

// Manejo de errores (siempre al final)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  
  // No bloqueante: el servidor ya responde mientras esto corre en segundo plano.
  //Esto corre cada vez que se inicia el servidor, es para la carga inicial de articulos a GestionCompras
  //, que una vez que se hace se dá x hecho segun compras_sync_status.estado 16/06/26
   inicializarArticulos().catch(err => {
    console.error('[articulos] Error en inicialización:', err)
  })

})