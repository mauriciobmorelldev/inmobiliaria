# Documentacion Completa - Proyecto Inmobiliaria Connexa

## 1. Resumen General

Connexa es una plataforma inmobiliaria construida en Next.js para cubrir el alcance contratado del proyecto `Inmobiliaria`. La aplicacion combina un sitio publico para clientes finales con un panel administrativo para operar propiedades, usuarios, leads, branding, filtros y metricas.

El alcance implementado toma como base el contrato y suma las ampliaciones solicitadas durante el desarrollo:

- Clientes finales con cuenta propia.
- Favoritos e historial de consultas.
- Estadisticas operativas avanzadas.
- Home editable desde el administrador.
- Roles de administrador principal y colaborador.
- Preparacion de integracion con Tocco.
- Identidad visual Connexa con la paleta del documento.
- Animaciones y mejoras UX/UI en home, cards, filtros, header y visualizador de imagenes.

El documento CONNEXA se uso solo como referencia compatible con el contrato. No se implementaron modulos fuera del alcance como Forum, pagos, suscripciones, turismo, Info BA o contenido editorial completo.

## 2. Stack Tecnico

- Framework: Next.js 16.2 con App Router.
- UI: React 19, TypeScript y Tailwind CSS 4.
- Animaciones: `motion`.
- Base de datos objetivo: Supabase/Postgres.
- Persistencia fallback: estado local en `localStorage` para desarrollo.
- PDF/reportes: `jspdf` disponible en dependencias.
- Email transaccional: adaptador propio con Resend opcional.

Comandos disponibles:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## 3. Estructura Principal

```text
Inmobiliaria/
  src/app/                 Rutas publicas, admin y APIs internas
  src/components/inmo/     Componentes principales del front y admin
  src/components/ui/       Utilidades visuales de scroll y progreso
  src/lib/                 Tipos, estado, sesiones, validaciones y helpers
  src/lib/server/          Repositorio Supabase, metricas, email y Tocco
  src/lib/supabase/        Cliente server de Supabase
  stitch/                  Artefactos visuales base generados por Stitch
  supabase.sql             Schema SQL del proyecto
  README.md                Resumen de alcance y setup
  DOCUMENTACION.md         Este documento
```

## 4. Rutas Publicas

### `/`

Home principal de Connexa.

Incluye:

- Hero con marca Connexa.
- Animacion de entrada del nombre y la `X`.
- Botones principales para comprar y alquilar.
- Secciones orientadas al cliente, no a metricas internas.
- Banners editables desde el panel admin.
- Propiedades destacadas/recientes segun el estado cargado.
- Header responsive con menu mobile.

### `/propiedades`

Catalogo publico de propiedades.

Incluye:

- Listado responsive.
- Filtros por operacion y atributos.
- Filtros mobile dentro de un menu.
- Cards clickeables completas, no solo el boton.
- Iconos pequeños para datos relevantes de la propiedad.
- Navegacion hacia la ficha de cada propiedad.

### `/propiedades/[id]`

Ficha publica de propiedad.

Incluye:

- Galeria de imagenes.
- Visualizador/lightbox.
- Zoom por click sobre imagen.
- Miniaturas.
- Datos principales de la propiedad.
- Caracteristicas/atributos.
- Formulario de consulta.
- Boton de WhatsApp cuando corresponde.
- Proteccion de informacion sensible: el cliente no ve instrucciones internas como "cargar telefono del corredor".

### `/registro`

Registro de cliente final.

Incluye:

- Validacion de nombre y apellido.
- Validacion de email y confirmacion de email.
- Validacion de telefono.
- Validacion de DNI/CUIL/CUIT.
- Validacion de contrasena fuerte.
- Confirmacion de contrasena.
- Validacion en frontend y backend.
- Envio de email de confirmacion si el proveedor esta configurado.
- Fallback local para desarrollo.

### `/confirmar`

Confirmacion de email de cliente final.

Incluye:

