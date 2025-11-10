"use client";
import { useEffect, useMemo, useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
// import { decrypt } from "@/utils/crypto";
import Link from "next/link";

// HeroUI-first validation (pure JSX version)
function ConfirmPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const dispatch = useDispatch();
  const router = useRouter();
  const param = useSearchParams();
  const deyemail = param.get("token");
  console.log(deyemail);
  const email = deyemail;
//   const email = decrypt(deyemail!);
  console.log("decrypted email", email);
  // ---- Rules ----
  const MIN_LEN = 8;
  const hasMin = password.length >= MIN_LEN;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Strength (0-4)
  const strength = useMemo(() => {
    let score = 0;
    if (hasMin) score += 1;
    if (hasLetter) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    return score;
  }, [hasMin, hasLetter, hasNumber, hasSpecial]);

  const pwdRuleError = useMemo(() => {
    if (!password) return "";
    if (!hasMin) return `Password must be at least ${MIN_LEN} characters.`;
    if (!(hasLetter && hasNumber)) return "Use both letters and numbers.";
    if (!hasSpecial) return "Add at least one special character (e.g., !@#$%).";
    return "";
  }, [password, hasMin, hasLetter, hasNumber, hasSpecial]);

  const matchError = useMemo(() => {
    if (!confirm) return "";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  }, [password, confirm]);

  const isPasswordInvalid = touched.password && !!pwdRuleError;
  const isConfirmInvalid = touched.confirm && (!!matchError || !!pwdRuleError);

  const formIsValid = Boolean(
    password && confirm && !pwdRuleError && password === confirm
  );

  const handleBlur = (field: string) => () =>
    setTouched((t) => ({ ...t, [field]: true }));

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (!formIsValid) return;

    // TODO: Call your password update API here
    // await updatePassword(password)

    const res: any = {};
    // const res = await dispatch(UpdatePassword({ email, password }));
    console.log("response mil raha ha password update ho gaya ", res);
    console.log("Password reset OK ✅");
    router.push("/auth/login");
  };

  useEffect(() => {
    if (confirm && !touched.confirm) {
      setTouched((t) => ({ ...t, confirm: true }));
    }
  }, [confirm, touched.confirm]);

  return (
    <div className="flex-1 flex items-center h-full justify-center px-4 pt-6 sm:pt-12 sm:px-12 ">
        <div className="absolute -bottom-36 sm:-bottom-18 shadow-md -right-36 sm:-right-24 w-[200px] h-[200px] bg-gradient-to-br from-[#5994d8] via-[#5792ec] to-[#02488d] rounded-full"></div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-[400px] flex flex-col h-full justify-between p-6 rounded-lg"
      >
        <Link href={'/'}>
          <h1 className="text-6xl hover:scale-105 duration-300 text-shadow-2xs text-shadow-[#67bbf0] font-bold text-center text-[#1DA1F2] tracking-tight select-none mb-4">
            rrely.io
          </h1>
        </Link>
        <div className="text-4xl text-center source-font font-extra text-foreground">
          Update Password
        </div>

        <div className="w-full mt-4 flex flex-col space-y-3">
          {/* Password Field */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="password" className="text-xs text-[#1DA1F2]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                required
                className="w-full text-xs px-3 py-4 rounded-md border-none bg-[#ADC8B93D] hover:bg-[#65b0873d] focus:outline-none"
                placeholder="Enter new password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handleBlur("password")}
                pattern={`(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{${MIN_LEN},}`}
                title={`At least ${MIN_LEN} characters, with letters, numbers, and a special character.`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-2.5 focus:outline-none"
              >
                {showPwd ? <IoEye color="#1DA1F2" /> : <IoEyeOff color="#1DA1F2" />}
              </button>
            </div>
            {isPasswordInvalid && (
              <p className="text-[11px] text-red-500">{pwdRuleError}</p>
            )}
          </div>

          {/* Live helper list */}
          <div className="text-[11px] leading-4 text-[#1DA1F2] grid grid-cols-2 gap-1">
            <Rule ok={hasMin} label={`≥ ${MIN_LEN} characters`} />
            <Rule ok={hasLetter} label="Contains a letter" />
            <Rule ok={hasNumber} label="Contains a number" />
            <Rule ok={hasSpecial} label="Contains a special char" />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="confirmPassword" className="text-xs text-[#1DA1F2]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                required
                className="w-full text-xs px-3 py-4 rounded-md border-none bg-[#ADC8B93D] hover:bg-[#65b0873d] focus:outline-none"
                placeholder="Confirm new password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={handleBlur("confirm")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-2.5 focus:outline-none"
              >
                {showConfirm ? (
                  <IoEye color="#1DA1F2" />
                ) : (
                  <IoEyeOff color="#1DA1F2" />
                )}
              </button>
            </div>
            {isConfirmInvalid && (
              <p className="text-[11px] text-red-500">
                {matchError || pwdRuleError || "Invalid value."}
              </p>
            )}
          </div>

          <PasswordStrength score={strength} />
        </div>

        <div className="mt-2">
          <button
            type="submit"
            disabled={!formIsValid}
            className="font-bold cursor-pointer text-sm w-full bg-[#1DA1F2] hover:bg-[#2a5298] text-white py-3 rounded-md disabled:opacity-50"
          >
            Update Password
          </button>
        </div>
      </form>

    </div>
  );
}

// Small helper component to show each rule state
function Rule({ ok, label }: any) {
  return (
    <div
      className={`flex items-center gap-1 ${ok ? "opacity-80" : "opacity-60"}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[#037cc7]" : "bg-gray-400"}`}
      />
      <span>{label}</span>
    </div>
  );
}

// Simple password strength bar (0-4)
function PasswordStrength({ score }: { score: number }) {
  const steps = 4;
  return (
    <div className="mt-1">
      <div className="flex gap-1">
        {Array.from({ length: steps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded ${i < score ? "bg-[#1DA1F2]" : "bg-[#ADC8B93D]"}`}
          />
        ))}
      </div>
      <p className="text-[10px] mt-1 text-[#1DA1F2]">
        {score <= 1
          ? "Weak"
          : score === 2
            ? "Fair"
            : score === 3
              ? "Good"
              : "Strong"}
      </p>
    </div>
  );
}

export default ConfirmPassword;