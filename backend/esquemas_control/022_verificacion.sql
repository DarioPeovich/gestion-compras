-- =============================================================================
-- MIGRACIÓN 022 — Verificación final del schema v1.0.6
-- gestionCompras v1.0.6
-- =============================================================================
-- No modifica nada. Ejecutar después de 016-021 para confirmar
-- que el schema quedó como se esperaba.
-- =============================================================================

-- 1. Tablas existentes (debe mostrar 18 tablas)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Confirmar tablas nuevas existen
SELECT 'compras_comprobantes'                 AS tabla, EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_comprobantes'                 AND schemaname='public') AS existe
UNION ALL
SELECT 'compras_comprobantes_detalle',          EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_comprobantes_detalle'          AND schemaname='public')
UNION ALL
SELECT 'compras_comprobantes_iva_detalle',      EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_comprobantes_iva_detalle'      AND schemaname='public')
UNION ALL
SELECT 'compras_comprobantes_tributos_detalle', EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_comprobantes_tributos_detalle' AND schemaname='public')
UNION ALL
SELECT 'compras_remitos_asociados',             EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_remitos_asociados'             AND schemaname='public')
UNION ALL
SELECT 'compras_cc_movimientos',                EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_cc_movimientos'                AND schemaname='public');

-- 3. Confirmar tablas viejas NO existen
SELECT 'compras_facturas'           AS tabla, EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_facturas'           AND schemaname='public') AS existe_NO_deberia
UNION ALL
SELECT 'compras_facturas_detalle',    EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_facturas_detalle'    AND schemaname='public')
UNION ALL
SELECT 'compras_notas_cd',            EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_notas_cd'            AND schemaname='public')
UNION ALL
SELECT 'compras_notas_cd_detalle',    EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_notas_cd_detalle'    AND schemaname='public')
UNION ALL
SELECT 'compras_remitos_facturas',    EXISTS (SELECT 1 FROM pg_tables WHERE tablename='compras_remitos_facturas'    AND schemaname='public');

-- 4. Confirmar remitos intactos
SELECT COUNT(*) AS columnas_remitos
FROM information_schema.columns
WHERE table_name = 'compras_remitos' AND table_schema = 'public';

-- 5. Confirmar estructura de cc_movimientos nueva
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'compras_cc_movimientos' AND table_schema = 'public'
ORDER BY ordinal_position;
