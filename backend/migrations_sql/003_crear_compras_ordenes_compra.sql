-- 003_crear_compras_ordenes_compra.sql
-- OC es opcional en el circuito. No bloquea la recepción de remitos ni facturas.
-- estado: BORRADOR | ENVIADA | RECIBIDA_PARCIAL | RECIBIDA | ANULADA

CREATE TABLE compras_ordenes_compra (
  id              SERIAL PRIMARY KEY,
  proveedor_id    INTEGER NOT NULL REFERENCES compras_proveedores(id),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega   DATE,
  estado          VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
  observaciones   TEXT,
  usuario_id      INTEGER NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE compras_ordenes_compra_detalle (
  id                  SERIAL PRIMARY KEY,
  orden_compra_id     INTEGER NOT NULL REFERENCES compras_ordenes_compra(id),
  hfsql_articulos_id  INTEGER NOT NULL,
  articulo_codigo     VARCHAR(20) NOT NULL,
  articulo_descrip    VARCHAR(100) NOT NULL,
  cantidad            DECIMAL(14,3) NOT NULL,
  precio_unitario     DECIMAL(19,6),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_oc_proveedor  ON compras_ordenes_compra(proveedor_id);
CREATE INDEX idx_compras_oc_estado     ON compras_ordenes_compra(estado);
CREATE INDEX idx_compras_ocd_orden     ON compras_ordenes_compra_detalle(orden_compra_id);
