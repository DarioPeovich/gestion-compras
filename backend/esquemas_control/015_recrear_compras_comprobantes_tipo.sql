-- esquemas_control/015_recrear_compras_comprobantes_tipo.sql
-- Elimina y recrea compras_comprobantes_tipo con los tipos correctos de compras
-- e incluye hfsql_comprobante_tipo_id para mapeo con comprobantesTipo.fic de HFSQL.
-- SEGURO: compras_facturas y compras_remitos están vacías, no hay FK activas.

-- ── 1. Eliminar tabla existente ──────────────────────────────────────────────
DROP TABLE IF EXISTS compras_comprobantes_tipo CASCADE;

-- ── 2. Recrear con estructura completa ──────────────────────────────────────
CREATE TABLE compras_comprobantes_tipo (
    id                      SERIAL PRIMARY KEY,
    descripcion             VARCHAR(50)  NOT NULL,
    descrip_abrev           VARCHAR(10)  NOT NULL,
    letra                   CHAR(1),
    produce                 CHAR(1),          -- 'D'=Débito, 'C'=Crédito, 'N'=Neutro
    factor                  SMALLINT     NOT NULL DEFAULT 1,
    cbte_fiscal             BOOLEAN      NOT NULL DEFAULT false,
    hfsql_comprobante_tipo_id INTEGER,        -- FK lógica a comprobantesTipo.fic HFSQL
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN compras_comprobantes_tipo.factor IS
    '+1 = genera/aumenta deuda (Factura, ND, Remito). -1 = reduce deuda (NC, OrdPago).';
COMMENT ON COLUMN compras_comprobantes_tipo.hfsql_comprobante_tipo_id IS
    'ID del registro equivalente en comprobantesTipo.fic de HFSQL (gestionVentas). '
    'Usado por WinDev al grabar StockMov para obtener el Factor correcto.';

-- ── 3. Insertar los 13 tipos de compras ─────────────────────────────────────
INSERT INTO compras_comprobantes_tipo
    (id, descripcion, descrip_abrev, letra, produce, factor, cbte_fiscal, hfsql_comprobante_tipo_id)
VALUES
--  Facturas
    (1,  'Factura Compra A',    'FacCmp_A',  'A', 'D',  1,  true,  41),
    (2,  'Factura Compra B',    'FacCmp_B',  'B', 'D',  1,  true,  42),
    (3,  'Factura Compra C',    'FacCmp_C',  'C', 'D',  1,  true,  43),
--  Notas de Crédito
    (4,  'NC Compra A',         'NCCmp_A',   'A', 'C', -1,  true,  44),
    (5,  'NC Compra B',         'NCCmp_B',   'B', 'C', -1,  true,  45),
    (6,  'NC Compra C',         'NCCmp_C',   'C', 'C', -1,  true,  46),
--  Notas de Débito
    (7,  'ND Compra A',         'NDCmp_A',   'A', 'D',  1,  true,  47),
    (8,  'ND Compra B',         'NDCmp_B',   'B', 'D',  1,  true,  48),
    (9,  'ND Compra C',         'NDCmp_C',   'C', 'D',  1,  true,  49),
--  No fiscales
    (10, 'Remito Compra',       'RtoCmp',    'X', 'N',  1,  false, 50),
    (11, 'ND Interna Compra',   'NDInt_Cmp', 'X', 'D',  1,  false, 51),
    (12, 'NC Interna Compra',   'NCInt_Cmp', 'X', 'C', -1,  false, 52),
    (13, 'Orden de Pago',       'OrdPago',   'X', 'C', -1,  false, 53);

-- Resetear secuencia al valor correcto
SELECT setval('compras_comprobantes_tipo_id_seq', 13);

-- ── 4. Verificación ──────────────────────────────────────────────────────────
SELECT id, descripcion, descrip_abrev, factor, cbte_fiscal, hfsql_comprobante_tipo_id
FROM compras_comprobantes_tipo
ORDER BY id;
