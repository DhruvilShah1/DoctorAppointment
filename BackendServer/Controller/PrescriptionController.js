import Prescription from "../Model/Prescription.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import Appointment from "../Model/Appointment.js";
import { uploadSignature, uploadPdf } from "../Config/uploadthing.js";

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
        parsedMedicines = typeof medicines === "string" ? JSON.parse(medicines) : medicines || [];
      } catch {
        parsedMedicines = [];
      }

      // Upload signature to uploadthing
      let signatureUrl = null;
      if (req.file) {
        signatureUrl = await uploadSignature(req.file);
      }

      const token = jwt.sign({ prescriptionId }, "VITECARE APPOINTMENT");
      const qrCode = await QRCode.toDataURL(JSON.stringify({ token }));

      const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
body { font-family: Arial; padding: 20px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #000; padding: 10px; text-align: center; }
img { max-width: 150px; }
</style>
</head>
<body>
<h1>Prescription</h1>
<p><b>ID:</b> ${prescriptionId}</p>
<p><b>Doctor:</b> Dr. ${doctorName}</p>
<p><b>Patient:</b> ${patientName}</p>
<p><b>Date:</b> ${date}</p>
<p><b>Slot:</b> ${slot}</p>
<h3>Instructions</h3>
<p>${instructions || "No instructions"}</p>
<h3>Medicines</h3>
<table>
<thead>
<tr><th>Medicine</th><th>Strength</th><th>Days</th><th>Morning</th><th>Afternoon</th><th>Night</th></tr>
</thead>
<tbody>
${parsedMedicines.map((m) => `
<tr>
<td>${m.name || "-"}</td>
<td>${m.strength || "-"}</td>
<td>${m.days || "-"}</td>
<td>${m.timing?.morning ? "Yes" : "No"}</td>
<td>${m.timing?.afternoon ? "Yes" : "No"}</td>
<td>${m.timing?.night ? "Yes" : "No"}</td>
</tr>`).join("")}
</tbody>
</table>
<h3>Doctor Signature</h3>
${signatureUrl ? `<img src="${signatureUrl}" />` : `<p>No Signature</p>`}
<h3>QR Code</h3>
<img src="${qrCode}" width="120" />
</body>
</html>`;

      // Upload HTML as file to uploadthing
      const htmlBuffer = Buffer.from(htmlTemplate, "utf-8");
      const pdfUrl = await uploadPdf(htmlBuffer, `${prescriptionId}.html`);

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
