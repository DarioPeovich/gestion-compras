-- Ajuste: se descarta articulo_codigo (cast artificial de articulosID, sin justificación real
-- ya que articulosID es estable y no requiere clave de negocio alternativa).
-- Se reemplaza por cod_barras, mapeado directo desde HFSQL articulos.codBarras.

ALTER TABLE compras_articulos_cache
  DROP COLUMN IF EXISTS articulo_codigo;

ALTER TABLE compras_articulos_cache
  ADD COLUMN cod_barras VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_compras_articulos_cache_cod_barras
  ON compras_articulos_cache(cod_barras);