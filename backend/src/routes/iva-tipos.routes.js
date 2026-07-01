import { Router } from 'express'
import { getIvaTipos } from '../controllers/iva-tipos.controller.js'

const router = Router()

router.get('/', getIvaTipos)

export default router
