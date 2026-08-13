import Prescription from "../Model/Prescription.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import Appointment from "../Model/Appointment.js";
import { uploadSignature, uploadPdf } from "../Config/uploadthing.js";
import QrCodeSection from "../createPrescription/QrCodeSection.js";
import generatePrescriptionHtml from "../createPrescription/prescriptionPdfTemplate.js";
import generatePrescriptionPdf from "../createPrescription/prescriptionPdfGenration.js";

const generate15DigitId = () => {
  return Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
};

const PrescriptionController = {

  createPrescription: async (req, res) => {
    try {
      const { patientId, doctorId, medicines, doctorName, patientName, instructions, date, slot } = req.body;

      const prescriptionId = generate15DigitId();

   let parsedMedicines = [];

try {

    if (typeof medicines === "string") {

        parsedMedicines = JSON.parse(medicines);

    } else if (Array.isArray(medicines)) {

        parsedMedicines = medicines;

    }

} catch (error) {

    console.error(
        "❌ Failed to parse medicines:",
        error
    );

    parsedMedicines = [];

}


if (!Array.isArray(parsedMedicines)) {
    parsedMedicines = [];
}

console.log(
    "✅ parsedMedicines:",
    parsedMedicines
);

console.log(
    "✅ isArray:",
    Array.isArray(parsedMedicines)
);


     // Signature Section 
      let signatureUrl = null;
      if (req.file) {
        signatureUrl = await uploadSignature(req.file);
      }

      // Qr Code Section 

      // const token = jwt.sign({ prescriptionId }, "VITECARE APPOINTMENT");
      // const qrCode = await QRCode.toDataURL(JSON.stringify({ token }));
      const qrCode = await QrCodeSection(prescriptionId);


      // PDF Template
     
//       const htmlTemplate = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8"/>
// <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

// <style>
// *{
//   margin:0;
//   padding:0;
//   box-sizing:border-box;
// }

// body{
//   font-family: Arial, sans-serif;
//   background:#f4f7fb;
//   padding:30px;
//   color:#1e293b;
// }

// .container{
//   background:#fff;
//   border-radius:20px;
//   overflow:hidden;
//   box-shadow:0 10px 35px rgba(0,0,0,0.08);
//   border:1px solid #e2e8f0;
// }

// /* Header */
// .header{
//   background:linear-gradient(
//     135deg,
//     #0f766e,
//     #14b8a6
//   );
//   color:white;
//   padding:35px;
// }

// .header-top{
//   display:flex;
//   justify-content:space-between;
//   align-items:center;
// }

// .hospital-name{
//   font-size:32px;
//   font-weight:bold;
// }

// .subtitle{
//   margin-top:6px;
//   opacity:0.9;
//   font-size:14px;
// }

// .prescription-badge{
//   background:rgba(255,255,255,0.2);
//   padding:10px 18px;
//   border-radius:999px;
//   font-size:14px;
// }

// /* Main */
// .content{
//   padding:35px;
// }

// .section-title{
//   font-size:20px;
//   font-weight:bold;
//   color:#0f766e;
//   margin-bottom:15px;
//   border-left:5px solid #14b8a6;
//   padding-left:10px;
// }

// /* Patient Card */
// .info-grid{
//   display:grid;
//   grid-template-columns:1fr 1fr;
//   gap:20px;
//   margin-bottom:30px;
// }

// .info-card{
//   background:#f8fafc;
//   border:1px solid #e2e8f0;
//   border-radius:14px;
//   padding:18px;
// }

// .label{
//   color:#64748b;
//   font-size:13px;
//   margin-bottom:5px;
// }

// .value{
//   font-size:17px;
//   font-weight:600;
//   color:#0f172a;
// }

// /* Instructions */
// .instructions-box{
//   background:#ecfeff;
//   border-left:5px solid #14b8a6;
//   padding:20px;
//   border-radius:12px;
//   margin-bottom:30px;
//   line-height:1.8;
// }

// /* Table */
// .table-container{
//   margin-top:15px;
//   overflow:hidden;
//   border-radius:14px;
//   border:1px solid #e2e8f0;
// }

// table{
//   width:100%;
//   border-collapse:collapse;
// }

// thead{
//   background:#0f766e;
//   color:white;
// }

// th{
//   padding:16px;
//   text-align:center;
//   font-size:14px;
// }

// td{
//   padding:15px;
//   border-bottom:1px solid #e2e8f0;
//   text-align:center;
//   font-size:14px;
// }

// tbody tr:nth-child(even){
//   background:#f8fafc;
// }

// /* Footer Section */
// .bottom-grid{
//   display:grid;
//   grid-template-columns:1fr 1fr;
//   gap:30px;
//   margin-top:35px;
// }

// .signature-card,
// .qr-card{
//   background:#f8fafc;
//   border-radius:18px;
//   border:1px solid #e2e8f0;
//   padding:25px;
//   text-align:center;
// }

// .signature-img{
//   max-width:180px;
//   height:80px;
//   object-fit:contain;
//   margin-top:10px;
// }

// .qr-img{
//   width:130px;
//   margin-top:15px;
// }

// .footer{
//   text-align:center;
//   padding:20px;
//   background:#f8fafc;
//   color:#64748b;
//   font-size:13px;
//   border-top:1px solid #e2e8f0;
// }

// .status-yes{
//   color:green;
//   font-weight:bold;
// }

// .status-no{
//   color:#ef4444;
//   font-weight:bold;
// }

// </style>
// </head>

// <body>

// <div class="container">

//   <!-- Header -->
//   <div class="header">
//     <div class="header-top">

//       <div>
//         <div class="hospital-name">
//           VitalCare Clinic
//         </div>

//         <div class="subtitle">
//           Professional Medical Prescription
//         </div>
//       </div>

//       <div class="prescription-badge">
//         ID: ${prescriptionId}
//       </div>

//     </div>
//   </div>

//   <div class="content">

//     <!-- Patient Info -->
//     <h2 class="section-title">
//       Patient Information
//     </h2>

//     <div class="info-grid">

//       <div class="info-card">
//         <div class="label">
//           Doctor Name
//         </div>
//         <div class="value">
//           Dr. ${doctorName}
//         </div>
//       </div>

//       <div class="info-card">
//         <div class="label">
//           Patient Name
//         </div>
//         <div class="value">
//           ${patientName}
//         </div>
//       </div>

//       <div class="info-card">
//         <div class="label">
//           Appointment Date
//         </div>
//         <div class="value">
//           ${date}
//         </div>
//       </div>

//       <div class="info-card">
//         <div class="label">
//           Slot Time
//         </div>
//         <div class="value">
//           ${slot}
//         </div>
//       </div>

//     </div>

//     <!-- Instructions -->
//     <h2 class="section-title">
//       Instructions
//     </h2>

//     <div class="instructions-box">
//       ${
//         instructions
//           ? instructions
//           : "No instructions provided."
//       }
//     </div>

//     <!-- Medicines -->
//     <h2 class="section-title">
//       Prescribed Medicines
//     </h2>

//     <div class="table-container">

//       <table>
//         <thead>
//           <tr>
//             <th>Medicine</th>
//             <th>Strength</th>
//             <th>Days</th>
//             <th>Morning</th>
//             <th>Afternoon</th>
//             <th>Night</th>
//           </tr>
//         </thead>

//         <tbody>

//         ${parsedMedicines
//           .map(
//             (m) => `
//           <tr>
//             <td>${m.name || "-"}</td>
//             <td>${m.strength || "-"}</td>
//             <td>${m.days || "-"}</td>

//             <td>
//               ${
//                 m.timing?.morning
//                   ? `<span class="status-yes">✔</span>`
//                   : `<span class="status-no">✘</span>`
//               }
//             </td>

//             <td>
//               ${
//                 m.timing?.afternoon
//                   ? `<span class="status-yes">✔</span>`
//                   : `<span class="status-no">✘</span>`
//               }
//             </td>

//             <td>
//               ${
//                 m.timing?.night
//                   ? `<span class="status-yes">✔</span>`
//                   : `<span class="status-no">✘</span>`
//               }
//             </td>

//           </tr>
//         `
//           )
//           .join("")}

//         </tbody>

//       </table>
//     </div>

//     <!-- Bottom -->
//     <div class="bottom-grid">

//       <div class="signature-card">
//         <h3>
//           Doctor Signature
//         </h3>

//         ${
//           signatureUrl
//             ? `
//             <img
//               src="${signatureUrl}"
//               class="signature-img"
//             />
//           `
//             : `
//             <p style="margin-top:20px;">
//               No Signature
//             </p>
//           `
//         }
//       </div>

//       <div class="qr-card">
//         <h3>
//           Scan Prescription
//         </h3>

//         <img
//           src="${qrCode}"
//           class="qr-img"
//         />
//       </div>

//     </div>

//   </div>

//   <div class="footer">
//     Generated securely by VitalCare Healthcare System
//   </div>

// </div>

// </body>
// </html>
//       `;
const htmlTemplate = await generatePrescriptionHtml(prescriptionId, doctorName, patientName, date, slot, instructions, parsedMedicines, signatureUrl, qrCode)

      // Generate PDF using puppeteer
      // const browser = await puppeteer.launch({
      //   args: chromium.args,
      //   executablePath: await chromium.executablePath(),
      //   headless: true,
      // });

      // const page = await browser.newPage();
      // await page.setContent(htmlTemplate, { waitUntil: "networkidle0" });
      // const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      // await browser.close();
      const pdfBuffer = await generatePrescriptionPdf(htmlTemplate)


// Uploading Pdf
      const pdfUrl = await uploadPdf(pdfBuffer, `${prescriptionId}.pdf`);

      const newPrescription = await Prescription.create({
        prescriptionId,
        patientId,
        doctorId,
        medicines: parsedMedicines,
        instructions,
        signature: signatureUrl,
        date,
        slot, 
        qrCode,
        pdfUrl,
        verificationStatus: "pending",
        status: "issued",
      });

      return res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        data: newPrescription,
      });

    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  verifyPrescription: async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
      }

      const decoded = jwt.verify(token, "VITECARE APPOINTMENT");

      const prescription = await Prescription.findOne({ prescriptionId: decoded.prescriptionId })
        .populate("doctorId", "name")
        .populate("patientId", "name");

      if (!prescription) {
        return res.status(404).json({ success: false, message: "Prescription not found" });
      }

      return res.status(200).json({ success: true, data: prescription });
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  },

  getByDoctorId: async (req, res) => {
    try {
      const doctorId = req.user.id;

      const prescriptions = await Prescription.find({ doctorId })
        .populate("patientId", "name")
        .sort({ createdAt: -1 });

      const appointments = await Appointment.find({ doctorId }).populate(
        "slots.patientList.patientId", "name"
      );

      const notComePatients = [];
      appointments.forEach((appointment) => {
        appointment.slots.forEach((slot) => {
          slot.patientList.forEach((patient) => {
            if (patient.status === "notcome") {
              notComePatients.push({
                _id: patient._id,
                patientId: patient.patientId,
                status: "notcome",
                slot: slot.start,
                date: appointment.date,
                createdAt: appointment.createdAt,
                isPrescription: false,
              });
            }
          });
        });
      });

      const prescriptionData = prescriptions.map((item) => ({
        ...item._doc,
        status: "done",
        isPrescription: true,
      }));

      const finalData = [...prescriptionData, ...notComePatients].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return res.status(200).json({ success: true, data: finalData });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

export default PrescriptionController;
