-- Tabla de control de procesos de sincronización (carga inicial / incremental).
-- Permite que el bootstrap del backend sepa, al arrancar, si la carga inicial
-- de un proceso (ej: artículos) ya se completó, está en progreso (y desde dónde
-- retomar tras una interrupción), o todavía no empezó.

CREATE TABLE compras_sync_status (
  proceso               VARCHAR(50) PRIMARY KEY,
  estado                VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  cursor_actual          VARCHAR(50),
  total_estimado         INTEGER,
  registros_procesados   INTEGER NOT NULL DEFAULT 0,
  iniciado_en            TIMESTAMP,
  actualizado_en         TIMESTAMP,
  finalizado_en          TIMESTAMP,
  ultimo_error           TEXT
);