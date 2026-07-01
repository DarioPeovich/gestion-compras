import { Router } from 'express'
import { getSucursales, getDepositosPorSucursal } from '../controllers/sucursales.controller.js'

const router = Router()

router.get('/',                      getSucursales)
router.get('/depositos/:sucursalId', getDepositosPorSucursal)

export default router
