import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportElementToPdf(el: HTMLElement, filename = 'HighwayExec.pdf') {
  const canvas = await html2canvas(el, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * ratio;
  const imgHeight = canvas.height * ratio;
  pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 40, imgWidth, imgHeight);
  pdf.save(filename);
}
