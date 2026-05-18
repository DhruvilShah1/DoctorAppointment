import express from "express";
import RegisterAndLoginController from "../Controller/RegisterAndLoginController.js";
import DoctorControllerSchedule from "../Controller/DoctorSlot.js";
import verifyToken from "../Middleware/verifyToken.js"
import { authorizeRoles } from "../Middleware/RoleMiddleware.js";
import AppointmentController from "../Controller/AppointmentController.js";
import DoctorController from "../Controller/DoctorController.js";
import PrescriptionController from "../Controller/PrescriptionController.js";
import upload from "../Config/uploads.js";

const router = express.Router();

router.post('/register/user' ,RegisterAndLoginController.register)
router.post('/login/user' ,RegisterAndLoginController.login)

router.post('/refresh-token' ,RegisterAndLoginController.refreshToken)

router.get("/me", verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email ,
    role: req.user.role  

  });
});

// Doctor 
router.post('/create/slot', verifyToken , authorizeRoles('doctor') ,  DoctorControllerSchedule.createSlot)
router.get('/doctor/:doctorId', DoctorControllerSchedule.getSlots)
router.get("/get/all", DoctorControllerSchedule.getAll);
router.post("/add/patient", verifyToken , authorizeRoles("user") ,  DoctorControllerSchedule.AddPatient);
router.post('/take/queue/number' , DoctorControllerSchedule.queueNumber);
router.get('/take/appointments', verifyToken , DoctorControllerSchedule.upcomingAppointments);


// Appointment

router.post('/total/patient/day' , verifyToken , authorizeRoles('doctor') , AppointmentController.totalDayPatient);
router.post('/get/slots' , verifyToken , authorizeRoles('doctor') ,AppointmentController.getSlotsDates);
router.post('/take/patient' , verifyToken , authorizeRoles('doctor') , AppointmentController.getPatientBySlots);
router.get('/today/appointment' , verifyToken , authorizeRoles('user') , AppointmentController.getTodayAppointment);

router.post('/start/queue' , verifyToken , AppointmentController.startQueuWithslots );

router.post('/get/full/slot' , verifyToken, AppointmentController.getFullSlots)
router.get("/doctor/profile/:doctorId", DoctorController.getDoctorProfile);
router.get('/finishAppointment', verifyToken , authorizeRoles('user')  , AppointmentController.finishAppointment);

router.patch(
  "/update/patient/status",
  verifyToken,
  AppointmentController.updateQueueByStatus
);




router.post('/finsh/slot', 
  verifyToken ,
  AppointmentController.finishedSlot
);


// Doctor Profile 

router.post('/create/doctor/profile', verifyToken , authorizeRoles("doctor") , DoctorController.createProfile)
router.get('/get/doctor/profile', verifyToken , authorizeRoles("doctor") , DoctorController.getMyProfile)


// create Prescription
router.post('/create/prescription' ,upload.single("signature") ,  verifyToken , authorizeRoles('doctor') , PrescriptionController.createPrescription);

router.post('/verify/prescription' , PrescriptionController.verifyPrescription);
router.get('/get/prescription/doctor' , verifyToken , authorizeRoles('doctor') , PrescriptionController.getByDoctorId)


router.get("/test", async (
  req,
  res
) => {
  try {
    const result =
      await imagekit.upload({
        file:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        fileName:
          "test.jpg",
      });

    res.json(result);
  } catch (err) {
    console.log(err);

    res.json(err);
  }
});


export default router;