// my-app/server/utils/parseReceipt.js (ESM)

function normalize(text) {
  return String(text)
    .replace(/[\u2013\u2014]/g, '-') // guiones largos
    .replace(/[\u00A0\t]+/g, ' ') // espacios no separables y tabs
    .replace(/\s{2,}/g, ' ') // espacios repetidos
    .replace(/^[\s\-•·\u2022\u25CF>]+/gm, '') // bullets o guiones al inicio
    .trim();
}

function toIntDigits(str) {
  if (!str) return undefined;
  const digits = String(str).replace(/[^\d]/g, '');
  if (!digits) return undefined;
  return Number(digits);
}

const MONTHS_ES = {
  ene: 1, enero: 1,
  feb: 2, febrero: 2,
  mar: 3, marzo: 3,
  abr: 4, abril: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6,
  jul: 7, julio: 7,
  ago: 8, agosto: 8,
  sep: 9, sept: 9, set: 9, septiembre: 9, setiembre: 9,
  oct: 10, octubre: 10,
  nov: 11, noviembre: 11,
  dic: 12, diciembre: 12,
};

const MONTH_REGEX =
  '(ene\\.?|enero|feb\\.?|febrero|mar\\.?|marzo|abr\\.?|abril|may\\.?|mayo|jun\\.?|junio|jul\\.?|julio|ago\\.?|agosto|sep\\.?|sept\\.?|set\\.?|septiembre|setiembre|oct\\.?|octubre|nov\\.?|noviembre|dic\\.?|diciembre)';

function monthTokenToNumber(token) {
  if (!token) return undefined;
  const key = token.toLowerCase().replace(/\./g, '');
  return MONTHS_ES[key];
}

function parseDateParts({ day, monthToken, time, ampm, year }) {
  const mon = monthTokenToNumber(monthToken);
  if (!mon) return undefined;
  let [hh, mm] = time.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return undefined;
  if (ampm) {
    if (ampm === 'pm' && hh < 12) hh += 12;
    if (ampm === 'am' && hh === 12) hh = 0;
  }
  const yr = year ? Number(year) : new Date().getFullYear();
  const d = new Date(yr, mon - 1, Number(day), hh, mm, 0);
  if (!Number.isNaN(d.getTime())) return d;
  return undefined;
}

