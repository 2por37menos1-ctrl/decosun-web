# DecoSun Project Context

DecoSun no es solo un sitio web.
Es un ERP operacional y una plataforma de gestion del negocio.

El objetivo es representar el flujo real de trabajo de la empresa.

Areas principales:
- Pipeline comercial
- Proyectos de clientes
- Agenda
- Operaciones
- Compras
- Tesoreria
- Planificacion financiera
- Comisiones
- Mercado Publico
- Academy

## Before modifying code

Siempre:
1. Entender primero la regla de negocio.
2. Revisar la implementacion existente.
3. Proponer un plan.
4. Implementar en pasos pequenos y controlados.

Nunca:
- Reescribir modulos completos sin aprobacion.
- Eliminar estructuras de datos existentes sin migracion.
- Romper flujos actuales.

## Finance rules

Antes de cambiar cualquier funcionalidad financiera, leer:

- `FINANCE_RULES.md`
- `FINANCE_IMPLEMENTATION_PLAN.md`

Filosofia financiera:

El objetivo no es contabilidad tradicional.

El objetivo es un motor gerencial de flujo de caja.

Flujo del dinero:

```text
Movimiento bancario
↓
Evento financiero
↓
Proyecto / categoria / persona
↓
Decision gerencial
```

## Development principles

Mantener:
- Trazabilidad
- Compatibilidad hacia atras
- Seguridad
- Permisos claros
- Migraciones incrementales

## Current technology

- React
- Vite
- Supabase
- Vercel
- GitHub

## AI collaboration workflow

Carlos define la logica de negocio.

ChatGPT ayuda con:
- arquitectura
- reglas de negocio
- estrategia de implementacion

Codex ayuda con:
- analisis de codigo
- implementacion
- refactoring
- tests

When uncertain, ask for clarification before changing business behavior.
