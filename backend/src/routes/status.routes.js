import { Router } from 'express'

import { getStatus, getStatusWinDev } from '../controllers/status.controller.js'

const router = Router()

router.get('/', getStatus)
router.get('/windev', getStatusWinDev)

export default router
