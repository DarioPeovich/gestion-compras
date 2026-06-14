-- 008_crear_compras_cc_movimientos.sql
-- Registro cronologico de todos los movimientos de la CC del proveedor.
-- saldo_acumulado se guarda en cada fila para consultas instantaneas.
-- Solo uno de factura_id / nota_id / pago_id tiene valor por fila, el resto NULL.
--
-- IMPORTANTE (concurrencia): toda insercion en esta tabla debe realizarse
-- dentro de una transaccion que primero ejecute, sobre la ultima fila de
-- este proveedor:
--   SELECT saldo_acumulado FROM compras_cc_movimientos
--   WHERE proveedor_id = $1 ORDER BY id DESC LIMIT 1 FOR UPDATE;
-- Esto evita que dos operaciones simultaneas sobre el mismo proveedor
-- calculen el saldo_acumulado a partir del mismo valor previo.
--
-- tipo: se informa explicitamente (no se deduce de los FK) para simplificar
-- reportes: FACTURA | NOTA_CREDITO | NOTA_DEBITO | NOTA_CREDITO_INTERNA |
-- NOTA_DEBITO_INTERNA | PAGO

CREATE TABLE compras_cc_movimientos (
  id                SERIAL PRIMARY KEY,
  proveedor_id      INTEGER NOT NULL REFERENCES compras_proveedores(id),
  factura_id        INTEGER REFERENCES compras_facturas(id),
  nota_id           INTEGER REFERENCES compras_notas_cd(id),
  pago_id           INTEGER REFERENCES compras_pagos(id),
  tipo              VARCHAR(30) NOT NULL,
  fecha             DATE NOT NULL,
  debito            DECIMAL(19,6) NOT NULL DEFAULT 0,
  credito           DECIMAL(19,6) NOT NULL DEFAULT 0,
  saldo_acumulado   DECIMAL(19,6) NOT NULL,
  descripcion       VARCHAR(200),
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_cc_mov_proveedor ON compras_cc_movimientos(proveedor_id);
CREATE INDEX idx_compras_cc_mov_fecha     ON compras_cc_movimientos(fecha);
CREATE INDEX idx_compras_cc_mov_tipo      ON compras_cc_movimientos(tipo);
CREATE INDEX idx_compras_cc_mov_factura   ON compras_cc_movimientos(factura_id);
CREATE INDEX idx_compras_cc_mov_nota      ON compras_cc_movimientos(nota_id);
CREATE INDEX idx_compras_cc_mov_pago      ON compras_cc_movimientos(pago_id);

-- Indice clave para el patron FOR UPDATE (ultima fila por proveedor)
CREATE INDEX idx_compras_cc_mov_proveedor_id_desc ON compras_cc_movimientos(proveedor_id, id DESC);
