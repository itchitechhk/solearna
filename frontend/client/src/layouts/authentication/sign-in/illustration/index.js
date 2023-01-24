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

import React, { useState, useEffect } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Switch from "@mui/material/Switch";

// Material Dashboard 2 PRO React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import IllustrationLayout from "layouts/authentication/components/IllustrationLayout";

// Image
import bgImage from "assets/images/illustrations/Login.jpg";

import firebase from "firebase";
// import SweetAlert from "react-bootstrap-sweetalert";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Loc from "localization";
import loadingBox from "components/loadingBox";

function Illustration() {
  const { state } = useLocation();
  
  const [rememberMe, setRememberMe] = useState(false);
  const [error, set_error] = React.useState("");

  const [data_email, setEmail] = React.useState("");
  const [data_password, setPassword] = React.useState("");
  const [language, set_Language] = React.useState("en");
  const [isLoading, set_isLoading] = React.useState(false);

  const [isSignIn, set_isSignedIn] = React.useState(false);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const [pathToRedirect, setRedirect] = React.useState("/homepage");
  const [itemToEdit, setItemToEdit] = React.useState(null);

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
  }, [itemToEdit]);

  useEffect(() => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("Initialized");
      });
  }, []);

  function handle_login(e) {
    // e.preventDefault();
    set_isLoading(true);
    // console.log("data_username: ", data_email);
    // console.log("data_password: ", data_password);

    firebase
      .auth()
      .signInWithEmailAndPassword(data_email, data_password)
      .then((result) => {
        // console.log(result.user.refreshToken);
        setItemToEdit({ language_code: language });
        // const uid = result.user.uid;

        // set_isLoading(false);
      })
      .catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("login fail, errorCode: ", errorCode);
        console.log("login fail, errorMessage: ", errorMessage);
        set_error(errorMessage);
        // showAlert_fail(Loc.loginFail_title, Loc.loginFail_content);
        set_isLoading(false);
      });
  }

  // function showAlert_fail(title, content) {
  //   setAlert(
  //     <SweetAlert
  //       error
  //       style={{ display: "block", marginTop: "-100px" }}
  //       closeOnClickOutside={false}
  //       title={title}
  //       onConfirm={() => hideAlert()}
  //       onCancel={() => hideAlert()}
  //       confirmBtnCssClass={classes_alert.button + " " + classes_alert.success}
  //       cancelBtnCssClass={classes_alert.button + " " + classes_alert.info}
  //       confirmBtnText={Loc.confirm}
  //       btnSize="lg"
  //       timeout={2000}
  //     >
  //       {content}
  //     </SweetAlert>
  //   );
  // }

  return (
    <MDBox>
      {/* <MDBox
          display="flex"
          justifyContent="right"
          p={1}
          bgColor="white"
        > */}
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
          </MDBox>          */}
        {/* </MDBox> */}
        
      <IllustrationLayout
        title={Loc.sign_in}
        description={Loc.sign_in_hints}
        illustration={bgImage}
      >
        <MDTypography
          color="error"
          fontWeight="medium"
          fontSize="16px"
          px={3}
          mb={3}
        >
          {error}
        </MDTypography>
        <MDBox component="form" role="form">
          <MDBox mb={2}>
            <MDInput
              type={Loc.email}
              label={Loc.email}
              fullWidth
              onChange={(e) => {
                // console.log(e.target.value)
                setEmail(e.target.value);
              }}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type={"password"}
              label={Loc.password}
              fullWidth
              onChange={(e) => {
                // console.log(e.target.value)
                setPassword(e.target.value);
              }}
            />
          </MDBox>
          <MDBox mt={4} mb={1}>
            <MDButton
              variant="gradient"
              color="info"
              size="large"
              fullWidth
              onClick={() => {
                handle_login();
              }}
            >
              {Loc.sign_in}
            </MDButton>
          </MDBox>
          <MDBox mt={3} textAlign="center">
            <MDTypography variant="button" color="text">
              {Loc.dont_have_account}{" "}
              <MDTypography
                component={Link}
                to="/authentication/sign-up"
                variant="button"
                color="info"
                fontWeight="medium"
                textGradient
              >
                {Loc.sign_up}
              </MDTypography>
            </MDTypography>
          </MDBox>
        </MDBox>
      </IllustrationLayout>
    </MDBox>
    
  );
}

export default Illustration;
