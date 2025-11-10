"use client";
import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
// import { encrypt } from "@/utils/crypto";
// import { ReSend_Action } from "@/redux/actions/adminActions";

const page = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const onSubmit = useCallback(
        async (e: any) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            const email = String(formData.get("email") || "").trim();
            if (!email) return;
            console.log("Please enter your email");
            try {
                setLoading(true);
                console.log("Email----------------------------------", email);
                // 3) IMPORTANT: thunk ko "call" kar ke dispatch karo
                //    dispatch(ReSend_Action({ email }))
                // const sendotp = await dispatch(ReSend_Action({ email }));
                const sendotp: any = {};
                // 4) agar action ne true return kiya, to aage jao

                const token = email;
                // const token = encrypt(email);
                console.log("token----------------------------------done", token);
                if (sendotp) {
                    router.push(`/auth/forget/verify-email?token=${token}`);
                }
            } finally {
                setLoading(false);
            }
        },
        [dispatch, router]
    );
    return (
        <div className="flex-1 flex items-center h-full justify-center px-4 pt-6 sm:pt-24 md:psy-6 sm:px-12 ">
            <div className="absolute -bottom-36 sm:-bottom-18 shadow-md -right-36 sm:-right-24 w-[200px] h-[200px] bg-gradient-to-br from-[#5994d8] via-[#5792ec] to-[#02488d] rounded-full"></div>

            <form
                onSubmit={onSubmit}
                className="w-full max-w-[400px] flex flex-col justify-between"
            >
                <h1 className="text-4xl text-center w-full py-6 font-extrabold text-[#1DA1F2] font-sans tracking-tight select-none">
                    rrely.io
                </h1>
                <div className="text-4xl text-center source-font font-bold text-foreground">
                    Send OTP
                </div>

                <div className="text-md text-center text-foreground mt-1">
                    Enter the email you are registered on
                </div>

                <div className="w-full mt-6 flex flex-col">
                    <label
                        htmlFor="email"
                        className="text-xs font-medium text-foreground mb-1"
                    >
                        Email
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="mb-6 w-full text-xs px-3 py-4 rounded-md border border-transparent bg-[#adbfc83d] hover:bg-[#658eb03d] outline-none focus:ring-2 focus:ring-[#1DA1F2]"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="font-bold cursor-pointer text-sm w-full bg-[#1DA1F2] text-white rounded-md py-3 mt-2 transition hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default page