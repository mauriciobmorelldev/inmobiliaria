# Proyecto Inmobiliaria Connexa

Plataforma inmobiliaria en Next.js basada en el contrato de prestacion de servicios y acotada al proyecto `Inmobiliaria`.

## Alcance Contratado

El contrato incluye:

- Sitio web inmobiliario responsive.
- Panel de administracion para gestion de propiedades.
- Integracion via API con Tocco para sincronizacion de informacion.
- Creacion y configuracion de usuarios administrativos.
- Roles y permisos para colaboradores con acceso restringido.
- Configuracion inicial de hosting y despliegue productivo.
- Capacitacion basica para el uso del panel administrativo.

Ampliaciones aprobadas durante la implementacion:

- Clientes finales con cuenta, perfil, favoritos e historial de consultas.
- Estadisticas operativas avanzadas en el panel administrador.
- Home editable desde el panel administrador con textos, CTAs y banners.
- Aplicacion de la paleta visual del documento: azul profundo, blanco, crema, azul secundario, gris oscuro y dorado.
- Identidad publica bajo el nombre Connexa con animacion de marca en la home.

## Match Con CONNEXA

Del documento tecnico CONNEXA se incorporan solo las partes compatibles con el contrato:

- Catalogo publico de propiedades.
- Ficha de propiedad con galeria, caracteristicas, consulta y WhatsApp.
- Agentes/colaboradores.
- Roles y permisos.
- Clientes finales.
- Leads/consultas.
- Metricas internas operativas.

Queda fuera de esta etapa:

- Forum.
- Pagos.
- Suscripciones.
- Info BA.
- Turismo.
- CMS editorial completo.
- Planes premium.
- Estadisticas comerciales avanzadas con analytics externo.

## Tareas Del Proyecto

### 1. Base y Persistencia

- Configurar Supabase/Postgres.
- Ejecutar `supabase.sql`.
- Definir variables de entorno desde `.env.example`.
- Usar `/api/inmo-state` como fuente persistente del estado de la plataforma.
- Mantener fallback local para desarrollo cuando Supabase no este configurado.

### 2. Sitio Publico

- Home responsive editable.
- Banners administrables con imagen, texto, link, CTA y estado activo/inactivo.
- Paleta visual basada en `#1b365d`, `#ffffff`, `#fff3c2`, `#2f5da1`, `#2e2e2e` y `#e6c88f`.
- Animaciones UX/UI suaves para hero, banners, cards y estados hover.
- Animacion inicial de marca Connexa: el nombre entra desde la izquierda y la `X` se asienta desde la derecha.
- Catalogo de propiedades con filtros.
- Detalle de propiedad.
- Formulario de consulta por propiedad.
- Contacto por WhatsApp si el agente tiene telefono.
- Favoritos para clientes logueados.

### 3. Panel Administrativo

- Gestion de propiedades.
- Gestion de agentes/colaboradores.
- Gestion de administradores.
- Gestion de clientes finales.
- Gestion de leads.
- Branding y home editable.
- Filtros configurables.
- Dashboard con metricas operativas.

### 4. Roles y Permisos

- `owner`: acceso completo al panel.
- `colaborador`: acceso acotado solo a crear y modificar propiedades propias.
- Cliente final: acceso a su cuenta, favoritos y consultas.

Nota: las propiedades creadas por un colaborador quedan asociadas al usuario que las creo mediante `createdByAdminId`. El colaborador no puede asignar corredor ni agregar datos de telefono desde su panel.

### 5. Clientes Finales

- Registro.
- Confirmacion local de email.
- Login.
- Edicion de perfil.
- Favoritos.
- Historial de consultas.

No incluye contratos, cuotas ni pagos.

### 6. Estadisticas Operativas

El panel admin muestra:

- Total de propiedades, activas, pausadas, reservadas y vendidas.
- Leads por estado.
- Conversion a visita, reserva y cierre.
- Rendimiento por agente.
- Propiedades con mas vistas, leads y favoritos.
- Evolucion de leads.

### 7. Tocco

La integracion queda preparada en `/api/tocco/sync`.

- Si faltan `TOCCO_API_BASE_URL` o `TOCCO_API_KEY`, se registra una sincronizacion mock sin modificar propiedades.
- Si las credenciales existen, el adaptador intenta leer `GET {TOCCO_API_BASE_URL}/properties`.
- El mapeo definitivo puede ajustarse cuando Tocco entregue documentacion real.

### 8. Branding y Home Editable

El panel `/admin/branding` permite:

- Configurar nombre comercial, logo, portada y colores principales.
- Editar texto del hero, titulos de secciones y botones principales.
- Crear, activar, desactivar y eliminar banners de home.
- Cargar imagenes de banners como data URL para prototipo/demo.
- Persistir el contenido en `platform_settings.home_content` cuando Supabase esta configurado.

Nota: para produccion conviene mover imagenes grandes a Supabase Storage o un CDN y guardar solo URLs.

## Setup

```bash
npm install
cp .env.example .env.local
```

Completar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOCCO_API_BASE_URL=
TOCCO_API_KEY=
```

Crear tablas con:

```bash
supabase.sql
```

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

El build de Next puede requerir acceso de red para descargar Google Fonts.

## Entregables

- Codigo fuente Next.js.
- Schema Supabase: `supabase.sql`.
- Variables de entorno de referencia: `.env.example`.
- APIs internas para estado, metricas y Tocco.
- Panel admin funcional.
- Sitio publico responsive.
- Home editable con banners y textos administrables.
- Identidad visual aplicada con la paleta del documento.
- Area de cliente final.
- Documento de alcance y tareas: este README.
- Documentacion completa tecnica, funcional y productiva: `DOCUMENTACION.md`.
- Documento comercial para presentacion y venta de la plataforma: `PRESENTACION_COMERCIAL.md`.
