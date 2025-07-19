# fonts-cat

## Resum

Molt ràpidament, aquest repositori es basa en dades públiques d'OpenStreetMap, concretament dels nodes de la regió de Catalunnya que tenen l'etiqueta `amenity=drinking_water`. Per mostrar el mapa i personalitzar-lo s'utilitza Mapbox.

## Configuració
0. Baixar o clonar el projecte en local (recomanació: utilitzar GitHub Desktop)
1. Instal·lar dependències (`npm install`)
2. Registrar-se a Mapbox i obtenir un access token: [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
3. Posar l'access token a un fitxer (crear-lo) `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGthYmNkZWYifQ.el-teu-token
   ```
4. Executar l'app en local en mode desenvolupament (`npm run dev` i [http://localhost:3000](http://localhost:3000))
5. Fer les personalitzacions necessaries
6. Executar l'app en local ara en mode producció (`npm run build` i `npm start` i [http://localhost:3000](http://localhost:3000)), si no es dona cap error, tot està ben configurat per publicar la web.
7. Publicar el repositori a GitHub utilitzant GitHub Desktop o Git
8. Importar-lo a Vercel
   1. GitHub settings > Apps > Vercel i donar accés al repositori (`fonts-cat`). 
   2. Obrir el Vercel dashboard (s'hauria d'obrir automoàticament) i crear un nou projecte, importar el repositori `fonts-cat`.
9. Afegir la variable de `.env.local` (si no es fa inicialment abans de fer el primer Deploy, es pot fer després a Project > Settings > Environment Variables)
4. Fer 'Deploy' del projecte
5. Veure la web publicada a una url similar a la següent `https://fonts-cat.vercel.app` (però segurament amb el nom del vostre projecte de Vercel)
   
## Dades
Les dades de les fonts són el fitxer GeoJson que hi ha dins la carpeta public (`public/fonts-cat.geojson`). En un cas ideal tindríem un servidor que obté via OpenStreetMap Overpass API les dades i les va actualitzant aproximadament 1 cop la setmana. En el nostre cas, com que és una aplicació client-side i les dades pesen poc (~2MB) les deixem dins la carpeta public de manera estàtica.

Per obtenir les dades el següent script d'exemple pot servir:

## Característiques tècniques de la app web
NextJS 15 amb App Router, Typescript i Tailwind CSS

## Estructura

```
src/
├── app/
│   ├── globals.css          # Global styles and Mapbox CSS
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main page with MapBox component
└── components/
    └── MapBox.tsx           # Interactive map component
public/
└── fonts-cat.geojson       # GeoJSON data file (1MB+)
```

## License

This project uses data from OpenStreetMap, which is available under the Open Database License (ODbL). This repository and it's code is completely unlicensed ('The Unlicense' LICENSE), that means you are free to do anything you want with it with no restrictions of any kind.
