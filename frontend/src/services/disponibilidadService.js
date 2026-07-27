const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api'

export const MOTIVOS_INDISPONIBILIDAD = {
  BACKEND_NO_DISPONIBLE: 'BACKEND_NO_DISPONIBLE',
  DATABASE_NO_DISPONIBLE: 'DATABASE_NO_DISPONIBLE',
  RESPUESTA_INVALIDA: 'RESPUESTA_INVALIDA',
}

export const verificarDisponibilidadCompras = async () => {
  let response

  try {
    response = await fetch(`${API_URL}/status`)
  } catch {
    return {
      disponible: false,
      motivo: MOTIVOS_INDISPONIBILIDAD.BACKEND_NO_DISPONIBLE,
    }
  }

  let data
  try {
    data = await response.json()
  } catch {
    return {
      disponible: false,
      motivo: MOTIVOS_INDISPONIBILIDAD.RESPUESTA_INVALIDA,
    }
  }

  if (
    response.ok &&
    data?.ok === true &&
    data?.estado === 'ACTIVO' &&
    data?.database?.estado === 'ACTIVA'
  ) {
    return { disponible: true, motivo: null }
  }

  if (
    response.status === 503 &&
    data?.database?.estado === 'NO_DISPONIBLE'
  ) {
    return {
      disponible: false,
      motivo: MOTIVOS_INDISPONIBILIDAD.DATABASE_NO_DISPONIBLE,
    }
  }

  return {
    disponible: false,
    motivo: MOTIVOS_INDISPONIBILIDAD.RESPUESTA_INVALIDA,
  }
}
