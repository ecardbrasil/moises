export function parseCSV(raw) {
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const rows = lines.map(parseCSVLine);
  const header = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key.trim()] = (row[i] ?? "").trim();
    });
    return obj;
  });
}

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c.replace("\r", "");
    }
  }
  out.push(cur.replace("\r", ""));
  return out;
}
