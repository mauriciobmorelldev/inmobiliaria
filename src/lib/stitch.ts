import { readFileSync } from "fs";
import path from "path";

const STITCH_DIR = path.join(process.cwd(), "stitch");

export const getStitchBody = (fileName: string) => {
  const fullPath = path.join(STITCH_DIR, fileName);
  const html = readFileSync(fullPath, "utf8");
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return (match ? match[1] : html).trim();
};
