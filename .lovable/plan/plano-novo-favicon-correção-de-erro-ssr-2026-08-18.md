# Plano: Novo favicon + correção de erro SSR

## 1. Trocar o favicon pelo logo enviado

Você enviou o logo horizontal da CUFA (pássaro + "CUFA / Central Única das Favelas").

- Adapto a imagem para um quadrado de 64x64px com fundo transparente, usando padding (nunca esticando), para o logo manter as proporções.
- Salvo o resultado em `public/favicon.png`.
- Atualizo o link do ícone em `src/routes/__root.tsx` para apontar ao novo arquivo.
- Removo `public/favicon.ico` se ainda existir, para não servir o ícone antigo.

Observação: por ser um logo horizontal e largo, no tamanho de 16-32px da aba o texto fica pequeno. Se preferir mais legibilidade, posso recortar só o pássaro como marca do favicon — me avise e ajusto.

## 2. Corrigir erro de runtime no preview

O preview está registrando `localStorage is not defined` em `src/components/site/MasterAdminDialog.tsx`: os estados iniciais leem `localStorage` durante a renderização no servidor.

- Inicializo esses estados com valores seguros para o servidor.
- Movo a leitura do `localStorage` para dentro de `useEffect`, executando apenas no navegador.

## Resultado esperado

- Favicon novo com a marca da CUFA em todas as abas.
- Preview sem o erro de SSR.
