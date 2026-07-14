-- Migración 027
-- Agrega el identificador idempotente de la operación de stock WinDev.
-- Es nullable para conservar compatibilidad con remitos existentes y con
-- remitos nuevos que no solicitan actualización de stock.

ALTER TABLE compras_remitos
  ADD COLUMN operacion_id UUID;

ALTER TABLE compras_remitos
  ADD CONSTRAINT compras_remitos_operacion_id_key
  UNIQUE (operacion_id);
