-- =============================================================================
-- MIGRACIÓN 018 — Crear compras_comprobantes_detalle
-- gestionCompras v1.0.6
-- =============================================================================
-- Detalle de líneas unificado para todos los tipos de comprobante.
-- hfsql_articulos_id = -99  →  concepto manual (flete, descuentos, etc.)
-- hfsql_articulos_id > 0    →  artículo real de HFSQL
-- articulo_descrip VARCHAR(200): Postgres usa almacenamiento variable,
--   sin costo adicional frente a VARCHAR(50). Da margen para texto libre.
-- =============================================================================

BEGIN;

CREATE TABLE compras_comprobantes_detalle (
    id                  SERIAL          PRIMARY KEY,
    comprobante_id      INTEGER         NOT NULL
                                        REFERENCES compras_comprobantes(id)
                                        ON DELETE CASCADE,
    hfsql_articulos_id  INTEGER         NULL,       -- -99 = concepto manual
    articulo_codigo     VARCHAR(50)     NULL,       -- NULL para manuales
    articulo_descrip    VARCHAR(200)    NOT NULL,   -- snapshot o texto libre
    cantidad            NUMERIC(12,4)   NOT NULL DEFAULT 0,
    precio_costo        NUMERIC(14,4)   NOT NULL DEFAULT 0,
    importe_linea       NUMERIC(14,2)   NOT NULL DEFAULT 0
);

CREATE INDEX ix_cbte_detalle_comprobante ON compras_comprobantes_detalle (comprobante_id);
CREATE INDEX ix_cbte_detalle_articulo    ON compras_comprobantes_detalle (hfsql_articulos_id)
    WHERE hfsql_articulos_id IS NOT NULL AND hfsql_articulos_id != -99;

COMMIT;
