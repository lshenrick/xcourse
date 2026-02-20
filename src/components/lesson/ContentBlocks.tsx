import { Download } from "lucide-react";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface ContentBlocksProps {
  blocks: ContentBlock[];
  excludeTypes?: string[];
}

export function ContentBlocks({ blocks, excludeTypes = ["embed", "audio"] }: ContentBlocksProps) {
  const filtered = blocks.filter((b) => !excludeTypes.includes(b.block_type));

  if (filtered.length === 0) return null;

  return (
    <>
      {filtered.map((block) => (
        <div key={block.id} className="mt-4">
          {block.block_type === "text" && block.content && (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          )}
          {block.block_type === "file" && block.file_url && (
            <a
              href={block.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Download className="h-4 w-4" />
              {block.file_name || "Download"}
            </a>
          )}
        </div>
      ))}
    </>
  );
}
