# Permissões solicitadas

Para uma explicação completa das permissões utilizadas pelo add-on, veja [este artigo](https://support.mozilla.org/kb/permission-request-messages-firefox-extensions).

## Permissões de instalação

Atualmente nenhuma permissão é solicitada na instalação ou autualização.

## Permissões de funcionalidades específicas (opcional)

Estas permissões são solicitadas quando é feito alguma ação, caso seja necessária.

| Id interno  | Permissão                                            | Solicitada em…               | Explicação                                                                                                                                                                                 |
|:------------|:-----------------------------------------------------|:-----------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `downloads` | Baixa arquivos e lê/altera o histórico de downloads  | Download do QR code como SVG | Necessário para baixar o SVG e permitir o usuário escolher um local de salvamento. Este add-on não acessa seus arquivos baixados, apenas utiliza a permissão para iniciar o  download. |

## Permissões ocultas
Adicionalmente as seguintes permissões são necessárias, que não são solicitadas pelo firefox na instalação por não serem permissões profundas.

| Id interno  | Permissão                                | Explicação                                                                          |
|:------------|:-----------------------------------------|:------------------------------------------------------------------------------------|
| `activeTab` | Acessa o website da página atual         | Necessário para buscar a URL do site atual para o QR Code                           |
| `storage`   | Acessa o armazenamento local             | Necessário para salvar as configurações                                             |
| `menus`     | Altera os menus de contexto do navegador | Necessário para adicionar ao menu de contexto "QR code através da seleção" (etc.)   |
