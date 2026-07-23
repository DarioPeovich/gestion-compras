-- ============================================================
-- Migración 028
-- Agregar operacion_id a compras_comprobantes
--
-- Objetivo:
-- Incorporar el identificador de operación idempotente utilizado
-- por la integración con la API WinDev.
--
-- Autor: SES Compras
-- Fecha: 2026-07-23
-- ============================================================

ALTER TABLE compras_comprobantes
ADD COLUMN IF NOT EXISTS operacion_id UUID NULL;

CREATE UNIQUE INDEX IF NOT EXISTS compras_comprobantes_operacion_id_key
ON compras_comprobantes (operacion_id);

COMMENT ON COLUMN compras_comprobantes.operacion_id IS
'UUID de la operación idempotente utilizada para la integración con la API WinDev.';
