-- =============================================================================
-- MIGRACIÓN 019 — Crear compras_comprobantes_iva_detalle
--                       y compras_comprobantes_tributos_detalle
-- gestionCompras v1.0.6
-- =============================================================================
-- Pie del comprobante: alícuotas de IVA y tributos (percepciones,
-- retenciones, impuestos internos, etc.).
-- Reemplaza las nunca-aplicadas compras_facturas_iva_detalle
-- y compras_facturas_tributos_detalle del plan v1.0.5.
-- =============================================================================

BEGIN;

-- IVA discriminado por alícuota
CREATE TABLE compras_comprobantes_iva_detalle (
    id              SERIAL          PRIMARY KEY,
    comprobante_id  INTEGER         NOT NULL
                                    REFERENCES compras_comprobantes(id)
                                    ON DELETE CASCADE,
    iva_tipo_id     INTEGER         NOT NULL,   -- ID en HFSQL ivaTipos
    base_imponible  NUMERIC(14,2)   NOT NULL DEFAULT 0,
    importe_iva     NUMERIC(14,2)   NOT NULL DEFAULT 0
);

CREATE INDEX ix_iva_detalle_comprobante ON compras_comprobantes_iva_detalle (comprobante_id);

-- Tributos (percepciones, retenciones, impuestos internos, etc.)
CREATE TABLE compras_comprobantes_tributos_detalle (
    id              SERIAL          PRIMARY KEY,
    comprobante_id  INTEGER         NOT NULL
                                    REFERENCES compras_comprobantes(id)
                                    ON DELETE CASCADE,
    tributo_id      INTEGER         NOT NULL,   -- ID en HFSQL tributos
    base_imponible  NUMERIC(14,2)   NULL,       -- NULL si no aplica base
    importe         NUMERIC(14,2)   NOT NULL DEFAULT 0
);

CREATE INDEX ix_tributos_detalle_comprobante ON compras_comprobantes_tributos_detalle (comprobante_id);

COMMIT;
