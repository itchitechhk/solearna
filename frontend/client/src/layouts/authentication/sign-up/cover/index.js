/**
=========================================================
* Material Dashboard 2 PRO React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-pro-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// react-router-dom components
import { Link } from "react-router-dom";
import React, { useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";

// Material Dashboard 2 PRO React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

import firebase from "firebase";
import fetchAPI from "../../../../examples/connectionHandler/FetchAPI";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

import CircularProgress from "@mui/material/CircularProgress";

import SweetAlert from "react-bootstrap-sweetalert";
import Loc from "localization";
import loadingBox from "components/loadingBox";
import MDAlert from "components/MDAlert";

// Images
import bgImage from "assets/images/Register.png";
import contained from "assets/theme/components/button/contained";
import { Button } from "@mui/material";
// import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useLocation } from "react-router-dom";
function Cover() {
  const { state } = useLocation();
  const [email, set_Email] = React.useState("");
  const [password, set_Password] = React.useState("");
  const [password_confirm, set_Password_confirm] = React.useState("");
  const [nickname, set_nickname] = React.useState("");
  const [wallet_address, set_wallet_address] = React.useState("");
  
  
  const [isAgreed, set_isAgreed] = React.useState(true);
  const [language, set_Language] = React.useState("en");
  // For navigation path and data to be transfer
  const [pathToRedirect, setRedirect] = React.useState("");
  const [itemToEdit, setItemToEdit] = React.useState(null);

  const [isLoading, set_isLoading] = React.useState(false);
  const [error, set_error] = React.useState("");

  const [alert_save, setSaveAlert] = React.useState(null);
  const hideAlert = () => {
    setSaveAlert(null);
  };

  // Launch navigation
  let navigate = useNavigate();
  const check_redirect = () => {
    if (pathToRedirect !== "") {
      if (itemToEdit !== null) {
        return navigate(pathToRedirect, { state: itemToEdit });
      } else {
        return navigate(pathToRedirect);
      }
    } else {
      return null;
    }
  };

  // Start navigate after setstate is completed
  useEffect(() => {
    if (itemToEdit !== null) {
      console.log("Selected Navigation", pathToRedirect);
      check_redirect();
    }

    const language_code = (state === null) ? null : state;
    if (language_code != null)
    {
      set_Language(language_code);
      console.log("language_code: " + language_code);
    }
  }, [itemToEdit, pathToRedirect]);

  useEffect(() => {
    Loc.setLanguage(language === "en" ? "en" : "zh_Hant");
  }, [language]);

  const check_valid = () =>
  {
    if (nickname == "")
    {
      set_error(Loc.nickname_empty);
      return false;
    }
    if (wallet_address == "")
    {
      set_error(Loc.wallet_address_empty);
      return false;
    }
    if (email == "")
    {
      set_error(Loc.email_empty);
      return false;
    }
    else if (password == "")
    {
      set_error(Loc.password_empty);
      return false;
    }
    else if (password != password_confirm)
    {
      set_error(Loc.password_not_match);
      return false;
    }
    else
    {
      return true;
    }
  }

  const handleSignUp = () => {
    set_isLoading(true);
    // console.log(email, password);
    if (check_valid())
    {
      firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        // console.log(user);
        const fetch_data = {
          content:{
            nickname: nickname,
            wallet_address: wallet_address,
            level: 1,
            exp: 0,
            exp_max: 10,
            balance_sol: 0
          }
        }

        fetchAPI.do_fetch("post", "user/register", fetch_data).then(
          (res) => {
            // console.log(res);
            // set_error("");
            // set_isLoading(false);
            setItemToEdit({ language_code: language });
            setRedirect("/homepage");
          },
          (error) => {
            firebase
              .auth()
              .signOut()
              .then(function () {
                set_isLoading(false);
                console.log("Sign-out successful.", error);
                // Sign-out successful.
              })
              .catch(function (error) {
                console.log("Sign-out fail, ", error);
                // An error happened.
              });
          }
        );
      })
      .catch((error) => {
        set_isLoading(false);
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        set_error(errorMessage);
        set_isAgreed(true);
      });
    }
    else
    {
      set_isLoading(false);
    }
  };
  return isLoading === true ? loadingBox : (
    <div>
      {alert_save}
      {/* <MDBox
          color="white"
          // bgColor="info"
          variant="gradient"
          borderRadius="lg"
          // shadow="lg"
          opacity={1}
          width={150}
          display="flex"
          justifyContent="center"
          alignItems="center"
          mr={2}
          position="absolute"
          right={0}
          top={10}
        >
          <MDButton size="small" color="info" variant="text" onClick={() => {
                Loc.setLanguage("zh_Hant");
                set_Language("zh-hk");
              }}>
            中
          </MDButton>
          <MDTypography color="info"> | </MDTypography>
          <MDButton size="small" color="info" variant="text" onClick={() => {
                Loc.setLanguage("en");
                set_Language("en");
              }}>
            Eng
          </MDButton>
      </MDBox>  */}
      <CoverLayout image={bgImage}>
        <Card>
          <MDBox
            variant="gradient"
            bgColor="info"
            borderRadius="lg"
            coloredShadow="success"
            mx={2}
            mt={-3}
            p={3}
            mb={1}
            textAlign="center"
          >
            <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
              {Loc.app_name}
            </MDTypography>
            <MDTypography display="block" variant="button" color="white" my={1}>
              {Loc.sign_up_hints}
            </MDTypography>
          </MDBox>
          <MDTypography
            color="error"
            fontWeight="medium"
            fontSize="16px"
            px={3}
          >
            {error}
          </MDTypography>
          <MDBox pt={4} pb={3} px={3}>
            <MDBox component="form" role="form">
              {/* <MDBox mb={2}>
              <MDInput type="text" label="Name" variant="standard" fullWidth />
            </MDBox> */}
            <MDBox mb={2}>
                <MDInput
                  required={true}
                  type={"nickname"}
                  label={Loc.nickname}
                  variant="standard"
                  fullWidth
                  onChange={(e) => set_nickname(e.target.value)}
                />
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  required={true}
                  type={"wallet_address"}
                  label={Loc.wallet_address}
                  variant="standard"
                  fullWidth
                  onChange={(e) => set_wallet_address(e.target.value)}
                />
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  required={true}
                  type={Loc.email}
                  label={Loc.email}
                  variant="standard"
                  fullWidth
                  onChange={(e) => set_Email(e.target.value)}
                />
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  required={true}
                  type={"password"}
                  label={Loc.password}
                  variant="standard"
                  fullWidth
                  onChange={(e) => set_Password(e.target.value)}
                />
              </MDBox>
              <MDBox mb={2}>
                <MDInput
                  required={true}
                  type={"password"}
                  label={Loc.password_confirm}
                  variant="standard"
                  fullWidth
                  onChange={(e) => set_Password_confirm(e.target.value)}
                />
              </MDBox>
              
              <MDBox display="flex" alignItems="center" ml={-1}>
                {/* <Checkbox
                  onChange={(e) => {
                    set_isAgreed(e.target.checked);
                  }}
                />
                <MDTypography
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
                >
                  {Loc.i_agree_the}
                </MDTypography>
                <MDTypography
                  component="a"
                  href="#"
                  variant="button"
                  fontWeight="bold"
                  color="info"
                  textGradient
                >
                  {Loc.terms_and_conditions}
                </MDTypography> */}
              </MDBox>
              <MDBox mt={4} mb={1}>
                <MDButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  disabled={!isAgreed}
                  onClick={() => handleSignUp()}
                >
                  {Loc.sign_up}
                </MDButton>
              </MDBox>
              <MDBox mt={3} mb={1} textAlign="center">
                <MDTypography variant="button" color="text">
                  {Loc.already_have_account}{" "}
                  <MDTypography
                    component={Link}
                    to="/authentication/sign-in"
                    variant="button"
                    color="info"
                    fontWeight="medium"
                    textGradient
                  >
                    {Loc.sign_in}
                  </MDTypography>
                </MDTypography>
              </MDBox>
            </MDBox>
          </MDBox>
        </Card>
      </CoverLayout>
    </div>
  );
}

export default Cover;
