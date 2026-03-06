import 'dotenv/config';

interface SeoFields {
  seoTitle?: string;
  metaDescription?: string;
}

function buildSetFieldXml(
  username: string,
  appPassword: string,
  postId: number,
  fields: SeoFields,
): string {
  const customFields: Array<{ key: string; value: string }> = [];
  if (fields.seoTitle) {
    customFields.push({ key: 'titleName', value: fields.seoTitle });
  }
  if (fields.metaDescription) {
    customFields.push({ key: 'description', value: fields.metaDescription });
  }

  const fieldsXml = customFields
    .map(
      (f) => `
        <value><struct>
          <member><name>key</name><value><string>${escapeXml(f.key)}</string></value></member>
          <member><name>value</name><value><string>${escapeXml(f.value)}</string></value></member>
        </struct></value>`,
    )
    .join('');

  return `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.editPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${escapeXml(username)}</string></value></param>
    <param><value><string>${escapeXml(appPassword)}</string></value></param>
    <param><value><int>${postId}</int></value></param>
    <param><value><struct>
      <member>
        <name>custom_fields</name>
        <value><array><data>${fieldsXml}
        </data></array></value>
      </member>
    </struct></value></param>
  </params>
</methodCall>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function setSeoFields(
  postId: number,
  fields: SeoFields,
): Promise<void> {
  const siteUrl = process.env.WP_SITE_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    throw new Error('Missing WP_SITE_URL, WP_USERNAME, or WP_APP_PASSWORD');
  }

  if (!fields.seoTitle && !fields.metaDescription) {
    return;
  }

  const xmlBody = buildSetFieldXml(username, appPassword, postId, fields);

  const res = await fetch(`${siteUrl}/xmlrpc.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xmlBody,
  });

  const text = await res.text();
  if (text.includes('<boolean>1</boolean>')) {
    const set = [
      fields.seoTitle ? 'SEO title' : '',
      fields.metaDescription ? 'meta description' : '',
    ]
      .filter(Boolean)
      .join(' & ');
    console.log(`SEO fields set via XML-RPC: ${set}`);
  } else if (text.includes('faultString')) {
    const fault = text.match(/<string>([^<]+)<\/string>/)?.[1] ?? 'unknown';
    console.error(`XML-RPC error setting SEO fields: ${fault}`);
  }
}

// CLI usage: npx tsx scripts/wp-set-seo-fields.ts <postId> [seoTitle] [metaDescription]
if (process.argv[1]?.includes('wp-set-seo-fields')) {
  const postId = parseInt(process.argv[2], 10);
  const seoTitle = process.argv[3] || undefined;
  const metaDescription = process.argv[4] || undefined;

  if (!postId) {
    console.error(
      'Usage: npx tsx scripts/wp-set-seo-fields.ts <postId> [seoTitle] [metaDescription]',
    );
    process.exit(1);
  }

  setSeoFields(postId, { seoTitle, metaDescription });
}
