Jsje, sembla mentida però ara estava mirant de fer una web de demo per mostrar-te com quedaria amb Openstreetmap + Mapbox i buscant he trobat aquesta pàgina de la wiki: [Oscar Fonts OSM](https://wiki.openstreetmap.org/wiki/Ca:Catalunya#Qui_cartografia?_/_%C2%BFQui%C3%A9nes_est%C3%A1n_cartografiando?_/_Who_are_mapping?), no ets tu mateix un dels principals cartografiadors de OMS Catalunya?. Si és així uau quanta feina! I en cas afirmatiu no t'he de dir res perquè ja deus estar perfectament familiaritzat.

Bé en cas que no, la idea seria obtenir les fonts de les dades d'OSM amb la seva API overpass filtrant per `"amenity"="drinking_water"`. Com a exemple sense utilitzar cap script pots entrar simplement a [https://overpass-turbo.eu/](https://overpass-turbo.eu/) i mostrar les fonts amb el següent codi:
```
[out:json][timeout:60];
{{geocodeArea:"Catalonia"}}->.searchArea;
(
  node["amenity"="drinking_water"](area.searchArea);
  way["amenity"="drinking_water"](area.searchArea);
  relation["amenity"="drinking_water"](area.searchArea);
);
out body;
>;
out skel qt;
```
O aquí directament un [link](https://overpass-turbo.eu/?Q=%5Bout%3Ajson%5D%5Btimeout%3A60%5D%3B%0A%7B%7BgeocodeArea%3A%22Catalonia%22%7D%7D-%3E.searchArea%3B%0A%28%0A++node%5B%22amenity%22%3D%22drinking_water%22%5D%28area.searchArea%29%3B%0A++way%5B%22amenity%22%3D%22drinking_water%22%5D%28area.searchArea%29%3B%0A++relation%5B%22amenity%22%3D%22drinking_water%22%5D%28area.searchArea%29%3B%0A%29%3B%0Aout+body%3B%0A%3E%3B%0Aout+skel+qt%3B) que ja conté el codi. Després seria descarregar les dades en format GeoJson. Aquest GeoJson es podria personalitzar amb dades de l'[ACA](https://aca.gencat.cat/ca/laigua/el-medi-hidric-a-catalunya/zones-protegides/zones-vulnerables-per-nitrats-dorigen-agrari/) (suposo vaja no en tinc ni idea realment de on estan les dades amb més detalls sobre contaminació per nitrats de l'aigua) o amb qualsevol altra informació rellevant com la temperatura de l'aigua o similar i ja un cop en aquest punt s'utilitza Carto, Mapbox (segurament el millor) o qualsevol altre GIS per renderitzar i mostrar el mapa. Al pesar molt poc les dades (aprox 1MB) es podrien servir client-side directament però si es volgués es podrien posar en un servidor i fins i tot permetre als usuaris modificar les dades de les fonts o afegir algun comentari. També es podrien combinar diferents datasets de fonts que no estan a OSM, per exemple es veu que l'ACA al 2018 tenia un mapa [CercaFonts](https://aca-web.gencat.cat/aca/appmanager/aca/aca) exclusiu de fonts naturals però pel que es veu ja no està actiu el link. També es podria fer que algú pugui afegir una font manualment des de la app i que d'allà es guardi la informació en el format correcete per tal que després l'admin pugui revisar una a una les contribucions i les acceptades es contribueixen directament a OSM via API amb OAuth.

No sé, potser és una mica innecessari tot plegat però jo a vegades vaig pel carrer i tinc set i m'agradaria saber on està la font més pròxima.

Vale ja està, ja he acabat la demo, aquí la tens: [https://fonts-cat.vercel.app/](https://fonts-cat.vercel.app/).

En realitat si vols simplement et compro el domini (si estàs disposat a canviar i t'ha de caducar algun dia d'aquest any). No és per fer-hi res comercial de veritat, simplement que és més ràpid escriure 'fonts.cat' que 'fonts-cat.vercel.app'.