ALTER TABLE compras_comprobantes_iva_detalle
  ADD COLUMN alicuota NUMERIC(5,2) NOT NULL DEFAULT 0;