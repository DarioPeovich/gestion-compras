import { Router } from 'express'
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor
} from '../controllers/proveedores.controller.js'

const router = Router()

router.get('/', getProveedores)
router.get('/:id', getProveedorById)
router.post('/', createProveedor)
router.put('/:id', updateProveedor)

export default router