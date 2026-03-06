import 'dotenv/config';
import { readFileSync } from 'fs';
import { basename, extname } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

async function main() {
  const filePath = process.argv[2];
  const altText = process.argv[3] || '';

  if (!filePath) {
    console.error(
      'Usage: npx tsx scripts/wp-upload-media.ts <image-path> [alt-text]',
    );
    process.exit(1);
  }

  const siteUrl = process.env.WP_SITE_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    console.error(
      'Missing WP_SITE_URL, WP_USERNAME, or WP_APP_PASSWORD in .env',
    );
    process.exit(1);
  }

  const fileName = basename(filePath);
  const ext = extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileBuffer = readFileSync(filePath);
  const credentials = Buffer.from(`${username}:${appPassword}`).toString(
    'base64',
  );

  const response = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': mimeType,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`WordPress API error: ${response.status} - ${body}`);
    process.exit(1);
  }

  const result = (await response.json()) as { id: number; source_url: string };

  if (altText) {
    await fetch(`${siteUrl}/wp-json/wp/v2/media/${result.id}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alt_text: altText }),
    });
  }

  console.log(
    JSON.stringify({ id: result.id, url: result.source_url, alt: altText }),
  );
}

main();
