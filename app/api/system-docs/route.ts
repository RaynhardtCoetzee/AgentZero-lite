import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ content: 'No filePath provided.' });
  }

  try {
    let docPath = filePath;

    // Remove project root prefix if present
    const cwd = process.cwd();
    if (docPath.toLowerCase().startsWith(cwd.toLowerCase())) {
      docPath = docPath.slice(cwd.length);
    }

    // Normalize separators
    docPath = docPath.split('\\').join('/').replace(/^\/+/, '');

    // Replace .ts/.tsx/.js/.jsx with .md
    docPath = docPath.replace(/\.(ts|tsx|js|jsx)$/, '.md');

    // Try to read from docs/ folder
    const docsPath = path.resolve(process.cwd(), 'docs', docPath);
    if (fs.existsSync(docsPath)) {
      const content = fs.readFileSync(docsPath, 'utf-8');
      return NextResponse.json({ content, source: 'file' });
    }

    // Fall back to manifest's extracted description
    const parts = docPath.replace(/\.md$/, '').split('/');
    const folder = parts[0];
    const fileName = parts[parts.length - 1];

    const manifestPath = path.resolve(process.cwd(), 'manifests', `${folder}.json`);
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as any;
      const nodes = manifest.nodes || [];

      for (const node of nodes) {
        if (node.type === 'source' && node.description) {
          const nodeName = node.name.replace(/\.(ts|tsx|js|jsx)$/, '');
          if (nodeName === fileName) {
            return NextResponse.json({ content: node.description, source: 'extracted' });
          }
        }
      }
    }

    return NextResponse.json({ content: 'No documentation available for this file.', source: 'none' });
  } catch (error) {
    console.error('System docs API error:', error);
    return NextResponse.json({ content: 'Failed to load documentation.', source: 'error' });
  }
}
