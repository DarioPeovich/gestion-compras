import { Router } from 'express'

import {
  getTiposComprobante,
  reconciliarPendientes,
  verificarDuplicado,
  registrarComprobante,
} from '../controllers/comprobantes.controller.js'

const router = Router()

router.get('/tipos',      getTiposComprobante)
router.get('/reconciliar-pendientes', reconciliarPendientes)
router.get('/verificar-duplicado', verificarDuplicado) 
router.post('/registrar', registrarComprobante)

export default router
