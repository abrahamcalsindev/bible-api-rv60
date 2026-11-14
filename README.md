# Bible API RV60

![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-GPL-blue)

API REST para consultar la Biblia en la versión **Reina Valera Revisada 1960 (RVR1960)**.
Expone los 66 libros, sus capítulos, versículos individuales y rangos de versículos
con respuestas JSON ligeras y predecibles.

---

## Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Scripts disponibles](#scripts-disponibles)
- [Autenticación](#autenticación)
- [Referencia de la API](#referencia-de-la-api)
  - [URL base](#url-base)
  - [Endpoints](#endpoints)
  - [Formas de respuesta](#formas-de-respuesta)
  - [Normalización de nombres de libros](#normalización-de-nombres-de-libros)
  - [Errores](#errores)
- [Apéndice: los 66 libros](#apéndice-los-66-libros)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Modelo de datos](#modelo-de-datos)
- [Tecnologías](#tecnologías)
- [Licencia](#licencia)

---

## Características

- **Libros** — lista completa de los 66 libros con su identificador y cantidad de capítulos.
- **Capítulos** — capítulos de cualquier libro con el conteo de versículos de cada uno.
- **Versículos individuales** — un versículo puntual, en un objeto directo (no un array).
- **Rangos de versículos** — tres sintaxis equivalentes: por ruta (`5-10`), por segmentos (`5/10`)
  y por query params (`?from=5&to=10`), con filtros independientes (`?from=5` o `?to=3`).
- **Nombres tolerantes** — `Génesis`, `genesis` y `Genesis` resuelven al mismo libro
  (se ignoran acentos, mayúsculas y espacios).
- **Autenticación** — los endpoints de la Biblia requieren una API key (`x-api-key` o `Authorization: Bearer`)
  con comparación en tiempo constante; la documentación auto-servida de `GET /api` queda abierta.
- **Errores consistentes** — toda respuesta de error es JSON con la forma `{ "error": "..." }`.
- **Auto-documentación** — `GET /api` devuelve la descripción de los endpoints disponibles.

## Requisitos

| Herramienta | Versión recomendada |
| ----------- | ------------------- |
| Node.js     | 18 o superior       |
| npm         | 8 o superior        |

## Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/abrahamcalsindev/bible-api-rv60.git
   cd bible-api-rv60
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Levanta el servidor:

   ```bash
   # Modo desarrollo (hot reload con nodemon)
   API_KEY=mi-clave-secreta npm run dev

   # Modo producción (compila y ejecuta)
   API_KEY=mi-clave-secreta npm run build && npm start
   ```

> **Importante:** `API_KEY` es obligatoria. Si no está definida, el servidor no arranca
> y muestra un mensaje con la causa (fail-fast).

Por defecto el servidor escucha en `http://localhost:8000`. Puedes cambiar el puerto
con la variable de entorno `PORT`.

## Scripts disponibles

| Script             | Comando                | Descripción                                    |
| ------------------ | ---------------------- | ---------------------------------------------- |
| Desarrollo         | `npm run dev`          | Servidor con hot reload vía nodemon + ts-node. |
| Compilar           | `npm run build`        | Limpia `dist/` y compila TypeScript a JavaScript. |
| Producción         | `npm start`            | Ejecuta el build desde `dist/`.                |
| Limpiar            | `npm run clean`        | Elimina el directorio `dist/`.                 |

---

## Autenticación

Todos los endpoints bajo `/api/bible` requieren una API key. `GET /api`
(auto-documentación) y el preflight CORS (`OPTIONS`) quedan abiertos.

La clave se define con la variable de entorno `API_KEY` y se envía en cada
petición por cualquiera de estos dos headers:

| Header | Formato |
| ------ | ------- |
| `x-api-key` | `x-api-key: mi-clave-secreta` |
| `Authorization` | `Authorization: Bearer mi-clave-secreta` |

```bash
# Con x-api-key
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books

# Con Bearer
curl -H "Authorization: Bearer mi-clave-secreta" http://localhost:8000/api/bible/books
```

Sin credenciales válidas la respuesta es `401` en JSON, consistente con el
resto de la API, junto con el header `WWW-Authenticate: Bearer`:

```json
{ "error": "Unauthorized" }
```

### Detalles de implementación

- **Zero-dependency** — ~40 líneas en `src/middlewares/auth.ts`; no se agregó
  ningún paquete de autenticación.
- **Comparación en tiempo constante** — la clave provista y la válida se comparan
  vía `crypto.timingSafeEqual` sobre sus hashes SHA-256, lo que neutraliza ataques
  de timing y no filtra la longitud de la clave.
- **Rotación de claves** — la factory `apiKeyAuth()` acepta una clave
  (`string`) o varias (`string[]`), lo que permite mantener una clave vieja y
  una nueva vigentes durante una rotación. Por defecto se usa la variable de
  entorno `API_KEY`.
- **Fail-fast** — si `API_KEY` no está definida, el servidor no arranca.

---

## Referencia de la API

### URL base

```
http://localhost:8000
```

Todos los endpoints de la Biblia están bajo el prefijo **`/api/bible/books`**.

### Endpoints

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `GET`  | `/api` | Descripción auto-servida de la API. |
| `GET`  | `/api/bible/books` | Todos los libros de la Biblia. |
| `GET`  | `/api/bible/books/:bookName/chapters` | Capítulos de un libro. |
| `GET`  | `/:bookName/chapters/:chapter/verses` | Todos los versículos de un capítulo (acepta `?from` y `?to`). |
| `GET`  | `/:bookName/chapters/:chapter/verses/:verseOrRange` | Un versículo (`5`) o un rango (`5-10`). |
| `GET`  | `/:bookName/chapters/:chapter/verses/:from/:to` | Rango con dos segmentos (compatibilidad). |

---

#### `GET /api`

Devuelve la descripción de la API y sus endpoints. Útil para descubrir la API
sin leer documentación externa.

```bash
curl http://localhost:8000/api
```

#### `GET /api/bible/books`

Todos los libros de la Biblia.

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books
```

```json
[
  {
    "book_id": 1,
    "book_name_id": "genesis",
    "book_name": "Génesis",
    "chapters_count": 50,
    "translation_name": "Reina Valera"
  }
]
```

> **Tip:** usa `book_name_id` en las rutas siguientes. Es el identificador normalizado del libro.

#### `GET /api/bible/books/:bookName/chapters`

Capítulos de un libro, con la cantidad de versículos de cada uno.

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/juan/chapters
```

```json
[
  {
    "book_id": 43,
    "chapter": 1,
    "verses_count": 51
  }
]
```

#### `GET /api/bible/books/:bookName/chapters/:chapter/verses`

Todos los versículos de un capítulo, en orden ascendente.

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/salmos/chapters/2/verses
```

```json
[
  { "verse": 1, "text": " ¿Por qué se amotinan las naciones... ", "subtitle": null }
]
```

##### Filtros opcionales e independientes

Los query params `from` y `to` pueden usarse **por separado**:

| Consulta | Resultado |
| -------- | --------- |
| `?from=5` | Del versículo 5 hasta el final del capítulo |
| `?to=3` | Del versículo 1 al 3 |
| `?from=5&to=10` | Exactamente los versículos 5 al 10 |

```bash
curl -H "x-api-key: mi-clave-secreta" "http://localhost:8000/api/bible/books/salmos/chapters/2/verses?from=5&to=10"
```

#### `GET /api/bible/books/:bookName/chapters/:chapter/verses/:verseOrRange`

Un solo segmento que acepta dos formatos. La forma de la respuesta depende del formato:

**Versículo individual** — solo el número. Devuelve **un objeto**:

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/salmos/chapters/2/verses/5
```

```json
{
  "verse": 5,
  "text": " Luego hablará a ellos en su furor, Y los turbará con su ira. ",
  "subtitle": null
}
```

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/juan/chapters/3/verses/16
```

```json
{
  "verse": 16,
  "text": " Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito... ",
  "subtitle": "De tal manera amó Dios al mundo"
}
```

**Rango de versículos** — formato `from-to` (por ejemplo, Salmos 2:5-10). Devuelve **un array**:

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/salmos/chapters/2/verses/5-10
```

```json
[
  { "verse": 5, "text": "...", "subtitle": null },
  { "verse": 6, "text": "...", "subtitle": null },
  { "verse": 7, "text": "...", "subtitle": null },
  { "verse": 8, "text": "...", "subtitle": null },
  { "verse": 9, "text": "...", "subtitle": null },
  { "verse": 10, "text": "...", "subtitle": null }
]
```

#### `GET /api/bible/books/:bookName/chapters/:chapter/verses/:from/:to`

Variante de compatibilidad del rango con dos segmentos de ruta. Equivalente a `5-10`:

```bash
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/salmos/chapters/2/verses/5/10
```

---

### Formas de respuesta

| Caso | Forma JSON |
| ---- | ---------- |
| Libros y rangos de versículos | Array de objetos |
| Capítulos | Array de objetos |
| Versículo individual | Un objeto directo |

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `book_id` | number | Identificador numérico del libro. |
| `book_name_id` | string | Nombre normalizado del libro (para usar en rutas). |
| `book_name` | string | Nombre del libro con acentuación original. |
| `chapters_count` | number | Cantidad de capítulos del libro. |
| `translation_name` | string | Nombre de la traducción ("Reina Valera"). |
| `chapter` | number | Número del capítulo. |
| `verses_count` | number | Cantidad de versículos del capítulo. |
| `verse` | number | Número del versículo dentro del capítulo. |
| `text` | string | Texto del versículo. |
| `subtitle` | string \| null | Subtítulo editorial del versículo, si existe. |

### Normalización de nombres de libros

`:bookName` no distingue acentos, mayúsculas ni espacios. Estas tres consultas
devuelven la misma respuesta:

```
/api/bible/books/Génesis/chapters/1/verses
/api/bible/books/genesis/chapters/1/verses
/api/bible/books/GENESIS/chapters/1/verses
```

| Lo que escribes | Cómo se resuelve |
| --------------- | ---------------- |
| `Génesis` | `genesis` |
| `1 Tesalonicenses` | `1_tesalonicenses` |
| `cantar de los cantares` | `cantar_de_los_cantares` |

### Errores

Toda respuesta de error es JSON con un solo campo `error`:

```json
{ "error": "Verses not found" }
```

| Código | Cuerpo | Causa |
| ------ | ------ | ----- |
| `401` | `Unauthorized` | Falta la API key o es inválida (con header `WWW-Authenticate: Bearer`). |
| `400` | `Invalid verse range: verse numbers must be positive integers` | El rango incluye cero, decimales, letras o valores negativos. |
| `400` | `Invalid verse range: 'from' must be less than or equal to 'to'` | El rango está invertido (p. ej. `10-5`). |
| `400` | `Invalid verse range: use the format 5-10` | El formato de rango es incorrecto. |
| `400` | `Missing route parameter: ...` | Falta un parámetro de ruta. |
| `404` | `Verse not found` | El versículo no existe en ese capítulo. |
| `404` | `Verses not found` | El libro, capítulo o rango no existe. |
| `404` | `Chapters not found` | El libro no existe (endpoint de capítulos). |
| `404` | `Not found` | La ruta no existe. |
| `500` | `Internal server error` | Error inesperado del servidor. |

Ejemplos:

```bash
# 401 — sin API key
curl http://localhost:8000/api/bible/books

# 400 — rango invertido
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/salmos/chapters/2/verses/10-5

# 404 — Salmos 2 solo tiene 12 versículos
curl -H "x-api-key: mi-clave-secreta" http://localhost:8000/api/bible/books/salmos/chapters/2/verses/99

# 404 — ruta inexistente
curl http://localhost:8000/api/bible/ruta/desconocida
```

---

## Apéndice: los 66 libros

Usa `book_name_id` en las rutas. La API también acepta el nombre con acentos (`1 Samuel`).

### Antiguo Testamento

| Libro | `book_name_id` | Capítulos |
| ----- | -------------- | --------- |
| Génesis | `genesis` | 50 |
| Éxodo | `exodo` | 40 |
| Levítico | `levitico` | 27 |
| Números | `numeros` | 36 |
| Deuteronomio | `deuteronomio` | 34 |
| Josué | `josue` | 24 |
| Jueces | `jueces` | 21 |
| Rut | `rut` | 4 |
| 1 Samuel | `1_samuel` | 31 |
| 2 Samuel | `2_samuel` | 24 |
| 1 Reyes | `1_reyes` | 22 |
| 2 Reyes | `2_reyes` | 25 |
| 1 Crónicas | `1_cronicas` | 29 |
| 2 Crónicas | `2_cronicas` | 36 |
| Esdras | `esdras` | 10 |
| Nehemías | `nehemias` | 13 |
| Ester | `ester` | 10 |
| Job | `job` | 42 |
| Salmos | `salmos` | 150 |
| Proverbios | `proverbios` | 31 |
| Eclesiastés | `eclesiastes` | 12 |
| Cantar de los Cantares | `cantar_de_los_cantares` | 8 |
| Isaías | `isaias` | 66 |
| Jeremías | `jeremias` | 52 |
| Lamentaciones | `lamentaciones` | 5 |
| Ezequiel | `ezequiel` | 48 |
| Daniel | `daniel` | 12 |
| Oseas | `oseas` | 14 |
| Joel | `joel` | 3 |
| Amós | `amos` | 9 |
| Abdías | `abdias` | 1 |
| Jonás | `jonas` | 4 |
| Miqueas | `miqueas` | 7 |
| Nahum | `nahum` | 3 |
| Habacuc | `habacuc` | 3 |
| Sofonías | `sofonias` | 3 |
| Hageo | `hageo` | 2 |
| Zacarías | `zacarias` | 14 |
| Malaquías | `malaquias` | 4 |

### Nuevo Testamento

| Libro | `book_name_id` | Capítulos |
| ----- | -------------- | --------- |
| Mateo | `mateo` | 28 |
| Marcos | `marcos` | 16 |
| Lucas | `lucas` | 24 |
| Juan | `juan` | 21 |
| Hechos | `hechos` | 28 |
| Romanos | `romanos` | 16 |
| 1 Corintios | `1_corintios` | 16 |
| 2 Corintios | `2_corintios` | 13 |
| Gálatas | `galatas` | 6 |
| Efesios | `efesios` | 6 |
| Filipenses | `filipenses` | 4 |
| Colosenses | `colosenses` | 4 |
| 1 Tesalonicenses | `1_tesalonicenses` | 5 |
| 2 Tesalonicenses | `2_tesalonicenses` | 3 |
| 1 Timoteo | `1_timoteo` | 6 |
| 2 Timoteo | `2_timoteo` | 4 |
| Tito | `tito` | 3 |
| Filemón | `filemon` | 1 |
| Hebreos | `hebreos` | 13 |
| Santiago | `santiago` | 5 |
| 1 Pedro | `1_pedro` | 5 |
| 2 Pedro | `2_pedro` | 3 |
| 1 Juan | `1_juan` | 5 |
| 2 Juan | `2_juan` | 1 |
| 3 Juan | `3_juan` | 1 |
| Judas | `judas` | 1 |
| Apocalipsis | `apocalipsis` | 22 |

> Los números de capítulos listados son referenciales. Para obtenerlos de forma
> programática usa `GET /api/bible/books/:bookName/chapters`.

---

## Arquitectura del proyecto

Estructura en capas: **rutas → controladores → modelos → base de datos**,
con utilidades transversales y tipos compartidos.

```
bible-api-rv60/
├── database/
│   ├── bible.db              # Base de datos SQLite (RVR1960)
│   └── bibleDb.ts            # Conexión + queryAll(): puente sqlite3 → Promises
├── src/
│   ├── app.ts                # Aplicación Express, rutas, 404 y error handler
│   ├── routes/               # Definición de rutas (capa de transporte)
│   │   ├── books.ts
│   │   ├── chapters.ts
│   │   └── verses.ts
│   ├── controllers/          # Orquestación: validación, 404 y mapeo a DTOs
│   │   ├── books.ts
│   │   ├── chapters.ts
│   │   └── verses.ts
│   ├── models/               # Acceso a datos: SQL y filtros
│   │   ├── books.ts
│   │   ├── chapters.ts
│   │   └── verses.ts
│   ├── types/
│   │   └── bible.ts          # Filas de BD (BookRow...) y DTOs de la API (BookDto...)
│   └── utils/
│       ├── asyncHandler.ts   # Puente async/await → pipeline de errores de Express
│       ├── bookName.ts       # Normalización de nombres de libros
│       ├── httpError.ts      # Clase HttpError (status + message)
│       ├── requestParams.ts  # Narrowing de parámetros de ruta
│       └── verseRange.ts     # Parseo y validación de rangos de versículos
├── README.md
├── LICENSE
└── package.json
```

## Modelo de datos

| Tabla | Contenido | Columnas clave |
| ----- | --------- | -------------- |
| `BOOKS` | Los 66 libros | `BOOK_ID`, `BOOK_NAME`, `BOOK_NAME_NORM`, `BIBLE_ID` |
| `VERSES` | Cada versículo de la Biblia | `BOOK_ID`, `CHAPTER`, `VERSE_ID`, `VERSE_TEXT`, `SUBTITLE` |
| `BIBLES` | Traducciones disponibles | `ID`, `BIBLE_NAME` |

La columna `BOOK_NAME_NORM` es la versión normalizada del nombre del libro
(minúsculas, sin acentos, con guiones bajos) y es la que usan todas las
consultas por nombre.

## Tecnologías

| Tecnología | Uso |
| ---------- | --- |
| [Node.js](https://nodejs.org) | Runtime de JavaScript. |
| [TypeScript](https://www.typescriptlang.org) | Tipado estático en modo estricto. |
| [Express](https://expressjs.com) | Framework HTTP. |
| [SQLite](https://www.sqlite.org) + [sqlite3](https://github.com/TryGhost/node-sqlite3) | Base de datos embebida y driver. |
| [CORS](https://github.com/expressjs/cors) | Acceso cross-origin abierto (`origin: *`). |
| [nodemon](https://nodemon.io) + [ts-node](https://typestrong.org/ts-node/) | Desarrollo con hot reload. |
| [npm](https://www.npmjs.com) | Gestor de paquetes. |

## Licencia

Este proyecto está bajo la licencia GNU GPL. Consulta el archivo
[LICENSE](LICENSE) para más detalles.
