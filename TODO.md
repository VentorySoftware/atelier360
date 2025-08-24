# Reorganización de Formularios de Trabajo

## Objetivo
Reordenar los formularios para que la información del cliente y del trabajo estén más arriba, sobre la información financiera.

## Archivos a modificar:
- [x] `src/pages/CreateWork.tsx` - Formulario de creación
- [x] `src/pages/EditWork.tsx` - Formulario de edición

## Pasos para CreateWork.tsx:
1. Dividir el formulario en múltiples Cards
2. Reordenar las secciones:
   - Información del Cliente y Trabajo (cliente + categoría)
   - Información Financiera (precio + depósito + estado depósito)
   - Fechas y Programación
   - Información Adicional (notas)

## Pasos para EditWork.tsx:
1. Reordenar las tarjetas existentes:
   - Primero: Información del Cliente y Trabajo (combinar las dos primeras tarjetas)
   - Segundo: Información Financiera
   - Tercero: Fechas
   - Cuarto: Notas

## Progreso:
- [x] CreateWork.tsx modificado
- [x] EditWork.tsx modificado
- [x] Verificación de funcionalidad

## Estado Actual:
✅ **Tarea completada** - Ambos formularios ya tienen la estructura correcta con la información del cliente y trabajo por encima de la información financiera.
