import prisma from "../config/prisma.js";
import { randomUUID } from "node:crypto";

const DESCRIP_ABREV_REMITO = "RtoCmp";
const TIMEOUT_POST_WINDEV_MS = 8000;
const TIMEOUT_GET_WINDEV_MS = 4000;
const INTENTOS_CONFIRMACION_WINDEV = 5;
const DEMORA_CONFIRMACION_WINDEV_MS = 500;

const campoEnteroPositivo = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchConTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const leerJsonSeguro = async (response) => {
  const texto = await response.text();
  if (!texto.trim()) throw new Error("WinDev devolvió un cuerpo vacío");

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("WinDev devolvió un JSON inválido");
  }
};

const consultarOperacionWinDev = async (windevUrl, operacionId) => {
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
        return { aplicada: true, resultado };
      } else if (resultado.estado === "ERROR") {
        return {
          aplicada: false,
          definitiva: true,
          error:
            resultado.error ||
            resultado.mensajeError ||
            "WinDev informó un error al actualizar el stock",
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

  return { aplicada: false, definitiva: false, error: ultimoError };
};

const eliminarRemitoSinStock = (remitoId) =>
  prisma.$transaction(async (tx) => {
    await tx.compras_remitos_detalle.deleteMany({
      where: { remito_id: remitoId },
    });
    await tx.compras_remitos.delete({ where: { id: remitoId } });
  });

export const registrarRemito = async (req, res, next) => {
  const {
    proveedor_id,
    punto_venta,
    numero_remito,
    fecha,
    deposito_id,
    sucursal_id,
    observaciones,
    usuario_id,
    usuario_nombre,
    actualizar_stock,
    items = [],
  } = req.body;
  const operacionId = actualizar_stock === true ? randomUUID() : null;

  if (
    !campoEnteroPositivo(proveedor_id) ||
    !campoEnteroPositivo(punto_venta) ||
    !campoEnteroPositivo(numero_remito) ||
    !fecha ||
    !campoEnteroPositivo(deposito_id) ||
    !campoEnteroPositivo(usuario_id)
  ) {
    return res.status(400).json({
      ok: false,
      error:
        "Faltan campos obligatorios o son inválidos: proveedor_id, punto_venta, numero_remito, fecha, deposito_id, usuario_id",
    });
  }

  const fechaRemito = new Date(fecha);
  if (Number.isNaN(fechaRemito.getTime())) {
    return res
      .status(400)
      .json({ ok: false, error: "La fecha del remito es inválida" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ ok: false, error: "El remito debe contener al menos un ítem" });
  }

  const conceptoManual = items.find(
    (item) => Number(item.hfsql_articulos_id) <= 0
  );
  if (conceptoManual) {
    return res.status(400).json({
      ok: false,
      error:
        "Los remitos no permiten conceptos manuales; todos los ítems deben corresponder a artículos válidos",
    });
  }

  const itemInvalido = items.find(
    (item) =>
      !campoEnteroPositivo(item.hfsql_articulos_id) ||
      !(Number(item.cantidad) > 0) ||
      !String(item.articulo_codigo || "").trim() ||
      !String(item.articulo_descrip || "").trim()
  );
  if (itemInvalido) {
    return res.status(400).json({
      ok: false,
      error:
        "Cada ítem debe tener artículo, código, descripción y cantidad mayor a cero",
    });
  }

  try {
    const duplicado = await prisma.compras_remitos.findUnique({
      where: {
        proveedor_id_punto_venta_numero_remito: {
          proveedor_id: Number(proveedor_id),
          punto_venta: Number(punto_venta),
          numero_remito: Number(numero_remito),
        },
      },
      select: { id: true },
    });

    if (duplicado) {
      return res.status(409).json({
        ok: false,
        error:
          "Ya existe un remito con el mismo proveedor, punto de venta y número",
        remito_id: duplicado.id,
      });
    }

    const tipoRemito = await prisma.compras_comprobantes_tipo.findFirst({
      where: { descrip_abrev: DESCRIP_ABREV_REMITO },
    });
    if (!tipoRemito?.hfsql_comprobante_tipo_id) {
      return res.status(500).json({
        ok: false,
        error: "No se encontró la configuración WinDev del tipo Remito Compra",
      });
    }

    const remito = await prisma.$transaction(async (tx) => {
      const cabecera = await tx.compras_remitos.create({
        data: {
          operacion_id: operacionId,
          proveedor_id: Number(proveedor_id),
          punto_venta: Number(punto_venta),
          numero_remito: Number(numero_remito),
          fecha: fechaRemito,
          deposito_id: Number(deposito_id),
          estado: "CONFIRMADO",
          stock_actualizado: false,
          observaciones: observaciones || null,
          usuario_id: Number(usuario_id),
        },
      });

      await tx.compras_remitos_detalle.createMany({
        data: items.map((item) => ({
          remito_id: cabecera.id,
          hfsql_articulos_id: Number(item.hfsql_articulos_id),
          articulo_codigo: String(item.articulo_codigo).trim(),
          articulo_descrip: String(item.articulo_descrip).trim(),
          cantidad: Number(item.cantidad),
          precio_costo:
            item.precio_costo == null ? null : Number(item.precio_costo),
        })),
      });

      return cabecera;
    });

    if (actualizar_stock === true) {
      const WINDEV_URL = process.env.WINDEV_API_URL;

      if (!WINDEV_URL) {
        await eliminarRemitoSinStock(remito.id);
        return res.status(503).json({
          ok: false,
          error:
            "No se pudo actualizar el stock: la API WinDev no está configurada",
        });
      }

      try {
        let confirmacion;

        try {
          const respuestaStock = await fetchConTimeout(
            `${WINDEV_URL}/apicompras/stock/actualizar`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                operacionID: operacionId,
                tipoOperacion: "ACTUALIZAR_STOCK",
                tipoEntidad: "REMITO",
                entidadID: remito.id,
                comprobanteTipoId: tipoRemito.hfsql_comprobante_tipo_id,
                depositoId: Number(deposito_id),
                factor: tipoRemito.factor,
                usuarioId: Number(usuario_id),
                usuarioNombre: usuario_nombre || "",
                observaciones:
                  observaciones ||
                  `${DESCRIP_ABREV_REMITO} ${String(punto_venta).padStart(
                    4,
                    "0"
                  )}-${String(numero_remito).padStart(8, "0")}`,
                puntoVenta: Number(punto_venta),
                nroComprobante: Number(numero_remito),
                items: items.map((item) => ({
                  articulosID: Number(item.hfsql_articulos_id),
                  cantidad: Number(item.cantidad),
                  descripcion: String(item.articulo_descrip),
                  precioCosto:
                    item.precio_costo == null
                      ? null
                      : Number(item.precio_costo),
                })),
              }),
            },
            TIMEOUT_POST_WINDEV_MS
          );
          const resultadoPost = await leerJsonSeguro(respuestaStock);

          if (
            respuestaStock.ok &&
            resultadoPost.ok === true &&
            resultadoPost.estado === "APLICADA"
          ) {
            confirmacion = { aplicada: true, resultado: resultadoPost };
          } else if (resultadoPost.estado === "ERROR") {
            confirmacion = {
              aplicada: false,
              definitiva: true,
              error:
                resultadoPost.error ||
                resultadoPost.mensajeError ||
                "WinDev informó un error al actualizar el stock",
              resultado: resultadoPost,
            };
          } else {
            confirmacion = await consultarOperacionWinDev(
              WINDEV_URL,
              operacionId
            );
          }
        } catch {
          confirmacion = await consultarOperacionWinDev(
            WINDEV_URL,
            operacionId
          );
        }

        if (!confirmacion.aplicada) {
          await eliminarRemitoSinStock(remito.id);

          if (confirmacion.definitiva) {
            return res.status(502).json({
              ok: false,
              error: "WinDev rechazó la actualización de stock",
              detalle: confirmacion.error,
              operacionID: operacionId,
            });
          }

          return res.status(502).json({
            ok: false,
            error: `No se pudo confirmar la actualización de stock en WinDev: ${confirmacion.error}`,
          });
        }
      } catch (error) {
        await eliminarRemitoSinStock(remito.id);
        return res.status(502).json({
          ok: false,
          error: `No se pudo actualizar el stock en WinDev: ${error.message}`,
        });
      }

      await prisma.compras_remitos.update({
        where: { id: remito.id },
        data: { stock_actualizado: true },
      });
    }

    res.status(201).json({
      ok: true,
      data: {
        id: remito.id,
        proveedor_id: remito.proveedor_id,
        punto_venta: remito.punto_venta,
        numero_remito: remito.numero_remito,
        estado: remito.estado,
        stock_actualizado: actualizar_stock === true,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        ok: false,
        error:
          "Ya existe un remito con el mismo proveedor, punto de venta y número",
      });
    }
    next(error);
  }
};
