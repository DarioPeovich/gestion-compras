-- 006_crear_compras_notas_cd.sql
-- Notas de Credito/Debito de proveedor, tanto fiscales (NC_A/NC_B/NC_C,
-- ND_A/ND_B/ND_C) como internas (NC_INT/ND_INT, no fiscales), segun
-- compras_comprobantes_tipo.cbte_fiscal.
--
-- El tipo (credito o debito) y su efecto sobre la cuenta corriente se
-- determinan por compras_comprobantes_tipo.factor (+1/-1); no se repite
-- esa informacion en esta tabla.
--
-- saldo: importe de la nota aun no aplicado (via cc_aplicaciones).
-- factura_id es nullable: puede referenciar una factura especifica o ser general
-- (por ejemplo, un ajuste interno que no corrige una factura puntual).

CREATE TABLE compras_notas_cd (
  id                     SERIAL PRIMARY KEY,
  proveedor_id           INTEGER NOT NULL REFERENCES compras_proveedores(id),
  comprobante_tipo_id    INTEGER NOT NULL REFERENCES compras_comprobantes_tipo(id),
  factura_id             INTEGER REFERENCES compras_facturas(id),
  punto_venta            INTEGER NOT NULL,
  nro_comprobante        INTEGER NOT NULL,
  fecha                  DATE NOT NULL DEFAULT CURRENT_DATE,
  importe                DECIMAL(19,6) NOT NULL,
  saldo                  DECIMAL(19,6) NOT NULL DEFAULT 0,
  motivo                 VARCHAR(200),
  impuestos              JSONB,
  stock_ajustado         BOOLEAN NOT NULL DEFAULT FALSE,
  estado                 VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO',
  observaciones          TEXT,
  usuario_id             INTEGER NOT NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(proveedor_id, comprobante_tipo_id, punto_venta, nro_comprobante)
);

CREATE TABLE compras_notas_cd_detalle (
  id                  SERIAL PRIMARY KEY,
  nota_id             INTEGER NOT NULL REFERENCES compras_notas_cd(id),
  hfsql_articulos_id  INTEGER,
  articulo_codigo     VARCHAR(20),
  articulo_descrip    VARCHAR(100),
  cantidad            DECIMAL(14,3),
  precio_costo        DECIMAL(19,6),
  importe_linea       DECIMAL(19,6) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_notas_cd_proveedor ON compras_notas_cd(proveedor_id);
CREATE INDEX idx_compras_notas_cd_factura   ON compras_notas_cd(factura_id);
CREATE INDEX idx_compras_notas_cd_tipo      ON compras_notas_cd(comprobante_tipo_id);
CREATE INDEX idx_compras_notas_cd_saldo     ON compras_notas_cd(saldo);
CREATE INDEX idx_compras_notas_cd_detalle_nota ON compras_notas_cd_detalle(nota_id);
