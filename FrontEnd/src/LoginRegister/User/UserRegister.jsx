import React, { useState } from "react";
import { toast } from "react-toastify";
import {BASE_URL} from "../config/api.js";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

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
          <div className="mb-0">
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
  <label className="block mb-3 font-semibold text-gray-700">
    Account Type
  </label>

  <div className="relative">

    <select
      value={Form.role}
      onChange={(e) =>
        setForm({
          ...Form,
          role: e.target.value,
        })
      }
      required
      className="
        w-full
        appearance-none
        bg-white
        border
        border-gray-300
        rounded-2xl
        px-5
        py-4
        text-gray-700
        font-medium
        outline-none
        cursor-pointer
        
        focus:border-teal-500
        focus:ring-4
        focus:ring-teal-100

        transition-all
        duration-200
      "
    >

      <option value="">
        Select Account Type
      </option>

      <option value="user">
        👤 Patient
      </option>

      <option value="doctor">
        🩺 Doctor
      </option>

      <option value="shopper">
        💊 Pharmacy
      </option>


    </select>


    {/* Custom Arrow */}

    <div
      className="
        pointer-events-none
        absolute
        right-5
        top-1/2
        -translate-y-1/2
        text-gray-500
      "
    >
      ▼
    </div>


  </div>
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

          <div className="
flex
items-center
gap-3
my-5
">

<div className="h-px bg-gray-200 flex-1"/>

<span className="text-gray-400 text-sm">
OR
</span>

<div className="h-px bg-gray-200 flex-1"/>


</div>

          <button

type="button"

onClick={()=>
window.location.href=`${BASE_URL}/api/auth/google`
}


className="
w-full
border
py-3
rounded-2xl
flex
items-center
justify-center
gap-3
font-semibold
hover:bg-gray-50
transition
"
>


<FcGoogle size={24}/>


Continue with Google


</button>


  
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