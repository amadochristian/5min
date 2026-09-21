# 5Minutos para Segurança

MVP PWA mobile-first para acesso aos formulários semanais de segurança da Santher.

## Estrutura

- `index.html`: shell acessível e navegação.
- `css/style.css`: identidade visual responsiva.
- `js/app.js`: estado, renderização, links semanais e eventos.
- `js/semanas.js`: ciclo semanal A/B, baseado em segunda-feira 21/09/2026.
- `js/notificacoes.js`: preferências e permissões da Notifications API.
- `manifest.json` e `sw.js`: instalação e cache offline.
- `assets/images/cipa-logo.png`: logo oficial da CIPA usado na tela inicial.
- `assets/images/santher-logo.png`: logo oficial da Santher usado na identificação principal.

## Executar

Service Workers precisam de um contexto seguro. Para testar localmente, use qualquer servidor estático, por exemplo:

```bash
python -m http.server 8080
```

Abra `http://localhost:8080`. O projeto pode ser publicado diretamente na Vercel como site estático.

## Observações

O link da semana é alternado automaticamente entre os dois Microsoft Forms configurados em `js/app.js`, com base no ciclo A/B iniciado em 21/09/2026. Notificações locais dependem do suporte do navegador; não há push server-side.
