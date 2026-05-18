import Appointment from "../Model/Appointment.js";
import DoctorSchedule from "../Model/DoctorSchedule.js";
import Prescription from "../Model/Prescription.js";
import { getIO } from "../socket/socket.js";

const AppointmentController = {


    totalDayPatient: async (req, res) => {
  try {
    const { date } = req.body;
    const doctorId = req.user.id ;

    const appointment = await Appointment.findOne({
      doctorId,
      date,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No appointment found for this date",
      });
    }

    let totalPatients = 0;

    appointment.slots.forEach((slot) => {
      if (slot.patientList && slot.patientList.length > 0) {
        totalPatients += slot.patientList.length;
      }
    });

    return res.status(200).json({
      doctorId,
      date,
      totalPatients,

    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
} , 



getSlotsDates: async (req, res) => {
  try {
    const { date } = req.body;
    const doctorId = req.user.id;

    const data = await DoctorSchedule.findOne({
      date,
      doctorId,
    });

    if (!data) {
      return res.status(404).json({
        message: "No schedule found for this date",
      });
    }

    return res.status(200).json({
      slots: data.slotDuration, // make sure this field exists
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
} ,


getPatientBySlots: async (req, res) => {
  try {
    const { date, slot } = req.body;
    const doctorId = req.user.id;

    const data = await Appointment.findOne({
      date,
      doctorId,
      "slots.start": slot,
    }).populate("slots.patientList.patientId", "name email");

    if (!data) {
      return res.status(404).json({
        message: "No schedule found for this slot",
      });
    }

    const matchedSlot = data.slots.find(
      (s) => s.start === slot
    );

    return res.status(200).json({
      slot: matchedSlot,
      patients: matchedSlot?.patientList || [],
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
},


startQueuWithslots: async (req, res) => {
  try {
    const { date, slot } = req.body;
    const doctorId = req.user.id;

    console.log("REQ BODY:", req.body);
    console.log("DOCTOR:", doctorId);

    // IMPORTANT FIX: normalize date
    const formattedDate = new Date(date)
      .toISOString()
      .split("T")[0];

    const appointment = await Appointment.findOne({
      doctorId,
      date: formattedDate,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "No appointment found for this date",
      });
    }

    const matchedSlot = appointment.slots.find(
      (s) => s.start === slot
    );

    if (!matchedSlot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    if (matchedSlot.isCompleted) {
      return res.status(400).json({
        message: "Slot already completed",
      });
    }

    if (matchedSlot.isQueueStarted) {
      return res.status(400).json({
        message: "Queue already started",
      });
    }

    matchedSlot.isQueueStarted = true;
    matchedSlot.startedAt = new Date();

    await appointment.save();

    // SOCKET SAFE CALL
    let io;
    try {
      io = getIO();
    } catch (err) {
      console.log("Socket not ready, skipping emit");
    }

    if (io) {
      const roomId = `${doctorId}_${formattedDate}_${slot}`;

      io.to(roomId).emit("queue:started", {
        message: "Queue has started",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Queue started successfully",
      slot: matchedSlot,
    });

  } catch (error) {
    console.error("START QUEUE ERROR:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
},

getFullSlots: async (req, res) => {
  try {
    const { date, slot } = req.body;

   const data = await Appointment.findOne({
  date,
  "slots.start": slot,
}).populate({
  path: "slots.patientList.patientId",
  select: "name", 
});

    if (!data) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }


     const selectedSlot = data.slots.find(
      (s) => s.start === slot
    );

const patients = selectedSlot?.patientList || [];

const total = patients.length;

const completed = patients.filter((p) =>
  ["done", "notcome"].includes(p.status?.toLowerCase())
).length;


   

    return res.status(200).json({
      total , completed , 
      currentPatientIndex : data.currentPatientIndex , 
      slot: selectedSlot,
      patients: selectedSlot?.patientList || [],
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}


, 

getTodayAppointment: async (req, res) => {
  try {
    const userId = req.user.id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

   const appointment = await Appointment.findOne({
  date: { $gte: start, $lte: end },

  slots: {
    $elemMatch: {
      isCompleted: false,
      "patientList.patientId": userId,
    },
  },
})
.populate("doctorId")
.populate("slots.patientList.patientId");


    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "No appointment found for today",
        data: null,
      });
    }

    let userSlot = null;

    for (const slot of appointment.slots) {
      const found = slot.patientList.find(
        (p) =>
          p.patientId?._id?.toString() === userId.toString()
      );

      if (found) {
        userSlot = {
          slotStart: slot.start,
          slotEnd: slot.end,
          status: found.status,
          queueNumber: found.queueNumber,
        };
        break;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        date: appointment.date,
        doctor: {
          id: appointment.doctorId?._id,
          name: appointment.doctorId?.name,
        },
        slot: userSlot,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
},

updateQueueByStatus: async (req, res) => {
  try {
    const { slot, date, patientId, status } = req.body;
    const doctorId  = req.user.id; 

const roomId = `${doctorId}_${date}_${slot}`;

    if (!slot || !date || !patientId || !status) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const appointment = await Appointment.findOne({
      date,
      "slots.start": slot,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }


    const selectedSlot = appointment.slots.find(
      (s) => s.start === slot
    );

    if (!selectedSlot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    const patientIndex = selectedSlot.patientList.findIndex(
  (p) => p?.patientId?.toString() === patientId.toString()
);

    if (patientIndex === -1) {
      return res.status(404).json({
        message: "Patient not found in this slot",
      });
    }

    const patient = selectedSlot.patientList[patientIndex];

    const validStatus = ["waiting", "current", "called" , "done", "skipped", "notcome" , "next"];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const io = getIO();


    if (patient.status === "done" || patient.status === "notcome") {
      return res.status(400).json({
        message: "Patient already completed",
      });
    }

    if (status === "current") {
      selectedSlot.patientList.forEach((p) => {
        if (p.status === "current") {
          p.status = "done";
        }
      });

      patient.status = "current";
    }

    else if (status === "done") {
      patient.status = "done";

        io.to(roomId).emit("queue:status:updated", {
        date , slot , 
        message : "Queue Updated"
      })
    }

     else if (status === "called") {
      patient.status = "called";
      selectedSlot.currentPatientIndex +=1 



      io.to(roomId).emit("queue:status:updated", {
        date , slot , 
        message : "Queue Updated"
      })
    }

    else if (status === "next") {
      patient.status = "next";
      selectedSlot.currentPatientIndex +=1 
      io.to(roomId).emit("queue:status:updated", {
        date , slot , 
        message : "Queue Updated"
      })
    }



    else if (status === "notcome") {
      patient.status = "notcome";

        io.to(roomId).emit("queue:status:updated", {
        date , slot , 
        message : "Queue Updated"
      })
    }

    else if (status === "skipped") {
      
      const skippedPatient = selectedSlot.patientList.splice(patientIndex, 1)[0];

      skippedPatient.status = "waiting"; 

      selectedSlot.patientList.push(skippedPatient);

      selectedSlot.patientList.forEach((p, index) => {
        p.queueNumber = index + 1;
      });

          io.to(roomId).emit("queue:status:updated", {
        date , slot , 
        message : "Queue Updated"
      })

    }

    await appointment.save();

    return res.json({
      success: true,
      message: "Status updated successfully",
      patients: selectedSlot.patients,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
},

finishedSlot: async (req, res) => {
  try {
    const { slot, date } = req.body;
    const doctorId = req.user.id;

    if (!slot || !date) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const appointment = await Appointment.findOne({
      date,
      "slots.start": slot,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const existingSlot = appointment.slots.find(
      (s) => s.start === slot
    );

    if (!existingSlot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    if (existingSlot.isCompleted) {
      return res.status(400).json({
        message: "Slot already completed",
      });
    }
    existingSlot.isCompleted = true;

    await appointment.save(); 

    const roomId = `${doctorId}_${date}_${slot}`;
    const io = getIO();


    io.to(roomId).emit("queue:status:finished", {
      date,
      slot,
      message: `${slot} is finished by ${req.user.name}`,
    });

    return res.status(200).json({
      success: true,
      message: "Slot marked as finished",
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}, 

finishAppointment: async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await Appointment.find({
      slots: {
        $elemMatch: {
          "patientList.patientId": userId,
        },
      },
    })
      .populate("doctorId", "name")
      .populate("slots.patientList.patientId", "name");

    if (!appointments.length) {
      return res.status(400).json({
        success: false,
        message: "No appointment found",
      });
    }

    const filteredAppointments = appointments.map((appointment) => {
      const filteredSlots = appointment.slots.filter((slot) =>
        slot.patientList.some(
          (p) =>
            p.patientId?._id?.toString() === userId.toString() &&
            p.status === "done"
        )
      );

      return {
        ...appointment._doc,
        slots: filteredSlots,
      };
    });
    const slotData = filteredAppointments?.[0]?.slots?.[0];


      const slotStart = slotData.start;
      const appointmentDate = filteredAppointments?.[0]?.date;

     const prescription = await Prescription.findOne({
        patientId: userId,
        slot: slotStart,
      }).populate('doctorId' ,'name email');

  return res.status(200).json({
  success: true,
  appointments: filteredAppointments,
  prescriptionId: prescription?.pdfUrl,
});

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
},

}


export default AppointmentController;