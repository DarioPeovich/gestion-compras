-- Migración 026
-- Normaliza la numeración de compras_remitos.
-- Reemplaza nro_remito por punto_venta + numero_remito.
-- La presentación formateada se construye al mostrar el documento.

ALTER TABLE compras_remitos
  ADD COLUMN punto_venta INTEGER,
  ADD COLUMN numero_remito INTEGER;

-- Ejecutar esta parte sólo si no existen datos que deban conservarse
-- en el campo anterior.
ALTER TABLE compras_remitos
  DROP COLUMN nro_remito;

ALTER TABLE compras_remitos
  ALTER COLUMN punto_venta SET NOT NULL,
  ALTER COLUMN numero_remito SET NOT NULL;

ALTER TABLE compras_remitos
  ADD CONSTRAINT uq_compras_remitos_numeracion
  UNIQUE (proveedor_id, punto_venta, numero_remito);

COMMENT ON COLUMN compras_remitos.punto_venta IS
  'Punto de venta informado en el remito del proveedor.';

COMMENT ON COLUMN compras_remitos.numero_remito IS
  'Número del remito dentro del punto de venta.';

COMMENT ON CONSTRAINT uq_compras_remitos_numeracion
  ON compras_remitos IS
  'Impide duplicar un remito para el mismo proveedor, punto de venta y número.';