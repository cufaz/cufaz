# Plano: Novo favicon + correção de erro SSR

## O que vamos fazer

1. **Trocar o favicon**
   - Você faz o upload da imagem que quer usar como favicon.
   - Eu adapto a imagem para um quadrado 64x64px (crop/pad preservando proporções).
   - Salvo o resultado em `public/favicon.png`.
   - Atualizo o link no `src/routes/__root.tsx` para apontar para o novo `favicon.png`.
   - Removo o `public/favicon.ico` padrão, se ainda existir.

2. **Corrigir erro de runtime no preview**
   - O erro `localStorage is not defined` acontece em `src/components/site/MasterAdminDialog.tsx` porque `useState` lê `localStorage` durante a renderização no servidor (SSR).
   - Ajusto os estados iniciais para valores seguros no servidor e movo a leitura do `localStorage` para dentro de `useEffect`, garantindo que só execute no cliente.

## Resultado esperado

- Favicon novo e quadrado em todas as abas do navegador.
- Preview sem o erro de SSR e sem queda para renderização apenas no cliente.

## Próximo passo

Envie a imagem que será usada como favicon para eu prosseguir com a adaptação.
