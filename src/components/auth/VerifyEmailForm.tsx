"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Otp_Verify_Action } from "@/redux/actions/authActions";
import { CgSpinner } from "react-icons/cg";
import Link from "next/link";

export function VerifyEmail() {
    const { loading, Verifyloading } = useSelector((state: any) => state?.auth);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [value, setValue] = useState("");
    const [errors, setErrors] = useState<any>({});
    const [loadingTime, setLoadingTime] = useState(false);

    // RESEND control timer (prevents spamming the resend link)
    const [resendTimer, setResendTimer] = useState(0);
    const resendIntervalRef = useRef(null);

    // OTP validity timer (starts on mount & on successful resend)
    const [validitySec, setValiditySec] = useState(30);
    const validityIntervalRef = useRef(null);

    const dispatch = useDispatch();
    const param = useSearchParams();
    const deyemail = param.get("token") || 'jfhgwuewer89yf8dswofhsda';
    const router = useRouter();

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.replace(/\D/, ""); // allow only digits
        const newValue = [...value];
        newValue[index] = val;
        setValue(newValue.join(''));


        // Move focus to next box automatically
        if (val && e.target.nextElementSibling instanceof HTMLInputElement) {
            e.target.nextElementSibling.focus();
        }

        // Clear errors if any
        if (errors?.otp) setErrors({});
    };

    // --- Cleanup on unmount
    useEffect(() => {
        return () => {
            if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
            if (validityIntervalRef.current)
                clearInterval(validityIntervalRef.current);
        };
    }, []);

    // --- Start / Restart OTP Validity Countdown
    const startOtpValidity = (seconds = 30) => {
        if (validityIntervalRef.current) clearInterval(validityIntervalRef.current);
        setValiditySec(seconds);

        // validityIntervalRef.current = setInterval(() => {
        //   setValiditySec((prev) => {
        //     if (prev <= 1) {
        //       clearInterval(validityIntervalRef.current);
        //       validityIntervalRef.current = null;
        //       return 0;
        //     }
        //     return prev - 1;
        //   });
        // }, 1000);
    };

    // Start validity timer on first mount
    useEffect(() => {
        startOtpValidity(30);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Start / Restart RESEND cooldown countdown
    const startResendCooldown = (seconds = 30) => {
        if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
        setResendTimer(seconds);

        // resendIntervalRef.current = setInterval(() => {
        //   setResendTimer((prev) => {
        //     if (prev <= 1) {
        //       clearInterval(resendIntervalRef.current);
        //       resendIntervalRef.current = null;
        //       return 0;
        //     }
        //     return prev - 1;
        //   });
        // }, 1000);
    };

    // --- Submit handler
    const onSubmit = async (e: any) => {
        e.preventDefault();
        if (submitLoading) return;
        setSubmitLoading(true);
        // Hard checks
        // if (validitySec === 0) {
        //   setErrors({ otp: "OTP expired. Please resend a new code." });
        //   return;
        // }
        // if (value.length !== 6) {
        //   setErrors({ otp: "OTP required" });
        //   return;
        // }
        const email = deyemail;
        // const email = decrypt(deyemail!);
        // console.log("email------------------", email);
        const payload: any = { email, otp: value };
        // console.log("emial ----------------",email);
        // console.log("emial payload----------------", payload);
        const token =email;
        // const token = encrypt(email);
        // console.log("emial token----------------", token);
        try {
            const res: any = {};
            //   const res = await dispatch(Otp_Verify_Action(payload));

            if (res?.status === "success") {
                router.push(`/auth/forget/confirm-password?token=${token}`);
            } else {
                console.error("OTP verify failed:", res?.message);
                setErrors({ otp: res?.message || "Invalid OTP" });
            }
        } catch (error) {
            console.error("Verification Error", error);

            // alert("Internal Error " + (error?.message || String(error)));
        } finally {
            setSubmitLoading(false);
        }

        // try {
        //   const res = await dispatch(Otp_Verify_Action(payload));
        //   if (res?.status === "success") {
        //     router.push("/auth/confirm-password");
        //   } else {
        //     console.error("OTP verify failed:", res?.message);
        //     setErrors({ otp: res?.message || "Invalid OTP" });
        //   }
        // } catch (error) {
        //   console.error("Verification Error", error);
        //   alert("Internal Error " + (error?.message || String(error)));
        // }
    };

    // --- Resend handler (resets both resend cooldown + validity timer)
    const handleResend = async () => {
        if (resendTimer > 0 || loadingTime) return;
        try {
            setLoadingTime(true);
            startResendCooldown(30);

            const dynamicEmail = await { email: deyemail! };
            // const dynamicEmail = await { email: decrypt(deyemail!) };
            console.log("dynamicEmail*****************", dynamicEmail);
            const payload = dynamicEmail;
            const res: any = {};
            // const res = await dispatch(resendnewotp(payload));

            // On successful resend, reset OTP input & restart OTP validity window
            setValue("");
            setErrors({});
            startOtpValidity(30);

            // Optional UX pause
            await new Promise((r) => setTimeout(r, 600));

            if (res?.status !== "success") {
                // If backend fails, let user try again and don’t lock them out
                if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
                setResendTimer(0);
            }
        } catch (error) {
            console.error("Resend OTP Error", error);
            alert("Internal Error " + ((error as Error)?.message || String(error)));
            if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
            setResendTimer(0);
        } finally {
            setLoadingTime(false);
        }
    };

    // Pretty seconds "00:30"
    const fmt = (s: number) => {
        const m = Math.floor(s / 60)
            .toString()
            .padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const otpExpired = validitySec === 0;
    const isSubmittingDisabled = submitLoading || otpExpired;
    return (
        <div className="flex-1 flex items-center h-full justify-center px-4 pt-6 sm:pt-16 md:psy-6 sm:px-12 ">
            <div className="absolute -bottom-36 sm:-bottom-18 shadow-md -right-36 sm:-right-24 w-[200px] h-[200px] bg-gradient-to-br from-[#5994d8] via-[#5792ec] to-[#02488d] rounded-full"></div>

            <div
                className="w-full max-w-[400px] flex flex-col justify-between">


                <Link href={'/'}>
                    <h1 className="text-4xl sm:text-6xl hover:scale-105 duration-300 text-shadow-2xs text-shadow-[#67bbf0] font-bold text-center text-[#1DA1F2] tracking-tight select-none mb-4">
                        rrely.io
                    </h1>
                </Link>

                <div className="w-full flex group justify-center items-center gap-1">
                    <button
                        onClick={() => router.push("/auth/login")}
                        aria-label="Back to login"
                        className="cursor-pointer duration-300 group-hover:-translate-x-3"
                    >
                        <MdKeyboardArrowLeft size={40} color="#1DA1F2" />
                    </button>
                    <span className="text-text-foreground text-2xl sm:text-3xl source-font font-extrabold">
                        Verify Your Email
                    </span>
                </div>

                <div className="my-4 text-md text-[#27252E] font-sora text-center">
                    We just sent a 6-digit code to <br />
                    <strong className="text-[#1DA1F2]">{deyemail}</strong>, enter
                    it below:
                </div>

                {/* OTP Validity Timer */}
                <div
                    className={`text-center text-sm mb-2 ${otpExpired ? "text-red-600" : "text-[#1DA1F2]"
                        }`}
                    aria-live="polite"
                >
                    {otpExpired ? (
                        <span>Your OTP has expired. Please resend a new code.</span>
                    ) : (
                        <span>
                            This OTP is valid for <strong>({fmt(validitySec)})</strong>
                        </span>
                    )}
                </div>

                <form
                    onSubmit={onSubmit}
                    className="w-full flex flex-col gap-1"
                >
                    <label
                        htmlFor="otp"
                        className="text-sm font-medium text-[#68696a]"
                    >
                        Code
                    </label>

                    <div className="flex justify-between w-full">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name={`otp-${i}`}
                                className="w-10 sm:w-14 h-10 sm:h-14 text-center text-[#1DA1F2] border border-[#9EA1A8] rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/50"
                                value={value[i] || ""}
                                onChange={(e) => handleOtpChange(e, i)}
                                disabled={otpExpired}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="font-bold cursor-pointer text-sm mt-3 w-full bg-[#1DA1F2] text-white py-3 rounded-md hover:bg-[#2a5298] transition disabled:opacity-50"
                        disabled={isSubmittingDisabled || otpExpired || submitLoading}
                    >
                        {submitLoading
                            ? "Verifying..."
                            : otpExpired
                                ? "OTP Expired"
                                : "Verify Email"}
                    </button>
                </form>


                {/* Resend control */}
                <div className="text-sm flex items-center gap-2 justify-center text-center text-[#27252E] mt-3">
                    Resend OTP?{" "}
                    <strong
                        role="button"
                        aria-disabled={resendTimer > 0 || loadingTime}
                        onClick={resendTimer > 0 || loadingTime ? undefined : handleResend}
                        className={`text-[#1DA1F2] flex items-center gap-2 ${resendTimer > 0 || loadingTime || loading
                            ? "opacity-60 pointer-events-none"
                            : "cursor-pointer hover:underline"
                            }`}
                    >
                        {loadingTime ? (
                            <span className="inline size-5 items-center gap-1">
                                <CgSpinner size={20} className="animate-spin" /> Sending...
                            </span>
                        ) : resendTimer > 0 ? (
                            `Wait ${resendTimer}s`
                        ) : (
                            "Send Now"
                        )}
                    </strong>
                </div>
            </div>
        </div>
    );
}
