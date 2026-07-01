import { Router } from 'express'
import { sincronizarProveedores } from '../controllers/sync.controller.js'

const router = Router()

router.post('/proveedores', sincronizarProveedores)

export default router