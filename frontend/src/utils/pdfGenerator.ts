import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { NotoSansJP_Base64 } from "./fonts";
import type { RiskItem } from "../types";

export const generatePDF = (analysis: RiskItem[], fileName: string) => {
  const doc = new jsPDF();

  // 日本語フォント対応
  try {
    doc.addFileToVFS("NotoSansJP.ttf", NotoSansJP_Base64);
    doc.addFont("NotoSansJP.ttf", "NotoSansJP", "normal");
    doc.setFont("NotoSansJP", "normal"); // 第2引数に "normal" を指定
  } catch (e) {
    console.error("フォントの読み込みに失敗しました:", e);
    return;
  }

  // ヘッダー
  doc.setFontSize(22);
  doc.setTextColor(33, 150, 243);
  doc.text("契約書リスク分析レポート", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`対象ファイル: ${fileName}`, 14, 32);
  doc.text(`生成元: ryoao AI システム`, 14, 38);
  doc.text(`発行日: ${new Date().toLocaleString("ja-JP")}`, 14, 44);

  // テーブル作成
  autoTable(doc, {
    startY: 50,
    head: [["重要度", "項目", "リスクの内容", "推奨されるアクション"]],
    body: analysis.map((item) => [
      item.rank,
      item.title,
      item.description,
      item.action,
    ]),
    styles: {
      font: "NotoSansJP",
      fontSize: 9,
      fontStyle: "normal",
      cellPadding: 5,
    },
    headStyles: {
      fontStyle: "normal",
      fillColor: [33, 150, 243],
      textColor: 255,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const val = data.cell.raw;
        if (val === "高") data.cell.styles.textColor = [255, 0, 0];
      }
    },
  });
  doc.save(`診断レポート_${fileName}.pdf`);
};