- Lectura del token desde la URL.
- Espera de hidratacion del estado local.
- Reintento antes de marcar token invalido.
- Activacion de la cuenta.
- Limpieza del token ya utilizado.
- Creacion de sesion de cliente.

Limitacion actual: si no hay persistencia real en Supabase, el link de confirmacion funciona de manera confiable en el mismo navegador donde se creo la cuenta. Para produccion debe persistirse el token en base de datos.

### `/acceso`

Login de cliente final.

Incluye:

- Login contra API interna.
- Fallback local para desarrollo.
- Bloqueo si el email no fue verificado.
- Mensajes de error orientados al usuario.
- Redireccion al area privada.

### `/mi-cuenta`

Area privada del cliente.

Incluye:

- Perfil del cliente.
- Favoritos.
- Historial de consultas enviadas.
- Navegacion hacia propiedades guardadas.
- Sesion local del cliente.

### `/barrios` y `/equipo`

Rutas publicas complementarias. En el enfoque actual, su valor comercial debe revisarse antes de produccion si no aportan al recorrido principal del cliente.

## 5. Panel Administrativo

### `/admin`

Dashboard principal del administrador.

Incluye:

- Resumen operativo.
- Accesos a inventario, propiedades, leads, usuarios, clientes, filtros y branding.
- Estadisticas internas.
- Proteccion por sesion admin.

### `/admin/propiedades`

Gestion de propiedades.

Incluye:

- Crear propiedades.
- Editar propiedades.
- Pausar, reservar, vender o activar.
- Cargar imagenes.
- Cargar datos basicos: titulo, tipo, estado, precio, barrio, superficie, ambientes, descripcion, atributos.
- Asociar agente cuando el rol tiene permisos.
- Respetar `createdByAdminId` para saber quien creo el inmueble.
- Para colaboradores: solo pueden operar propiedades propias y no pueden cargar telefono ni asignar datos sensibles de corredor.

### `/admin/inventario` y `/admin/inventory`

Vistas de inventario administrativo.

Incluyen:

- Listado operativo de propiedades.
- Estados.
- Acciones de gestion.
- Soporte a roles.

### `/admin/agentes`

Gestion de agentes/corredores.

Incluye:

- Nombre.
- Rol.
- Email.
- Telefono.
- Foto.

Nota: el telefono de agente es un dato administrado internamente. No debe exponerse como instruccion editable en el front publico.

### `/admin/administradores`

Gestion de usuarios administrativos.

Roles disponibles:

- `owner`: acceso completo.
- `colaborador`: acceso acotado a carga y modificacion de propiedades propias.

El colaborador queda limitado para:

- No administrar otros usuarios.
- No administrar agentes.
- No gestionar clientes.
- No ver o modificar propiedades de otros colaboradores.
- No cargar telefono de corredor desde su panel acotado.

### `/admin/clientes`

Gestion de clientes finales.

Incluye:

- Ver clientes registrados.
- Estado activo/inactivo.
- Verificacion de email.
- Datos basicos de contacto.

### `/admin/leads`

Gestion de consultas/leads.

Incluye:

- Leads por propiedad.
- Datos del interesado.
- Estado del lead: `nuevo`, `visita`, `reservado`, `cerrado`.
- Notas.
- Historial de eventos de cambio de estado.

### `/admin/filtros`

Gestion de filtros configurables.

Incluye:

- Grupos de filtros.
- Opciones por grupo.
- Modo `single` o `multi`.
- Uso en el catalogo publico.

### `/admin/branding`

Gestion visual y home editable.

Incluye:

- Nombre de marca.
- Logo.
- Imagen de portada.
- Paleta principal.
- Textos del hero.
- CTAs.
- Titulos y subtitulos de secciones.
- Banners con titulo, subtitulo, imagen, link, CTA y estado activo.

Nota productiva: hoy las imagenes pueden guardarse como data URL para prototipo. Para produccion conviene moverlas a Supabase Storage o CDN.

## 6. Roles y Permisos

### Owner

Usuario administrador principal.

Permisos:

