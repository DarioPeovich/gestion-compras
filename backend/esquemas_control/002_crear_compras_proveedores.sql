-- 002_crear_compras_proveedores.sql
-- Proveedores: fuente de verdad en PostgreSQL para los datos propios de Compras.
-- hfsql_proveedores_id, razon_social y cuit son sincronizados desde HFSQL
-- (solo lectura desde Compras). El resto de los campos son propios de
-- Compras y se editan únicamente desde este módulo.
-- articulo_codigo es el código estable generado desde articulosID (cast a texto)
-- (campo reservado para uso futuro en este contexto).

CREATE TABLE compras_proveedores (
  id                    SERIAL PRIMARY KEY,
  hfsql_proveedores_id  INTEGER UNIQUE,
  razon_social          VARCHAR(150) NOT NULL,
  cuit                  VARCHAR(20),
  articulo_codigo       VARCHAR(20) UNIQUE,
  condicion_pago        VARCHAR(50),
  dias_pago             INTEGER DEFAULT 0,
  email                 VARCHAR(100),
  telefono              VARCHAR(30),
  direccion             VARCHAR(200),
  contactos             JSONB,
  activo                BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at_hfsql      TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compras_proveedores_hfsql    ON compras_proveedores(hfsql_proveedores_id);
CREATE INDEX idx_compras_proveedores_cuit     ON compras_proveedores(cuit);
CREATE INDEX idx_compras_proveedores_activo   ON compras_proveedores(activo);
