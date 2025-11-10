"use client";
// import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { signupAction } from "@/redux/actions/authActions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpForm() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const dispatch = useDispatch();

  const { loading } = useSelector((state: any) => state?.auth);
  // console.log("🚀 ~ Home ~ loading:", loading)
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const onSubmit = async (e: any) => {
    e.preventDefault();
    let data = Object.fromEntries(new FormData(e.currentTarget));
    // console.log("🚀 ~ onSubmit ~ data:", data)

    const payload = {
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      phone: data.phone,
      password: data.password,
      provider: "credentials",
    };

    try {
      const check = {};
      // const check = await dispatch(signupAction(payload));
      if (check) {
        router.push("/auth/verify-email?email=" + data.email);
      }
    } catch (error) {
      console.error("Signup Error", error);
      alert("Internal Error" + (error as Error).message || (error as Error).toString());
    }
  };
  const validatePhone = (value: string) => {
    // Allows optional +, spaces, parentheses, and dashes, 10–15 digits total
    const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;

    if (!value) {
      setError("Phone number is required");
    } else if (!phoneRegex.test(value.replace(/\s+/g, ""))) {
      setError("Please enter a valid phone number (10–20 digits)");
    } else {
      // Remove non-digits to count digits only
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 20) {
        setError("Please enter a valid phone number (10–20 digits)");
      } else {
        setError("");
      }
    }
  };
  const handleChange = (e: any) => {
    const value = e.target.value;
    setPhone(value);
    validatePhone(value);
  };

  return (
    <div className="flex-1 flex items-center h-full justify-center px-4 py-6 sm:py-12 md:py-6 sm:px-12 ">

      <div className="absolute -bottom-36 sm:-bottom-18 shadow-md -right-36 sm:-right-24 w-[200px] h-[200px] bg-gradient-to-br from-[#5994d8] via-[#5792ec] to-[#02488d] rounded-full"></div>

      <form
        onSubmit={onSubmit}
        className="w-full flex lg:max-w-lg flex-col h-full justify-between tesxt-[#0C7ABF]"
      >
        <Link href={'/'}>
          <h1 className="text-6xl hover:scale-105 duration-300 text-shadow-2xs text-shadow-[#67bbf0] font-bold text-center text-[#1DA1F2] tracking-tight select-none mb-2">
            rrely.io
          </h1>
        </Link>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Sign up</h3>
        <p className="text-sm text-gray-500 mb-8">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit
        </p>

        {/* --- Input Fields --- */}
        <div className="w-full mt-3 flex flex-col">
          {/* First & Last Name */}
          <div className="flex flex-row gap-3">
            <div className="flex flex-col mb-4 w-full">
              <label htmlFor="firstname" className="text-xs font-semibold text-orange-600s">
                First Name
              </label>
              <input
                id="firstname"
                name="firstname"
                type="text"
                placeholder="Enter first name"
                required
                className="rounded-md border border-[#D1E8FF] px-3 py-4 text-xs mt-1 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"
              />
            </div>

            <div className="flex flex-col mb-4 w-full">
              <label htmlFor="lastname" className="text-xs font-semibold text-indigo-600s">
                Last Name
              </label>
              <input
                id="lastname"
                name="lastname"
                type="text"
                placeholder="Enter last name"
                required
                className="rounded-md border border-[#D1E8FF] px-3 py-4 text-xs mt-1 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col mb-4 w-full">
              <label htmlFor="email" className="text-xs font-semibold text-indigo-600s">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email"
                required
                className="rounded-md border border-[#D1E8FF] px-3 py-4 text-xs mt-1 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"
              />
            </div>

            <div className="flex flex-col mb-4 w-full">
              <label htmlFor="phone" className="text-xs font-semibold text-indigo-600f">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={15}
                className={`rounded-md border ${error ? "border-[#E63946]" : "border-[#D1E8FF]"
                  } px-3 py-4 text-xs mt-1 focus:ring-2 ${error ? "focus:ring-[#E63946]" : "focus:ring-[#1DA1F2]"
                  } focus:outline-none`}
              />
              {error && <p className="text-[#E63946] text-[11px] mt-1">{error}</p>}
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col mb-2 relative">
            <label htmlFor="password" className="text-xs font-semibold text-indigo-600s">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={isVisible ? "text" : "password"}
              placeholder="Enter password"
              required
              className="rounded-md border border-[#D1E8FF]  px-3 py-4 text-xs mt-1 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none pr-9"
            />
            <button
              type="button"
              onClick={toggleVisibility}
              aria-label="Toggle password visibility"
              className="absolute right-3 top-7 text-[#1DA1F2]"
            >
              {isVisible ? <IoEye /> : <IoEyeOff />}
            </button>
          </div>

          {/* Remember Me */}
          <div className="flex mt-4 items-center justify-between w-full">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                name="isRemember"
                required
                className="accent-[#1DA1F2]"
              />
              Remember me
            </label>
          </div>
        </div>

        {/* --- Buttons --- */}
        <div className="w-full mt-4 flex text-xs font-semibold flex-col gap-2 items-center justify-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold text-sm bg-[#1DA1F2] text-white py-4 rounded-md hover:bg-[#2a5298] transition"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>

          <span className="text-gray-500 text-[11px]">Or</span>

          {/* Google Sign-up */}
          <GoogleLogin
            text="signup_with"
            onSuccess={async (credentialResponse) => {
              try {
                // const g_check = await dispatch(
                //   signupAction({
                //     credential: credentialResponse.credential,
                //     provider: "google",
                //   })
                // );
                // if (g_check) router.push("/host");
              } catch (error: any) {
                console.error("Signup Error", error);
                alert("Internal Error " + (error.message || error.toString()));
              }
            }}
          />
        </div>

        {/* Sign in link */}
        <div className="text-center mt-2 text-xs w-full">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#1DA1F2] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}