function parseLooseDateTime(snippet) {
  if (!snippet) return undefined;
  const lower = normalize(snippet).toLowerCase();
  const re = new RegExp(
    `(\\b\\d{1,2})\\s+${MONTH_REGEX}` +
      `(?:\\s+(\\d{4}))?` +
      `(?:\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)?\\s*(hrs?|horas?)?)?`,
    'i'
  );
  const match = lower.match(re);
  if (match) {
    const [, day, monthToken, year, hour, minute, ampm] = match;
    if (hour != null && minute != null) {
      return parseDateParts({
        day,
        monthToken,
        time: `${hour}:${minute}`,
        ampm: ampm?.toLowerCase(),
        year,
      });
    }
    if (year) {
      const d = new Date(Number(year), monthTokenToNumber(monthToken) - 1, Number(day));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  const timeOnly = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
  if (timeOnly) {
    const [, hour, minute, ampm] = timeOnly;
    const now = new Date();
    let hh = Number(hour);
    if (ampm) {
      if (ampm === 'pm' && hh < 12) hh += 12;
      if (ampm === 'am' && hh === 12) hh = 0;
    }
    now.setHours(hh);
    now.setMinutes(Number(minute));
    now.setSeconds(0, 0);
    return now;
  }
  return undefined;
}

function findDateTime(text) {
  const t = normalize(text).toLowerCase();
  const reNamed = new RegExp(
    `(\\b\\d{1,2})\\s+${MONTH_REGEX}\\s+(\\d{1,2}:\\d{2})\\s*(am|pm)?(?:\\s*(\\d{4}))?`,
    'i'
  );
  const m1 = t.match(reNamed);
  if (m1) {
    const [, day, monthToken, time, ampmRaw, year] = m1;
    const dt = parseDateParts({
      day,
      monthToken,
      time,
      ampm: ampmRaw?.toLowerCase(),
      year,
    });
    if (dt) return dt;
  }
  const m2 = t.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})\s+(\d{2}):(\d{2})/);
  if (m2) {
    const d = new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]), Number(m2[4]), Number(m2[5]), 0);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const m3 = t.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m3) {
    const d = new Date(Number(m3[3]), Number(m3[2]) - 1, Number(m3[1]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}

function findPrecio(text) {
  const lns = normalize(text).split('\n');
  const labeled = [];
  const reCurrency = /(CLP|\$|USD|EUR)\s*([\d.\s,]+)/i;
  lns.forEach((l, i) => {
    const m = l.match(reCurrency);
    if (m) {
      const v = toIntDigits(m[2]);
      if (v) labeled.push({ v, i });
    }
  });
  if (labeled.length) {
    labeled.sort((a, b) => a.i - b.i);
    return labeled[0].v;
  }
  for (const l of lns) {
    if (/total|precio/i.test(l)) {
      const m = l.match(/[\d.\s,]+/);
      const v = toIntDigits(m?.[0]);
      if (v) return v;
    }
  }
  const nums = [...normalize(text).matchAll(/[\d.\s,]+/g)]
    .map((m) => toIntDigits(m[0]))
    .filter((x) => x && x > 0 && x < 1000000);
  if (nums.length) return nums.sort((a, b) => b - a)[0];
  return undefined;
}

function findByLabel(text, labelRegex) {
  const m = normalize(text).match(labelRegex);
  return m ? m[1].trim() : undefined;
}

function lines(text) {
  return normalize(text).split('\n').map((l) => l.trim()).filter(Boolean);
}

function cleanBulletPrefix(line) {
  return line
    .replace(/^[\-\*\u2022\u25cf>·•o]+\s*/i, '')
    .replace(/^(?:oi|oI|Oi|IO|i|l)\s+(?=[A-ZÁÉÍÓÚ])/u, '')
    .trim();
}

function normalizeAddressText(address) {
  return address
    .replace(/\s+,/g, ',')
    .replace(/,\s+,/g, ', ')
    .replace(/Región,\s+Metropolitana/gi, 'Región Metropolitana')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
function detectTransportMethod(text) {
  const normalized = normalize(text).toLowerCase();
  if (!normalized) return undefined;

  if (/\buberx?\b/.test(normalized)) {
    return 'uber';
  }

  const looksTransvip =
    /\btransvip\b/.test(normalized) ||
    (/\breserva\s+#\d+/.test(normalized) && /aeropuerto_scl/.test(normalized)) ||
    (/\bretir[oa]\s+solicitado\b/.test(normalized) && /\btarifa fija\b/.test(normalized));

  if (looksTransvip) {
    return 'transvip';
  }

  return undefined;
}

function isAddressLine(l) {
  const line = cleanBulletPrefix(l);
  if (!line) return false;
  const hasLetters = /[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc]/i.test(line);
  const hasDigits = /\d+/.test(line);
  const hasComma = /,/.test(line);
  const hasStreetWord = /(calle|avenida|av\.|camino|pasaje|pje\.?|edificio|plaza|condes|pe\u00f1alol[e\u00e9]n|penalolen|santiago|metropolitana|aeropuerto|terminal|estaci[o\u00f3]n|regi[o\u00f3]n|comuna)/i.test(line);
  const tooShort = line.length < 6;
  const looksNoise = /^[\W_]+$/.test(line);
  const startsWithNoise = /^(detalle|subtotal|total|tarifa|retiro|reserva|tiempo|distancia|pasajer[oa]s?|mercadopago|ayuda|seguridad)/i.test(line);
  if (startsWithNoise) return false;
  return !tooShort && !looksNoise && hasLetters && (hasDigits || hasStreetWord);
}

function looksCurrencyLine(line) {
  return /(clp|\$|total|subtotal|precio)/i.test(line);
}

function findDirecciones(text) {
  const lns = lines(text);
  const timeRe = /(\d{1,2}:\d{2})\s*(am|pm)?/i;
  const candidates = [];
  const inLineCandidates = [];

  lns.forEach((raw) => {
    if (!timeRe.test(raw)) return;
    const [maybeAddress, maybeTime] = raw.split('|').map((part) => part?.trim() || '');
    if (maybeAddress && isAddressLine(maybeAddress)) {
      inLineCandidates.push({
        address: cleanBulletPrefix(maybeAddress),
        dateTime: parseLooseDateTime(maybeTime),
      });
    }
  });

  const cleaned = lns.map(cleanBulletPrefix);
  cleaned.forEach((line, idx) => {
    if (!timeRe.test(line)) return;
    for (let j = idx - 1; j >= 0 && idx - j <= 3; j -= 1) {
      const prev = cleaned[j];
      if (isAddressLine(prev)) {
        candidates.push(prev);
        break;
      }
    }
  });

  if (inLineCandidates.length) {
    const origen = inLineCandidates[0].address;
    const destino = inLineCandidates[inLineCandidates.length - 1].address;
    return { origen, destino };
  }
  if (candidates.length) {
    const origen = candidates[0];
    const destino = candidates[candidates.length - 1];
    return { origen, destino };
  }
  const addr = cleaned.filter(isAddressLine);
  if (!addr.length) return { origen: undefined, destino: undefined };
  return { origen: addr[0], destino: addr[addr.length - 1] };
}

const REGION_PATTERNS = [
  { regex: /\bregi[oó]n metropolitana\b/i, value: 'Región Metropolitana de Santiago' },
  { regex: /\bmetropolitana de santiago\b/i, value: 'Región Metropolitana de Santiago' },
  { regex: /\bregi[oó]n de arica y parinacota\b/i, value: 'Región de Arica y Parinacota' },
  { regex: /\barica y parinacota\b/i, value: 'Región de Arica y Parinacota' },
  { regex: /\bregi[oó]n de tarapac[aá]\b/i, value: 'Región de Tarapacá' },
  { regex: /\btarapac[aá]\b/i, value: 'Región de Tarapacá' },
  { regex: /\bregi[oó]n de antofagasta\b/i, value: 'Región de Antofagasta' },
  { regex: /\bantofagasta\b/i, value: 'Región de Antofagasta' },
  { regex: /\bregi[oó]n de atacama\b/i, value: 'Región de Atacama' },
  { regex: /\batacama\b/i, value: 'Región de Atacama' },
  { regex: /\bregi[oó]n de coquimbo\b/i, value: 'Región de Coquimbo' },
  { regex: /\bcoquimbo\b/i, value: 'Región de Coquimbo' },
  { regex: /\bregi[oó]n de valpara[ií]so\b/i, value: 'Región de Valparaíso' },
  { regex: /\bvalpara[ií]so\b/i, value: 'Región de Valparaíso' },
  { regex: /\bregi[oó]n del libertador\b/i, value: "Región del Libertador General Bernardo O'Higgins" },
  { regex: /\bo'?higgins\b/i, value: "Región del Libertador General Bernardo O'Higgins" },
  { regex: /\bregi[oó]n del maule\b/i, value: 'Región del Maule' },
  { regex: /\bmaule\b/i, value: 'Región del Maule' },
  { regex: /\bregi[oó]n de \u00f1uble\b/i, value: 'Región de Ñuble' },
  { regex: /\u00f1uble\b/i, value: 'Región de Ñuble' },
  { regex: /\bregi[oó]n del biob[ií]o\b/i, value: 'Región del Biobío' },
  { regex: /\bbiob[ií]o\b/i, value: 'Región del Biobío' },
  { regex: /\bregi[oó]n de la araucan[ií]a\b/i, value: 'Región de La Araucanía' },
  { regex: /\bla araucan[ií]a\b/i, value: 'Región de La Araucanía' },
  { regex: /\bregi[oó]n de los r[ií]os\b/i, value: 'Región de Los Ríos' },
  { regex: /\blos r[ií]os\b/i, value: 'Región de Los Ríos' },
  { regex: /\bregi[oó]n de los lagos\b/i, value: 'Región de Los Lagos' },
  { regex: /\blos lagos\b/i, value: 'Región de Los Lagos' },
  { regex: /\bregi[oó]n de ays[eé]n\b/i, value: 'Región de Aysén del General Carlos Ibáñez del Campo' },
  { regex: /\bays[eé]n\b/i, value: 'Región de Aysén del General Carlos Ibáñez del Campo' },
  { regex: /\bregi[oó]n de magallanes\b/i, value: 'Región de Magallanes y de la Antártica Chilena' },
  { regex: /\bmagallanes\b/i, value: 'Región de Magallanes y de la Antártica Chilena' },
];

const GENERIC_COMUNA_SKIP = new Set([
  'santiago',
  'chile',
  'metropolitana',
  'metropolitana de santiago',
  'región metropolitana',
  'region metropolitana',
  'región metropolitana de santiago',
  'region metropolitana de santiago',
]);

function extractComunaRegion(address) {
  if (!address) return { comuna: undefined, region: undefined };
  const normalized = address.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();
  let region;
  for (const candidate of REGION_PATTERNS) {
    if (candidate.regex.test(lower)) {
      region = candidate.value;
      break;
    }
  }
  if (!region) {
    const direct = normalized.match(/regi[oó]n\s+[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\s]+/i);
    if (direct) {
      region = direct[0].replace(/\s*,*$/g, '').trim();
    }
  }
  if (region) {
    region = region.replace(/,\s*chile$/i, '').trim();
  }

  const parts = normalized.split(',').map((p) => p.trim()).filter(Boolean);
  let comuna;
  if (parts.length) {
    const regionIndex = parts.findIndex((segment) => /regi[oó]n/.test(segment.toLowerCase()) || /metropolitana/.test(segment.toLowerCase()));
    if (regionIndex > 0) {
      for (let i = regionIndex - 1; i >= 0; i -= 1) {
        const candidateRaw = parts[i];
        const cleaned = candidateRaw.replace(/\b\d{3,}\b/g, '').trim();
        if (!cleaned) continue;
        const normalizedCandidate = cleaned.toLowerCase();
        if (GENERIC_COMUNA_SKIP.has(normalizedCandidate)) continue;
        comuna = cleaned;
        break;
      }
    } else if (parts.length >= 2) {
      const lastRelevant = parts[parts.length - 1].toLowerCase().includes('chile') ? parts[parts.length - 2] : parts[parts.length - 1];
      if (!/chile$/i.test(lastRelevant.toLowerCase())) {
        comuna = lastRelevant.replace(/\b\d{3,}\b/g, '').trim();
      }
    }
  }
  if (comuna) {
    comuna = comuna.replace(/^(comuna\s+de\s+)/i, '').trim();
  }
  return { comuna: comuna || undefined, region: region || undefined };
}

function parseCommonFields(text) {
  const dt = findDateTime(text) || undefined;
  let fechaHora = dt;
  let fecha;
  let hora;
  if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
    fecha = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    hora = `${hh}:${mm}`;
  }
  const precio = findPrecio(text);
  const { origen, destino } = findDirecciones(text);
  const cantidadPasajeros = toIntDigits(findByLabel(text, /pasajer[oa]s?[:\-\s]+(\d{1,2})/i));
  return {
    origen,
    destino,
    precio,
    fechaHora,
    fecha,
    hora,
    cantidadPasajeros,
  };
}

const UBER_BASE_HINT = /(calle|avenida|av\.|edificios?|pasaje|camino|ruta|autopista|terminal|aeropuerto|condominio|pje\.?)/i;

function parseUberReceipt(text) {
  const lns = lines(text);
  const timeRe = /(\d{1,2}:\d{2})\s*(am|pm)?/i;
  const addresses = [];
  const consumed = new Set();

  for (let i = 0; i < lns.length && addresses.length < 3; i += 1) {
    if (consumed.has(i)) continue;
    const base = cleanBulletPrefix(lns[i]);
    if (!isAddressLine(base)) continue;
    if (!UBER_BASE_HINT.test(base)) continue;
    if (looksCurrencyLine(base) || timeRe.test(base)) continue;
    const fragments = [base];
    consumed.add(i);
    let k = i + 1;
    while (k < lns.length) {
      const next = cleanBulletPrefix(lns[k]);
      if (timeRe.test(next)) {
        consumed.add(k);
        if (k + 1 < lns.length) {
          const after = cleanBulletPrefix(lns[k + 1]);
          if (isAddressLine(after)) {
            fragments.push(after);
            consumed.add(k + 1);
          }
        }
        break;
      }
      if (looksCurrencyLine(next)) break;
      if (isAddressLine(next)) {
        fragments.push(next);
        consumed.add(k);
        k += 1;
      } else {
        break;
      }
    }
    const joined = fragments.join(', ').replace(/,\s*,/g, ', ').replace(/\s+/g, ' ').trim();
    if (joined) {
      addresses.push(normalizeAddressText(joined));
    }
  }

  const result = {};
  if (addresses.length) {
    result.origen = addresses[0];
  }
  if (addresses.length > 1) {
    result.destino = addresses[1];
  }
  return result;
}

function collectTransvipStops(text) {
  const rawLines = normalize(text).split('\n');
  const stops = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    if (!/^\s*[o0]\b/i.test(rawLines[i])) continue;
    let segment = cleanBulletPrefix(rawLines[i]);
    let j = i + 1;
    while (j < rawLines.length && !segment.includes('|')) {
      if (/^\s*[o0]\b/i.test(rawLines[j])) break;
      const nextClean = cleanBulletPrefix(rawLines[j]);
      if (!nextClean || /^(?:\u20ac|responder|reenviar)/i.test(nextClean)) break;
      segment += ` ${nextClean}`;
      if (nextClean.includes('|')) {
        j += 1;
        break;
      }
      j += 1;
    }
    i = Math.max(i, j - 1);
    const [addressPartRaw, timePartRaw] = segment.split('|').map((part) => part?.trim() || '');
    if (!addressPartRaw) continue;
    const address = normalizeAddressText(addressPartRaw);
    let timePart = timePartRaw;
    if (timePart) {
      timePart = timePart.replace(/(\u20ac|responder|reenviar).*$/i, '').trim();
    }
    const dateTime = parseLooseDateTime(timePart);
    stops.push({ address, dateTime });
  }
  return stops;
}

function parseTransvipReceipt(text) {
  const stops = collectTransvipStops(text);
  const result = {};
  if (stops.length) {
    result.origen = normalizeAddressText(stops[0].address);
  }
  if (stops.length > 1) {
    result.destino = normalizeAddressText(stops[stops.length - 1].address);
  }
  const firstDt = stops.find((s) => s.dateTime)?.dateTime;
  if (firstDt instanceof Date && !Number.isNaN(firstDt.getTime())) {
    result.fechaHora = firstDt;
    result.fecha = new Date(firstDt.getFullYear(), firstDt.getMonth(), firstDt.getDate());
    result.hora = `${String(firstDt.getHours()).padStart(2, '0')}:${String(firstDt.getMinutes()).padStart(2, '0')}`;
  }
  return result;
}

const PROVIDER_PARSERS = {
  uber: parseUberReceipt,
  transvip: parseTransvipReceipt,
};

function fillDateParts(result) {
  if (result.fechaHora instanceof Date && !Number.isNaN(result.fechaHora.getTime())) {
    if (!result.fecha) {
      result.fecha = new Date(
        result.fechaHora.getFullYear(),
        result.fechaHora.getMonth(),
        result.fechaHora.getDate()
      );
    }
    if (!result.hora) {
      result.hora = `${String(result.fechaHora.getHours()).padStart(2, '0')}:${String(result.fechaHora.getMinutes()).padStart(2, '0')}`;
    }
  } else {
    result.fechaHora = undefined;
  }
}

function parseReceipt(text) {
  const metodoTransporte = detectTransportMethod(text);
  const common = parseCommonFields(text);
  const providerParser = metodoTransporte ? PROVIDER_PARSERS[metodoTransporte] : undefined;
  const providerData = providerParser ? providerParser(text) : {};

  const merged = {
    ...common,
    ...providerData,
  };

  // Prefer provider date/time if supplied.
  if (providerData.fechaHora) merged.fechaHora = providerData.fechaHora;
  if (providerData.fecha) merged.fecha = providerData.fecha;
  if (providerData.hora) merged.hora = providerData.hora;

  fillDateParts(merged);

  const origenMeta = extractComunaRegion(merged.origen);
  const destinoMeta = extractComunaRegion(merged.destino);
  merged.comuna = destinoMeta.comuna || origenMeta.comuna || merged.comuna;
  merged.region = destinoMeta.region || origenMeta.region || merged.region;

  merged.metodoTransporte = metodoTransporte;
  return merged;
}

export { parseReceipt };
