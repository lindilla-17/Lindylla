import { google, drive_v3 } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

// Sube facturas al Google Drive de Mercedes, en la carpeta que le corresponda
// dentro de: Lindilla > cuentas > <año> > ...
//
// Google NO deja que una "cuenta de servicio" cree archivos en un Drive
// personal (solo en cuentas de empresa de pago), así que se usa autorización
// OAuth: Mercedes autorizó una vez a la app y desde entonces la web actúa
// en su nombre con un "refresh token" que no caduca.
//
// En local: credenciales en oauth-credentials.txt y el token en
// google-refresh-token.json (ninguno de los dos se sube a git).
// En Vercel: variables de entorno GOOGLE_OAUTH_CLIENT_ID,
// GOOGLE_OAUTH_CLIENT_SECRET y GOOGLE_OAUTH_REFRESH_TOKEN.

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_LINDILLA_FOLDER_ID || "1iuiQFoW_6RQUh7_b_Hd9laS1k4VQk9Ev";

function cargarCredencialesOAuth(): { clientId: string; clientSecret: string; refreshToken: string } | null {
  if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    };
  }
  try {
    const credsPath = path.join(process.cwd(), "oauth-credentials.txt");
    const tokenPath = path.join(process.cwd(), "google-refresh-token.json");
    if (!fs.existsSync(credsPath) || !fs.existsSync(tokenPath)) return null;
    const creds = fs.readFileSync(credsPath, "utf8");
    const clientId = creds.match(/CLIENT_ID=(.+)/)?.[1]?.trim();
    const clientSecret = creds.match(/CLIENT_SECRET=(.+)/)?.[1]?.trim();
    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    if (!clientId || !clientSecret || !tokens.refresh_token) return null;
    return { clientId, clientSecret, refreshToken: tokens.refresh_token };
  } catch {
    return null;
  }
}

let driveClient: drive_v3.Drive | null | undefined;

function getDrive(): drive_v3.Drive | null {
  if (driveClient !== undefined) return driveClient;
  const creds = cargarCredencialesOAuth();
  if (!creds) {
    driveClient = null;
    return null;
  }
  const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
  oauth2Client.setCredentials({ refresh_token: creds.refreshToken });
  driveClient = google.drive({ version: "v3", auth: oauth2Client });
  return driveClient;
}

// Busca una subcarpeta por nombre dentro de otra; si no existe, la crea.
async function buscarOCrearCarpeta(drive: drive_v3.Drive, padreId: string, nombre: string): Promise<string> {
  const nombreEscapado = nombre.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `'${padreId}' in parents and name = '${nombreEscapado}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  if (res.data.files && res.data.files.length > 0) return res.data.files[0].id!;
  const creada = await drive.files.create({
    requestBody: { name: nombre, mimeType: "application/vnd.google-apps.folder", parents: [padreId] },
    fields: "id",
  });
  return creada.data.id!;
}

function trimestreDe(fecha: Date): string {
  const q = Math.floor(fecha.getMonth() / 3) + 1;
  return `${q}º trimestre`;
}

export type SubidaResultado = { ok: true; carpeta: string } | { ok: false; error: string };

// Sube un archivo a una ruta de carpetas dentro de "Lindilla" en Drive, creando
// las que falten. `carpetas` es la ruta relativa, ej. ["cuentas", "2026",
// "centroveo", "3º trimestre", "ingresos"].
async function subirADrive(opts: { pdf: Buffer; nombreArchivo: string; carpetas: string[]; mimeType?: string }): Promise<SubidaResultado> {
  const drive = getDrive();
  if (!drive) return { ok: false, error: "Credenciales de Google Drive no configuradas." };

  try {
    let carpetaId = ROOT_FOLDER_ID;
    for (const nombre of opts.carpetas) {
      carpetaId = await buscarOCrearCarpeta(drive, carpetaId, nombre);
    }

    // Si ya existe un archivo con ese nombre en la carpeta, lo sustituye (evita duplicados)
    const existentes = await drive.files.list({
      q: `'${carpetaId}' in parents and name = '${opts.nombreArchivo.replace(/'/g, "\\'")}' and trashed = false`,
      fields: "files(id)",
    });

    const media = { mimeType: opts.mimeType ?? "application/pdf", body: Readable.from(opts.pdf) };

    if (existentes.data.files && existentes.data.files.length > 0) {
      await drive.files.update({ fileId: existentes.data.files[0].id!, media });
    } else {
      await drive.files.create({
        requestBody: { name: opts.nombreArchivo, parents: [carpetaId] },
        media,
        fields: "id",
      });
    }

    return { ok: true, carpeta: `Lindilla/${opts.carpetas.join("/")}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido subiendo a Drive." };
  }
}

// Sube el PDF de una factura de Centroveo a cuentas/<año>/centroveo/<trimestre>/ingresos
export async function subirFacturaCentroveoADrive(opts: { pdf: Buffer; nombreArchivo: string; fecha: Date }): Promise<SubidaResultado> {
  const anio = String(opts.fecha.getFullYear());
  const trimestre = trimestreDe(opts.fecha);
  return subirADrive({
    pdf: opts.pdf,
    nombreArchivo: opts.nombreArchivo,
    carpetas: ["cuentas", anio, "centroveo", trimestre, "ingresos"],
  });
}

// Sube el PDF de una factura de Lindilla (gorros) a cuentas/<año>/<trimestre>/Ingresos sociedad
export async function subirFacturaLindillaADrive(opts: { pdf: Buffer; nombreArchivo: string; fecha: Date }): Promise<SubidaResultado> {
  const anio = String(opts.fecha.getFullYear());
  const trimestre = trimestreDe(opts.fecha);
  return subirADrive({
    pdf: opts.pdf,
    nombreArchivo: opts.nombreArchivo,
    carpetas: ["cuentas", anio, trimestre, "Ingresos sociedad"],
  });
}

// Sube la foto/archivo de un gasto de Lindilla (gorros) a
// cuentas/<año>/<trimestre>/Gastos sociedad ó Gastos mios, según corresponda.
export async function subirGastoLindillaADrive(opts: {
  archivo: Buffer;
  nombreArchivo: string;
  fecha: Date;
  mimeType: string;
  tipo: "sociedad" | "mios";
}): Promise<SubidaResultado> {
  const anio = String(opts.fecha.getFullYear());
  const trimestre = trimestreDe(opts.fecha);
  const carpetaGasto = opts.tipo === "mios" ? "Gastos mios" : "Gastos sociedad";
  return subirADrive({
    pdf: opts.archivo,
    nombreArchivo: opts.nombreArchivo,
    carpetas: ["cuentas", anio, trimestre, carpetaGasto],
    mimeType: opts.mimeType,
  });
}
