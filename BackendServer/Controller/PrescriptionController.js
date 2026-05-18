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

    let signatureBase64 = null;
    let signatureUrl = null;

    if (req.file) {
      // Upload Signature to ImageKit
      const uploadedSignature =
        await imagekit.upload({
          file:
            req.file.buffer.toString(
              "base64"
            ),

          fileName:
            Date.now() +
            "-" +
            req.file.originalname,

          folder:
            "/doctor-signatures",
        });

      signatureUrl =
        uploadedSignature.url;

      // Base64 for PDF preview
      signatureBase64 = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString(
        "base64"
      )}`;
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
<html>
<head>
<meta charset="UTF-8"/>

<style>
body{
font-family:Arial,sans-serif;
padding:20px;
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

.sig-area img{
max-width:180px;
max-height:70px;
}

.qr-img{
width:120px;
height:120px;
}
</style>

</head>

<body>

<h1>
VitalCare Prescription
</h1>

<p>
<b>Prescription ID:</b>
${prescriptionId}
</p>

<p>
<b>Doctor:</b>
Dr. ${doctorName}
</p>

<p>
<b>Patient:</b>
${patientName}
</p>

<p>
<b>Date:</b>
${date}
</p>

<p>
<b>Slot:</b>
${slot}
</p>

<h3>
Instructions
</h3>

<p>
${
  instructions ||
  "No instructions provided."
}
</p>

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
${m.name}
</td>

<td>
${m.strength}
</td>

<td>
${m.days}
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

<div
style="
margin-top:40px;
display:flex;
justify-content:space-between;
align-items:center;
"
>

<div>

<h3>
Doctor Signature
</h3>

<div class="sig-area">

${
  signatureBase64
    ? `<img src="${signatureBase64}" />`
    : `<span>No signature</span>`
}

</div>

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

    await page.setContent(
      htmlTemplate,
      {
        waitUntil:
          "networkidle0",
      }
    );

    // -------------------------
    // Generate PDF Buffer
    // -------------------------

    const pdfBuffer =
      await page.pdf({
        format: "A4",
        printBackground: true,
      });

    await browser.close();

    // -------------------------
    // Upload PDF to ImageKit
    // -------------------------

    const randomFile =
      generateRandomFileName();

    const uploadedPDF =
      await imagekit.upload({
        file:
          pdfBuffer.toString(
            "base64"
          ),

        fileName:
          `${randomFile}.pdf`,

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