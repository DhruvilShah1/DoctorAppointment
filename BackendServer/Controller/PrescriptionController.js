import Prescription from "../Model/Prescription.js";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

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

      // Signature
      let signatureBase64 = null;

      if (req.file) {
        const image =
          fs.readFileSync(
            req.file.path
          );

        signatureBase64 = `data:image/png;base64,${image.toString(
          "base64"
        )}`;
      }

      // Parse Medicines
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

      // QR Token
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

const htmlTemplate = `
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"/>

<style>
@page {
  size: A4;
  margin: 10mm;
}

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --blue-50:#EBF4FF;
  --blue-100:#DBEAFE;
  --blue-300:#93C5FD;
  --blue-500:#3B82F6;
  --blue-600:#2563EB;
  --blue-700:#1D4ED8;
  --blue-800:#1E40AF;
  --blue-900:#1E3A8A;
  --slate-50:#F8FAFC;
  --slate-100:#F1F5F9;
  --slate-200:#E2E8F0;
  --slate-300:#CBD5E1;
  --slate-400:#94A3B8;
  --slate-500:#64748B;
  --slate-600:#475569;
  --slate-700:#334155;
  --slate-800:#1E293B;
  --slate-900:#0F172A;
  --green-50:#F0FDF4;
  --green-600:#16A34A;
  --red-50:#FFF1F2;
  --red-800:#991B1B;
}

body {
  font-family: 'DM Sans', sans-serif;
  background:#EEF2F7;
  color:var(--slate-900);
  padding:20px;
}

.rx-wrapper{
  max-width:800px;
  margin:auto;
  background:#fff;
  border-radius:24px;
  overflow:hidden;
  box-shadow:0 20px 60px rgba(30,58,138,.12),
  0 4px 16px rgba(30,58,138,.08);
}

.rx-header{
  background:linear-gradient(
    135deg,
    var(--blue-900) 0%,
    var(--blue-700) 55%,
    #3730A3 100%
  );
  padding:26px 30px 20px;
  color:white;
}

.header-inner{
  display:flex;
  justify-content:space-between;
}

.brand-block{
  display:flex;
  gap:14px;
}

.brand-icon{
  width:50px;
  height:50px;
  border-radius:14px;
  background:rgba(255,255,255,.15);
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
}

.brand-name{
  font-size:30px;
  font-family:'DM Serif Display';
}

.brand-sub{
  font-size:11px;
  opacity:.7;
}

.rx-badge{
  background:rgba(255,255,255,.15);
  padding:4px 12px;
  border-radius:8px;
  font-size:10px;
  margin-bottom:10px;
}

.meta-row{
  display:flex;
  gap:10px;
  justify-content:flex-end;
  font-size:12px;
}

.header-strip{
  margin-top:16px;
  border-top:1px solid rgba(255,255,255,.15);
  padding-top:14px;
  display:flex;
  gap:20px;
}

.strip-item{
  font-size:12px;
}

.rx-body{
  padding:26px 30px;
}

.sec-head{
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:14px;
}

.sec-head-text{
  font-size:11px;
  color:var(--blue-600);
  font-weight:700;
  text-transform:uppercase;
}

.sec-line{
  flex:1;
  height:1px;
  background:var(--blue-100);
}

.patient-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
}

.p-field{
  background:var(--slate-50);
  border:1px solid var(--slate-200);
  border-radius:14px;
  padding:14px;
}

.p-field-value{
  font-weight:600;
}

.instructions-box{
  background:var(--slate-50);
  border-left:4px solid var(--blue-500);
  border-radius:0 14px 14px 0;
  padding:12px;
}

.med-table{
  width:100%;
  border-collapse:collapse;
}

.med-table th{
  background:var(--blue-700);
  color:white;
  padding:12px;
  font-size:11px;
}

.med-table td{
  padding:12px;
  border-bottom:1px solid #eee;
}

.center{
  text-align:center;
}

.strength-pill,
.days-pill{
  padding:4px 10px;
  border-radius:6px;
  font-size:12px;
}

.strength-pill{
  background:#DBEAFE;
}

.days-pill{
  background:#E2E8F0;
}

.t-check{
  padding:5px 10px;
  border-radius:8px;
}

.t-yes{
  background:#DCFCE7;
}

.t-no{
  background:#F1F5F9;
}

.rx-footer{
  display:grid;
  grid-template-columns:1fr 250px;
  gap:16px;
  margin-top:25px;
}

.sig-card,
.qr-card{
  border-radius:16px;
  padding:18px;
}

.sig-card{
  background:var(--slate-50);
}

.sig-area{
  min-height:75px;
  display:flex;
  justify-content:center;
  align-items:center;
  margin:20px 0;
}

.sig-area img{
  max-width:180px;
  max-height:70px;
}

.qr-card{
  border:2px dashed var(--blue-300);
  text-align:center;
}

.qr-img{
  width:110px;
  height:110px;
}

.rx-branding{
  margin-top:25px;
  display:flex;
  justify-content:space-between;
  border-top:1px solid #eee;
  padding-top:14px;
}
</style>
</head>

<body>

<div class="rx-wrapper">

<div class="rx-header">

<div class="header-inner">

<div class="brand-block">
<div class="brand-icon">🩺</div>

<div>
<div class="brand-name">VitalCare</div>
<div class="brand-sub">
Digital Verified Prescription System
</div>
</div>
</div>

<div>
<div class="rx-badge">
✦ Verified Rx
</div>

<div class="meta-row">
<span>Prescription ID:</span>
<span>${prescriptionId}</span>
</div>

<div class="meta-row">
<span>Date:</span>
<span>${date}</span>
</div>

<div class="meta-row">
<span>Slot:</span>
<span>${slot}</span>
</div>
</div>

</div>

<div class="header-strip">
<div class="strip-item">
Doctor: <b>Dr. ${doctorName}</b>
</div>

<div class="strip-item">
Patient: <b>${patientName}</b>
</div>

<div class="strip-item">
Status:
<b style="color:#86EFAC">
Digitally Signed ✓
</b>
</div>
</div>

</div>

<div class="rx-body">

<div class="patient-section">
<div class="sec-head">
<span class="sec-head-text">
Patient Information
</span>
<div class="sec-line"></div>
</div>

<div class="patient-grid">

<div class="p-field">
<div>👤</div>
<div>Full Name</div>
<div class="p-field-value">
${patientName}
</div>
</div>

<div class="p-field">
<div>🧑‍⚕️</div>
<div>Treating Doctor</div>
<div class="p-field-value">
Dr. ${doctorName}
</div>
</div>

<div class="p-field">
<div>📅</div>
<div>Date & Slot</div>
<div class="p-field-value">
${date}
</div>
<div>${slot}</div>
</div>

</div>
</div>

<div class="instructions-section">
<div class="sec-head">
<span class="sec-head-text">
Clinical Notes
</span>
<div class="sec-line"></div>
</div>

<div class="instructions-box">
${instructions || "No instructions provided."}
</div>
</div>

<table class="med-table">
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
<td>
${m.name}
<br/>
<small>${m.type || ""}</small>
</td>

<td class="center">
<span class="strength-pill">
${m.strength}
</span>
</td>

<td class="center">
<span class="days-pill">
${m.days}d
</span>
</td>

<td class="center">
${m.timing?.morning ? "✓" : "–"}
</td>

<td class="center">
${m.timing?.afternoon ? "✓" : "–"}
</td>

<td class="center">
${m.timing?.night ? "✓" : "–"}
</td>

</tr>
`
  )
  .join("")}