- Acceso total al panel.
- Gestion completa de propiedades.
- Gestion de agentes.
- Gestion de administradores.
- Gestion de clientes.
- Gestion de leads.
- Gestion de filtros.
- Gestion de branding/home.
- Acceso a metricas operativas.

Usuario por defecto de desarrollo:

```text
Email: admin@connexa.com
Password: connexa-admin
```

Este usuario debe cambiarse o eliminarse antes de produccion.

### Colaborador

Usuario administrativo restringido.

Permisos:

- Crear propiedades propias.
- Editar solo propiedades creadas por ese usuario.
- Ver solo el inventario que le corresponde.

Restricciones:

- No puede modificar propiedades de otro colaborador.
- No puede administrar usuarios.
- No puede administrar agentes.
- No puede administrar clientes.
- No puede cargar telefono de corredor.
- No debe acceder a datos operativos globales que excedan su rol.

Campo clave:

```text
createdByAdminId
```

Este campo asocia cada propiedad al usuario admin que la creo.

### Cliente Final

Usuario publico registrado.

Permisos:

- Acceder a su cuenta.
- Editar/consultar su informacion basica.
- Guardar favoritos.
- Ver historial de consultas.
- Enviar consultas desde propiedades.

No incluye:

- Contratos.
- Pagos.
- Cuotas.
- Documentacion legal.
- Reservas online transaccionales.

## 7. Modelo de Datos

Los tipos principales viven en:

```text
src/lib/inmoData.ts
```

Entidades principales:

- `ThemeSettings`: marca, colores, logo e imagen hero.
- `HomeContent`: textos, CTAs y banners de la home.
- `AdminUser`: usuarios administrativos.
- `ClientUser`: clientes finales.
- `Agent`: agentes/corredores.
- `Listing`: propiedades.
- `FilterGroup`: filtros configurables.
- `PropertyFavorite`: favoritos.
- `Lead`: consultas.
- `LeadEvent`: historial de cambios de lead.
- `PropertyMetric`: metricas por propiedad.
- `ToccoSyncLog`: logs de sincronizacion.

Estados de propiedad:

- `disponible`
- `pausado`
- `reservado`
- `vendido`

Tipos de propiedad:

- `tradicional`
- `temporario`
- `pozo`
- `listo`

Unidades de precio:

- `venta`
- `mensual`
- `noche`

Estados de lead:

- `nuevo`
- `visita`
- `reservado`
- `cerrado`

## 8. Supabase y Base de Datos

El schema esta en:

```text
supabase.sql
```

Tablas creadas:

- `platform_settings`
- `roles`
- `profiles`
- `agents`
- `clients`
- `properties`
- `property_images`
- `property_favorites`
- `leads`
- `lead_events`
- `property_metrics`
- `tocco_sync_logs`

Indices relevantes:

- `idx_properties_agent`
- `idx_properties_created_by_admin`
- `idx_leads_agent`
- `idx_leads_client`
- `idx_favorites_client`

El repositorio server esta en:

```text
src/lib/server/inmoRepository.ts
```

Responsabilidades:

- Leer el estado completo desde Supabase.
- Convertir filas SQL al modelo interno `InmoState`.
- Escribir el estado completo en Supabase.
- Sincronizar imagenes de propiedades.
- Mantener fallback al estado por defecto si Supabase no esta configurado.

## 9. Persistencia y Estado

El estado cliente vive en:

```text
src/lib/inmoStore.ts
```

Funcionamiento:

- Carga estado por defecto.
- Hidrata desde `localStorage`.
- Intenta leer estado remoto desde `/api/inmo-state`.
- Mezcla estado remoto y local.
- Guarda cambios en memoria y `localStorage`.
- Intenta persistir remoto cuando corresponde.

Clave de storage:

```text
connexa-state/v4
```

Nota: `/api/inmo-state` protege escritura con `INMO_STATE_WRITE_SECRET`. Si el cliente no envia ese secreto, la escritura remota se rechaza. Esto evita que cualquier navegador pueda reemplazar el estado completo de la plataforma.

