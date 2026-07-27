import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MOTIVOS_INDISPONIBILIDAD,
  verificarDisponibilidadCompras,
} from '../src/services/disponibilidadService.js'

test('normaliza SES Compras disponible', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    servicio: 'SES Compras API',
    estado: 'ACTIVO',
    database: { estado: 'ACTIVA' },
  }))

  assert.deepEqual(await verificarDisponibilidadCompras(), {
    disponible: true,
    motivo: null,
  })
})

test('distingue backend inaccesible', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed')
  }

  assert.deepEqual(await verificarDisponibilidadCompras(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.BACKEND_NO_DISPONIBLE,
  })
})

test('distingue PostgreSQL no disponible', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: false,
    servicio: 'SES Compras API',
    estado: 'NO_DISPONIBLE',
    database: { estado: 'NO_DISPONIBLE' },
  }), { status: 503 })

  assert.deepEqual(await verificarDisponibilidadCompras(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.DATABASE_NO_DISPONIBLE,
  })
})

test('distingue respuesta inválida', async () => {
  globalThis.fetch = async () => new Response('respuesta no JSON')

  assert.deepEqual(await verificarDisponibilidadCompras(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.RESPUESTA_INVALIDA,
  })
})
