-- 007_crear_compras_pagos.sql
-- compras_pagos: cabecera del pago al proveedor. saldo = importe_total
-- menos lo ya aplicado via cc_aplicaciones (permite pagos a cuenta /
-- anticipos sin factura asociada al momento del pago).
-- compras_pagos_medios: con que medios se realizo el pago (puede ser
-- combinado: parte transferencia, parte cheque, etc).
--
-- compras_cc_aplicaciones: vincula un origen de credito (pago o nota de
-- credito) con un destino de deuda (factura o nota de debito), por un
-- importe parcial o total. Es la unica forma de modificar el saldo de
-- facturas, notas y pagos -- sin aplicaciones, el saldo por comprobante
-- no tendria trazabilidad.

CREATE TABLE compras_pagos (
  id              SERIAL PRIMARY KEY,
  proveedor_id    INTEGER NOT NULL REFERENCES compras_proveedores(id),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  importe_total   DECIMAL(19,6) NOT NULL,
  saldo           DECIMAL(19,6) NOT NULL DEFAULT 0,
  observaciones   TEXT,
  usuario_id      INTEGER NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- medio: TRANSFERENCIA | CHEQUE | EFECTIVO | TARJETA | OTROS
CREATE TABLE compras_pagos_medios (
  id          SERIAL PRIMARY KEY,
  pago_id     INTEGER NOT NULL REFERENCES compras_pagos(id),
  medio       VARCHAR(20) NOT NULL,
  importe     DECIMAL(19,6) NOT NULL,
  referencia  VARCHAR(100),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Origen (credito): solo uno de pago_id / nota_credito_id tiene valor.
-- Destino (deuda):  solo uno de factura_id / nota_debito_id tiene valor.
CREATE TABLE compras_cc_aplicaciones (
  id                SERIAL PRIMARY KEY,
  proveedor_id      INTEGER NOT NULL REFERENCES compras_proveedores(id),
  pago_id           INTEGER REFERENCES compras_pagos(id),
  nota_credito_id   INTEGER REFERENCES compras_notas_cd(id),
  factura_id        INTEGER REFERENCES compras_facturas(id),
  nota_debito_id    INTEGER REFERENCES compras_notas_cd(id),
  importe           DECIMAL(19,6) NOT NULL,
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id        INTEGER NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_pagos_proveedor       ON compras_pagos(proveedor_id);
CREATE INDEX idx_compras_pagos_fecha           ON compras_pagos(fecha);
CREATE INDEX idx_compras_pagos_saldo           ON compras_pagos(saldo);
CREATE INDEX idx_compras_pagos_medios_pago     ON compras_pagos_medios(pago_id);
CREATE INDEX idx_compras_cc_aplic_proveedor    ON compras_cc_aplicaciones(proveedor_id);
CREATE INDEX idx_compras_cc_aplic_pago         ON compras_cc_aplicaciones(pago_id);
CREATE INDEX idx_compras_cc_aplic_nota_credito ON compras_cc_aplicaciones(nota_credito_id);
CREATE INDEX idx_compras_cc_aplic_factura      ON compras_cc_aplicaciones(factura_id);
CREATE INDEX idx_compras_cc_aplic_nota_debito  ON compras_cc_aplicaciones(nota_debito_id);
