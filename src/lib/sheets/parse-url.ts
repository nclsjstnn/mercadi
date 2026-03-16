/**
 * Extract spreadsheet ID and gid from Google Sheets URLs
 * and build the public CSV export URL.
 */

const SHEETS_URL_REGEX =
  /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;

const GID_REGEX = /[?&#]gid=(\d+)/;

export function parseGoogleSheetsUrl(url: string): {
  spreadsheetId: string;
  gid: string;
  csvUrl: string;
} {
  const idMatch = url.match(SHEETS_URL_REGEX);
  if (!idMatch) {
    throw new Error(
      "URL inválida. Asegúrate de pegar un enlace de Google Sheets."
    );
  }

  const spreadsheetId = idMatch[1];
  const gidMatch = url.match(GID_REGEX);
  const gid = gidMatch ? gidMatch[1] : "0";

  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

  return { spreadsheetId, gid, csvUrl };
}
