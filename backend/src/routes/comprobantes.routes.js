import { Router } from 'express'

import {
  getTiposComprobante,
  verificarDuplicado,
  registrarComprobante,
} from '../controllers/comprobantes.controller.js'

const router = Router()

router.get('/tipos',      getTiposComprobante)
router.get('/verificar-duplicado', verificarDuplicado) 
router.post('/registrar', registrarComprobante)

export default router