-- =============================================================================
-- MIGRACIÓN 016 — Drop tablas viejas
-- gestionCompras v1.0.6
-- =============================================================================
-- Elimina las tablas del schema viejo que quedan reemplazadas por
-- compras_comprobantes y su familia.
-- compras_remitos y compras_remitos_detalle SE CONSERVAN.
-- compras_cc_movimientos SE DROPEA aquí para recrearse en migración 021
-- con estructura nueva.
-- TODAS LAS TABLAS ESTÁN VACÍAS EN DEV — sin riesgo de pérdida de datos.
-- =============================================================================

BEGIN;

-- Vínculo viejo remito ↔ factura (reemplazado por compras_remitos_asociados)
DROP TABLE IF EXISTS compras_remitos_facturas CASCADE;

-- Notas de crédito/débito (reemplazadas por compras_comprobantes)
DROP TABLE IF EXISTS compras_notas_cd_detalle CASCADE;
DROP TABLE IF EXISTS compras_notas_cd CASCADE;

-- Facturas (reemplazadas por compras_comprobantes)
DROP TABLE IF EXISTS compras_facturas_detalle CASCADE;
DROP TABLE IF EXISTS compras_facturas CASCADE;

-- CC movimientos viejo (factura_id / nota_id / tipo varchar)
-- Se recrea con estructura nueva en migración 021
DROP TABLE IF EXISTS compras_cc_movimientos CASCADE;

COMMIT;

-- Verificación
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
