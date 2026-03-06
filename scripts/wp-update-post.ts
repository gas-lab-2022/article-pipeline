import 'dotenv/config';
import { readFileSync } from 'fs';
import { setSeoFields } from './wp-set-seo-fields.js';

interface ArticleData {
  title: string;
  seoTitle?: string;
  slug?: string;
  htmlContent: string;
  metaDescription: string;
  tags?: string[];
}

async function main() {
  const postIdArg = process.argv[2];
  const filePath = process.argv[3];

  if (!postIdArg || !filePath) {
    console.error('Usage: npx tsx scripts/wp-update-post.ts <postId> <article.json>');
    process.exit(1);
  }

  const siteUrl = process.env.WP_SITE_URL;
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl || !username || !appPassword) {
    console.error('Missing WP_SITE_URL, WP_USERNAME, or WP_APP_PASSWORD in .env');
    process.exit(1);
  }

  const article: ArticleData = JSON.parse(readFileSync(filePath, 'utf-8'));
  const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const url = `${siteUrl}/wp-json/wp/v2/posts/${postIdArg}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: article.title,
      ...(article.slug ? { slug: article.slug } : {}),
      content: article.htmlContent,
      excerpt: article.metaDescription,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`WordPress API error: ${response.status} - ${body}`);
    process.exit(1);
  }

  const result = await response.json();
  const postId = (result as any).id as number;
  console.log(`Post updated! Post ID: ${postId}`);
  console.log(`Edit URL: ${siteUrl}/wp-admin/post.php?post=${postId}&action=edit`);

  await setSeoFields(postId, {
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
  });
}

main();
