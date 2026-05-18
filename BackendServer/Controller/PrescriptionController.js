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
    // Upload Signature
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
      parsedMedicines =
        typeof medicines ===
        "string"
          ? JSON.parse(
              medicines
            )
          : medicines || [];
    } catch (error) {
      parsedMedicines = [];
    }

    // -------------------------
    // QR Code
    // -------------------------

    const token = jwt.sign(
      { prescriptionId },
      "VITECARE APPOINTMENT"
    );

    const qrCode =
      await QRCode.toDataURL(
        JSON.stringify({
          token,
        })
      );

    // -------------------------
    // Simple HTML
    // -------------------------

    const htmlTemplate = `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8"/>

<style>

body{
font-family:Arial,sans-serif;
padding:20px;
color:#000;
}

h1{
text-align:center;
margin-bottom:20px;
}

p{
margin:8px 0;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th,td{
border:1px solid #000;
padding:8px;
text-align:center;
}

img{
max-width:150px;
}

.section{
margin-top:25px;
}

</style>

</head>

<body>

<h1>
Prescription
</h1>

<p>
<b>
Prescription ID:
</b>
${prescriptionId}
</p>

<p>
<b>
Doctor:
</b>
Dr. ${doctorName}
</p>

<p>
<b>
Patient:
</b>
${patientName}
</p>

<p>
<b>
Date:
</b>
${date}
</p>

<p>
<b>
Slot:
</b>
${slot}
</p>

<div class="section">

<b>
Instructions:
</b>

<p>
${
  instructions ||
  "No instructions"
}
</p>

</div>

<div class="section">

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
    ? "Yes"
    : "No"
}

</td>

<td>
${
  m.timing
    ?.afternoon
    ? "Yes"
    : "No"
}

</td>

<td>
${
  m.timing?.night
    ? "Yes"
    : "No"
}

</td>

</tr>
`
  )
  .join("")}

</tbody>

</table>

</div>

<div class="section">

<h3>
Doctor Signature
</h3>

${
  signatureUrl
    ? `
<img
src="${signatureUrl}"
alt="Signature"
/>
`
    : `
<p>
No Signature
</p>
`
}

</div>

<div class="section">

<h3>
QR Verification
</h3>

<img
src="${qrCode}"
width="120"
/>

</div>

</body>
</html>
`;

    // -------------------------
    // Puppeteer
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

    await page.setContent(
      htmlTemplate,
      {
        waitUntil:
          "networkidle0",
      }
    );

    // -------------------------
    // Generate PDF
    // -------------------------

    const pdfBuffer =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    await browser.close();

    // -------------------------
    // Upload PDF
    // -------------------------

    const uploadedPDF =
      await imagekit.upload({
        file:
`data:application/pdf;base64,${pdfBuffer.toString("base64")}`,

        fileName:
          `${prescriptionId}.pdf`,

        folder:
          "/prescriptions",
      });

    const pdfUrl =
      uploadedPDF.url;

    // -------------------------
    // Save DB
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

          pdfUrl,

          verificationStatus:
            "pending",

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