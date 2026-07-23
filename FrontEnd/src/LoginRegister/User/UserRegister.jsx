import React, { useState } from "react";
import { toast } from "react-toastify";
import BASE_URL from "../../config/api";
import { useNavigate } from "react-router-dom";

const UserRegister = () => {

  const navigate = useNavigate();
  const [loading , setLoading ] = useState(false)

    const [Form , setForm] = useState({
        name : "" , email : "" , password : "" , checked: "" , role : ""
    })

    const Register = (e) => {
        e.preventDefault();
                  setLoading(true)


        fetch(`${BASE_URL}/api/register/user`, {
            method : "POST" , 
             headers: {
    "Content-Type": "application/json",
  },
            body : JSON.stringify(Form)
        })
        .then(res => res.json())
        .then(data => {
          
            if(data.info){
                toast.info(data.info)
                return;
            }

             if(data.error){
                 setLoading(false)
                toast.info(data.error)
                return;
            }
                              setLoading(false)

   toast.success(data.message)

   navigate("/login")



        })
    }

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#f8fafb] text-[#191c1d]">

      {/* LEFT SIDE */}
      <section className="hidden md:flex md:w-1/2 relative bg-[#0d5c63] p-12 flex-col justify-between overflow-hidden">

        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3gXZ7R7d6rQPH1MMiMHEzCxE4XulTJbSyJktEhccJuSDdGwn_asqLVoX3SsbKoqeEKDmV11nx1ZYiq2dlmcEHqEmfibE232uYhQpg_Thk15qe2sRTBk6OtCJrI-hcL04CKyzTPTtz2xzd2IK2emRCE0po0r1SSNYcwTivN1y2q3ulYHmwnclreheZ8NVpdIWR-w8XZOrcSDDvsUZZmqHHMr-ZN87PNYE3wQSpWg5HPKM4GhbuexVmIYaf5W1Lpe3Kco3AWpocwo2l"
            alt="background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#a43b31] rounded-xl flex items-center justify-center text-white">
            ❤️
          </div>
          <span className="text-white text-2xl font-semibold">VitalCare</span>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-6">
            Empathetic care, delivered digitally.
          </h1>
          <p className="mb-8 opacity-80">
            Join a healthcare platform designed to make you feel supported,
            not processed.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-xl">
              ✔️ <p>Certified Healthcare Professionals</p>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-xl">
              🔒 <p>End-to-End Health Data Security</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60 relative z-10">
          © 2024 VitalCare Health
        </p>
      </section>

      {/* RIGHT SIDE */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-white">

        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-[#004349] mb-2">
              Create your account
            </h2>
            <p className="text-gray-500">
              Start your journey toward better health today.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={Register} className="space-y-6">

            {/* Name */}
            <div>
              <label className="block mb-2 font-medium">Full Name</label>
              <input
                type="text"
                value={Form.name}
                onChange={(e)=>{
                    setForm({
                        ...Form  ,
                        name :  e.target.value
                    })
                }}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#004349]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 font-medium">Email</label>
              <input
                type="email"
                 value={Form.email}
                onChange={(e)=>{
                    setForm({
                        ...Form  ,
                        email :  e.target.value
                    })
                }}
                required
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#004349]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 font-medium">Password</label>
              <input
                type="password"
                   value={Form.password}
                onChange={(e)=>{
                    setForm({
                        ...Form  ,
                        password :  e.target.value
                    })
                }}
                required
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#004349]"
              />
            </div>


            <div>
              <label className="block mb-2 font-medium">Role</label>
              <select
  value={Form.role}
  onChange={(e) =>
    setForm({
      ...Form,
      role: e.target.value, 
    })
  }

  required
>
  <option value="">Select the Role</option>
  <option value="user">User</option>
  <option value="doctor">Doctor</option>
  <option value="shopper">Pharmacy</option>
</select>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2">
              <input type="checkbox"
                   value={Form.checked}
                onChange={(e)=>{
                    setForm({
                        ...Form  ,
                        checked :  e.target.checked
                    })
                }}
              required

              />
              <span className="text-sm text-gray-600">
                I agree to Terms & Privacy Policy
              </span>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a43b31] text-white py-4 rounded-full hover:opacity-90"
            >
              {
                loading ? "Creating Account..." : "Create Account"
              }
            </button>
          </form>

  
          {/* Footer */}
          <p className="mt-8 text-center text-gray-500">
            Already have an account?{" "}
            <span 
            onClick={()=>navigate("/login")}
            className="text-[#a43b31] font-semibold cursor-pointer"
            >
              Login
            </span>
          </p>

        </div>
      </section>
    </main>
  );
};

export default UserRegister;