## 10. APIs Internas

### `GET /api/inmo-state`

Devuelve el estado de la plataforma.

Protecciones:

- Sanitiza passwords de administradores.
- Sanitiza passwords de clientes.
- Informa origen en header `x-inmo-state-source`: `supabase` o `fallback`.

### `PUT /api/inmo-state`

Escribe el estado completo.

Requiere header:

```text
x-inmo-write-secret: <INMO_STATE_WRITE_SECRET>
```

### `POST /api/admin/login`

Login administrativo.

Body:

```json
{
  "email": "admin@connexa.com",
  "password": "connexa-admin"
}
```

Respuesta exitosa:

```json
{
  "ok": true,
  "admin": {
    "id": "admin-owner",
    "email": "admin@connexa.com",
    "name": "Admin Principal",
    "role": "owner"
  }
}
```

### `POST /api/client/register`

Valida y prepara registro de cliente.

Incluye:

- Normalizacion de email.
- Normalizacion de telefono.
- Normalizacion de DNI/CUIL/CUIT.
- Validacion de duplicados.
- Generacion de token.
- Envio de email de confirmacion si hay proveedor.

### `POST /api/client/login`

Login de cliente final.

Bloquea:

- Credenciales invalidas.
- Usuarios inactivos.
- Emails no verificados.

### `GET /api/metrics`

Devuelve metricas operativas calculadas.

Incluye:

- Propiedades por estado.
- Leads por estado.
- Leads por mes.
- Publicaciones por mes.
- Conversion a visita/reserva/cierre.
- Rendimiento por agente.
- Propiedades mas relevantes por vistas, leads y favoritos.

### `POST /api/tocco/sync`

Ejecuta sincronizacion Tocco.

Requiere header:

```text
x-tocco-sync-secret: <TOCCO_SYNC_SECRET>
```

Si faltan `TOCCO_API_BASE_URL` o `TOCCO_API_KEY`, registra un log mock sin modificar propiedades.

## 11. Integracion Tocco

Archivos:

```text
src/app/api/tocco/sync/route.ts
src/lib/server/tocco.ts
```

Estado actual:

- Preparado para consultar `GET {TOCCO_API_BASE_URL}/properties`.
- Usa bearer token con `TOCCO_API_KEY`.
- Normaliza propiedades externas al modelo interno `Listing`.
- Reemplaza propiedades importadas por ID `tocco-*`.
- Registra logs de exito, error o mock.

Pendiente para integracion real:

- Documentacion oficial de endpoints Tocco.
- Credenciales reales.
- Mapeo definitivo de campos.
- Reglas de actualizacion y eliminacion.
- Manejo de imagenes y videos.
- Validacion de estados y operaciones reales.

## 12. Emails

Archivo:

```text
src/lib/server/email.ts
```

Funcionamiento:

- Usa `RESEND_API_KEY` si esta disponible.
- Usa `EMAIL_FROM` como remitente.
- Si no hay proveedor, no rompe el flujo: devuelve estado no enviado y permite fallback de desarrollo.

Variables relacionadas:

```env
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_SITE_URL=
```

## 13. Sesiones

Archivo:

```text
src/lib/session.ts
```

Sesiones actuales:

- Admin: `inmo-admin-session/v1`
- Cliente: `inmo-client-session/v1`

Se guardan en `localStorage`.

Nota productiva: para produccion real conviene migrar a Supabase Auth o sesiones HTTP-only con expiracion server-side.

## 14. Validaciones

### Registro de cliente

Archivo:

```text
src/lib/clientValidation.ts
```

Validaciones:

- Nombre y apellido.
- Email valido.
- Confirmacion de email.
- Telefono con al menos 8 digitos.
- DNI de 8 digitos.
- CUIL/CUIT de 11 digitos con digito verificador.
- Contrasena de al menos 8 caracteres, letras y numeros.
- Confirmacion de contrasena.

### Login

Validado en APIs:

- `/api/admin/login`
- `/api/client/login`

### Estado remoto

La escritura remota requiere secretos:

