import { Router } from 'express'
import {
  buscarPorCodigoProveedor,
  buscarPorCodigoBarras,
  buscarPorDescripcion,
  buscarPorId
} from '../controllers/articulos.controller.js'

const router = Router()

router.get('/por-proveedor/:proveedorId/:codigo', buscarPorCodigoProveedor)
router.get('/por-codigo-barras/:proveedorId/:codBarras', buscarPorCodigoBarras)
router.get('/por-descripcion/:proveedorId/', buscarPorDescripcion)
router.get('/por-id/:proveedorId/:articuloId', buscarPorId)
export default router