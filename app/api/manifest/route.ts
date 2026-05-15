import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder');
  const schema = searchParams.get('schema');

  try {
    // Schema manifest endpoint
    if (schema) {
      const schemaManifestPath = path.resolve(process.cwd(), 'manifests', 'schema.json');
      if (fs.existsSync(schemaManifestPath)) {
        const raw = fs.readFileSync(schemaManifestPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.tables)) parsed.tables = [];
        if (!Array.isArray(parsed.functions)) parsed.functions = [];
        if (!Array.isArray(parsed.enums)) parsed.enums = [];
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ tables: [], functions: [], enums: [] });
    }

    // Folder manifest endpoint
    if (folder) {
      const folderName = folder.split(/[/\\]/).pop() ?? folder;
      const folderManifestPath = path.resolve(process.cwd(), 'manifests', `${folderName}.json`);
      if (fs.existsSync(folderManifestPath)) {
        const raw = fs.readFileSync(folderManifestPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.nodes)) parsed.nodes = [];
        if (!Array.isArray(parsed.internalLinks)) parsed.internalLinks = [];
        if (!Array.isArray(parsed.externalIngress)) parsed.externalIngress = [];
        if (!Array.isArray(parsed.externalEgress)) parsed.externalEgress = [];
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ folder, nodes: [], internalLinks: [], externalIngress: [], externalEgress: [] });
    }

    // Root manifest: folder containers + inter-folder arcs only
    const rootPath = path.resolve(process.cwd(), 'manifest.json');
    if (fs.existsSync(rootPath)) {
      const raw = fs.readFileSync(rootPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.folders)) parsed.folders = [];
      if (!Array.isArray(parsed.folderArcs)) parsed.folderArcs = [];
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ folders: [], folderArcs: [] });
  } catch (error) {
    console.error('Manifest API error:', error);
    return NextResponse.json({ folders: [], folderArcs: [] });
  }
}
