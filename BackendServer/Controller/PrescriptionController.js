import Prescription from "../Model/Prescription.js";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

import jwt from "jsonwebtoken";

function generate15DigitId() {

    const timestamp = Date.now().toString(); 
  const random = Math.floor(10 + Math.random() * 90).toString(); 
  return timestamp.slice(-13) + random; 
}

const PrescriptionController = {

 createPrescription : async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      medicines,
      doctorName ,
      patientName , 
      instructions,
      date,
      slot,
    } = req.body;

    const prescriptionId = generate15DigitId();

    let signatureBase64 = null;

    if (req.file) {
      const image = fs.readFileSync(req.file.path);
      signatureBase64 = `data:image/png;base64,${image.toString("base64")}`;
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
  "VITECARE APPOINTMENT",
);
const qrData = JSON.stringify({
  token,
});

const qrCode = await QRCode.toDataURL(qrData);
  
const htmlTemplate = `
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet"/>

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
  --blue-50:   #EBF4FF;
  --blue-100:  #DBEAFE;
  --blue-300:  #93C5FD;
  --blue-500:  #3B82F6;
  --blue-600:  #2563EB;
  --blue-700:  #1D4ED8;
  --blue-800:  #1E40AF;
  --blue-900:  #1E3A8A;
  --slate-50:  #F8FAFC;
  --slate-100: #F1F5F9;
  --slate-200: #E2E8F0;
  --slate-300: #CBD5E1;
  --slate-400: #94A3B8;
  --slate-500: #64748B;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1E293B;
  --slate-900: #0F172A;
  --green-50:  #F0FDF4;
  --green-600: #16A34A;
  --red-50:    #FFF1F2;
  --red-800:   #991B1B;
}

body {
  font-family: 'DM Sans', sans-serif;
  background: #EEF2F7;
  color: var(--slate-900);
  padding: 20px;
  min-height: 100vh;
}

/* ─── WRAPPER ─── */
.rx-wrapper {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(30,58,138,0.12), 0 4px 16px rgba(30,58,138,0.08);
}

/* ─── HEADER ─── */
.rx-header {
  background: linear-gradient(135deg, var(--blue-900) 0%, var(--blue-700) 55%, #3730A3 100%);
  padding: 26px 30px 20px;
  position: relative;
  overflow: hidden;
}

.rx-header::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 220px; height: 220px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
}

.rx-header::after {
  content: '';
  position: absolute;
  bottom: -80px; left: 30%;
  width: 280px; height: 280px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 50px; height: 50px;
  background: rgba(255,255,255,0.15);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  border: 1px solid rgba(255,255,255,0.2);
}

.brand-name {
  font-family: 'DM Serif Display', serif;
  font-size: 30px;
  color: #fff;
  letter-spacing: -0.5px;
  line-height: 1;
}

.brand-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.65);
  margin-top: 5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.header-meta {
  text-align: right;
  position: relative;
  z-index: 1;
}

.rx-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 10px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 1.8px;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 10px;
}

.meta-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 3px;
}

.meta-label {
  font-size: 10px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

/* ─── HEADER STRIP ─── */
.header-strip {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.12);
  display: flex;
  gap: 22px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.strip-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.strip-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--blue-300);
  flex-shrink: 0;
}

.strip-text {
  font-size: 11.5px;
  color: rgba(255,255,255,0.7);
}

.strip-text b {
  color: #fff;
  font-weight: 600;
}

/* ─── BODY ─── */
.rx-body {
  padding: 26px 30px;
}

/* ─── SECTION HEADING ─── */
.sec-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.sec-head-text {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.3px;
  color: var(--blue-600);
  white-space: nowrap;
}

.sec-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--blue-100), transparent);
}

/* ─── PATIENT GRID ─── */
.patient-section {
  margin-bottom: 22px;
}

.patient-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.p-field {
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: 14px;
  padding: 12px 14px;
}

.p-field-icon {
  width: 30px; height: 30px;
  background: var(--blue-50);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  margin-bottom: 8px;
}

.p-field-label {
  font-size: 9.5px;
  color: var(--slate-400);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 3px;
}

.p-field-value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--slate-800);
  line-height: 1.25;
}

.p-field-sub {
  font-size: 10.5px;
  color: var(--slate-500);
  margin-top: 2px;
}

/* ─── INSTRUCTIONS ─── */
.instructions-section {
  margin-bottom: 22px;
}

.instructions-box {
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-left: 4px solid var(--blue-500);
  border-radius: 0 14px 14px 0;
  padding: 5px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--slate-700);
  white-space: pre-wrap;
  word-break: break-word;
}

.instructions-box.empty {
  color: var(--slate-400);
  font-style: italic;
}

/* ─── MEDICINE TABLE ─── */
.medicines-section {
  margin-bottom: 22px;
}

.med-table-wrap {
  border: 1px solid var(--slate-200);
  border-radius: 16px;
  overflow: hidden;
}

.med-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.med-table thead {
  background: linear-gradient(135deg, var(--blue-800), var(--blue-700));
}

.med-table thead th {
  padding: 11px 14px;
  text-align: left;
  color: rgba(255,255,255,0.9);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.9px;
}

.med-table thead th.center {
  text-align: center;
}

.med-table tbody tr {
  border-bottom: 1px solid var(--slate-100);
}

.med-table tbody tr:last-child {
  border-bottom: none;
}

.med-table tbody tr:nth-child(even) {
  background: var(--slate-50);
}

.med-table td {
  padding: 11px 14px;
  color: var(--slate-700);
  vertical-align: middle;
}

.med-table td.center {
  text-align: center;
}

.med-name {
  font-weight: 600;
  color: var(--slate-800);
  font-size: 13.5px;
}

.med-type {
  font-size: 10.5px;
  color: var(--slate-400);
  margin-top: 2px;
}

.strength-pill {
  display: inline-block;
  background: var(--blue-50);
  border: 1px solid var(--blue-100);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--blue-700);
}

.days-pill {
  display: inline-block;
  background: var(--slate-100);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--slate-600);
}

.t-check {
  width: 26px; height: 26px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.t-yes {
  background: var(--green-50);
  color: var(--green-600);
  border: 1px solid #BBF7D0;
}

.t-no {
  background: var(--slate-100);
  color: var(--slate-300);
  border: 1px solid var(--slate-200);
}

/* ─── FOOTER ─── */
.rx-footer {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 16px;
  align-items: stretch;
}

/* ─── SIGNATURE ─── */
.sig-card {
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
}

.sig-card-title {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  color: var(--slate-400);
  font-weight: 700;
  margin-bottom: 12px;
}

.sig-area {
  flex: 1;
  min-height: 75px;
  border-bottom: 1.5px dashed var(--slate-300);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.sig-area img {
  max-width: 180px;
  max-height: 70px;
  object-fit: contain;
}

.sig-no-img {
  font-size: 12px;
  color: var(--slate-300);
  font-style: italic;
}

.sig-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sig-doc-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--slate-700);
}

.sig-datetime {
  font-size: 10.5px;
  color: var(--slate-400);
  margin-top: 2px;
}

.digital-seal {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--blue-50);
  border: 1px solid var(--blue-100);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  color: var(--blue-700);
}

.seal-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--blue-500);
  animation: blink 2s infinite;
}

@keyframes blink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.3; }
}

/* ─── QR CARD ─── */
.qr-card {
  background: #fff;
  border: 1.5px dashed var(--blue-300);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.qr-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--blue-500), #6366F1, var(--blue-500));
}

.qr-card-title {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.1px;
  color: var(--slate-400);
  margin-bottom: 10px;
}

.qr-img {
  width: 110px;
  height: 110px;
  border-radius: 8px;
  margin: 0 auto 8px;
  display: block;
}

.qr-id {
  display: inline-block;
  font-size: 10px;
  font-family: monospace;
  color: var(--blue-600);
  background: var(--blue-50);
  border-radius: 6px;
  padding: 3px 8px;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

.qr-warning {
  background: var(--red-50);
  border: 1px solid #FECACA;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 10px;
  color: var(--red-800);
  text-align: left;
  line-height: 1.6;
  display: flex;
  gap: 6px;
}

.warn-icon {
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ─── BRANDING ─── */
.rx-branding {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--slate-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-footer-name {
  font-family: 'DM Serif Display', serif;
  font-size: 18px;
  color: var(--blue-700);
}

.brand-footer-sub {
  font-size: 10.5px;
  color: var(--slate-400);
  margin-top: 2px;
}

.trust-badges {
  display: flex;
  gap: 8px;
}

.trust-badge {
  background: var(--slate-50);
  border: 1px solid var(--slate-200);
  border-radius: 100px;
  padding: 3px 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--slate-500);
}

/* ─── PRINT ─── */
@media print {
  body {
    background: #fff;
    padding: 0;
  }
  .rx-wrapper {
    box-shadow: none;
    border-radius: 0;
    max-width: 100%;
  }
  .seal-dot { animation: none; }
}

</style>
</head>

<body>

<div class="rx-wrapper">

  <!-- ══════ HEADER ══════ -->
  <div class="rx-header">

    <div class="header-inner">

      <div class="brand-block">
        <div class="brand-icon">🩺</div>
        <div>
          <div class="brand-name">VitalCare</div>
          <div class="brand-sub">Digital Verified Prescription System</div>
        </div>
      </div>

      <div class="header-meta">
        <div class="rx-badge">✦ Verified Rx</div>
        <div class="meta-row">
          <span class="meta-label">Prescription ID</span>
          <span class="meta-value">${prescriptionId}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date Issued</span>
          <span class="meta-value">${date}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Appointment Slot</span>
          <span class="meta-value">${slot}</span>
        </div>
      </div>

    </div>

    <div class="header-strip">
      <div class="strip-item">
        <div class="strip-dot"></div>
        <div class="strip-text">Doctor: <b>Dr. ${doctorName}</b></div>
      </div>
      <div class="strip-item">
        <div class="strip-dot"></div>
        <div class="strip-text">Patient: <b>${patientName}</b></div>
      </div>
      <div class="strip-item">
        <div class="strip-dot"></div>
        <div class="strip-text">Status: <b style="color:#86EFAC;">Digitally Signed ✓</b></div>
      </div>
    </div>

  </div>

  <!-- ══════ BODY ══════ -->
  <div class="rx-body">

    <!-- Patient Information -->
    <div class="patient-section">
      <div class="sec-head">
        <span class="sec-head-text">Patient Information</span>
        <div class="sec-line"></div>
      </div>
      <div class="patient-grid">

        <div class="p-field">
          <div class="p-field-icon">👤</div>
          <div class="p-field-label">Full Name</div>
          <div class="p-field-value">${patientName}</div>
        </div>

        <div class="p-field">
          <div class="p-field-icon">🧑‍⚕️</div>
          <div class="p-field-label">Treating Doctor</div>
          <div class="p-field-value">Dr. ${doctorName}</div>
          <div class="p-field-sub">General Physician</div>
        </div>

        <div class="p-field">
          <div class="p-field-icon">📅</div>
          <div class="p-field-label">Visit Date &amp; Slot</div>
          <div class="p-field-value">${date}</div>
          <div class="p-field-sub">${slot}</div>
        </div>

      </div>
    </div>

    <!-- Clinical Instructions -->
    <div class="instructions-section">
      <div class="sec-head">
        <span class="sec-head-text">Clinical Notes &amp; Instructions</span>
        <div class="sec-line"></div>
      </div>
      <div class="instructions-box${instructions ? "" : " empty"}">
        ${instructions ? instructions : "No medical instructions provided."}
      </div>
    </div>

    <!-- Prescribed Medicines -->
    <div class="medicines-section">
      <div class="sec-head">
        <span class="sec-head-text">Prescribed Medicines</span>
        <div class="sec-line"></div>
      </div>

      <div class="med-table-wrap">
        <table class="med-table">
          <thead>
            <tr>
              <th style="width:36%">Medicine</th>
              <th class="center" style="width:14%">Strength</th>
              <th class="center" style="width:10%">Days</th>
              <th class="center" style="width:13%">Morning</th>
              <th class="center" style="width:13%">Afternoon</th>
              <th class="center" style="width:13%">Night</th>
            </tr>
          </thead>
          <tbody>
            ${parsedMedicines.map(m => `
              <tr>
                <td>
                  <div class="med-name">${m.name}</div>
                  <div class="med-type">${m.type || ""}</div>
                </td>
                <td class="center"><span class="strength-pill">${m.strength}</span></td>
                <td class="center"><span class="days-pill">${m.days}d</span></td>
                <td class="center"><span class="t-check ${m.timing?.morning    ? "t-yes" : "t-no"}">${m.timing?.morning    ? "✓" : "–"}</span></td>
                <td class="center"><span class="t-check ${m.timing?.afternoon  ? "t-yes" : "t-no"}">${m.timing?.afternoon  ? "✓" : "–"}</span></td>
                <td class="center"><span class="t-check ${m.timing?.night      ? "t-yes" : "t-no"}">${m.timing?.night      ? "✓" : "–"}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Signature + QR -->
    <div class="rx-footer">

      <!-- Signature -->
      <div class="sig-card">
        <div class="sig-card-title">Doctor's Signature</div>
        <div class="sig-area">
          ${signatureBase64
            ? `<img src="${signatureBase64}" alt="Doctor Signature" />`
            : `<span class="sig-no-img">No signature uploaded</span>`
          }
        </div>
        <div class="sig-bottom">
          <div>
            <div class="sig-doc-name">Dr. ${doctorName}</div>
            <div class="sig-datetime">${new Date().toLocaleString()}</div>
          </div>
          <div class="digital-seal">
            <div class="seal-dot"></div>
            Digitally Signed
          </div>
        </div>
      </div>

      <!-- QR Code -->
      <div class="qr-card">
        <div class="qr-card-title">Scan to Verify</div>
        <img class="qr-img" src="${qrCode}" alt="Prescription QR Code" />
        <div class="qr-warning">
          <span class="warn-icon">⚠</span>
          <span>Pharmacists must scan &amp; verify this QR before dispensing medicines. Unauthorized dispensing may lead to legal action.</span>
        </div>
      </div>

    </div>

    <!-- Bottom Branding -->
    <div class="rx-branding">
      <div>
        <div class="brand-footer-name">VitalCare</div>
        <div class="brand-footer-sub">Secure • Verified • Digital Healthcare System</div>
      </div>
      <div class="trust-badges">
        <div class="trust-badge">🔒 Encrypted</div>
        <div class="trust-badge">✅ HIPAA Safe</div>
        <div class="trust-badge">📋 Audit Logged</div>
      </div>
    </div>

  </div>
</div>

</body>
</html>
`;
    const browser = await puppeteer.launch({
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setContent(htmlTemplate);

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

    const randomFile = generateRandomFileName();

    const pdfPath = `uploads/prescriptions/${randomFile}.pdf`;

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    const newPrescription = await Prescription.create({
      prescriptionId,
      patientId,
      doctorId,
      medicines: parsedMedicines,
      instructions,
      signature: signatureBase64, 
      date,
      slot,
      qrCode,
      verificationStatus: "pending",
      pdfUrl: pdfPath,
      status: "issued",
    });

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully with PDF",
      data: newPrescription,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},


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