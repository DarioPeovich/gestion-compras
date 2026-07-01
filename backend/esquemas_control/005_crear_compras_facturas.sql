-- 005_crear_compras_facturas.sql
-- stock_actualizado=FALSE cuando ya existe remito asociado (stock ya fue actualizado).
-- stock_actualizado=TRUE cuando la factura llega sola (sin remito previo) y por
-- lo tanto dispara ella misma el ingreso de stock.
--
-- saldo: importe pendiente de cancelar (total - aplicaciones via cc_aplicaciones).
--        saldo = total            -> pendiente
--        0 < saldo < total        -> pagada parcial
--        saldo = 0                -> pagada
--        (no se guarda un campo de estado de pago separado: se deriva de saldo)
--
-- estado: CONFIRMADO | ANULADO
-- Una factura con aplicaciones (saldo distinto de total) NO puede anularse;
-- cualquier ajuste posterior se realiza mediante una Nota de Credito/Debito
-- interna (compras_comprobantes_tipo.cbte_fiscal = false).

CREATE TABLE compras_facturas (
  id                     SERIAL PRIMARY KEY,
  proveedor_id           INTEGER NOT NULL REFERENCES compras_proveedores(id),
  comprobante_tipo_id    INTEGER NOT NULL REFERENCES compras_comprobantes_tipo(id),
  punto_venta            INTEGER NOT NULL,
  nro_factura            INTEGER NOT NULL,
  fecha                  DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vto              DATE,
  subtotal               DECIMAL(19,6) NOT NULL DEFAULT 0,
  total                  DECIMAL(19,6) NOT NULL DEFAULT 0,
  saldo                  DECIMAL(19,6) NOT NULL DEFAULT 0,
  impuestos              JSONB,
  estado                 VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',
  stock_actualizado      BOOLEAN NOT NULL DEFAULT FALSE,
  observaciones          TEXT,
  usuario_id             INTEGER NOT NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(proveedor_id, comprobante_tipo_id, punto_venta, nro_factura)
);

CREATE TABLE compras_facturas_detalle (
  id                  SERIAL PRIMARY KEY,
  factura_id          INTEGER NOT NULL REFERENCES compras_facturas(id),
  hfsql_articulos_id  INTEGER NOT NULL,
  articulo_codigo     VARCHAR(20) NOT NULL,
  articulo_descrip    VARCHAR(100) NOT NULL,
  cantidad            DECIMAL(14,3) NOT NULL,
  precio_costo        DECIMAL(19,6) NOT NULL,
  impuestos_linea     JSONB,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Asociación N:M entre remitos y facturas.
-- Una factura puede agrupar varios remitos; un remito puede figurar en
-- varias facturas (caso raro pero posible).
CREATE TABLE compras_remitos_facturas (
  id          SERIAL PRIMARY KEY,
  remito_id   INTEGER NOT NULL REFERENCES compras_remitos(id),
  factura_id  INTEGER NOT NULL REFERENCES compras_facturas(id),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(remito_id, factura_id)
);

CREATE INDEX idx_compras_facturas_proveedor ON compras_facturas(proveedor_id);
CREATE INDEX idx_compras_facturas_estado    ON compras_facturas(estado);
CREATE INDEX idx_compras_facturas_saldo     ON compras_facturas(saldo);
CREATE INDEX idx_compras_facturas_fecha_vto ON compras_facturas(fecha_vto);
CREATE INDEX idx_compras_facturas_detalle_factura ON compras_facturas_detalle(factura_id);
CREATE INDEX idx_compras_remitos_facturas_remito   ON compras_remitos_facturas(remito_id);
CREATE INDEX idx_compras_remitos_facturas_factura  ON compras_remitos_facturas(factura_id);
