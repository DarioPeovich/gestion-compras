-- Migración 029
-- Estado de la integración transaccional PostgreSQL-WinDev de comprobantes.

ALTER TABLE compras_comprobantes
ADD COLUMN IF NOT EXISTS estado_integracion VARCHAR(20) NOT NULL DEFAULT 'NO_REQUIERE';

ALTER TABLE compras_comprobantes
ADD CONSTRAINT compras_comprobantes_estado_integracion_check
CHECK (estado_integracion IN ('NO_REQUIERE', 'PENDIENTE', 'APLICADA'));

COMMENT ON COLUMN compras_comprobantes.estado_integracion IS
'Estado transaccional de WinDev: NO_REQUIERE, PENDIENTE o APLICADA. ERROR no se persiste porque provoca rollback.';
