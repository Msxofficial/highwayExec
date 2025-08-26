import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

export async function exportTextToDocx(title: string, content: string, filename = 'HighwayExec.docx') {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          ...content.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
