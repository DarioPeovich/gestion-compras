-- =============================================================================
-- MIGRACIÓN 017 — Crear compras_comprobantes
-- gestionCompras v1.0.6
-- =============================================================================
-- Tabla cabecera unificada para: Facturas A/B/C, NC Compra, ND Compra,
-- NC Interna, ND Interna.
-- Los Remitos NO van aquí — tienen tabla propia (compras_remitos).
-- =============================================================================

BEGIN;

CREATE TABLE compras_comprobantes (
    id                        SERIAL          PRIMARY KEY,
    proveedor_id              INTEGER         NOT NULL
                                              REFERENCES compras_proveedores(id),
    comprobante_tipo_id       INTEGER         NOT NULL
                                              REFERENCES compras_comprobantes_tipo(id),
    punto_venta               SMALLINT        NOT NULL,
    numero_comprobante        INTEGER         NOT NULL,
    fecha                     DATE            NOT NULL,
    fecha_vto                 DATE            NULL,
    subtotal                  NUMERIC(14,2)   NOT NULL DEFAULT 0,
    total                     NUMERIC(14,2)   NOT NULL DEFAULT 0,
    saldo                     NUMERIC(14,2)   NOT NULL DEFAULT 0,
    estado                    VARCHAR(20)     NOT NULL DEFAULT 'CONFIRMADO',
    fecha_actualizacion_stock TIMESTAMPTZ     NULL,
    observaciones             TEXT            NULL,
    usuario_id                INTEGER         NOT NULL,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Evita duplicar el mismo comprobante fiscal del mismo proveedor
CREATE UNIQUE INDEX uix_comprobantes_fiscal
    ON compras_comprobantes (proveedor_id, comprobante_tipo_id, punto_venta, numero_comprobante);

-- Índices de uso frecuente
CREATE INDEX ix_comprobantes_proveedor  ON compras_comprobantes (proveedor_id);
CREATE INDEX ix_comprobantes_fecha      ON compras_comprobantes (fecha);
CREATE INDEX ix_comprobantes_estado     ON compras_comprobantes (estado);

COMMIT;
