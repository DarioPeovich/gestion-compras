import assert from "node:assert/strict";

import {
  consultarOperacionWinDevParaReconciliacion,
  ejecutarOperacionWinDev,
} from "../src/services/windevClient.js";

const OPERACION_ID = "11111111-1111-4111-8111-111111111111";
const parametros = {
  windevUrl: "http://windev.test",
  endpoint: "/apicompras/comprobantes/actualizar-articulos-stock",
  operacionId: OPERACION_ID,
  payload: { operacionID: OPERACION_ID },
};

const respuestaJson = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ejecutarConRespuestas = async (respuestas) => {
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    const siguiente = respuestas.shift();
    if (siguiente instanceof Error) throw siguiente;
    assert.ok(siguiente, `No hay respuesta simulada para ${url}`);
    return siguiente;
  };
  return { resultado: await ejecutarOperacionWinDev(parametros), urls };
};

{
  const { resultado, urls } = await ejecutarConRespuestas([
    respuestaJson({ ok: true, estado: "APLICADA", operacionID: OPERACION_ID }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.equal(urls.length, 1);
}

{
  const { resultado, urls } = await ejecutarConRespuestas([
    respuestaJson({ ok: true, estado: "APLICADA" }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.equal(urls.length, 1);
}

{
  const { resultado, urls } = await ejecutarConRespuestas([
    respuestaJson({ ok: true, estado: "APLICADA", operacionID: "otro-id" }),
    respuestaJson({ ok: true, estado: "APLICADA", operacionID: OPERACION_ID }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.equal(urls.length, 2);
  assert.match(urls[1], new RegExp(`/operaciones/${OPERACION_ID}$`));
}

{
  const { resultado, urls } = await ejecutarConRespuestas([
    respuestaJson({ estado: "ERROR", operacionID: OPERACION_ID, error: "fallo controlado" }),
  ]);
  assert.equal(resultado.estado, "ERROR");
  assert.equal(resultado.error, "fallo controlado");
  assert.equal(urls.length, 1);
}

{
  const respuestas = [
    respuestaJson({ ok: true, estado: "RECIBIDA" }),
    ...Array.from({ length: 5 }, () =>
      respuestaJson({
        ok: true,
        estado: "NO_ENCONTRADA",
        encontrada: false,
        operacionID: OPERACION_ID,
      })
    ),
  ];
  const { resultado, urls } = await ejecutarConRespuestas(respuestas);
  assert.equal(resultado.estado, "INCIERTA");
  assert.equal(urls.length, 6);
  assert.ok(urls.slice(1).every((url) => url.endsWith(`/operaciones/${OPERACION_ID}`)));
}

{
  const { resultado, urls } = await ejecutarConRespuestas([
    new Response("", { status: 500 }),
    respuestaJson({ ok: true, estado: "APLICADA", operacionID: OPERACION_ID }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.equal(urls.length, 2);
}

{
  const timeout = new Error("timeout simulado");
  timeout.name = "AbortError";
  const { resultado, urls } = await ejecutarConRespuestas([
    timeout,
    respuestaJson({ estado: "ERROR", operacionID: OPERACION_ID, error: "fallo confirmado" }),
  ]);
  assert.equal(resultado.estado, "ERROR");
  assert.equal(resultado.error, "fallo confirmado");
  assert.equal(urls.length, 2);
}

console.log("windevClient: 7 escenarios OK");

const reconciliarConRespuestas = async (respuestas) => {
  const urls = [];
  globalThis.fetch = async (url, options = {}) => {
    urls.push({ url: String(url), method: options.method || "GET" });
    const siguiente = respuestas.shift();
    if (siguiente instanceof Error) throw siguiente;
    assert.ok(siguiente, `No hay respuesta simulada para ${url}`);
    return siguiente;
  };
  const resultado = await consultarOperacionWinDevParaReconciliacion(
    parametros.windevUrl,
    OPERACION_ID
  );
  assert.ok(urls.every(({ method }) => method === "GET"));
  return { resultado, urls };
};

{
  const { resultado } = await reconciliarConRespuestas([
    respuestaJson({
      ok: true,
      estado: "APLICADA",
      operacionID: OPERACION_ID,
      stockMovId: 14334,
      itemsStockProcesados: 2,
    }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.equal(resultado.resultado.stockMovId, 14334);
  assert.equal(resultado.resultado.itemsStockProcesados, 2);
}

{
  const { resultado } = await reconciliarConRespuestas([
    respuestaJson({
      ok: true,
      estado: "APLICADA",
      operacionID: OPERACION_ID,
      stockMovId: 0,
      itemsStockProcesados: 0,
      itemsCostoProcesados: 1,
    }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.equal(Number(resultado.resultado.stockMovId || 0) > 0, false);
  assert.equal(Number(resultado.resultado.itemsStockProcesados || 0) > 0, false);
}

{
  const { resultado } = await reconciliarConRespuestas([
    respuestaJson({
      ok: true,
      estado: "APLICADA",
      operacionID: OPERACION_ID,
      stockMovId: 0,
      itemsStockProcesados: 2,
    }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.ok(Number(resultado.resultado.itemsStockProcesados || 0) > 0);
}

{
  const { resultado } = await reconciliarConRespuestas([
    respuestaJson({
      ok: true,
      estado: "APLICADA",
      operacionID: OPERACION_ID,
      stockMovId: 14334,
      itemsStockProcesados: 0,
    }),
  ]);
  assert.equal(resultado.estado, "APLICADA");
  assert.ok(Number(resultado.resultado.stockMovId || 0) > 0);
}

{
  const { resultado } = await reconciliarConRespuestas([
    respuestaJson({ estado: "ERROR", operacionID: OPERACION_ID, error: "rechazo" }),
  ]);
  assert.equal(resultado.estado, "ERROR");
}

{
  const { resultado, urls } = await reconciliarConRespuestas(
    Array.from({ length: 5 }, () =>
      respuestaJson({
        estado: "NO_ENCONTRADA",
        encontrada: false,
        operacionID: OPERACION_ID,
      })
    )
  );
  assert.equal(resultado.estado, "NO_ENCONTRADA");
  assert.equal(urls.length, 5);
}

{
  const { resultado } = await reconciliarConRespuestas(
    Array.from({ length: 5 }, () =>
      respuestaJson({ estado: "PROCESANDO", operacionID: OPERACION_ID })
    )
  );
  assert.equal(resultado.estado, "INCIERTA");
  assert.equal(resultado.estadoWinDev, "PROCESANDO");
}

{
  const timeout = new Error("timeout simulado");
  timeout.name = "AbortError";
  const { resultado } = await reconciliarConRespuestas(
    Array.from({ length: 5 }, () => timeout)
  );
  assert.equal(resultado.estado, "INCIERTA");
  assert.equal(resultado.estadoWinDev, null);
}

console.log("reconciliación WinDev: 8 escenarios GET OK");