- `INMO_STATE_WRITE_SECRET`
- `TOCCO_SYNC_SECRET`

## 15. Estadisticas Operativas

Archivo:

```text
src/lib/server/analytics.ts
```

Metricas implementadas:

- Total de propiedades.
- Propiedades activas.
- Propiedades pausadas.
- Propiedades reservadas.
- Propiedades vendidas.
- Leads por estado.
- Leads por mes.
- Conversion a visita.
- Conversion a reserva.
- Conversion a cierre.
- Rendimiento por agente.
- Propiedades mas consultadas o con mayor actividad.

Estas metricas son internas para administracion. No se muestran al cliente final cuando no agregan valor al recorrido de compra/alquiler.

## 16. Identidad Visual y UX/UI

Paleta aplicada desde el documento:

- Azul principal: `#1b365d`
- Blanco: `#ffffff`
- Crema: `#fff3c2`
- Azul secundario: `#2f5da1`
- Gris oscuro: `#2e2e2e`
- Dorado: `#e6c88f`

Mejoras realizadas:

- Header con marca textual Connexa.
- Eliminacion del icono circular con `C`.
- Animacion inicial de Connexa.
- Botones comprar/alquilar centrados y ajustados.
- Menu mobile mejorado.
- Filtros mobile dentro de panel/menu.
- Cards de propiedades clickeables completas.
- Ficha con visualizador de imagenes.
- Zoom por click.
- Remocion de textos internos o poco claros para cliente.
- Enfoque del front en acciones utiles: comprar, alquilar, consultar, guardar.

## 17. Seguridad Actual y Recomendaciones Productivas

Mejoras ya aplicadas:

- Passwords sanitizados en `GET /api/inmo-state`.
- Login admin por API.
- Login cliente por API.
- Escritura remota protegida por secreto.
- Sync Tocco protegido por secreto.
- Colaborador limitado por rol y propiedad creadora.
- Cliente limitado a su perfil, favoritos y consultas.
- Remocion de botones tipo reset demo.

Pendientes antes de produccion:

- Migrar autenticacion a Supabase Auth o sistema con cookies HTTP-only.
- Hashear passwords. Hoy el prototipo usa passwords en texto dentro del modelo de estado.
- Implementar Row Level Security en Supabase.
- Persistir registros/confirmaciones de cliente directamente en Supabase.
- Mover imagenes a Supabase Storage o CDN.
- Agregar rate limiting a login, registro y formularios de consulta.
- Agregar CSRF o arquitectura de mutaciones server-side con sesion segura.
- Completar secrets en entorno productivo.
- Eliminar o cambiar credenciales por defecto.

## 18. Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INMO_STATE_WRITE_SECRET=
NEXT_PUBLIC_SITE_URL=
RESEND_API_KEY=
EMAIL_FROM=
TOCCO_API_BASE_URL=
TOCCO_API_KEY=
TOCCO_SYNC_SECRET=
```

Uso:

- `NEXT_PUBLIC_SUPABASE_URL`: URL publica del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: key server para operaciones administrativas.
- `INMO_STATE_WRITE_SECRET`: protege `PUT /api/inmo-state`.
- `NEXT_PUBLIC_SITE_URL`: URL base para links de confirmacion.
- `RESEND_API_KEY`: envio de emails.
- `EMAIL_FROM`: remitente de emails.
- `TOCCO_API_BASE_URL`: URL base de API Tocco.
- `TOCCO_API_KEY`: token Tocco.
- `TOCCO_SYNC_SECRET`: protege sincronizacion Tocco.

## 19. Setup Local

Instalar dependencias:

```bash
npm install
```

Crear entorno:

```bash
cp .env.example .env.local
```

Levantar desarrollo:

```bash
npm run dev
```

Validar:

```bash
npm run lint
npm run build
```

## 20. Setup Supabase

1. Crear proyecto Supabase.
2. Ejecutar `supabase.sql` en SQL Editor.
3. Cargar variables de entorno.
4. Configurar `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
5. Definir `INMO_STATE_WRITE_SECRET`.
6. Verificar que `/api/inmo-state` responda con header `x-inmo-state-source: supabase`.

