# Dashboard de Votação — Mapa de Calor

Dashboard interno para a equipe de campanha: mapa de calor da votação de 2024
(vereador) em Porto Alegre, com meta de 2026 (deputado estadual).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Pipeline de dados

Os dados de origem (já processados e conferidos a partir do CSV bruto do TSE)
ficam em `data/raw/*.csv`. Dois scripts geram os dados que o app consome, em
`data/processed/`:

### 1. `node scripts/build-data.mjs`

Lê os CSVs de `data/raw/`, valida contra os totais oficiais (8.603 votos, 339
locais, totais por zona) e gera:

- `data/processed/zonas.json`
- `data/processed/locations.json` — os 339 locais únicos, sem lat/lng ainda
  (`geocodeStatus: "pending"`)
- `data/processed/results-2024-vereador.json` — votos por local para esta
  eleição

Rodar de novo **apaga qualquer geocodificação já feita** em `locations.json`
(regenera do zero a partir do CSV) — só rode se os CSVs de origem mudarem.

### 2. `node scripts/geocode.mjs`

Geocodifica os 339 endereços via **Nominatim (OpenStreetMap, gratuito)**,
respeitando o limite de ~1 requisição/segundo, e grava lat/lng direto em
`data/processed/locations.json` (idempotente — só re-geocodifica o que ainda
não tem status `"ok"`; use `--force` para regeocodificar tudo).

> **Importante:** este script precisa de acesso de rede a
> `nominatim.openstreetmap.org`. Em ambientes sandboxed (como o Claude Code na
> web) esse domínio costuma estar bloqueado pela política de rede — rode este
> script na sua máquina local. Ele leva ~10-12 minutos (339 × ~1.1s).

Ao final ele imprime um resumo: quantos endereços foram geocodificados com
exatidão (`ok`), quantos caíram no fallback aproximado sem número
(`approx`, ex.: endereços "S/N" do TSE) e quantos falharam de vez
(`failed`). O app também mostra essa cobertura permanentemente no cabeçalho
("Cobertura de geocodificação"), incluindo a lista de locais sem coordenada,
para que a equipe saiba exatamente quantos votos não estão sendo plotados.

Depois de rodar, `git add data/processed/locations.json` e commite — o app
não geocodifica em tempo real, só lê o JSON estático.

## Configuração do candidato

`data/config/candidate.json` tem nome, cargo 2024/2026, cidade e meta 2026.
Ajuste esse arquivo (é o único lugar com o nome do candidato).

## Adicionando candidatos/eleições futuras

O schema já separa **locais** (endereço + geocodificação, reutilizável) de
**resultados por eleição**:

- `data/processed/locations.json` — master de locais, por `id` estável
  (`{zona}-{slug-do-nome}`)
- `data/processed/results-<ano>-<cargo>.json` — votos por `locationId` para
  uma eleição/candidato específico

Para adicionar uma nova eleição (ex.: deputado estadual 2022), gere um novo
`results-2022-deputado-estadual.json` no mesmo formato (ver
`scripts/build-data.mjs` para o shape) e registre em
`src/lib/data.ts` (`elections` map). Locais que já existem em
`locations.json` são reaproveitados automaticamente — só é preciso
geocodificar endereços novos.

## Stack

Next.js (App Router) + TypeScript + Tailwind, `react-leaflet` +
`leaflet.heat` para o mapa (tiles OpenStreetMap, sem chave de API), dados
estáticos em JSON. Deploy alvo: Vercel.
