'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { IoEye, IoEyeOff } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { getCurrentUserAction, login, Oauth_login } from "@/redux/actions/authActions";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import toast from 'react-hot-toast'

export default function LoginForm() {
  const { loading } = useSelector((state: any) => state?.auth);
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showError, setshowError] = useState(null)
  const [user, setUser] = useState(false)
  const [email, setEmail] = useState("hixar82635@etenx.com");
  const dispatch = useDispatch();
  const router = useRouter();
  const tabRoutes = [
    { key: "dashboard", link: "/admin" },
    { key: "host-management", link: "/admin/host-management" },
    { key: "listing-management", link: "/admin/listing-management" },
    { key: "booking-management", link: "/admin/booking-management" },
    { key: "dispute-management", link: "/admin/dispute-management" },
    { key: "payment-commission", link: "/admin/payment-commission" },
    { key: "notifications", link: "/admin/notifications-center" },
    { key: "page-management", link: "/admin/page-management" },
    { key: "events-management", link: "/admin/events-management" },
    { key: "reports-analytics", link: "/admin/reports-analytics" },
  ];

  let userPermissions = [];


  const onSubmit = async (e: any) => {
    e.preventDefault();

    try {
      // --- Extract Form Data ---
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      console.log("🚀 ~ onSubmit ~ data:", data);

      // --- Create Payload ---
      const payload = {
        email: data.email?.toString().trim(),
        password: data.password,
        provider: "credentials",
      };
      toast.success(JSON.stringify(payload))
      // --- Step 1: Login Attempt ---
      const res: any = {};
      // const res = await dispatch(login(payload));

      if (res?.status !== "success") {
        console.error("Login verify failed:", res?.message);
        // optionally: show toast.error(res?.message);
        return;
      }

      // --- Step 2: Fetch Current User ---
      const userData = [{}];
      // const userData = await dispatch(getCurrentUserAction());
      const user: any = userData?.[0];

      if (!user) {
        console.error("User not found after login");
        router.push("/");
        return;
      }

      const { role, email, permissions } = user;

      // --- Step 3: Routing Logic Based on Role ---
      if (role === "admin" && email === "admin123@gmail.com") {
        router.push("/admin");
        return;
      }

      if (role === "admin") {
        const userPermissions = permissions
          ?.replace(/[{}"]/g, "")
          ?.split(",")
          ?.map((p: string) => p.trim())
          ?.filter(Boolean) || [];

        const firstRoute = userPermissions[0];
        const hasPermission = tabRoutes.find((route) => route.key === firstRoute);

        router.push(hasPermission?.link || "/");
        return;
      }

      if (role === "user") {
        router.push("/");
        return;
      }

      // --- Default Fallback ---
      router.push("/");
    } catch (error) {
      console.error("Error in Login Verify:", error);
      // optionally: show toast.error("Unexpected error, please try again.");
    }
  };

  return (
    <div className="flex-1 flex items-center h-screen justify-center px-4 pt-6 sm:pt-12 md:pt-0 sm:px-12 ">

      <div className="absolute -bottom-36 sm:-bottom-18 shadow-md -right-36 sm:-right-24 w-[200px] h-[200px] bg-gradient-to-br from-[#5994d8] via-[#5792ec] to-[#02488d] rounded-full"></div>
      <form className="w-full max-w-md" onSubmit={onSubmit}>
        <Link href={'/'}>
          <h1 className="text-6xl hover:scale-105 duration-300 text-shadow-2xs text-shadow-[#67bbf0] font-bold text-center text-[#1DA1F2] tracking-tight select-none mb-2">
            rrely.io
          </h1>
        </Link>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Sign in</h3>
        <p className="text-sm text-gray-500 mb-8">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit
        </p>
        {/* <div className="flex items-center mt-3 ml-1 gap-2 text-sm text-[#1DA1F2]">
              <input
                type="checkbox"
                id="switch"
                checked={user}
                onChange={() => {
                  if (user) setEmail("hixar82635@etenx.com");
                  else setEmail("admin123@gmail.com");
                  setUser(!user);
                }}
                className="w-4 h-4 accent-[#1DA1F2] cursor-pointer"
              />
              <label htmlFor="switch" className="cursor-pointer">
                Switch to {user ? "User" : "Admin"} Credentials
              </label>
            </div> */}
        {/* Username */}
        <div className="mb-5 relative">
          <input
            type="text"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 bg-background/80 focus:border-[#2a5298] outline-none text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/80"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>

        {/* Password */}
        <div className="mb-5 relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            defaultValue="Admin@123"
            required
            className="w-full pl-12 pr-16 py-3 rounded-lg border bordesr-gray-200 bg-background/80  focus:border-[#2a5298] outline-none text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/80"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <circle cx="12" cy="16" r="1"></circle>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-[#2a5298]"
          >
            {showPassword ? "HIDE" : "SHOW"}
          </button>
        </div>

        {/* Options */}
        <div className="flex justify-between items-center mb-6 text-sm">
          <label className="flex items-center cursor-pointer text-gray-600">
            <input
              type="checkbox"
              name="rememberMe"
              className="hidden"
            />
            Remember me
          </label>
          <Link href="/auth/forget/send-otp">
            <span className="text-[#2a5298] hover:underline">
              Forgot Password?
            </span>
          </Link>
        </div>

        {/* Buttons */}
        <button
          type="submit"
          className="w-full cursor-pointer py-3 text-white mb-4 bg-[#1DA1F2] font-semibold rounded-lg hover:bg-[#2a5298] transition-colors"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              console.log("Google Login:", credentialResponse);
              // call OAuth API here
            } catch (error: any) {
              alert("Internal Error: " + (error.message || error.toString()));
            }
          }}
        />

        {/* Signup */}
        <div className="text-center mt-2 text-sm text-foreground/70">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-[#1DA1F2] font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}