</tbody>
</table>

<div class="rx-footer">

<div class="sig-card">

<h4>Doctor Signature</h4>

<div class="sig-area">
${
  signatureBase64
    ? `<img src="${signatureBase64}" alt="Doctor Signature" />`
    : `<span>No signature uploaded</span>`
}
</div>

<div>
Dr. ${doctorName}
<br/>
${new Date().toLocaleString()}
</div>

</div>

<div class="qr-card">

<h4>Scan to Verify</h4>

<img
class="qr-img"
src="${qrCode}"
alt="QR"
/>

<p style="font-size:11px;margin-top:10px">
Pharmacists must verify this QR.
</p>

</div>

</div>

<div class="rx-branding">
<div>
<b>VitalCare</b>
</div>

<div>
🔒 Encrypted | ✅ Verified
</div>
</div>

</div>
</div>

</body>
</html>
`;
      // Ensure Folder Exists
      const uploadFolder = path.join(
  process.cwd(),
  "uploads",
  "prescriptions"
);

ensureDir(uploadFolder);

console.log(uploadFolder);

      // PDF Name
      const randomFile =
        generateRandomFileName();

      const fileName = `${randomFile}.pdf`;

      const pdfPath = path.join(
  uploadFolder,
  `${randomFile}.pdf`
);

console.log(
  "PDF Save Path:",
  pdfPath
);

      // Launch Browser
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

      // Create PDF
      await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
});

      await browser.close();

      // Public URL
      const pdfUrl = `/uploads/prescriptions/${fileName}`;

      // Save DB
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
              signatureBase64,
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