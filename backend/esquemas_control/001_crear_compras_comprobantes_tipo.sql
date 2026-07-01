-- 001_crear_compras_comprobantes_tipo.sql
-- Tabla de referencia de tipos de comprobante relevantes para Compras.
-- Replica el concepto ya existente en HFSQL (comprobantesTipo), pero acotado
-- a los tipos que aplican del lado de Compras (Facturas, NC/ND, e internos).
--
-- factor: +1 aumenta la deuda con el proveedor, -1 la disminuye.
-- cbte_fiscal: false para comprobantes internos (NC_INT/ND_INT), usados
--              para ajustes que no representan un documento fiscal real.

CREATE TABLE compras_comprobantes_tipo (
  id                INTEGER PRIMARY KEY,
  comprob_afip_id   INTEGER,
  descripcion       VARCHAR(50) NOT NULL,
  descrip_abrev     VARCHAR(10) NOT NULL,
  letra             VARCHAR(2),
  factor            SMALLINT NOT NULL CHECK (factor IN (1, -1)),
  cbte_fiscal       BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO compras_comprobantes_tipo (id, comprob_afip_id, descripcion, descrip_abrev, letra, factor, cbte_fiscal) VALUES
  (1,  1,  'Factura A',          'Fac_A',  'A',  1, true),
  (2,  6,  'Nota de Debito A',   'ND_A',   'A',  1, true),
  (3,  7,  'Nota de Credito A',  'NC_A',   'A', -1, true),
  (4,  6,  'Factura B',          'Fac_B',  'B',  1, true),
  (5,  7,  'Nota de Debito B',   'ND_B',   'B',  1, true),
  (6,  8,  'Nota de Credito B',  'NC_B',   'B', -1, true),
  (7,  11, 'Factura C',          'Fac_C',  'C',  1, true),
  (8,  12, 'Nota de Debito C',   'ND_C',   'C',  1, true),
  (9,  13, 'Nota de Credito C',  'NC_C',   'C', -1, true),
  (33, 0,  'Nota de Debito Interna',  'ND_INT', 'X',  1, false),
  (34, 0,  'Nota de Credito Interna', 'NC_INT', 'X', -1, false);
