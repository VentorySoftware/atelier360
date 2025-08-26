# Implementación de Botones de Gestión de Estados

## Tareas Pendientes:
- [x] Crear función helper `getStatusActions` para determinar botones según estado
- [x] Reemplazar el componente Select actual por botones dinámicos
- [x] Implementar lógica de transición de estados según reglas del requerimiento
- [x] Verificar que los botones solo se muestren cuando corresponda
- [x] Asegurar que no se muestren botones en estado "Entregado"
- [ ] Probar las transiciones de estado

## Reglas de Implementación:
- Estado "Pendiente": Botón "Iniciar trabajo" → "En progreso"
- Estado "En progreso": Botones "Esperando piezas" y "Completado"
- Estado "Esperando piezas": Botón "En progreso" → vuelve a "En progreso"
- Estado "Completado": Botón "Entregado" → cambia a "Entregado"
- Estado "Entregado": Sin botones
