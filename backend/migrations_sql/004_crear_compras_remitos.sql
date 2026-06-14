-- 004_crear_compras_remitos.sql
-- El remito se guarda e impacta stock en HFSQL de forma atomica:
-- si la actualizacion de stock via WinDev API falla, no se guarda el remito
-- (rollback completo). No existe un estado intermedio "pendiente".
--
-- estado: CONFIRMADO | ANULADO
-- Un remito solo puede anularse si no tiene aplicaciones que lo afecten
-- (en la practica, los remitos no participan de cc_aplicaciones, pero el
-- estado ANULADO dispara la reversa del movimiento de stock en HFSQL).

CREATE TABLE compras_remitos (
  id                SERIAL PRIMARY KEY,
  proveedor_id      INTEGER NOT NULL REFERENCES compras_proveedores(id),
  orden_compra_id   INTEGER REFERENCES compras_ordenes_compra(id),
  nro_remito        VARCHAR(20) NOT NULL,
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  deposito_id       INTEGER NOT NULL,
  estado            VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',
  stock_actualizado BOOLEAN NOT NULL DEFAULT FALSE,
  observaciones     TEXT,
  usuario_id        INTEGER NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE compras_remitos_detalle (
  id                  SERIAL PRIMARY KEY,
  remito_id           INTEGER NOT NULL REFERENCES compras_remitos(id),
  hfsql_articulos_id  INTEGER NOT NULL,
  articulo_codigo     VARCHAR(20) NOT NULL,
  articulo_descrip    VARCHAR(100) NOT NULL,
  cantidad            DECIMAL(14,3) NOT NULL,
  precio_costo        DECIMAL(19,6),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_remitos_proveedor  ON compras_remitos(proveedor_id);
CREATE INDEX idx_compras_remitos_estado     ON compras_remitos(estado);
CREATE INDEX idx_compras_remitos_fecha      ON compras_remitos(fecha);
CREATE INDEX idx_compras_remitos_detalle_remito ON compras_remitos_detalle(remito_id);
