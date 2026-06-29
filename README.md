# 💀 ROC BOT — Bot de Instagram para @carreraroc

Bot automático que responde mensajes directos de Instagram con información del evento **ROC – Race Obstacle Course 2026**.

---

## Qué hace

- Responde DMs de Instagram en tiempo real
- Detecta la intención del usuario (precios, fecha, inscripción, premios, etc.)
- Responde con info actualizada del evento
- Muestra indicador "escribiendo..." para parecer natural

---

## Stack

- **Node.js** + **Express**
- **Meta Graph API** (Instagram Messaging)
- Deploy en **Railway**

---

## Estructura

```
roc-bot/
├── src/
│   ├── index.js          → Servidor Express + manejo de webhooks
│   ├── messageHandler.js → Detección de intención + selector de respuesta
│   ├── knowledge.js      → Base de conocimiento del evento ROC
│   └── instagram.js      → Cliente de la Graph API (envío de mensajes)
├── .env.example          → Variables de entorno necesarias
├── Procfile              → Para Railway
└── package.json
```

---

## Setup paso a paso

### 1. Crear app en Meta for Developers

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. **Create App** → tipo "Business"
3. En el dashboard de la app, ir a **Add Product** → **Messenger** (cubre Instagram también)
4. En **Instagram** → conectar tu cuenta de Instagram @carreraroc (necesitás una Página de Facebook vinculada)

### 2. Obtener el Page Access Token

1. En Meta for Developers → tu app → Messenger → **Access Tokens**
2. Seleccioná la Página de Facebook vinculada a @carreraroc
3. Generá el token y copialo → va a `PAGE_ACCESS_TOKEN` en `.env`

### 3. Inventar un Verify Token

Es una string que vos elegís (puede ser cualquier cosa, ej: `roc_webhook_2026`).  
Va en `VERIFY_TOKEN` en `.env` **y también en la config del webhook en Meta** (paso 5).

### 4. Obtener el App Secret

1. En tu app de Meta → **Settings → Basic**
2. Copiá el **App Secret** → va a `APP_SECRET` en `.env`

### 5. Deploy en Railway

1. Subí este código a un repo de GitHub (privado está bien)
2. En [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Seleccioná el repo `roc-bot`
4. En **Variables** (Settings → Variables), cargá:
   ```
   VERIFY_TOKEN=roc_webhook_2026
   PAGE_ACCESS_TOKEN=<el token de paso 2>
   APP_SECRET=<el app secret de paso 4>
   PORT=3000
   ```
5. Railway te da una URL pública tipo `https://roc-bot-xxxx.up.railway.app`

### 6. Configurar el Webhook en Meta

1. En tu app de Meta → Messenger → **Webhooks**
2. **Edit Callback URL:**
   - Callback URL: `https://roc-bot-xxxx.up.railway.app/webhook`
   - Verify Token: `roc_webhook_2026` (el mismo que pusiste en la env var)
3. Hacer clic en **Verify and Save**
4. En **Webhook Fields**, activar:
   - ✅ `messages`
   - ✅ `messaging_postbacks` (opcional)

### 7. Suscribir la página al webhook

1. En Meta for Developers → Messenger → **Webhooks**
2. Seleccioná tu página y hacé clic en **Subscribe**

### 8. Probar

Mandá un DM a @carreraroc desde otra cuenta y verificá que el bot responda.  
También podés verificar los logs en tiempo real desde el dashboard de Railway.

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `VERIFY_TOKEN` | Token de verificación del webhook (lo inventás vos) | ✅ |
| `PAGE_ACCESS_TOKEN` | Token de acceso a la página de Meta | ✅ |
| `APP_SECRET` | App Secret de tu app de Meta | ✅ |
| `PORT` | Puerto del servidor (Railway lo pone automáticamente) | Auto |

---

## Respuestas del bot

El bot detecta estas intenciones y responde en consecuencia:

| Keywords del usuario | Intención | Respuesta |
|---|---|---|
| hola, buenas, hey | bienvenida | Menú de opciones |
| fecha, cuándo, noviembre | fecha | Fecha y lugar del evento |
| donde, lugar, campo de mayo | lugar | Ubicación detallada |
| precio, cuánto, cuesta | precios | Tabla de precios por período |
| inscribir, anotar, link | inscripción | Link a Eventols |
| premios, ganador, podio | premios | Premios en efectivo |
| categoría, elite, competitiva | categorías | Descripción de categorías |
| reglamento, reglas, penali | reglamento | Puntos clave del reglamento |
| qué es roc, carrera | qué es | Descripción del evento |
| contacto, mail | contacto | Info de contacto |

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Copiar y completar variables
cp .env.example .env

# Correr en modo dev (con auto-reload)
npm run dev

# Para recibir webhooks localmente usá ngrok:
# ngrok http 3000
# y ponés la URL de ngrok como Callback URL en Meta
```

---

## Notas

- El bot responde solo a mensajes de texto. Stickers, fotos o audios no generan respuesta.
- Meta requiere que respondas el webhook en < 20 segundos. El servidor responde 200 inmediatamente y procesa el mensaje en background.
- El Page Access Token expira — generá uno de larga duración (60 días) o configurá un token permanente vía System User en Business Manager.

---

*ROC — CORRER NO ES SUFICIENTE* 💀
