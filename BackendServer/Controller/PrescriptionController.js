import Prescription from "../Model/Prescription.js";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

import fs from "fs";
import path from "path";

import jwt from "jsonwebtoken";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const generateRandomFileName = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < 14; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
};

const PrescriptionController = {

createPrescription: async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      medicines,
      doctorName,
      patientName,
      instructions,
      date,
      slot,
    } = req.body;

    const prescriptionId = generate15DigitId();

    let signatureBase64 = null;

    if (req.file) {
      const image = fs.readFileSync(req.file.path);

      signatureBase64 = `data:image/png;base64,${image.toString(
        "base64"
      )}`;
    }

    let parsedMedicines = [];

    try {
      if (typeof medicines === "string") {
        parsedMedicines = JSON.parse(medicines);
      } else if (Array.isArray(medicines)) {
        parsedMedicines = medicines;
      }
    } catch (err) {
      parsedMedicines = [];
    }

    const token = jwt.sign(
      { prescriptionId },
      "VITECARE APPOINTMENT"
    );

    const qrData = JSON.stringify({
      token,
    });

    const qrCode = await QRCode.toDataURL(qrData);

    const htmlTemplate = `
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        body{
          font-family: Arial, sans-serif;
          padding:40px;
        }

        h1{
          color:#2563eb;
        }

        .card{
          border:1px solid #ddd;
          padding:20px;
          border-radius:10px;
          margin-bottom:20px;
        }

        table{
          width:100%;
          border-collapse: collapse;
        }

        th,td{
          border:1px solid #ddd;
          padding:10px;
          text-align:center;
        }

        th{
          background:#2563eb;
          color:white;
        }

        .signature{
          margin-top:30px;
        }

        .signature img{
          width:180px;
          height:auto;
        }

      </style>
    </head>

    <body>

      <h1>VitalCare Prescription</h1>

      <div class="card">
        <h3>Patient Information</h3>

        <p>
          <strong>Patient:</strong>
          ${patientName}
        </p>

        <p>
          <strong>Doctor:</strong>
          Dr. ${doctorName}
        </p>

        <p>
          <strong>Date:</strong>
          ${date}
        </p>

        <p>
          <strong>Slot:</strong>
          ${slot}
        </p>

        <p>
          <strong>Prescription ID:</strong>
          ${prescriptionId}
        </p>
      </div>

      <div class="card">
        <h3>Instructions</h3>

        <p>
          ${
            instructions ||
            "No instructions provided"
          }
        </p>
      </div>

      <div class="card">
        <h3>Medicines</h3>

        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Strength</th>
              <th>Days</th>
              <th>Morning</th>
              <th>Afternoon</th>
              <th>Night</th>
            </tr>
          </thead>

          <tbody>
            ${parsedMedicines
              .map(
                (m) => `
              <tr>
                <td>${m.name}</td>
                <td>${m.strength}</td>
                <td>${m.days}</td>
                <td>${
                  m.timing?.morning
                    ? "✓"
                    : "-"
                }</td>
                <td>${
                  m.timing?.afternoon
                    ? "✓"
                    : "-"
                }</td>
                <td>${
                  m.timing?.night
                    ? "✓"
                    : "-"
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="signature">

        <h3>Doctor Signature</h3>

        ${
          signatureBase64
            ? `<img src="${signatureBase64}" />`
            : "<p>No Signature</p>"
        }

      </div>

      <div style="margin-top:40px">
        <h3>Verify Prescription</h3>
        <img src="${qrCode}" width="120" />
      </div>

    </body>
    </html>
    `;

    ensureDir("uploads/prescriptions");

    const randomFile =
      generateRandomFileName();

    const pdfPath = path.join(
      "uploads",
      "prescriptions",
      `${randomFile}.pdf`
    );

    // LAUNCH CHROME FOR RENDER
    const browser =
      await puppeteer.launch({
        args: chromium.args,
        executablePath:
          await chromium.executablePath(),
        headless: chromium.headless,
      });

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1600,
    });

    await page.setContent(
      htmlTemplate,
      {
        waitUntil: "networkidle0",
      }
    );

    // GENERATE PDF
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    // SAVE DB
    const newPrescription =
      await Prescription.create({
        prescriptionId,
        patientId,
        doctorId,
        medicines: parsedMedicines,
        instructions,
        signature:
          signatureBase64,
        date,
        slot,
        qrCode,
        verificationStatus:
          "pending",
        pdfUrl: pdfPath,
        status: "issued",
      });

    return res.status(201).json({
      success: true,
      message:
        "Prescription created successfully",
      data: newPrescription,
    });
  } catch (error) {
    console.log(
      "Prescription Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } }, 

verifyPrescription: async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const decoded = jwt.verify(token, "VITECARE APPOINTMENT");

    const prescriptionId = decoded.prescriptionId;

    console.log(prescriptionId);
    

    if (!prescriptionId) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const prescription = await Prescription.findOne({
      prescriptionId: prescriptionId,
    })
      .populate("doctorId", "name")
      .populate("patientId", "name");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription verified successfully",
      data: prescription,
    });

  } catch (error) {
    console.log("verifyPrescription error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
},


getByDoctorId: async ( req,res) => {
  try {
    const doctorId =
      req.user.id;

    const prescriptions =
      await Prescription.find({
        doctorId,
      })
        .populate(
          "patientId",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Prescriptions retrieved successfully",
        data:
          prescriptions,
      });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
},




};

export default PrescriptionController;