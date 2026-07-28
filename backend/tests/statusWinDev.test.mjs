import assert from 'node:assert/strict'
import test from 'node:test'

import { getStatusWinDev } from '../src/controllers/status.controller.js'

const WINDEV_URL = 'http://gestion-ventas.test'

function respuestaFetch(body, { status = 200, texto } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (texto === undefined ? JSON.stringify(body) : texto),
  }
}

function respuestaExpress() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

async function ejecutar(fetchImpl) {
  const fetchAnterior = global.fetch
  const urlAnterior = process.env.WINDEV_API_URL
  const consoleErrorAnterior = console.error
  let llamada

  global.fetch = async (url, options) => {
    llamada = { url, options }
    return fetchImpl(url, options)
  }
  process.env.WINDEV_API_URL = WINDEV_URL
  console.error = () => {}

  try {
    const res = respuestaExpress()
    await getStatusWinDev({}, res)
    return { res, llamada }
  } finally {
    global.fetch = fetchAnterior
    console.error = consoleErrorAnterior
    if (urlAnterior === undefined) delete process.env.WINDEV_API_URL
    else process.env.WINDEV_API_URL = urlAnterior
  }
}

const respuestaGenerica = {
  ok: false,
  servicio: 'Gestión Ventas API',
  estado: 'NO_DISPONIBLE',
  database: { estado: 'NO_VERIFICADA' },
}

test('estado activo devuelve 200 y conserva el contrato estable', async () => {
  const remoto = {
    ok: true,
    servicio: 'Gestión Ventas API',
    version: '1.0',
    timestamp: '2026-07-27T12:00:00Z',
    estado: 'ACTIVO',
    database: { estado: 'ACTIVA' },
  }
  const { res, llamada } = await ejecutar(() => respuestaFetch(remoto))

  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, remoto)
  assert.equal(llamada.url, `${WINDEV_URL}/apicompras/status`)
  assert.equal(llamada.options.method, undefined)
})

test('HFSQL no disponible devuelve 503 y conserva la respuesta válida', async () => {
  const remoto = {
    ok: false,
    servicio: 'Gestión Ventas API',
    estado: 'NO_DISPONIBLE',
    database: { estado: 'NO_DISPONIBLE' },
  }
  const { res } = await ejecutar(() => respuestaFetch(remoto))

  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, remoto)
})

test('HTTP 503 con contrato válido conserva HFSQL como NO_DISPONIBLE', async () => {
  const remoto = {
    ok: false,
    servicio: 'Gestión Ventas API',
    version: '1.0',
    timestamp: '2026-07-27T12:00:00Z',
    estado: 'NO_DISPONIBLE',
    database: { estado: 'NO_DISPONIBLE' },
  }
  const { res } = await ejecutar(() => respuestaFetch(remoto, { status: 503 }))

  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, remoto)
})

test('error de conexión devuelve 503 sin detalles técnicos', async () => {
  const { res } = await ejecutar(() => {
    throw new TypeError('ECONNREFUSED http://servidor-interno')
  })
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, respuestaGenerica)
})

test('timeout devuelve 503 sin detalles técnicos', async () => {
  const { res } = await ejecutar(() => {
    throw new DOMException('The operation was aborted', 'AbortError')
  })
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, respuestaGenerica)
})

test('HTTP 503 con respuesta vacía devuelve 503 genérico', async () => {
  const { res } = await ejecutar(() =>
    respuestaFetch(null, { status: 503, texto: '' }),
  )
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, respuestaGenerica)
})

test('HTTP 503 con JSON inválido devuelve 503 genérico', async () => {
  const { res } = await ejecutar(() =>
    respuestaFetch(null, { status: 503, texto: '{' }),
  )
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, respuestaGenerica)
})

test('respuesta incompleta devuelve 503 genérico', async () => {
  const { res } = await ejecutar(() =>
    respuestaFetch({ ok: true, servicio: 'Gestión Ventas API' }),
  )
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, respuestaGenerica)
})

test('fault de WebDev devuelve 503 genérico y no se propaga', async () => {
  const { res } = await ejecutar(() =>
    respuestaFetch(
      { fault: 'HFSQL password=secreto', code: 500 },
      { status: 500 },
    ),
  )
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, respuestaGenerica)
  assert.equal(JSON.stringify(res.body).includes('secreto'), false)
})
