
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";


const generatePrescriptionPDF = async (html) => {

      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
      
      return pdfBuffer;

};


export default generatePrescriptionPDF;