import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "~/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fileField = formData.get("file");
  if (!(fileField instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 },
    );
  }

  const filename = fileField.name;
  const mimeType = fileField.type || "application/octet-stream";
  const arrayBuffer = await fileField.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await dbPool.query(`CREATE TABLE IF NOT EXISTS files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id text NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );`);

  const projectId = process.env.NEXT_PUBLIC_VIBES_ENGINEERING_PROJECT_ID!;
  const insert = await dbPool.query(
    `INSERT INTO files (project_id, filename, mime_type, data)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [projectId, filename, mimeType, buffer],
  );

  const id = insert.rows[0].id as string;

  return NextResponse.json({ success: true, id });
}
