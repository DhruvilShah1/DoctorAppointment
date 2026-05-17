import React, { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import UserRegister from './LoginRegister/User/UserRegister'
import UserLogin from './LoginRegister/User/UserLogin'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from './LoginRegister/User/MainLayout'
import DashboardContent from './LoginRegister/User/DashboardContent'
import RoleMiddleware from './RoleMiddleware'
import DoctorLayout from './LoginRegister/Doctor/DoctorLayout'
import DoctorDashboard from './LoginRegister/Doctor/DoctorDashboard'
import UserAppointmentShow from './LoginRegister/User/UserAppointmentShow'
import ScheduleDoctor from './LoginRegister/Doctor/ScheduleDoctor'
import UserQueue from './LoginRegister/User/UserQueue'
import { useAuth } from './AuthProvider'
import { toast } from 'react-toastify'
import DoctorProfileEditor from './LoginRegister/Doctor/DoctorProfileEditor'
import ViewDoctorProfile from './LoginRegister/User/ViewDoctorProfile'
import UserRecord from './LoginRegister/User/UserRecord'
import QRScanner from './pharmacy-side-portal/QRScanner'
import PharmacySidebar from './pharmacy-side-portal/PharmacySidebar'
import PharmacyDashboard from './pharmacy-side-portal/PharmacyDashboard'
import DoctorPrescriptionTable from './LoginRegister/Doctor/DoctorPrescriptionTable'
import { socket } from './socket/FrontendSocketConnection';

const App = () => {
  

  const {user}  = useAuth();

  const [queueList, setQueueList] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [currentQueueNumber , setQueueNumber] = useState(0)
  const [totalPatient ,  setTotal] = useState(null);
  const [completedpatient , ssetCompleted]  = useState(null);
  const [data , setData] = useState(null);
  const [showList, setShowList] = useState(false);

    

  const fetchAppointment = async (date, slot) => {
    try {
      const refreshRes = await fetch(
        `http://localhost:5000/api/refresh-token`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const refreshData = await refreshRes.json();
      const token = refreshData.newAccessToken;

      const res = await fetch(
        `http://localhost:5000/api/get/full/slot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ date, slot }),
        }
      );

      const data = await res.json();

      setTotal(data.total)
      ssetCompleted(data.completed)
      console.log("Fetch Appointment");
      
      console.log(data);
      const patients = data?.patients || [];

      setQueueList(patients);

      setData(data)

      const current = patients.find((p) => p.status === "current");
      setCurrentNumber(current?.queueNumber || 0);
      setQueueNumber(data?.slot?.currentPatientIndex)
      
    console.log("Me");
      
      // console.log(me);
      
      // setMyData(me || {});

    } catch (err) {
      console.log(err);
    }
  };

  const reconnectToRoom = () => {
    const savedRoom = localStorage.getItem("roomId");
    const savedData = JSON.parse(localStorage.getItem("appointment"));
  
    if (!savedRoom || !savedData) return;
  
    socket.emit("patient:join", {
      doctorId: savedData.doctorId,
      date: savedData.date,
      slot: savedData.slot,
      patientId: user?.id,
    });
  
    console.log("Reconnected to room:", savedRoom);
  };

useEffect(() => {
  const handleStart = async (data) => {
    toast.success("Doctor has started appointment");

    await fetchAppointment(data.date, data.slot);

    setShowList(true);
  };

  socket.on("queue:started", handleStart);
  socket.on("queue:status:updated", async (data) => {
  toast.success(data.message);

  await fetchAppointment(data.date, data.slot);
});

  return () => {
    socket.off("queue:started", handleStart);
  };
}, []);

reconnectToRoom();

useEffect(() => {
  const handleFinish = (data) => {

        localStorage.clear();

    setShowList(false);
    setQueueList([]);
    setCurrentNumber(0);
    setQueueNumber(0);
    setTotal(null);
    ssetCompleted(null);
    setData(null);
  };

  socket.on("queue:status:finished", handleFinish);

  return () => {
    socket.off("queue:status:finished", handleFinish);
  };
}, []);

  return (
        <Routes>
      <Route path="/" element={<UserRegister />} />
            <Route path="/login" element={<UserLogin />} />


           <Route element={<ProtectedRoute />}>
  <Route element={<RoleMiddleware allowedRoles={['user']} />}>
    <Route element={<MainLayout />}>
      
      <Route path="/dashboard" element={<DashboardContent />} />
      <Route path="/appointments" element={<UserAppointmentShow />} />

      <Route path='/queue'  element={
        <UserQueue
       queueList={queueList}  showList={showList} currentQueueNumber={currentQueueNumber} 
      currentNumber={currentNumber} data={data}
      totalPatient={totalPatient}   completedpatient={completedpatient}
      />
      }/>      

      <Route path='/profile/:doctorId' element={<ViewDoctorProfile/>}/>

      <Route path='/records' element={<UserRecord/>}/>

        <Route path="*" element={
          <div>
            Nooo Broo oooo
          </div>
        } />


    </Route>
  </Route>
</Route>


           <Route element={<ProtectedRoute />}>
             <Route element={<RoleMiddleware allowedRoles={['doctor']} />}>

                 <Route element={<DoctorLayout />}>
            <Route path='/dashboard/doctor' element={<DoctorDashboard />}/>
            <Route path='/schedule' element={<ScheduleDoctor/>}/>

            <Route path='doctor/profile' element={<DoctorProfileEditor/>}/>

            <Route path='/patient/table' element={<DoctorPrescriptionTable/>}/>
            </Route>


</Route>
</Route>

{/* <Route element={<ProtectedRoute />}>
              <Route element={<RoleMiddleware allowedRoles={['pharmacy']} />}> */}
               <Route element={<PharmacySidebar />}>
  <Route
    path="/dashboard/pharmacy"
    element={<PharmacyDashboard />}
  />
</Route>
              {/* </Route>
            </Route> */}


         


    </Routes>

  )
}

export default App
