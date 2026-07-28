import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MOTIVOS_INDISPONIBILIDAD,
  verificarDisponibilidadCompras,
  verificarDisponibilidadGestionVentas,
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

test('normaliza Gestión Ventas y HFSQL disponibles', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    servicio: 'Gestión Ventas API',
    estado: 'ACTIVO',
    database: { estado: 'ACTIVA' },
  }))

  assert.deepEqual(await verificarDisponibilidadGestionVentas(), {
    disponible: true,
    motivo: null,
    databaseEstado: 'ACTIVA',
  })
})

test('conserva HFSQL NO_DISPONIBLE en una respuesta HTTP 503', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: false,
    servicio: 'Gestión Ventas API',
    estado: 'NO_DISPONIBLE',
    database: { estado: 'NO_DISPONIBLE' },
  }), { status: 503 })

  assert.deepEqual(await verificarDisponibilidadGestionVentas(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.HFSQL_NO_DISPONIBLE,
    databaseEstado: 'NO_DISPONIBLE',
  })
})

test('conserva Gestión Ventas NO_VERIFICADA en una respuesta HTTP 503', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: false,
    servicio: 'Gestión Ventas API',
    estado: 'NO_DISPONIBLE',
    database: { estado: 'NO_VERIFICADA' },
  }), { status: 503 })

  assert.deepEqual(await verificarDisponibilidadGestionVentas(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.WINDEV_NO_VERIFICADA,
    databaseEstado: 'NO_VERIFICADA',
  })
})

test('normaliza JSON inválido de Gestión Ventas como NO_VERIFICADA', async () => {
  globalThis.fetch = async () => new Response('respuesta no JSON', { status: 503 })

  assert.deepEqual(await verificarDisponibilidadGestionVentas(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.WINDEV_NO_VERIFICADA,
    databaseEstado: 'NO_VERIFICADA',
  })
})

test('normaliza un contrato incompleto de Gestión Ventas como NO_VERIFICADA', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    database: { estado: 'NO_DISPONIBLE' },
  }), { status: 503 })

  assert.deepEqual(await verificarDisponibilidadGestionVentas(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.WINDEV_NO_VERIFICADA,
    databaseEstado: 'NO_VERIFICADA',
  })
})

test('normaliza un error de red de Gestión Ventas como NO_VERIFICADA', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed')
  }

  assert.deepEqual(await verificarDisponibilidadGestionVentas(), {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.WINDEV_NO_VERIFICADA,
    databaseEstado: 'NO_VERIFICADA',
  })
})
