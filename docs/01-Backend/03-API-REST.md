# Endpoint de Remitos

## POST /api/remitos/registrar

Registra un Remito de Compra independiente del modelo de comprobantes.

### Persistencia

Cabecera:

- compras_remitos

Detalle:

- compras_remitos_detalle

### Validaciones

- proveedor obligatorio
- punto de venta obligatorio
- número obligatorio
- fecha válida
- depósito obligatorio
- sucursal obligatoria
- al menos un artículo
- cantidades mayores que cero
- identificador HFSQL válido
- ausencia de conceptos manuales
- duplicado por proveedor + punto de venta + número

### Integración

Luego de persistir el remito:

1. genera operacionID
2. llama a WinDev
3. actualiza stock
4. consulta confirmación si corresponde
5. devuelve resultado al frontend

### Diferencias respecto a Facturas

Los Remitos:

- no generan comprobantes
- no generan IVA
- no generan tributos
- no generan cuenta corriente
- no actualizan costos
- únicamente actualizan stock
