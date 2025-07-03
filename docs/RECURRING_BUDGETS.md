# Sistema de Presupuestos Recurrentes

## Resumen
Sistema híbrido que combina auto-detección inteligente, notificaciones visuales y generación automática mensual de presupuestos usando plantillas.

## Arquitectura

### 1. **Plantillas de Presupuesto** (BudgetTemplate)
- **Función**: Configuraciones reutilizables para presupuestos
- **Campos clave**:
  - `autoGenerate`: Determina si se genera automáticamente
  - `lastGenerated`: Rastrea última generación
  - `period`: Frecuencia (MONTHLY, QUARTERLY, etc.)

### 2. **Auto-detección** (`/api/budget/missing`)
- **Cuándo**: Al cargar la página de presupuestos
- **Función**: Detecta plantillas con `autoGenerate: true` sin presupuesto del mes actual
- **Resultado**: Lista de presupuestos faltantes para notificación

### 3. **Generación Manual** (`/api/budget/generate-all`)
- **Trigger**: Botón "Generate All" en notificación
- **Función**: Crea todos los presupuestos faltantes de una vez
- **Ventaja**: Control inmediato del usuario

### 4. **Generación Automática** (Vercel Cron)
- **Cuándo**: 1ro de cada mes a medianoche UTC
- **Endpoint**: `/api/cron/generate-monthly-budgets`
- **Seguridad**: Token `CRON_SECRET` para autenticación
- **Logs**: Registro completo de generaciones y errores

## Flujo de Usuario

### Experiencia Típica
1. **Usuario crea plantilla** con `autoGenerate: true`
2. **Sistema detecta** presupuesto faltante al cargar página
3. **Notificación visual** aparece con botón de acción
4. **Usuario puede**:
   - Generar todos los presupuestos faltantes
   - Ver detalles en pestaña Templates
   - Ignorar (cron lo hará automáticamente)

### Notificación Visual
```
🔔 2 Budgets Missing
You have auto-templates that need budgets for enero 2025

[View Templates] [⚡ Generate All (2)]

Missing budgets:
🍽️ Monthly Groceries Template ($500,000)  🏠 Rent Template ($1,200,000)
```

## Configuración

### Variables de Entorno
```env
CRON_SECRET="tu-secreto-muy-seguro-aqui"
```

### Vercel Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/generate-monthly-budgets",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### Deployment
1. **Agregar `CRON_SECRET`** en Vercel dashboard
2. **Deploy con vercel.json** incluido
3. **Verificar logs** en Vercel Functions tab

## Monitoreo

### Logs del Cron
- **Vercel Functions**: Ver ejecuciones y errores
- **Console logs**: Detalles de cada generación
- **Database**: `lastGenerated` timestamps

### Métricas
```typescript
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "period": "enero 2025",
  "totalTemplates": 5,
  "generatedCount": 3,
  "skippedCount": 2,
  "results": [...]
}
```

## Casos de Uso

### 1. **Usuario Nuevo**
- Crea plantillas
- Ve notificación inmediata
- Genera presupuestos manualmente

### 2. **Usuario Existente**
- Presupuestos se generan automáticamente
- Solo ve notificación si cron falla
- Puede ajustar plantillas según necesidad

### 3. **Usuario Irregular**
- Puede generar presupuestos atrasados
- Sistema detecta múltiples meses faltantes
- Opción de generar por mes específico

## Beneficios

### ✅ **Flexibilidad**
- Control manual inmediato
- Automatización opcional
- Fallback robusto

### ✅ **Experiencia de Usuario**
- Notificaciones claras
- Acciones directas
- Sin sorpresas

### ✅ **Confiabilidad**
- Múltiples puntos de activación
- Logs detallados
- Recuperación automática

## Próximas Mejoras

1. **Notificaciones por email** cuando cron genera presupuestos
2. **Configuración de timezone** para usuarios en diferentes zonas
3. **Templates con fechas personalizadas** (e.g., presupuesto quincenal)
4. **Dashboard de actividad** para ver historial de generaciones
5. **Templates condicionados** (e.g., solo generar si hay ingresos)