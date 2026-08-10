import { Rewind } from "lucide-react";
import mongoose from "mongoose";
import Appointment from "../Model/Appointment.js";
import DoctorProfile from "../Model/DoctorProfile.js";
import DoctorSchedule from "../Model/DoctorSchedule.js";
import { getIO } from "../socket/socket.js"
import Users from "../Model/Users.js";
const DoctorControllerSchedule = {

 createSlot: async (req, res) => {
  try {
    const {
      date,
      isOff,
      start,
      maxPerSlot,
      end,
      slots,
      breaks,
    } = req.body;

    const doctorId = req.user.id;

    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const existing =
      await DoctorSchedule.findOne({
        doctorId,
        date,
      });

    const checkProfileCreated =
      await DoctorProfile.findOne({
        doctorId,
      });

    if (!checkProfileCreated) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete doctor profile first",
      });
    }

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Slot Already Done",
        data: existing,
      });
    }

    const newSlot =
      new DoctorSchedule({
        doctorId,
        date,
        isOff: isOff || false,
        start: isOff
          ? undefined
          : start,
        end: isOff
          ? undefined
          : end,
        maxPerSlot,
        slotDuration: isOff
          ? []
          : slots || [],
        breaks: isOff
          ? []
          : breaks || [],
        saved: true,
      });

    // SAVE FIRST
    await newSlot.save();

    // SOCKET (SAFE)
    try {
      const io = getIO();

      io.emit(
        "DoctorSlotAdded",
        newSlot
      );
    } catch (socketError) {
      console.log(
        "Socket emit failed:",
        socketError.message
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Slot created successfully",
      data: newSlot,
    });
  } catch (error) {
    console.error(
      "CREATE SLOT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},

  getSlots: async (req, res) => {
    try {
      const { doctorId } = req.params;

      if (!doctorId) {
        return res.status(400).json({
          success: false,
          message: "doctorId is required",
        });
      }

      const slots = await DoctorSchedule.find({ doctorId }).sort({ date: 1 });

      return res.status(200).json({
        success: true,
        data: slots,
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  },

getAll: async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);

    const search = req.query.search?.trim() || "";

    const skip = (page - 1) * limit;

    let doctorIds = null;

    // =====================================================
    // SEARCH BY DOCTOR NAME OR SPECIALTIES
    // =====================================================

    if (search) {
      const searchRegex = new RegExp(search, "i");

      // ---------------------------------------------------
      // 1. Search doctor NAME from User collection
      // ---------------------------------------------------

      const users = await Users.find({
        name: {
          $regex: searchRegex,
        },
      }).select("_id");

      const userDoctorIds = users.map((user) => user._id);

      // ---------------------------------------------------
      // 2. Search SPECIALTIES from doctorprofiles collection
      // ---------------------------------------------------

      const profiles = await DoctorProfile
        .find({
          specialties: {
            $regex: searchRegex,
          },
        })
        .select("doctorId");

      const profileDoctorIds = profiles.map(
        (profile) => profile.doctorId
      );

      // ---------------------------------------------------
      // 3. Combine both results
      // ---------------------------------------------------

      doctorIds = [
        ...new Set([
          ...userDoctorIds.map((id) => id.toString()),
          ...profileDoctorIds.map((id) => id.toString()),
        ]),
      ];

      // Convert strings back to ObjectIds
      doctorIds = doctorIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      // ---------------------------------------------------
      // No doctor found
      // ---------------------------------------------------

      if (doctorIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No doctors found",
          pagination: {
            currentPage: page,
            limit: limit,
            totalSchedules: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }
    }

    // =====================================================
    // BUILD SCHEDULE QUERY
    // =====================================================

    const query = doctorIds
      ? {
          doctorId: {
            $in: doctorIds,
          },
        }
      : {};

    // =====================================================
    // TOTAL COUNT
    // =====================================================

    const totalSchedules =
      await DoctorSchedule.countDocuments(query);

    const totalPages = Math.ceil(totalSchedules / limit);

    // =====================================================
    // FETCH SCHEDULES
    // =====================================================

    const data = await DoctorSchedule.find(query)
      .populate("doctorId", "name email role")
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // =====================================================
    // NO SCHEDULE FOUND
    // =====================================================

    if (data.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: search
          ? "No doctors or schedules found"
          : "No doctor schedules found",

        pagination: {
          currentPage: page,
          limit: limit,
          totalSchedules: totalSchedules,
          totalPages: totalPages,
          hasNextPage: false,
          hasPreviousPage: page > 1,
        },
      });
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      data,

      pagination: {
        currentPage: page,
        limit: limit,
        totalSchedules: totalSchedules,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("🔥 GET ALL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
},


AddPatient: async (req, res) => {
  try {
    const { doctorId, date, slotStart } = req.body;
    const patientId = req.user.id;

    const schedule = await DoctorSchedule.findOne({
      doctorId,
      date,
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Doctor schedule not found",
      });
    }

    const slotExists = (schedule.slotDuration || []).find(
      (s) => s.start === slotStart
    );

    if (!slotExists) {
      return res.status(404).json({
        message: "Slot not available in schedule",
      });
    }

    let appointment = await Appointment.findOne({
      doctorId,
      date,
    });

    if (!appointment) {
      const io = getIO();
      appointment = await Appointment.create({
        doctorId,
        date,
        slots: (schedule.slotDuration || []).map((s) => ({
          start: s.start,
          maxPatients: s.maxPatients || 1,
          patientList: [],
        })),
      });

      io.to(patientId).emit('appointmentBooking', appointment)

    }

    // 4️⃣ FIND SLOT
    const slot = appointment.slots.find(
      (s) => s.start === slotStart
    );

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found in appointment",
      });
    }

    // 5️⃣ CHECK ALREADY BOOKED (ANY SLOT)
    const alreadyBooked = appointment.slots.some((s) =>
      (s.patientList || []).some(
        (p) => p.patientId.toString() === patientId
      )
    );

    if (alreadyBooked) {
      return res.status(400).json({
        message: "You already booked a slot today",
      });
    }

    // 6️⃣ CHECK SLOT CAPACITY
    if ((slot.patientList || []).length >= 10) {
      return res.status(400).json({
        message: "Slot is full",
      });
    }

    //  QUEUE NUMBER
    const queueNumber = slot.patientList.length + 1;

    //  ADD PATIENT
    slot.patientList.push({
      patientId,
      queueNumber,
      status: "waiting",
    });

    // 9️⃣ SAVE
    await appointment.save();

    return res.json({
      success: true,
      message: "Appointment booked successfully",
      queueNumber,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
},

python_booking : async (req, res) => {
  try {
    const { doctorId, date, slotStart  ,patientId } = req.body;

    const schedule = await DoctorSchedule.findOne({
      doctorId,
      date,
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Doctor schedule not found",
      });
    }

    const slotExists = (schedule.slotDuration || []).find(
      (s) => s.start === slotStart
    );

    if (!slotExists) {
      return res.status(404).json({
        message: "Slot not available in schedule",
      });
    }

    let appointment = await Appointment.findOne({
      doctorId,
      date,
    });

    if (!appointment) {
      const io = getIO();
      appointment = await Appointment.create({
        doctorId,
        date,
        slots: (schedule.slotDuration || []).map((s) => ({
          start: s.start,
          maxPatients: s.maxPatients,
          patientList: [],
        })),
      });

      io.to(patientId).emit('appointmentBooking', appointment)

    }

    // 4️⃣ FIND SLOT
    const slot = appointment.slots.find(
      (s) => s.start === slotStart
    );

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found in appointment",
      });
    }

    // 5️⃣ CHECK ALREADY BOOKED (ANY SLOT)
    const alreadyBooked = appointment.slots.some((s) =>
      (s.patientList || []).some(
        (p) => p.patientId.toString() === patientId
      )
    );

    if (alreadyBooked) {
      return res.status(400).json({
        message: "You already booked a slot today",
      });
    }

    // 6️⃣ CHECK SLOT CAPACITY
    if ((slot.patientList || []).length >= 10) {
      return res.status(400).json({
        message: "Slot is full",
      });
    }

    //  QUEUE NUMBER
    const queueNumber = slot.patientList.length + 1;

    //  ADD PATIENT
    slot.patientList.push({
      patientId,
      queueNumber,
      status: "waiting",
    });

    // 9️⃣ SAVE
    await appointment.save();

    return res.json({
      success: true,
      message: "Appointment booked successfully",
      queueNumber,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
},

queueNumber : async (req, res) => {

  const {doctorId , startSlot , date}  = req.body;

  

  const schedule = await Appointment.findOne({
      doctorId,
      date,
    });


       if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    
    const slot = schedule.slots.find(
      (s) => s.start == startSlot
    );

    

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

     if (!slot.patientList) {
      return res.json({
        queueNumber : 0
      })
    }

    const totalPaitent = slot.patientList.length ; 
    console.log(totalPaitent);
    

    return res.json({
       queueNumber : totalPaitent
    })
},

upcomingAppointments: async (req, res) => {
try {
const patientId = req.user.id;

const schedules = await Appointment.find({
  "slots.patientList.patientId": patientId,
})
  .populate("doctorId", "name email")
  .lean();

const result = [];

schedules.forEach((doc) => {
  (doc.slots || []).forEach((slot) => {
    (slot.patientList || []).forEach((p) => {
      if (p.patientId.toString() === patientId) {
        result.push({
          doctorId: doc.doctorId?._id,
          doctorName: doc.doctorId?.name,
          doctorEmail: doc.doctorId?.email,

          date: doc.date,
          slotStart: slot.start,

          queueNumber: p.queueNumber,
          status: p.status,
          bookedAt: p.bookedAt,
        });
      }
    });
  });
});

if (result.length === 0) {
  return res.json({
    message: "No Upcoming Appointments",
  });
}

// optional sorting
result.sort((a, b) => {
  if (new Date(a.date) - new Date(b.date) !== 0) {
    return new Date(a.date) - new Date(b.date);
  }
  return a.slotStart.localeCompare(b.slotStart);
});

res.json({
  success: true,
  count: result.length,
  data: result,
});


} catch (err) {
console.error(err);
res.status(500).json({
message: "Server error",
});
}
} 
}

export default DoctorControllerSchedule;