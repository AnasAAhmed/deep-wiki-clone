"use client";

import { axiosInstance } from "@/contexts/axios.config";
import {showMessage,successMessage,errorMessage} from '@/contexts/toast.config'
import { authConstants } from "../constants/authContants";

export const login = (values:any) => async (dispatch:any) => {
  dispatch({
    type: authConstants.LOGIN_REQUEST,
  });
  try {
    const res = await axiosInstance.post("/auth/login", values);
    if (res?.data?.status === "success") {
      await dispatch({
        type: authConstants.LOGIN_SUCCESS,
        payload: res?.data,
      });
      successMessage("Login Successfull");
      return true;
    }
  } catch (error) {
    dispatch({
      type: authConstants.LOGIN_FAILURE,
      payload: (error as Error).message || "Server Error",
    });
    errorMessage((error as Error).message);
  }
};

export const signupAction = (values:any) => async (dispatch:any) => {
  dispatch({
    type: authConstants.SIGNUP_REQUEST,
  });
  try {
    const res = await axiosInstance.post("/auth/signup", values);
    // console.log("Testing RES DATA -----", res.data);

    if (res?.data) {
      await dispatch({
        type: authConstants.SIGNUP_SUCCESS,
        payload: res?.data,
      });
      showMessage(res?.data?.message, res?.data?.status);
      return true;
    }
  } catch (error) {
    dispatch({
      type: authConstants.SIGNUP_FAILURE,
      payload: (error as Error).message || "Server Error",
    });

    showMessage((error as Error).message);

  }
};

export const Otp_Verify_Action = (values:any) => async (dispatch:any) => {
  dispatch({
    type: authConstants.OTP_VERIFY_REQUEST,
  });
  try {
    const res = await axiosInstance.post("/auth/verify-email", values);
    console.log("OTP Actions verify -----", res.data);
    if (res?.data) {
      await dispatch({
        type: authConstants.OTP_VERIFY_SUCCESS,
        payload: res?.data,
      });
      showMessage(res?.data?.message, res?.data?.status);
    }
    return res?.data;
  } catch (error) {
    dispatch({
      type: authConstants.OTP_VERIFY_FAILURE,
      payload: (error as Error).message || "Server Error",
    });

    showMessage((error as Error).message);
  }
};

export const ReSend_Action = (values:any) => async (dispatch:any) => {
  dispatch({
    type: authConstants.RESEND_OTP_REQUEST,
  });
  try {
    const res = await axiosInstance.post("/auth/resendOtp", values);
    // console.log("Resend OTP ACtions -----", res);
    if (res?.data) {
      await dispatch({
        type: authConstants.RESEND_OTP_SUCCESS,
        payload: res?.data,
      });
      showMessage(res?.data?.message, res?.data?.status);
      return true;
    }
  } catch (error) {
    dispatch({
      type: authConstants.RESEND_OTP_FAILURE,
      payload: (error as Error).message || "Server Error",
    });

    showMessage((error as Error).message);
  }
};


export const UpdatePassword = (values:any) => async (dispatch:any) => {
  dispatch({
    type: authConstants.PASSWORD_UPDATE_REQUEST,
  });
  try {
    const res = await axiosInstance.put("profile/resetpassword", values);
    console.log("🚀 ~ UpdatePassword ~ res:", res)
    if (res?.data) {
      await dispatch({
        type: authConstants.PASSWORD_UPDATE_SUCCESS,
        payload: res?.data,
      });
      showMessage(res?.data?.message, res?.data?.status);
    }
    return res;
  } catch (error) {
    dispatch({
      type: authConstants.PASSWORD_UPDATE_FAILURE,
      payload: (error as Error).message || "Server Error",
    });
    showMessage((error as Error).message);
    return(error as Error).message;
  }
};

export const Oauth_login = (values:any) => async (dispatch:any) => {
  dispatch({
    type: authConstants.OAUTH_LOGIN_REQUEST,
  });
  try {
    const res = await axiosInstance.post("/auth/oauth", values);
    // console.log("Oauth Login Actions -----", res.data);
    if (res?.data) {
      await dispatch({
        type: authConstants.OAUTH_LOGIN_SUCCESS,
        payload: res?.data,
      });
      showMessage(res?.data?.message, res?.data?.status);
    }
    return res?.data;
  } catch (error) {
    dispatch({
      type: authConstants.OAUTH_LOGIN_FAILURE,
      payload: (error as Error).message || "Server Error",
    });
    showMessage((error as Error).message);
    return(error as Error).message;
  }
};

export const getCurrentUserAction = () => async (dispatch:any) => {
  dispatch({
    type: authConstants.CURRENT_USER_REQUEST,
  });
  try {
    const res = await axiosInstance.get("/user/me");
    if (res?.data) {
      localStorage.setItem("user", "true");
      await dispatch({
        type: authConstants.CURRENT_USER_SUCCESS,
        payload: res?.data?.data,
      });

    }
    dispatch({
      type: authConstants.CURRENT_USER_FAILURE,
    });
    return res?.data?.data;
  } catch (error) {
    dispatch({
      type: authConstants.CURRENT_USER_FAILURE,
      payload: (error as Error).message || "Server Error",
    });
    // showMessage((error as Error).message);
    return (error as Error).message;
  }
};

