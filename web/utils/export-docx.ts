
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"
import { saveAs } from "file-saver"

export async function exportToDocx(article: any) {
    const children = []

    // 1. Title
    children.push(
        new Paragraph({
            text: article.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    )

    // 2. Meta Data
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Client: ", bold: true }),
                new TextRun(article.clients?.name || "Unknown"),
                new TextRun({ text: "\tLanguage: ", bold: true }),
                new TextRun(article.language),
                new TextRun({ text: "\tTone: ", bold: true }),
                new TextRun(article.brand_tone),
            ],
            spacing: { after: 200 },
        })
    )

    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Keyword: ", bold: true }),
                new TextRun(article.keyword),
            ],
            spacing: { after: 400 },
        })
    )

    // 3. Simple Markdown Parser
    // Split by newlines
    const lines = article.content_html.split("\n")

    for (let line of lines) {
        line = line.trim()
        if (!line) continue

        if (line.startsWith("# ")) {
            children.push(
                new Paragraph({
                    text: line.replace("# ", ""),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 100 },
                })
            )
        } else if (line.startsWith("## ")) {
            children.push(
                new Paragraph({
                    text: line.replace("## ", ""),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 200, after: 100 },
                })
            )
        } else if (line.startsWith("### ")) {
            children.push(
                new Paragraph({
                    text: line.replace("### ", ""),
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                })
            )
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
            children.push(
                new Paragraph({
                    text: line.replace(/^[-*] /, ""),
                    bullet: { level: 0 },
                })
            )
        } else {
            // Regular paragraph
            // Try to handle **bold** simply?
            // For MVP, just dumping text is safer than complex regex parsing which might break
            children.push(
                new Paragraph({
                    children: [new TextRun(line)],
                    spacing: { after: 100 },
                })
            )
        }
    }

    // Create Document
    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    })

    // Generate and Save
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${article.keyword.replace(/\s+/g, '_')}_article.docx`)
}
