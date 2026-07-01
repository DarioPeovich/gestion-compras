-- =============================================================================
-- MIGRACIÓN 021 — Recrear compras_cc_movimientos
-- gestionCompras v1.0.6
-- =============================================================================
-- La tabla vieja tenía: factura_id, nota_id, tipo VARCHAR, created_at sin TZ.
-- La tabla nueva unifica en comprobante_id (para cualquier tipo de comprobante)
-- y pago_id (para pagos/órdenes de pago).
-- Regla de negocio: comprobante_id XOR pago_id — nunca ambos poblados.
-- El DROP ya fue ejecutado en migración 016.
-- =============================================================================

BEGIN;

CREATE TABLE compras_cc_movimientos (
    id               SERIAL          PRIMARY KEY,
    proveedor_id     INTEGER         NOT NULL
                                     REFERENCES compras_proveedores(id),
    comprobante_id   INTEGER         NULL
                                     REFERENCES compras_comprobantes(id),
    pago_id          INTEGER         NULL
                                     REFERENCES compras_pagos(id),
    fecha            DATE            NOT NULL,
    debito           NUMERIC(14,2)   NOT NULL DEFAULT 0,  -- deuda generada (facturas, ND)
    credito          NUMERIC(14,2)   NOT NULL DEFAULT 0,  -- deuda cancelada (pagos, NC)
    saldo_acumulado  NUMERIC(14,2)   NOT NULL DEFAULT 0,
    descripcion      VARCHAR(200)    NULL,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX ix_cc_mov_proveedor    ON compras_cc_movimientos (proveedor_id);
CREATE INDEX ix_cc_mov_fecha        ON compras_cc_movimientos (fecha);
CREATE INDEX ix_cc_mov_comprobante  ON compras_cc_movimientos (comprobante_id)
    WHERE comprobante_id IS NOT NULL;
CREATE INDEX ix_cc_mov_pago         ON compras_cc_movimientos (pago_id)
    WHERE pago_id IS NOT NULL;

-- Constraint: al menos uno de los dos debe estar poblado
ALTER TABLE compras_cc_movimientos
    ADD CONSTRAINT chk_cc_mov_origen
    CHECK (comprobante_id IS NOT NULL OR pago_id IS NOT NULL);

COMMIT;
