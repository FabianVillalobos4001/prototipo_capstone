// server/utils/zones.js

const ZONES = [
  {
    slug: 'zona1-centro',
    label: 'Zona 1 – Centro',
    communes: [
      'santiago',
      'providencia',
      'ñuñoa',
      'nunoa',
      'estación central',
      'estacion central',
      'independencia',
      'recoleta',
    ],
  },
  {
    slug: 'zona2-norte-urbano',
    label: 'Zona 2 – Norte Urbano',
    communes: [
      'quilicura',
      'conchalí',
      'conchali',
      'huechuraba',
      'renca',
      'cerro navia',
      'quinta normal',
      'lo prado',
    ],
  },
  {
    slug: 'zona3-oriente-urbano',
    label: 'Zona 3 – Oriente Urbano',
    communes: [
      'las condes',
      'vitacura',
      'lo barnechea',
      'la reina',
      'peñalolén',
      'penalolen',
      'macul',
    ],
  },
  {
    slug: 'zona4-sur-urbano',
    label: 'Zona 4 – Sur Urbano',
    communes: [
      'la florida',
      'puente alto',
      'la granja',
      'san joaquín',
      'san joaquin',
      'san miguel',
      'la cisterna',
      'san ramón',
      'san ramon',
      'el bosque',
      'lo espejo',
    ],
  },
  {
    slug: 'zona5-poniente-periurbano',
    label: 'Zona 5 – Poniente / Periurbano',
    communes: [
      'maipú',
      'maipu',
      'cerrillos',
      'padre hurtado',
      'peñaflor',
      'penaflor',
      'talagante',
      'el monte',
      'melipilla',
      'pudahuel',
    ],
  },
  {
    slug: 'zona6-periferia-metropolitana',
    label: 'Zona 6 – Periferia Metropolitana',
    communes: [
      'san bernardo',
      'calera de tango',
      'buin',
      'paine',
      'lampa',
      'colina',
      'til til',
      'pirque',
      'san josé de maipo',
      'san jose de maipo',
      'curacaví',
      'curacavi',
      'maría pinto',
      'maria pinto',
      'alhué',
      'alhue',
    ],
  },
];

const COMMUNE_TO_ZONE = new Map();
for (const zone of ZONES) {
  zone.communes.forEach((commune) => COMMUNE_TO_ZONE.set(commune, zone));
}

function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findZoneByAddress(address) {
  if (!address) return undefined;
  const norm = normalize(address);
  for (const [commune, zone] of COMMUNE_TO_ZONE.entries()) {
    if (norm.includes(commune)) return zone;
  }
  return undefined;
}

export function inferZoneFromAddress(address) {
  return findZoneByAddress(address);
}

export function buildRouteZone(originAddress, destinationAddress) {
  const originZoneObj = findZoneByAddress(originAddress);
  const destinationZoneObj = findZoneByAddress(destinationAddress);

  const originZone = originZoneObj?.slug;
  const destinationZone = destinationZoneObj?.slug;
  const originZoneLabel = originZoneObj?.label;
  const destinationZoneLabel = destinationZoneObj?.label;

  const zone =
    originZone && destinationZone
      ? `${originZone}->${destinationZone}`
      : originZone || destinationZone || undefined;

  const zoneLabel =
    originZoneLabel && destinationZoneLabel
      ? `${originZoneLabel} → ${destinationZoneLabel}`
      : originZoneLabel || destinationZoneLabel || undefined;

  return {
    originZone,
    destinationZone,
    zone,
    originZoneLabel,
    destinationZoneLabel,
    zoneLabel,
  };
}

export function describeZone(slug) {
  if (!slug) return undefined;
  return ZONES.find((z) => z.slug === slug)?.label;
}
