import * as pdfMake from "pdfmake/build/pdfmake";

// Utility: Detect script and return appropriate font
const getFontForText = (text) => {
  if (!text) return "NotoSans";
  const hasGujarati = /[\u0A80-\u0AFF]/.test(text);
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasGujarati) return "AnekGujarati";
  if (hasDevanagari) return "Karma";
  return "NotoSans";
};

export const generateShippingLabelsPDF = async (data, title) => {
  console.log(data, "data label");
  try {
    // Load fonts and logo
    const [notoResp, anekResp, karmaResp, logoResp] = await Promise.all([
      fetch("/book-panel/NotoSans-Regular.ttf"),
      fetch("/book-panel/AnekGujarati-Regular.ttf"),
      fetch("/book-panel/Karma-Regular.ttf"),
      fetch("/book-panel/logo.png"),
    ]);

    const [notoBuf, anekBuf, karmaBuf, logoBuf] = await Promise.all([
      notoResp.arrayBuffer(),
      anekResp.arrayBuffer(),
      karmaResp.arrayBuffer(),
      logoResp.arrayBuffer(),
    ]);

    const notoBase64 = arrayBufferToBase64(notoBuf);
    const anekBase64 = arrayBufferToBase64(anekBuf);
    const karmaBase64 = arrayBufferToBase64(karmaBuf);
    const logoBase64 = arrayBufferToBase64(logoBuf);
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;

    // Define fonts
    const fonts = {
      NotoSans: {
        normal: "NotoSans-Regular.ttf",
        bold: "NotoSans-Regular.ttf",
        italics: "NotoSans-Regular.ttf",
        bolditalics: "NotoSans-Regular.ttf",
      },
      AnekGujarati: {
        normal: "AnekGujarati-Regular.ttf",
        bold: "AnekGujarati-Regular.ttf",
        italics: "AnekGujarati-Regular.ttf",
        bolditalics: "AnekGujarati-Regular.ttf",
      },
      Karma: {
        normal: "Karma-Regular.ttf",
        bold: "Karma-Regular.ttf",
        italics: "Karma-Regular.ttf",
        bolditalics: "Karma-Regular.ttf",
      },
    };

    const vfs = {
      "NotoSans-Regular.ttf": notoBase64,
      "AnekGujarati-Regular.ttf": anekBase64,
      "Karma-Regular.ttf": karmaBase64,
    };

    // ── Layout constants ──────────────────────────────────────────────────────
    // A4 usable height ≈ 287mm with 3mm top/bottom margins.
    // Each label row is ~32mm → fits 9 labels per page comfortably.
    const content = [];
    const labelsPerPage = 10; // maximised for A4

    for (let i = 0; i < data.length; i += labelsPerPage) {
      const tableBody = [];

      for (let row = 0; row < labelsPerPage; row++) {
        const index = i + row;
        if (index >= data.length) break;

        const item = data[index];
        const copies = item["નકલ"] || 1;
        const registrationId =
          item.registrationId || `TM_${new Date(item.timestamp).getTime()}`;

        // Format address
        const addressRaw =
          item["એડ્રેસ/एड्रेस"] || item["એડ્રેસ"] || "";
        const address = addressRaw
          .replace(/\n/g, ", ")
          .replace(/\s+/g, " ")
          .trim();

        // Book name for display
        const formattedTitle = title
          ? title.charAt(0).toUpperCase() + title.slice(1)
          : "";
        const bookName =
          item.bookName
            ? item.bookName.charAt(0).toUpperCase() + item.bookName.slice(1)
            : formattedTitle;

        // ── LEFT CELL: Receiver info ─────────────────────────────────────────
        const receiverCell = {
          stack: [
            // Recipient name
            {
              text: `${item["नाम"] || ""} ${item["उपनाम"] || ""}`.trim(),
              bold: true,
              fontSize: 9,
              font: getFontForText(`${item["नाम"] || ""} ${item["उपनाम"] || ""}`),
            },
            // Address
            {
              text: address,
              fontSize: 9,
              font: getFontForText(address),
              margin: [0, 1, 0, 1],
            },
            // City / PIN / Mobile
            {
              text: `${item["शहर"] || ""} - Pin: ${item["पिनकोड"] || ""}, Mo: ${item["मोबाइल नंबर"] || ""}`,
              fontSize: 9,
              font: getFontForText(`${item["शहर"] || ""} - Pin: ${item["पिनकोड"] || ""}`),
              margin: [0, 0, 0, 3],
            },
            // Highlighted order/book/qty line — pinned to bottom
            {
              table: {
                widths: ["*"],
                body: [
                  [
                    {
                      text: [
                        { text: "Order Id: ", bold: true, fontSize: 10 },
                        { text: `${registrationId}`, bold: true, fontSize: 10 },
                        { text: "   Book: ", bold: true, fontSize: 10 },
                        { text: `${bookName}`, bold: true, fontSize: 10, font: getFontForText(bookName) },
                        { text: "   Qty: ", bold: true, fontSize: 10 },
                        { text: `${copies}`, bold: true, fontSize: 10 },
                      ],
                      // fillColor: "#FFE066",
                      margin: [3, 2, 3, 2],
                    },
                  ],
                ],
              },
              layout: "noBorders",
              margin: [0, 0, 0, 0],
            },
          ],
          margin: [3, 3, 3, 3],
        };

        // ── RIGHT CELL: Sender info ──────────────────────────────────────────
        const senderCell = {
          stack: [
            { text: "From:", fontSize: 9, bold: true, font: "NotoSans" },
            {
              text: "Adhyatm Parivar, Adhyatm Bhavan, 3rd Floor",
              fontSize: 8,
              bold: true,
              font: "NotoSans",
            },
            {
              text: "Anand Shravak Aradhana Bhavan, Shanti Vardhak Jain Sangh, Near Sanjeev Kumar Auditorium, Pal, Surat - 395009",
              fontSize: 8,
              font: "NotoSans",
            },
            {
              text: "Contact: 7676769600",
              fontSize: 8,
              font: "NotoSans",
              margin: [0, 1, 0, 0],
            },
          ],
          margin: [3, 3, 3, 3],
        };

        tableBody.push([
          {
            // Inner two-column table for receiver | sender
            table: {
              widths: ["60%", "40%"],
              body: [[receiverCell, senderCell]],
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#000000",
              vLineColor: () => "#000000",
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 0,
              paddingBottom: () => 0,
            },
            margin: [0, 0, 0, 0],
          },
        ]);
      }

      content.push({
        table: {
          widths: ["*"],
          body: tableBody,
        },
        layout: {
          hLineWidth: (i, node) =>
            i === 0 || i === node.table.body.length ? 0.5 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      });

      if (i + labelsPerPage < data.length) {
        content.push({ text: "", pageBreak: "after" });
      }
    }

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [5, 5, 5, 5], // minimal margins to fit more labels
      content,
      defaultStyle: {
        font: "NotoSans",
      },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts, vfs);
    pdfDoc.download(`${title}_shipping_labels.pdf`);
  } catch (error) {
    console.error("Error generating shipping labels:", error);
    throw error;
  }
};

// Utility: ArrayBuffer → Base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  return btoa(
    bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
};