## 21. Smoke Test Recomendado

### Front publico

- Abrir `/`.
- Verificar header desktop/mobile.
- Probar botones comprar y alquilar.
- Abrir `/propiedades`.
- Abrir filtros en mobile.
- Clickear cualquier parte de una card.
- Abrir ficha.
- Abrir galeria.
- Probar zoom por click.
- Enviar consulta.
- Verificar que no aparezcan textos internos o instrucciones administrativas.

### Cliente final

- Crear cuenta en `/registro`.
- Validar mensajes de error campo por campo.
- Confirmar email.
- Iniciar sesion en `/acceso`.
- Guardar favorita.
- Ver favoritos en `/mi-cuenta`.
- Ver historial de consultas.
- Cerrar sesion.
- Confirmar que al volver a ingresar no queda en una ruta privada vieja.

### Admin owner

- Ingresar a `/admin`.
- Crear propiedad.
- Editar propiedad.
- Crear agente.
- Crear administrador colaborador.
- Gestionar filtros.
- Gestionar home/branding.
- Revisar leads.
- Revisar metricas.

### Admin colaborador

- Ingresar con usuario colaborador.
- Crear propiedad.
- Verificar que `createdByAdminId` quede asociado.
- Verificar que no pueda ver o editar propiedades de otro colaborador.
- Verificar que no pueda cargar telefono de corredor.
- Verificar que no acceda a administradores, clientes, branding global o agentes.

### APIs

- `GET /api/inmo-state` no debe devolver passwords.
- `PUT /api/inmo-state` sin secreto debe responder 401.
- `POST /api/tocco/sync` sin secreto debe responder 401.
- Login cliente no verificado debe responder 403.
- Login con credenciales invalidas debe responder 401.

## 22. Alcance No Incluido

Quedan fuera de esta version:

- Pagos.
- Suscripciones.
- Forum.
- Turismo.
- Info BA.
- Blog/editorial completo.
- Contratos digitales.
- Cuotas.
- Reservas transaccionales online.
- Integracion Google Analytics avanzada.
- Reportes comerciales complejos.
- Firma digital.
- CRM externo.

## 23. Pendientes Priorizados Para Produccion

Prioridad alta:

- Supabase Auth o autenticacion segura server-side.
- Hash de passwords.
- Persistencia real de registro y confirmacion de clientes.
- RLS en Supabase.
- Storage/CDN para imagenes.
- Secrets completos en deploy.
- Cambiar credenciales por defecto.

Prioridad media:

- Tests automatizados para roles.
- Tests de APIs.
- Rate limiting.
- Mejoras de performance con `next/image`.
- Auditoria completa mobile.
- Mejoras de accesibilidad.

Prioridad baja:

- Reportes PDF.
- Exportacion de leads.
- Filtros mas avanzados.
- Integracion definitiva Tocco cuando exista documentacion.

## 24. Archivos Clave

- `README.md`: alcance resumido y setup.
- `DOCUMENTACION.md`: documentacion completa.
- `supabase.sql`: schema de base de datos.
- `src/lib/inmoData.ts`: modelo de datos y estado por defecto.
- `src/lib/inmoStore.ts`: estado cliente y persistencia local/remota.
- `src/lib/server/inmoRepository.ts`: lectura/escritura Supabase.
- `src/lib/server/analytics.ts`: metricas operativas.
- `src/lib/server/tocco.ts`: adaptador Tocco.
- `src/lib/clientValidation.ts`: validaciones de registro.
- `src/lib/session.ts`: sesiones locales.
- `src/app/api/*`: APIs internas.
- `src/components/inmo/HomeStitch.tsx`: home.
- `src/components/inmo/PropertyCatalog.tsx`: catalogo.
- `src/app/propiedades/[id]/page.tsx`: ficha de propiedad.
- `src/components/inmo/admin/AdminShell.tsx`: layout/seguridad del admin.

