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
import prescriptionQueue from "../Queue/PresecpionQueue.js";
import QueueJobs from "../Model/QueueJobs.js";

const generate15DigitId = () => {
  return Math.floor(
    100000000000000 + Math.random() * 900000000000000,
  ).toString();
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

      let parsedMedicines = [];

      try {
        if (typeof medicines === "string") {
          parsedMedicines = JSON.parse(medicines);
        } else if (Array.isArray(medicines)) {
          parsedMedicines = medicines;
        }
      } catch (error) {
        console.error("❌ Failed to parse medicines:", error);

        parsedMedicines = [];
      }

      if (!Array.isArray(parsedMedicines)) {
        parsedMedicines = [];
      }

      console.log("✅ parsedMedicines:", parsedMedicines);

      console.log("✅ isArray:", Array.isArray(parsedMedicines));

      // Signature Section
      let signatureUrl = null;
      if (req.file) {
        signatureUrl = await uploadSignature(req.file);
      }

      const job = await prescriptionQueue.add("generate-prescription", {
        prescriptionId,
        patientId,
        doctorId,
        medicines: parsedMedicines,
        doctorName,
        patientName,
        instructions,
        date,
        slot,
        signatureUrl,
      });

      await QueueJobs.create({
        jobId: job.id,
        queueName: "prescriptionQueue",
        jobType: "generate-prescription",
        userId: doctorId,
        payload: {
          patientId,
          date,
          slot,
        },
        referenceType: "prescription",
        referenceId: prescriptionId,
        status: "waiting",
      });
      console.log("Added to Queue");

   
      const newPrescription = await Prescription.create({
        prescriptionId,
        patientId,
        doctorId,
        medicines: parsedMedicines,
        instructions,
        signature: signatureUrl,
        date,
        slot,
        qrCode: null,
        pdfUrl: null,
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
        return res
          .status(400)
          .json({ success: false, message: "Token is required" });
      }

      const decoded = jwt.verify(token, "VITECARE APPOINTMENT");

      const prescription = await Prescription.findOne({
        prescriptionId: decoded.prescriptionId,
      })
        .populate("doctorId", "name")
        .populate("patientId", "name");

      if (!prescription) {
        return res
          .status(404)
          .json({ success: false, message: "Prescription not found" });
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
        "slots.patientList.patientId",
        "name",
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
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      return res.status(200).json({ success: true, data: finalData });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

export default PrescriptionController;
