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
    // =====================================================
    // PAGINATION
    // =====================================================

    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.max(
      parseInt(req.query.limit) || 10,
      1
    );

    const skip = (page - 1) * limit;

    // =====================================================
    // SEARCH / DATE
    // =====================================================

    const search =
      req.query.search?.trim() || "";

    const date =
      req.query.date?.trim() || "";

    let doctorIds = null;

    // =====================================================
    // ESCAPE REGEX
    // =====================================================

    const escapeRegex = (value) => {
      return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
    };

    // =====================================================
    // SEARCH BY DOCTOR NAME OR SPECIALTY
    // =====================================================

    if (search) {
      const safeSearch = escapeRegex(search);

      const searchRegex = new RegExp(
        safeSearch,
        "i"
      );

      // ===================================================
      // 1. SEARCH DOCTOR NAME
      // ===================================================

      const users = await Users.find({
        name: {
          $regex: searchRegex,
        },
      })
        .select("_id")
        .lean();

      // ===================================================
      // 2. SEARCH SPECIALTY
      // ===================================================

      const profiles =
        await DoctorProfile.find({
          specialties: {
            $regex: searchRegex,
          },
        })
          .select("doctorId")
          .lean();

      // ===================================================
      // 3. GET DOCTOR IDS FROM USER NAME
      // ===================================================

      // IMPORTANT:
      // Use users.map(), NOT Users.map()
      //
      // users = array returned by Users.find()
      // Users = Mongoose model

      const nameDoctorIds = users.map(
        (user) => user._id
      );

      // ===================================================
      // 4. GET DOCTOR IDS FROM SPECIALTY
      // ===================================================

      const specialtyDoctorIds =
        profiles
          .map(
            (profile) =>
              profile.doctorId
          )
          .filter(Boolean);

      // ===================================================
      // 5. COMBINE + REMOVE DUPLICATES
      // ===================================================

      doctorIds = [
        ...new Map(
          [
            ...nameDoctorIds,
            ...specialtyDoctorIds,
          ].map((id) => [
            id.toString(),
            id,
          ])
        ).values(),
      ];

      console.log(
        "Search:",
        search
      );

      console.log(
        "Name Doctor IDs:",
        nameDoctorIds
      );

      console.log(
        "Specialty Doctor IDs:",
        specialtyDoctorIds
      );

      console.log(
        "Combined Doctor IDs:",
        doctorIds
      );

      // ===================================================
      // NO DOCTORS FOUND
      // ===================================================

      if (doctorIds.length === 0) {
        return res.status(200).json({
          success: true,

          data: [],

          message:
            "No doctors found",

          pagination: {
            currentPage: page,
            limit,
            totalSchedules: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage:
              page > 1,
          },
        });
      }
    }

    // =====================================================
    // BUILD DOCTOR SCHEDULE QUERY
    // =====================================================

    const query = {};

    // =====================================================
    // FILTER BY DOCTOR IDS
    // =====================================================

    if (doctorIds !== null) {
      query.doctorId = {
        $in: doctorIds,
      };
    }

    // =====================================================
    // FILTER BY DATE
    // =====================================================

    if (date) {
      // Expected:
      // 2026-08-10

      const startDate = new Date(
        `${date}T00:00:00.000Z`
      );

      const endDate = new Date(
        `${date}T23:59:59.999Z`
      );

      // ===================================================
      // INVALID DATE
      // ===================================================

      if (
        Number.isNaN(
          startDate.getTime()
        ) ||
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid date format. Use YYYY-MM-DD",
        });
      }

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    // =====================================================
    // TOTAL SCHEDULES
    // =====================================================

    const totalSchedules =
      await DoctorSchedule.countDocuments(
        query
      );

    // =====================================================
    // TOTAL PAGES
    // =====================================================

    const totalPages =
      Math.ceil(
        totalSchedules / limit
      );

    // =====================================================
    // FETCH PAGINATED SCHEDULES
    // =====================================================

    const data =
      await DoctorSchedule.find(query)
        .populate(
          "doctorId",
          "name email role"
        )
        .sort({
          date: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // =====================================================
    // GET DOCTOR IDS FROM CURRENT PAGE
    // =====================================================

    const doctorIdsFromData =
      data
        .map(
          (item) =>
            item.doctorId?._id
        )
        .filter(Boolean);

    // =====================================================
    // FETCH PROFILES
    // =====================================================

    const profiles =
      await DoctorProfile.find({
        doctorId: {
          $in: doctorIdsFromData,
        },
      })
        .select(
          "doctorId specialties title experience bio"
        )
        .lean();

    // =====================================================
    // CREATE PROFILE MAP
    // =====================================================

    const profileMap =
      new Map();

    profiles.forEach(
      (profile) => {
        if (profile.doctorId) {
          profileMap.set(
            profile.doctorId.toString(),
            profile
          );
        }
      }
    );

    // =====================================================
    // MERGE SCHEDULE + PROFILE
    // =====================================================

    const finalData =
      data.map(
        (schedule) => {
          const doctorId =
            schedule.doctorId?._id?.toString();

          const profile =
            profileMap.get(
              doctorId
            );

          return {
            ...schedule,

            doctorProfile:
              profile || null,
          };
        }
      );

    // =====================================================
    // NO RESULTS
    // =====================================================

    if (
      finalData.length === 0
    ) {
      return res.status(200).json({
        success: true,

        data: [],

        message:
          search || date
            ? "No doctors or schedules found"
            : "No doctor schedules found",

        pagination: {
          currentPage: page,
          limit,
          totalSchedules,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      });
    }

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      data: finalData,

      pagination: {
        currentPage: page,

        limit,

        totalSchedules,

        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    // =====================================================
    // ERROR
    // =====================================================

    console.error(
      "🔥 GET ALL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to fetch doctor schedules",
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