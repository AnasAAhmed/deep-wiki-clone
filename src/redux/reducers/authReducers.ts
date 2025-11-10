"use client";

import { authConstants } from "../constants/authContants";

const token = null;

export const initialAuthState = {
  user: {},
  isAuthenticated: token ? true : false,
  loading: false,
};

export const authReducer = (
  state = initialAuthState,
  action:any
) => {
  switch (action.type) {
    case authConstants.SIGNUP_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case authConstants.SIGNUP_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    case authConstants.GET_SETTING_SUCCESS:
      return {
        ...state,
        loading: false,
        setting: action.payload,
      };
    case authConstants.SIGNUP_FAILURE:
      return {
        ...state,
        loading: false,
      };

    // OTP VERIFY CASES

    case authConstants.OTP_VERIFY_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case authConstants.OTP_VERIFY_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    case authConstants.OTP_VERIFY_FAILURE:
      return {
        ...state,
        loading: false,
      };



    case authConstants.PASSWORD_UPDATE_REQUEST:
    case authConstants.RESEND_OTP_REQUEST:
      return {
        ...state,
        loading1: true,
      };
    case authConstants.PASSWORD_UPDATE_SUCCESS:
    case authConstants.RESEND_OTP_SUCCESS:
      return {
        ...state,
        loading1: false,
      };
    case authConstants.RESEND_OTP_FAILURE:
    case authConstants.PASSWORD_UPDATE_FAILURE:
      return {
        ...state,
        loading1: false,
      };

    // LOGIN  CASES
    case authConstants.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case authConstants.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    case authConstants.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
      };

    // OAUTH LOGIN  CASES
    case authConstants.OAUTH_LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case authConstants.OAUTH_LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    case authConstants.OAUTH_LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
      };

    // CURRENT USER   CASES
    case authConstants.CURRENT_USER_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case authConstants.CURRENT_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case authConstants.CURRENT_USER_FAILURE:
      return {
        ...state,
        loading: false,
      };

    default: // ? defaaaalt case yk...!
      return state;
  }
};