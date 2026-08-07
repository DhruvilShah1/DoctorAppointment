import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BASE_URL from "../../config/api.js";
import { useAuth } from "../../AuthProvider";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

const UserLogin = () => {


  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loginBButton , setLoading] = useState(false)

    const [Form , setForm] = useState({
        email : "" , password : ""
    })



      const Login = (e) => {
            e.preventDefault();
            setLoading(true)

            
    
fetch(`${BASE_URL}/api/login/user`, {
                method : "POST" , 
                 credentials: "include",
                 headers: {
        "Content-Type": "application/json",
      },
                body : JSON.stringify(Form)
            })
            .then(res => res.json())
            .then(data => {
                if(data.info){
                    toast.info(data.info)
                    setLoading(false)
                    return;
                }
    
                 if(data.error){
                    setLoading(false)
                    toast.info(data.error)
                    return;
                }
                              setLoading(false)
       setUser(data.user);

       toast.success(data.message)

       const role  = data.user.role ; 
     

       if (role === 'user'){
        setLoading(false)
        navigate('/dashboard')
       }else if (role === 'doctor'){
                setLoading(false)

          navigate('/doctor/profile')
       }
       else if (role === 'shopper'){
                setLoading(false)

        navigate('/dashboard/pharmacy/profile')
       }
            })
        }

  return (
    <main className="flex min-h-screen">

      {/* LEFT SIDE */}
      <section className="hidden lg:flex flex-col w-1/2 bg-[#004349] relative overflow-hidden">

        <div className="absolute inset-0 opacity-20">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEqS1c18Cau_bYKMZdcdQPrCdmoue6TM_13xn8HQMBRL-RhWPGrz79ihr5KPReUCkNenrkysc1bT06bqSEc9CYTXKjni60pqdzo2HBoC1FPvkmM8ONT0Rq9RjgbOTAqIzODUUk4vKVsw0-K2W8pXIhycwy_LnHtdiFcMaeJXzXGeho2ZJKI8rArldyxhEtLhxApRv3FaFtuvsUJwxd1glmi-XdIujnA6s3dwfvsY9DdjfSe5jKYeplffhlEXbb4gjaEzSTgb8beIzi"
            alt="bg"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full px-12 space-y-6 text-white">

          <div className="flex items-center space-x-3">
            <div className="bg-white p-3 rounded-xl text-[#004349]">
              🏥
            </div>
            <h1 className="text-3xl font-bold">VitalCare</h1>
          </div>

          <h1 className="text-4xl font-bold leading-tight">
            Your health journey, <br />
            <span className="text-[#8fd1d9]">clarified and supported.</span>
          </h1>

          <p className="text-white/80 max-w-md">
            Access your records, appointments, and healthcare team in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6 max-w-md">

            <div className="bg-white/10 p-4 rounded-xl">
              🔐
              <p className="text-xs mt-2">Secure Access</p>
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
              ⚡
              <p className="text-xs mt-2">Fast Appointments</p>
            </div>

          </div>

        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">

        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-[#004349]">
              Welcome back
            </h2>
            <p className="text-gray-500">
              Please enter your details to sign in.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={Login} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={Form.email}
               onChange={(e)=>{
                setForm({
                    ...Form , 
                    email : e.target.value
                })

               }}
               required
                placeholder="name@example.com"
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#004349]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                  value={Form.password}
               onChange={(e)=>{
                setForm({
                    ...Form , 
                    password : e.target.value
                })

               }}
                placeholder="••••••••"
                required
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#004349]"
              />
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2">
              <input type="checkbox" />
              <span className="text-sm text-gray-600">
                Keep me signed in
              </span>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loginBButton}
              className="w-full bg-[#a43b31] text-white py-4 rounded-full hover:opacity-90"
            >
              {loginBButton ? "Signing In..." : "Sign In"}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">

      <button
  className="
    cursor-pointer
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-xl
    border
    border-gray-300
    bg-white
    py-3
    px-4
    text-sm
    sm:text-base
    font-semibold
    text-gray-700
    transition-all
    duration-200
    hover:bg-gray-100
    hover:shadow-md
    active:scale-95
    whitespace-nowrap
  "
  onClick={() => window.location.href = `${BASE_URL}/api/auth/google`}
>

  <FcGoogle 
    size={22}
    className="flex-shrink-0"
  />

  <span className="truncate">
    Continue with Google
  </span>

</button>

    <button
  disabled
  className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-gray-300 bg-gray-100 py-3 font-medium text-gray-400 opacity-70"
>
  <FaFacebook size={22} />
  <span>Continue with Facebook</span>
</button>

          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm">
            Don’t have an account?{" "}
            <span
            
            className="text-[#a43b31] font-semibold cursor-pointer"
            onClick={() => navigate("/")}
            >
              Register
            </span>
          </p>

        </div>
      </section>

    </main>
  );
};

export default UserLogin;