-- esquemas_control/012_crear_compras_cc_movimientos.sql
-- Tabla de movimientos de cuenta corriente de proveedores.
-- El saldo_acumulado es la fuente de verdad del saldo del proveedor.
-- La columna tipo + comprobante_id permite reconstruir el historial por comprobante.

CREATE TABLE IF NOT EXISTS compras_cc_movimientos (
    id                BIGSERIAL PRIMARY KEY,
    proveedor_id      INTEGER       NOT NULL REFERENCES compras_proveedores(id),
    comprobante_id    INTEGER,          -- FK a compras_facturas.id (NULL para pagos futuros)
    tipo              VARCHAR(20)   NOT NULL,  -- FACTURA | NOTA_CREDITO | NOTA_DEBITO | PAGO
    debito            DECIMAL(19,6) NOT NULL DEFAULT 0,
    credito           DECIMAL(19,6) NOT NULL DEFAULT 0,
    saldo_acumulado   DECIMAL(19,6) NOT NULL,
    fecha             DATE          NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice principal para el SELECT FOR UPDATE del helper registrarMovimientoCC
CREATE INDEX IF NOT EXISTS idx_cc_movimientos_proveedor_id
    ON compras_cc_movimientos (proveedor_id, id DESC);

-- Índice para consultas por comprobante
CREATE INDEX IF NOT EXISTS idx_cc_movimientos_comprobante_id
    ON compras_cc_movimientos (comprobante_id);

COMMENT ON TABLE compras_cc_movimientos IS
    'Registro cronológico de movimientos de cuenta corriente por proveedor. '
    'saldo_acumulado = suma histórica de debitos - creditos hasta ese movimiento.';

COMMENT ON COLUMN compras_cc_movimientos.saldo_acumulado IS
    'Saldo del proveedor luego de aplicar este movimiento. '
    'El último registro por proveedor (ORDER BY id DESC LIMIT 1) es el saldo actual.';
