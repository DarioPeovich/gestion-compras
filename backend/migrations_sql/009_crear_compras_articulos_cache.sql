-- 009_crear_compras_articulos_cache.sql
-- Proyeccion liviana del catalogo de articulos de HFSQL, para que las
-- busquedas en Compras sean rapidas (catalogos de hasta 600.000+ articulos).
--
-- Carga inicial: paginada por hfsql_articulos_id (lotes de ~2000, IDs
-- consecutivos sin huecos), una sola vez al dar de alta la empresa.
-- Sincronizacion periodica: incremental por updated_at.
-- "Actualizar catalogo ahora": mismo endpoint incremental, on-demand.
--
-- Calculo de precio de venta (no se almacena, se calcula):
--   precio_neto = precio_costo * (1 + utilidad_lista_N / 100)
--   imp_interno = (imp_interno_tipo == PORCENTUAL)
--                   ? precio_neto * (imp_interno_alicuota / 100)
--                   : imp_interno_monto
--   precio_con_internos = precio_neto + imp_interno
--                          + imp_transf_comb + imp_dioxido_carbono
--   precio_venta_lista_N = precio_con_internos * (1 + alicuota_iva / 100)

CREATE TABLE compras_articulos_cache (
  hfsql_articulos_id    INTEGER PRIMARY KEY,
  articulo_codigo       VARCHAR(20) NOT NULL,
  descripcion           VARCHAR(150) NOT NULL,
  precio_costo          DECIMAL(19,6),
  utilidad_lista_1      DECIMAL(6,2),
  utilidad_lista_2      DECIMAL(6,2),
  utilidad_lista_3      DECIMAL(6,2),
  utilidad_lista_4      DECIMAL(6,2),
  utilidad_lista_5      DECIMAL(6,2),
  alicuota_iva          DECIMAL(5,2),
  imp_interno_tipo      INTEGER,
  imp_interno_alicuota  DECIMAL(6,2),
  imp_interno_monto     DECIMAL(19,6),
  imp_transf_comb       DECIMAL(19,6),
  imp_dioxido_carbono   DECIMAL(19,6),
  updated_at_hfsql      TIMESTAMP NOT NULL,
  extra                 JSONB,
  synced_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_articulos_cache_codigo ON compras_articulos_cache(articulo_codigo);
CREATE INDEX idx_compras_articulos_cache_descrip ON compras_articulos_cache(descripcion);
CREATE INDEX idx_compras_articulos_cache_updated ON compras_articulos_cache(updated_at_hfsql);
