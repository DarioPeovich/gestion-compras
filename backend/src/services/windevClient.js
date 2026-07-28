export const TIMEOUT_POST_WINDEV_MS = 8000;
export const TIMEOUT_STATUS_WINDEV_MS = 20000;
const TIMEOUT_GET_WINDEV_MS = 4000;
const INTENTOS_CONFIRMACION_WINDEV = 5;
const DEMORA_CONFIRMACION_WINDEV_MS = 500;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchConTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const leerJsonSeguro = async (response) => {
  const texto = await response.text();
  if (!texto.trim()) throw new Error("WinDev devolvió un cuerpo vacío");
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("WinDev devolvió un JSON inválido");
  }
};

export const consultarStatusWinDev = async (windevUrl) => {
  try {
    if (!windevUrl) throw new Error("WINDEV_API_URL no configurada");

    const response = await fetchConTimeout(
      `${windevUrl.replace(/\/$/, "")}/apicompras/status`,
      {},
      TIMEOUT_STATUS_WINDEV_MS
    );
    //console.log(`[windev/status] HTTP recibido: ${response.status}`);

    const data = await leerJsonSeguro(response);
    //console.log("[windev/status] JSON recibido:", data);
    const contratoValido =
      typeof data?.servicio === "string" &&
      typeof data?.estado === "string" &&
      typeof data?.database?.estado === "string";

    if (!contratoValido) throw new Error("Respuesta de estado incompleta");

    const resultado = {
      ok: data.ok,
      servicio: data.servicio,
      ...(typeof data.version === "string" ? { version: data.version } : {}),
      ...(typeof data.timestamp === "string"
        ? { timestamp: data.timestamp }
        : {}),
      estado: data.estado,
      database: { estado: data.database.estado },
    };

    if (
      data.estado === "NO_DISPONIBLE" &&
      data.database.estado === "NO_DISPONIBLE"
    ) {
      return { disponible: false, respuestaValida: true, resultado };
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    if (data.estado === "ACTIVO" && data.database.estado === "ACTIVA") {
      return { disponible: true, respuestaValida: true, resultado };
    }

    throw new Error("Respuesta de estado inconsistente");
  } catch (error) {
    const motivo =
      error?.name === "AbortError"
        ? "Timeout consultando estado"
        : error.message;
    console.error(
      `[windev/status] Clasificada como NO_VERIFICADA. Motivo: ${motivo}`
    );
    return {
      disponible: false,
      respuestaValida: false,
      error: motivo,
    };
  }
};

export const consultarOperacionWinDev = async (windevUrl, operacionId) => {
  let ultimoError = "No se pudo confirmar la operación en WinDev";

  for (let intento = 1; intento <= INTENTOS_CONFIRMACION_WINDEV; intento++) {
    try {
      const response = await fetchConTimeout(
        `${windevUrl}/apicompras/operaciones/${encodeURIComponent(
          operacionId
        )}`,
        {},
        TIMEOUT_GET_WINDEV_MS
      );
      const resultado = await leerJsonSeguro(response);

      if (!response.ok) {
        ultimoError = `WinDev respondió HTTP ${response.status} al consultar la operación`;
      } else if (resultado.operacionID !== operacionId) {
        ultimoError = "WinDev devolvió un operacionID inesperado";
      } else if (resultado.ok === true && resultado.estado === "APLICADA") {
        return { estado: "APLICADA", resultado };
      } else if (resultado.estado === "ERROR") {
        return {
          estado: "ERROR",
          error:
            resultado.error ||
            resultado.mensajeError ||
            "WinDev informó un error al procesar la operación",
          resultado,
        };
      } else if (
        resultado.estado === "RECIBIDA" ||
        resultado.estado === "PROCESANDO"
      ) {
        ultimoError = `La operación continúa en estado ${resultado.estado}`;
      } else if (
        resultado.estado === "NO_ENCONTRADA" ||
        resultado.encontrada === false
      ) {
        ultimoError = "La operación todavía no fue encontrada en WinDev";
      } else {
        ultimoError =
          "WinDev devolvió una respuesta inesperada al consultar la operación";
      }
    } catch (error) {
      ultimoError =
        error.name === "AbortError"
          ? "Timeout al consultar la operación en WinDev"
          : error.message;
    }

    if (intento < INTENTOS_CONFIRMACION_WINDEV) {
      await esperar(DEMORA_CONFIRMACION_WINDEV_MS);
    }
  }

  return { estado: "INCIERTA", error: ultimoError };
};

export const consultarOperacionWinDevParaReconciliacion = async (
  windevUrl,
  operacionId
) => {
  let ultimoError = "No se pudo confirmar la operación en WinDev";
  let ultimoEstadoConfiable = null;

  for (let intento = 1; intento <= INTENTOS_CONFIRMACION_WINDEV; intento++) {
    try {
      const response = await fetchConTimeout(
        `${windevUrl}/apicompras/operaciones/${encodeURIComponent(
          operacionId
        )}`,
        {},
        TIMEOUT_GET_WINDEV_MS
      );
      const resultado = await leerJsonSeguro(response);

      if (!response.ok) {
        ultimoEstadoConfiable = null;
        ultimoError = `WinDev respondió HTTP ${response.status} al consultar la operación`;
      } else if (resultado.operacionID !== operacionId) {
        ultimoEstadoConfiable = null;
        ultimoError = "WinDev devolvió un operacionID inesperado";
      } else if (resultado.ok === true && resultado.estado === "APLICADA") {
        return { estado: "APLICADA", resultado };
      } else if (resultado.estado === "ERROR") {
        return {
          estado: "ERROR",
          error:
            resultado.error ||
            resultado.mensajeError ||
            "WinDev informó un error al procesar la operación",
          resultado,
        };
      } else if (
        resultado.estado === "NO_ENCONTRADA" ||
        resultado.encontrada === false
      ) {
        ultimoEstadoConfiable = "NO_ENCONTRADA";
        ultimoError = "La operación no fue encontrada en WinDev";
      } else if (
        resultado.estado === "RECIBIDA" ||
        resultado.estado === "PROCESANDO"
      ) {
        ultimoEstadoConfiable = resultado.estado;
        ultimoError = `La operación continúa en estado ${resultado.estado}`;
      } else {
        ultimoEstadoConfiable = null;
        ultimoError =
          "WinDev devolvió una respuesta inesperada al consultar la operación";
      }
    } catch (error) {
      ultimoEstadoConfiable = null;
      ultimoError =
        error.name === "AbortError"
          ? "Timeout al consultar la operación en WinDev"
          : error.message;
    }

    if (intento < INTENTOS_CONFIRMACION_WINDEV) {
      await esperar(DEMORA_CONFIRMACION_WINDEV_MS);
    }
  }

  if (ultimoEstadoConfiable === "NO_ENCONTRADA") {
    return { estado: "NO_ENCONTRADA", error: ultimoError };
  }

  return {
    estado: "INCIERTA",
    estadoWinDev: ultimoEstadoConfiable,
    error: ultimoError,
  };
};

export const consultarOperacionWinDevLegacy = async (
  windevUrl,
  operacionId
) => {
  const confirmacion = await consultarOperacionWinDev(windevUrl, operacionId);
  if (confirmacion.estado === "APLICADA") {
    return { aplicada: true, resultado: confirmacion.resultado };
  }
  return {
    aplicada: false,
    definitiva: confirmacion.estado === "ERROR",
    error: confirmacion.error,
    resultado: confirmacion.resultado,
  };
};

export const ejecutarOperacionWinDev = async ({
  windevUrl,
  endpoint,
  operacionId,
  payload,
}) => {
  try {
    const response = await fetchConTimeout(
      `${windevUrl}${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      TIMEOUT_POST_WINDEV_MS
    );
    const resultado = await leerJsonSeguro(response);
    const operacionIdCoincide =
      resultado.operacionID == null || resultado.operacionID === operacionId;

    if (
      response.ok &&
      resultado.ok === true &&
      resultado.estado === "APLICADA" &&
      operacionIdCoincide
    ) {
      return { estado: "APLICADA", resultado };
    }
    if (resultado.estado === "ERROR" && operacionIdCoincide) {
      return {
        estado: "ERROR",
        error:
          resultado.error ||
          resultado.mensajeError ||
          "WinDev informó un error al procesar la operación",
        resultado,
      };
    }
  } catch {
    // El POST pudo aplicarse aunque su respuesta se haya perdido.
  }

  return consultarOperacionWinDev(windevUrl, operacionId);
};
