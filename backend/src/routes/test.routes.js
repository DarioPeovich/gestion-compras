// ARCHIVO TEMPORAL DE DIAGNÓSTICO - borrar junto con test.controller.js

import { Router } from 'express'
import { testWinDevProveedores } from '../controllers/test.controller.js'

const router = Router()

router.get('/proveedores', testWinDevProveedores)

export default router