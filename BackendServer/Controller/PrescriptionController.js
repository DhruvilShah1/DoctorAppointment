import Prescription from "../Model/Prescription.js";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import imagekit from "../Config/imagekit.js";

const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true,
      });

      console.log(
        "Folder created:",
        dirPath
      );
    } else {
      console.log(
        "Folder already exists:",
        dirPath
      );
    }
  } catch (error) {
    console.log(
      "Folder create error:",
      error
    );
  }
};

const generate15DigitId = () => {
  return Math.floor(
    100000000000000 +
      Math.random() * 900000000000000
  ).toString();
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
createPrescription: async (
  req,
  res
) => {
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

    const prescriptionId =
      generate15DigitId();

    // -------------------------
    // Signature Upload
    // -------------------------

    let signatureUrl = null;

    if (req.file) {
      const uploadedSignature =
        await imagekit.upload({
          file:
            req.file.buffer.toString(
              "base64"
            ),

          fileName:
            `${Date.now()}-${
              req.file.originalname
            }`,

          folder:
            "/doctor-signatures",
        });

      signatureUrl =
        uploadedSignature.url;
    }

    // -------------------------
    // Parse Medicines
    // -------------------------

    let parsedMedicines = [];

    try {
      if (
        typeof medicines ===
        "string"
      ) {
        parsedMedicines =
          JSON.parse(
            medicines
          );
      } else if (
        Array.isArray(
          medicines
        )
      ) {
        parsedMedicines =
          medicines;
      }
    } catch (error) {
      parsedMedicines = [];
    }

    // -------------------------
    // QR Token
    // -------------------------

    const token = jwt.sign(
      { prescriptionId },
      "VITECARE APPOINTMENT"
    );

    const qrData =
      JSON.stringify({
        token,
      });

    const qrCode =
      await QRCode.toDataURL(
        qrData
      );

    // -------------------------
    // HTML Template
    // -------------------------

    const htmlTemplate = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8"/>

<style>

body{
font-family:Arial,sans-serif;
padding:25px;
color:#222;
}

h1{
color:#2563EB;
margin-bottom:10px;
}

.info{
margin-bottom:8px;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th,td{
border:1px solid #ddd;
padding:10px;
text-align:center;
}

th{
background:#2563EB;
color:white;
}

.footer{
margin-top:40px;
display:flex;
justify-content:space-between;
align-items:center;
}

.signature img{
max-width:180px;
max-height:70px;
object-fit:contain;
}

.qr-img{
width:120px;
height:120px;
}

.note{
margin-top:25px;
padding:12px;
background:#f5f5f5;
border-left:4px solid #2563EB;
}

</style>

</head>

<body>

<h1>
VitalCare Prescription
</h1>

<div class="info">
<b>
Prescription ID:
</b>
${prescriptionId}
</div>

<div class="info">
<b>
Doctor:
</b>
Dr. ${doctorName}
</div>

<div class="info">
<b>
Patient:
</b>
${patientName}
</div>

<div class="info">
<b>
Date:
</b>
${date}
</div>

<div class="info">
<b>
Slot:
</b>
${slot}
</div>

<div class="note">
<b>
Instructions:
</b>
<br/>
${
  instructions ||
  "No instructions provided."
}
</div>

<h3>
Medicines
</h3>

<table>

<thead>
<tr>
<th>
Medicine
</th>

<th>
Strength
</th>

<th>
Days
</th>

<th>
Morning
</th>

<th>
Afternoon
</th>

<th>
Night
</th>
</tr>
</thead>

<tbody>

${parsedMedicines
  .map(
    (m) => `
<tr>

<td>
${m.name || "-"}
</td>

<td>
${m.strength || "-"}
</td>

<td>
${m.days || "-"}
</td>

<td>
${
  m.timing?.morning
    ? "✓"
    : "–"
}
</td>

<td>
${
  m.timing
    ?.afternoon
    ? "✓"
    : "–"
}
</td>

<td>
${
  m.timing?.night
    ? "✓"
    : "–"
}
</td>

</tr>
`
  )
  .join("")}

</tbody>

</table>

<div class="footer">

<div class="signature">

<h3>
Doctor Signature
</h3>

${
  signatureUrl
    ? `
<img
src="${signatureUrl}"
crossorigin="anonymous"
/>
`
    : `<p>No signature uploaded</p>`
}

<p>
Dr. ${doctorName}
</p>

</div>

<div>

<h3>
Verify QR
</h3>

<img
class="qr-img"
src="${qrCode}"
alt="QR"
/>

</div>

</div>

</body>
</html>
`;

    // -------------------------
    // Launch Browser
    // -------------------------

    const browser =
      await puppeteer.launch({
        args:
          chromium.args,

        executablePath:
          await chromium.executablePath(),

        headless: true,
      });

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1600,
    });

    await page.setJavaScriptEnabled(
      true
    );

    await page.setContent(
      htmlTemplate,
      {
        waitUntil:
          "domcontentloaded",
      }
    );

    // Wait for images
    await page.evaluate(
      async () => {
        const images =
          Array.from(
            document.images
          );

        await Promise.all(
          images.map(
            (img) => {
              if (
                img.complete
              ) {
                return Promise.resolve();
              }

              return new Promise(
                (
                  resolve
                ) => {
                  img.onload =
                    resolve;

                  img.onerror =
                    resolve;
                }
              );
            }
          )
        );
      }
    );

    await page.waitForNetworkIdle();

    // -------------------------
    // Generate PDF
    // -------------------------

    const pdfBuffer =
      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

    await browser.close();

    // -------------------------
    // Upload PDF to ImageKit
    // -------------------------

    const uploadedPDF =
      await imagekit.upload({
        file:
          pdfBuffer.toString(
            "base64"
          ),

        fileName:
          `${prescriptionId}.pdf`,

        folder:
          "/prescriptions",
      });

    const pdfUrl =
      uploadedPDF.url;

    // -------------------------
    // Save Prescription
    // -------------------------

    const newPrescription =
      await Prescription.create(
        {
          prescriptionId,
          patientId,
          doctorId,

          medicines:
            parsedMedicines,

          instructions,

          signature:
            signatureUrl,

          date,
          slot,

          qrCode,

          verificationStatus:
            "pending",

          pdfUrl,

          status:
            "issued",
        }
      );

    return res.status(201).json({
      success: true,

      message:
        "Prescription created successfully",

      data:
        newPrescription,
    });
  } catch (error) {
    console.log(
      "Prescription Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
},
  verifyPrescription:   async (req, res) => {
      try {
        const { token } =
          req.body;

        if (!token) {
          return res
            .status(400)
            .json({
              success:
                false,
              message:
                "Token is required",
            });
        }

        const decoded =
          jwt.verify(
            token,
            "VITECARE APPOINTMENT"
          );

        const prescription =
          await Prescription.findOne(
            {
              prescriptionId:
                decoded.prescriptionId,
            }
          )
            .populate(
              "doctorId",
              "name"
            )
            .populate(
              "patientId",
              "name"
            );

        if (
          !prescription
        ) {
          return res
            .status(404)
            .json({
              success:
                false,
              message:
                "Prescription not found",
            });
        }

        return res
          .status(200)
          .json({
            success: true,
            data:
              prescription,
          });
      } catch (error) {
        return res
          .status(401)
          .json({
            success:
              false,
            message:
              "Invalid token",
          });
      }
    },

  getByDoctorId:  async (req, res) => {
      try {
        const doctorId =
          req.user.id;

        const prescriptions =
          await Prescription.find(
            {
              doctorId,
            }
          )
            .populate(
              "patientId",
              "name"
            )
            .sort({
              createdAt:
                -1,
            });

        return res
          .status(200)
          .json({
            success: true,
            data:
              prescriptions,
          });
      } catch (error) {
        return res
          .status(500)
          .json({
            success:
              false,
            message:
              error.message,
          });
      }
    },
};

export default PrescriptionController;