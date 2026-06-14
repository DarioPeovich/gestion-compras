import express from 'express'
import cors from 'cors'
import proveedoresRouter from './src/routes/proveedores.routes.js'
import { errorHandler } from './src/middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/proveedores', proveedoresRouter)

// Manejo de errores (siempre al final)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})