import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const generatePrescriptionPdf = async (htmlTemplate) => {

    const browser = await puppeteer.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        });

    try {

        const page = await browser.newPage();
      await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
        return pdfBuffer;

    } finally {

      await browser.close();

    }
};
export default generatePrescriptionPdf;