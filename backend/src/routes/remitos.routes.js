import { Router } from 'express'

import { registrarRemito } from '../controllers/remitos.controller.js'

const router = Router()

router.post('/registrar', registrarRemito)

export default router
