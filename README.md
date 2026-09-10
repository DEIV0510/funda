# FUNDASPED · Sitio web institucional

Sitio de una sola página para **FUNDASPED — Fundación Educativa Asesorías Pedagógicas**
(entidad sin ánimo de lucro, Medellín · Antioquia, desde 1994) y su programa de
**Técnicas de Lectura Rápida, Comprensión y Retención**.

## Arquitectura

HTML, CSS y JavaScript planos, sin dependencias ni paso de compilación: el sitio
se publica subiendo la carpeta tal cual. Todas las rutas son relativas, así que
funciona en la raíz de un dominio, en un subdirectorio o abierto con `file://`.

```
index.html              Página completa (marcado semántico + datos estructurados)
site.webmanifest        Manifiesto e iconos
robots.txt
assets/css/styles.css   Hoja única, organizada por secciones numeradas
assets/js/main.js       Comportamiento (sin librerías)
assets/fonts/           Inter y Newsreader, subconjunto latino, servidos localmente
assets/img/             Imágenes optimizadas que usa la página
_tools/                 Scripts de preparación de assets (no se publican)
_raw/                   Material original del cliente (no se publica)
```

## Contenido

Todo el texto y las cifras provienen del material institucional entregado
(brochure de FUNDASPED, versión previa de la página y el sitio actual
`asped2007.jimdofree.com`). No hay datos, testimonios ni logros inventados.

Las fotografías son reales: dos vienen del brochure (Biblioteca Municipal de
Girardota y estudiantes de la vereda Encenillos) y el resto del sitio actual de
la fundación. La galería conserva la nota de autorización de los padres de
familia. El certificado que se muestra es el ejemplo real, con el nombre del
participante reemplazado por un marcador genérico.

El logotipo es el original de FUNDASPED: solo se limpió el recorte (halo blanco y
restos de texto que arrastraba el PDF de origen). No se modificó forma, color ni
proporción.

## Assets

Los scripts de `_tools/` regeneran `assets/img/` a partir de `_raw/`. Requieren
`sharp`; si no está instalado en el proyecto puede apuntarse a otro:

```bash
node _tools/logo.js          # limpia el recorte del logotipo -> _tools/logo-mark.png
node _tools/build-images.js  # logo, favicons, Open Graph y fotografías -> assets/img/
```

Las imágenes nunca se amplían: el ancho de salida se limita al del original.

## Desarrollo

```bash
node _tools/dev-server.js
```

Abre `http://localhost:5333`.

## Formulario de contacto

No hay backend. El formulario valida en el navegador y arma un mensaje de
WhatsApp con los datos; también se ofrece el correo como alternativa. Cuando
exista un servicio que reciba las solicitudes, basta con asignar la ruta a la
constante `ENDPOINT` en `assets/js/main.js`: el envío por WhatsApp se mantiene
como respaldo.

## Pendientes para el cliente

- **URL definitiva.** Al publicar, conviene cambiar `og:image` a ruta absoluta y
  añadir `<link rel="canonical">` y un `sitemap.xml`.
- **Certificado.** El brochure describe la certificación como *Lector Experto en
  Técnicas de Lectura Rápida*; el certificado de ejemplo dice, en su cuerpo,
  *Creador Textual en Pensamiento y Memoria*. La página usa la primera
  denominación. Conviene confirmar cuál es la vigente.
- **Medios de donación.** No se publicaron cuentas ni pasarelas: la sección
  remite a WhatsApp o correo, como indica el material.
- **Facebook.** Solo aparece el nombre de la página (*Asesorías Pedagógicas
  Asped*); falta la URL para enlazarla.
