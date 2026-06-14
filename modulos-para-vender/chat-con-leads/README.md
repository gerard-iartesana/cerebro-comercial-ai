# 💬 Sistema de Chat Premium PWA con Automatización y Agendamiento (Módulo Standalone)

Este módulo contiene el sistema completo de chat para Leads (clientes) y Administradores (asesores), optimizado como Progressive Web Application (PWA) e instalado con diseño de vidrio translúcido (*glassmorphic*) al estilo de interfaces de Apple.

Incluye la persistencia en base de datos en tiempo real con Supabase, notificaciones push nativas, agendamiento de citas sincronizado con Google Calendar en el backend y registro automático de actividades en un registro histórico.

---

## 📂 Estructura del Módulo

*   `chat.html`: PWA para la vista del cliente/lead.
*   `admin-chat.html`: PWA para la vista del asesor/administrador.
*   `chat-sw.js` & `admin-sw.js`: Service workers para soporte offline, actualización de caché y control de notificaciones push.
*   `manifest-chat.json` & `manifest-admin.json`: Manifiestos de instalación PWA para iOS y Android.
*   `chat-icon.png` & `admin-icon.png`: Iconografía de la marca para accesos directos en dispositivos móviles.
*   `supabase/`: Contiene los scripts SQL para configurar la base de datos Supabase:
    *   `chat_tables.sql`: Define las salas, mensajes y programados de chat, junto con índices y políticas RLS.
    *   `create_chat_activities.sql`: Define la tabla de historial de actividades.
*   `api/`: Funciones serverless de Node.js:
    *   `meetings.js`: Enlace para crear citas y sincronizar a Google Calendar desde el backend.
    *   `gcal-token.js`: Refresco silencioso de credenciales de Google.
    *   `push.js`: Endpoint para suscripción y envío de notificaciones push nativas.

---

## 🚀 Guía de Instalación y Configuración

### Paso 1: Configurar la Base de Datos en Supabase
1. Entra a tu panel de control de **Supabase**.
2. Ve a la sección **SQL Editor**.
3. Copia y ejecuta el contenido de los dos archivos de la carpeta `supabase/`:
   - Primero ejecuta `chat_tables.sql` (para crear las tablas principales).
   - Segundo ejecuta `create_chat_activities.sql` (para habilitar el historial de logs).
4. Verifica en la sección **Database > Tables** que se crearon las tablas `chat_rooms`, `chat_messages`, `chat_scheduled_messages` y `chat_activities`.
5. Asegúrate de habilitar **Realtime** en la tabla `chat_messages` desde Supabase para habilitar la mensajería instantánea.

### Paso 2: Configurar las Variables de Entorno (Vercel u Hosting)
El backend requiere configurar las siguientes variables de entorno para las notificaciones, emails y calendario:

```env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_KEY="tu-clave-secreta-servicio-supabase"
API_BASE="https://tu-backend-api.com/api"

# Opcionales para Notificaciones Push (Web-Push VAPID)
VAPID_PUBLIC_KEY="tu-clave-publica-vapid"
VAPID_PRIVATE_KEY="tu-clave-privada-vapid"

# Opcionales para Google Calendar (Sincronización Automática)
GOOGLE_CLIENT_ID="tu-client-id-google"
GOOGLE_CLIENT_SECRET="tu-client-secret-google"
GOOGLE_REFRESH_TOKEN="tu-refresh-token-google"
GOOGLE_CALENDAR_ID="primary"
```

### Paso 3: Servir los Archivos Estáticos
1. Sube los archivos HTML (`chat.html`, `admin-chat.html`), JS, JSON y PNG a la carpeta pública de tu hosting o repositorio Vercel.
2. En tu archivo `chat.html` y `admin-chat.html`, asegúrate de actualizar las credenciales de cliente Supabase de forma pública al inicio de los bloques `<script>`:
   ```javascript
   const supabaseUrl = 'https://tu-proyecto.supabase.co';
   const supabaseKey = 'tu-clave-publica-anon-supabase';
   ```

---

## 🎨 Personalización del Tema (Diseño Apple Glassmorphism)

El diseño visual está completamente gobernado por variables CSS personalizables. Para modificar el branding, puedes editar las variables en el encabezado de los archivos HTML:

```css
:root {
    --bg-primary: #0a0a0f;       /* Fondo oscuro de la pantalla */
    --bg-secondary: #12121a;     /* Fondo de las tarjetas y burbujas de chat */
    --bg-tertiary: #1e1e2a;      /* Fondo de inputs y botones secundarios */
    --accent: linear-gradient(135deg, #6c5ce7, #a855f7); /* Color primario / Apple Violet */
    --card-border: rgba(255, 255, 255, 0.08); /* Brillo translúcido del cristal */
    --text-main: #ffffff;
    --text-grey: #8e8e93;
}
```

---

## 📱 Funcionalidades Incorporadas

### 1. PWA del Lead (chat.html)
- **Mensajería Instantánea**: Comunicación con el asesor en tiempo real a través de Supabase Realtime.
- **Notas de Voz**: Grabación y envío directo de audios de voz mediante `MediaRecorder` de navegador.
- **Adjuntos**: Subida de archivos, imágenes y vídeos de forma directa a Supabase Storage.
- **Recordatorios**: El cliente puede programarse notificaciones directas.
- **Salida Segura**: Flujo de logout sin fugas de información.

### 2. PWA del Asesor (admin-chat.html)
- **Consola Multichat**: Vista unificada de todos los leads activos con contadores de mensajes no leídos.
- **Menú de Acciones Rápidas (➕)**: Creación de Tareas, Citas (sincronizadas a Google Calendar) e informes de chat en un solo paso.
- **Historial de Mensajes Programados**: Programación, edición y borrado de mensajes para envíos automáticos.
- **Enlaces Clickables**: Conversión automática de enlaces web en hipervínculos interactivos (`linkify`).
