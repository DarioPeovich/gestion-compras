-- =============================================================================
-- MIGRACIÓN 023 — Agregar campos de impuestos en compras_comprobantes_detalle
-- gestionCompras v1.0.7
-- =============================================================================
-- Se agregan los campos de impuestos por línea necesarios para:
--   - Discriminar IVA por alícuota (agrupado en iva_detalle al confirmar)
--   - ICL (ex ITC, Ley 27.430) por línea → tributos_detalle tributo_id=8
--   - IDC por línea → tributos_detalle tributo_id=9
--   - Imp. Internos por línea (cigarrillos, gaseosas) → tributo_id=4
--
-- Líneas con hfsql_articulos_id=-99 (conceptos manuales):
--   todos los campos de impuesto quedan en DEFAULT 0.
-- =============================================================================

BEGIN;

ALTER TABLE compras_comprobantes_detalle
  ADD COLUMN alicuota_iva        NUMERIC(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN importe_iva         NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN importe_icl         NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN importe_idc         NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN importe_imp_interno NUMERIC(14,2) NOT NULL DEFAULT 0;

COMMIT;

-- Verificación
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'compras_comprobantes_detalle'
  AND table_schema = 'public'
ORDER BY ordinal_position;
