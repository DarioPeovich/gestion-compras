-- Migración 025
-- Agrega campo periodo_fiscal a compras_comprobantes
-- Formato: 'MM/YYYY' (ej: '06/2026')
-- Nullable: comprobantes no fiscales no requieren período fiscal

ALTER TABLE compras_comprobantes
  ADD COLUMN periodo_fiscal VARCHAR(7) NULL;

-- Índice para filtrar por período al generar Libro IVA
CREATE INDEX ix_comprobantes_periodo_fiscal ON compras_comprobantes (periodo_fiscal);

COMMENT ON COLUMN compras_comprobantes.periodo_fiscal IS
  'Período fiscal de imputación en formato MM/YYYY. '
  'Obligatorio para comprobantes fiscales. '
  'Puede diferir de la fecha de emisión en facturas retrasadas.';
