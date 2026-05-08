import { BlockNode, TextNode } from "@/types/blog-post"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

function renderText(node: TextNode, idx: number): React.ReactNode {
  if (node.type === "link") {
    return (
      <a key={idx} href={node.url} target="_blank" rel="noopener noreferrer" className="text-amber-600 underline hover:text-amber-700">
        {node.children?.map((c, i) => renderText(c, i))}
      </a>
    )
  }
  let content: React.ReactNode = node.text ?? ""
  if (node.bold)          content = <strong key={idx}>{content}</strong>
  if (node.italic)        content = <em key={idx}>{content}</em>
  if (node.underline)     content = <u key={idx}>{content}</u>
  if (node.strikethrough) content = <s key={idx}>{content}</s>
  return <span key={idx}>{content}</span>
}

function renderBlock(block: BlockNode, idx: number): React.ReactNode {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={idx} className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
          {block.children.map(renderText)}
        </p>
      )
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
      const sizes: Record<number, string> = {
        1: "text-3xl font-bold mt-8 mb-4",
        2: "text-2xl font-bold mt-7 mb-3",
        3: "text-xl font-semibold mt-6 mb-2",
        4: "text-lg font-semibold mt-4 mb-2",
        5: "text-base font-semibold mt-3 mb-1",
        6: "text-sm font-semibold mt-3 mb-1",
      }
      return (
        <Tag key={idx} className={`${sizes[block.level]} text-gray-900 dark:text-gray-100`}>
          {block.children.map(renderText)}
        </Tag>
      )
    }
    case "list": {
      const Tag = block.format === "ordered" ? "ol" : "ul"
      const listClass = block.format === "ordered"
        ? "list-decimal pl-6 mb-4 space-y-1"
        : "list-disc pl-6 mb-4 space-y-1"
      return (
        <Tag key={idx} className={listClass}>
          {block.children.map((item, i) => (
            <li key={i} className="text-gray-700 dark:text-gray-300">
              {item.children.map(renderText)}
            </li>
          ))}
        </Tag>
      )
    }
    case "quote":
      return (
        <blockquote key={idx} className="border-l-4 border-amber-400 pl-4 italic my-5 text-gray-600 dark:text-gray-400">
          {block.children.map(renderText)}
        </blockquote>
      )
    case "code":
      return (
        <pre key={idx} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono">
          <code>{block.children.map(c => c.text ?? "").join("")}</code>
        </pre>
      )
    case "image": {
      const url = block.image.url.startsWith("http")
        ? block.image.url
        : `${BACKEND}${block.image.url}`
      return (
        <figure key={idx} className="my-6">
          <img
            src={url}
            alt={block.image.alternativeText ?? ""}
            className="rounded-xl w-full object-cover"
          />
          {block.image.alternativeText && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">
              {block.image.alternativeText}
            </figcaption>
          )}
        </figure>
      )
    }
    default:
      return null
  }
}

export default function BlocksRenderer({ blocks }: { blocks: BlockNode[] }) {
  return <div className="prose-custom">{blocks.map(renderBlock)}</div>
}
