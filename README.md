# MiCita

MiCita es una aplicación de turnos con una interfaz web, una API PHP y dos opciones para Android: Capacitor y Expo.

## Estructura del repositorio

| Ruta | Contenido |
| --- | --- |
| `public/` | Interfaz web: páginas HTML, estilos y JavaScript del navegador. |
| `api/` | Endpoints PHP y conexión a MySQL. |
| `db/` | Archivos de base de datos del proyecto. |
| `android/` | Proyecto nativo Android generado e integrado con Capacitor. |
| `expo/` | Workspace de Expo que muestra la aplicación web en un WebView. |
| `.github/workflows/` | Automatizaciones de GitHub Actions, incluida la compilación Android. |
| `App.js` | Aplicación Expo usada por la configuración Expo de la raíz. |
| `Dockerfile` | Imagen Apache/PHP que publica `public/` y `api/`. |
| `capacitor.config.json` | Configuración de Capacitor; la web se toma de `public/`. |
| `app.json`, `eas.json` | Configuración Expo/EAS de la raíz. |

## Requisitos

- Node.js y npm.
- PHP con Apache para ejecutar la web y la API localmente, o Docker.
- MySQL para la API; `api/conexion.php` lee la configuración de estas variables de entorno: `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER` y `MYSQLPASSWORD`.
- Android Studio/JDK si se va a compilar o ejecutar la aplicación Android localmente.

## Desarrollo

Instala las dependencias desde la raíz:

```sh
npm ci
```

La carpeta `public/` y la carpeta `api/` deben publicarse juntas en un servidor Apache/PHP. En XAMPP, por ejemplo, coloca el repositorio dentro de `htdocs` y configura MySQL para que coincida con las variables de entorno de la API.

Para crear una imagen Docker:

```sh
docker build -t micita .
docker run --rm -p 8080:80 micita
```

Configura las variables de entorno de MySQL al ejecutar el contenedor. La imagen incluye PHP y Apache, no el servidor MySQL.

## Aplicaciones Android

### Capacitor

Capacitor empaqueta la web de `public/` y utiliza el proyecto nativo de `android/`. Para sincronizar los recursos y compilar un APK debug en Windows:

```sh
npm run build:capacitor:apk
```

El APK se genera en `android/app/build/outputs/apk/debug/app-debug.apk`.

### Expo

Expo usa un WebView. La URL se puede cambiar con `EXPO_PUBLIC_WEB_URL`; si no se define, se usa la URL de producción configurada en `App.js`.

```sh
npm run start:expo
npm run android:expo
```

Para solicitar una compilación Android con EAS:

```sh
npm run build:expo:apk
```

Este comando usa el perfil `preview` de `eas.json` y requiere tener EAS configurado para la cuenta correspondiente.

## Automatización

El workflow `.github/workflows/build-apk.yml` instala dependencias, sincroniza Capacitor y compila el APK debug en GitHub Actions. El artefacto se publica con el nombre `micita-debug-apk`.
