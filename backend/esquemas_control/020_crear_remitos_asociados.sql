-- =============================================================================
-- MIGRACIÓN 020 — Crear compras_remitos_asociados
-- gestionCompras v1.0.6
-- =============================================================================
-- Vínculo N remitos → 1 factura.
-- Una factura puede consolidar múltiples remitos de entrega parcial.
-- Reemplaza compras_remitos_facturas (dropeada en migración 016).
--
-- Cardinalidad:
--   compras_comprobantes (factura)  1 ──< N  compras_remitos_asociados
--   compras_remitos                 1 ──< N  compras_remitos_asociados
--   (un remito podría asociarse a más de una factura en casos de
--    facturación parcial — la tabla lo soporta sin restricción adicional)
-- =============================================================================

BEGIN;

CREATE TABLE compras_remitos_asociados (
    id              SERIAL  PRIMARY KEY,
    comprobante_id  INTEGER NOT NULL
                            REFERENCES compras_comprobantes(id)
                            ON DELETE CASCADE,
    remito_id       INTEGER NOT NULL
                            REFERENCES compras_remitos(id)
);

CREATE INDEX ix_remitos_asoc_comprobante ON compras_remitos_asociados (comprobante_id);
CREATE INDEX ix_remitos_asoc_remito      ON compras_remitos_asociados (remito_id);

-- Evita vincular el mismo remito dos veces a la misma factura
CREATE UNIQUE INDEX uix_remitos_asoc
    ON compras_remitos_asociados (comprobante_id, remito_id);

COMMIT;
