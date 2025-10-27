// my-app/server/utils/parseReceipt.js (ESM)

function normalize(text) {
  return String(text)
    .replace(/[\u2013\u2014]/g, '-') // guiones
    .replace(/[\u00A0\t]+/g, ' ') // espacios no separables y tabs
    .replace(/\s{2,}/g, ' ') // espacios repetidos
    .replace(/^[\s\-–—·•]+/gm, '') // bullet/guiones al inicio de línea
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

function findDateTime(text) {
  const t = normalize(text).toLowerCase();
  // 24 sept 10:34am (opcional año)
  const reNamed = /(\b\d{1,2})\s+(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|set|septiembre|setiembre|oct|octubre|nov|noviembre|dic|diciembre)\s+(\d{1,2}:\d{2})\s*(am|pm)?(?:\s*(\d{4}))?/i;
  const m1 = t.match(reNamed);
  if (m1) {
    const day = Number(m1[1]);
    const mon = MONTHS_ES[m1[2]];
    const time = m1[3];
    const ampm = m1[4]?.toLowerCase();
    const year = m1[5] ? Number(m1[5]) : new Date().getFullYear();
    let [hh, mm] = time.split(':').map(Number);
    if (ampm === 'pm' && hh < 12) hh += 12;
    if (ampm === 'am' && hh === 12) hh = 0;
    const d = new Date(year, mon - 1, day, hh, mm, 0);
    if (!isNaN(d.getTime())) return d;
  }
  // dd/mm/yyyy hh:mm
  const m2 = t.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})\s+(\d{2}):(\d{2})/);
  if (m2) {
    const d = new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]), Number(m2[4]), Number(m2[5]), 0);
    if (!isNaN(d.getTime())) return d;
  }
  // solo fecha dd/mm/yyyy
  const m3 = t.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m3) {
    const d = new Date(Number(m3[3]), Number(m3[2]) - 1, Number(m3[1]));
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}

function findPrecio(text) {
  const lns = normalize(text).split('\n');
  // 1) Priorizar montos con CLP o símbolo
  const labeled = [];
  const reCurrency = /(CLP|\$|USD|EUR)\s*([\d\.\s,]+)/i;
  lns.forEach((l, i) => {
    const m = l.match(reCurrency);
    if (m) {
      const v = toIntDigits(m[2]);
      if (v) labeled.push({ v, i });
    }
  });
  if (labeled.length) {
    labeled.sort((a, b) => a.i - b.i); // tomar el primero etiquetado
    return labeled[0].v;
  }
  // 2) Líneas que contengan 'total' o 'precio'
  for (const l of lns) {
    if (/total|precio/i.test(l)) {
      const m = l.match(/[\d\.\s,]+/);
      const v = toIntDigits(m?.[0]);
      if (v) return v;
    }
  }
  // 3) Cualquier número plausible, evitando códigos postales largos sin etiqueta
  const nums = [...normalize(text).matchAll(/[\d\.\s,]+/g)]
    .map((m) => toIntDigits(m[0]))
    .filter((x) => x && x > 0 && x < 1000000); // descartar 7+ dígitos sin etiqueta
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

function isAddressLine(l) {
  const hasLetters = /[a-záéíóúñ]/i.test(l);
  const hasDigits = /\d+/.test(l);
  const hasComma = /,/.test(l);
  const hasStreetWord = /(calle|avenida|av\.|camino|pasaje|pje\.?|edificio|edificios|plaza|condes|peñalol[ée]n|santiago)/i.test(l);
  const tooShort = l.length < 8;
  const looksNoise = /^[\W_]+$/.test(l);
  return !tooShort && !looksNoise && hasLetters && (hasDigits || hasStreetWord || hasComma);
}

function findDirecciones(text) {
  const lns = lines(text);
  const timeRe = /(\d{1,2}:\d{2})\s*(am|pm)?/i;
  const timeIdx = [];
  lns.forEach((l, i) => {
    const m = l.match(timeRe);
    if (m) timeIdx.push(i);
  });

  const candidates = [];
  function extendAfter(timeIndex, baseIndex) {
    const parts = [lns[baseIndex]];
    for (let k = timeIndex + 1; k <= timeIndex + 2 && k < lns.length; k++) {
      const lk = lns[k];
      if (timeRe.test(lk)) break;
      if (/,/.test(lk) && /[a-záéíóúñ]/i.test(lk)) {
        parts.push(lk.replace(/^[,\s]+/, '').replace(/[,\s]+$/, ''));
        break; // solo una línea extra
      }
    }
    return parts.join(', ').replace(/,\s*,/g, ', ');
  }

  for (const idx of timeIdx) {
    // buscar hacia arriba la primera línea que parezca dirección
    for (let j = idx - 1; j >= 0 && idx - j <= 3; j--) {
      const prev = lns[j];
      if (isAddressLine(prev)) {
        candidates.push(extendAfter(idx, j));
        break;
      }
    }
  }
  // Si encontramos al menos una, tomar primera como origen y última como destino
  if (candidates.length) {
    const origen = candidates[0];
    const destino = candidates[candidates.length - 1];
    return { origen, destino };
  }
  // Fallback: primera y última línea que luzca dirección
  const addr = lns.filter(isAddressLine);
  if (!addr.length) return { origen: undefined, destino: undefined };
  return { origen: addr[0], destino: addr[addr.length - 1] };
}

function parseReceipt(text) {
  const dt = findDateTime(text) || undefined;
  let fechaHora = dt;
  let fecha = undefined;
  let hora = undefined;
  if (dt instanceof Date && !isNaN(dt.getTime())) {
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

export { parseReceipt };
