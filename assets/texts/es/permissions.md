# Permisos Solicitados

Para una explicación general de los permisos en extensiones consulta [este artículo de soporte](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Permisos de Instalación

Actualmente, no se requiere de ningún permiso al instalar o al actualizar.

## Permisos (opcionales) de Funciones-específicas

Estos permisos son solicitados al hacer acciones específicas en caso de ser requeridos.

| Id Interno | Permiso                                                        | Solicitado                         | 

Explicación                                                                                                        |

|:-----------|:---------------------------------------------------------------|:-----------------------------------|

| `download` | Descarga, lee y modifica archivos en el historial de descargas del navegador |  Permite descargar el código QR como SVG | Requerido para descargar (y guardar) el SVG y permitirle al usuario elegir una ubicación de destino. Esta extensión no accede a tus archivos descargados, solo utiliza este permiso para iniciar la descarga.|

## Permisos Ocultos
Adicionalmente, solicita estos permisos, los cuales no son solicitados en Firefox cuando la extensión es instalada al no ser permisos mayores.

| Id Interno  | Permiso                      | Explicación                                                         |
|:------------|:-----------------------------|:--------------------------------------------------------------------|
| `activeTab` | Accede al sitio de la pestaña| Requerido para obtener la URL actual para generar el código QR      |
| `storage`   | Almacenamiento local         | Requerido para guardar la configuración                             |
| `menus`     | Modificar menús de contexto  | Requerido para agregar menús de contexto "QR de la selección (etc)" |
