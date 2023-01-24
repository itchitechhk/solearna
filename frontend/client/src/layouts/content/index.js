import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Breadcrumbs, Icon, Link } from "@mui/material";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ContentBox from "./component/contentbox";

import firebase from "../../examples/connectionHandler/firebase";
import fetchAPI from "../../examples/connectionHandler/FetchAPI";

import CircularProgress from "@mui/material/CircularProgress";
import MDApp from "./component/markdown";

import Loc from "localization";
import loadingBox from "components/loadingBox";
import MDButton from "components/MDButton";

function Content() {
  // For receiving data from navigated page
  const { state } = useLocation();
  // console.log("This is state:", state);
  const { title } = state;
  const { title_eng } = state;
  const { section } = state;
  const { section_eng } = state;
  const { id } = state;
  const { quiz } = state;
  const { course_duration } = state;
  const { language_code } = state;

  // For navigation path and data to be transfer
  const [pathToRedirect, setRedirect] = React.useState("");
  const [itemToEdit, setItemToEdit] = React.useState(null);

  // For changing section to show (Section 1~4)
  const [currentSection, setcurrentSection] = useState(1);
  const [currentSectionNumber, setcurrentSectionNumber] = useState(1);
  const [lastSection, setlastSection] = useState(1);
  const [sectionContent, set_sectionContent] = useState("");

  const [isSignedIn, setSignedIn] = React.useState(false);
  const [isCheckedSignIn, set_isCheckedSignIn] = React.useState(false);

  const [isLoading, set_isLoading] = React.useState(true);
  const [isFetchingSection, set_isFetchingSection] = React.useState(true);

  const [language, set_Language] = React.useState(language_code);
  // console.log(language);

  const [sectionArray, set_sectionArray] = React.useState([]);
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

    if (language_code != null)
    {
      set_Language(language_code);
    }
  }, [itemToEdit]);

  useEffect(() => {
    Loc.setLanguage(language === "en" ? "en" : "zh_Hant");
  }, [language]);

  //  Check signed in or not
  function add_authListener() {
    // console.log("add_authListener called in Admin");
    return firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        set_isLoading(true);
        // User is signed in.
        console.log("Checking, signed in");
        setSignedIn(true);
        get_courseData();
      } else {
        // User is signed out.
        console.log("NOT signed in");
        setRedirect("/authentication/sign-in/illustration");
        setItemToEdit("");
        setSignedIn(false);
        set_isCheckedSignIn(true);
      }
    });
  }

  // Called when signed in
  function get_courseData() {
    const body2 = {
      course_id: id,
      language_code: language,
    };
    fetchAPI.do_fetch("post", "course/get_section_list", body2).then(
      (res) => {
        // console.log("this is the result of section list:", res);
        let temp = res.data.section_list.sort((a, b) =>
          a.section_index > b.section_index ? 1 : -1
        );
        // console.log("this is sorted:", temp);
        setlastSection(temp.length);
        set_sectionArray(temp);
        // console.log(section, temp.length);
        if (section < temp.length) {
          setcurrentSection(temp[section]);
          setcurrentSectionNumber(section + 1);
        }
        // set_isLoading(false);
      },
      (error) => {
        firebase
          .auth()
          .signOut()
          .then(function () {
            console.log("Sign-out successful.", error);
            // setSignedIn(false);
            // set_isCheckedSignIn(true);
            // Sign-out successful.
          })
          .catch(function (error) {
            console.log("Sign-out fail, ", error);
            // setSignedIn(false);
            // set_isCheckedSignIn(true);
            // An error happened.
          });
      }
    );
  }

  useEffect(() => {
    set_isCheckedSignIn(false);
    const subscription_auth = add_authListener();
    return function cleanup() {
      subscription_auth();
    };
  }, []);

  // Get section data when section number changed
  useEffect(() => {
    if (sectionArray.length > 0) {
      set_isFetchingSection(true);
      // console.log(currentSectionNumber - 1);
      setcurrentSection(sectionArray[currentSectionNumber - 1]);
      const body2 = {
        section_id: sectionArray[currentSectionNumber - 1].id,
        language_code: language,
      };
      fetchAPI.do_fetch("post", "course/get_section_data", body2).then(
        (res) => {
          // console.log("this is the result of section data:", res);
          // console.log(
          //   "this is the result of section data:",
          //   res.data.section_content
          // );

          set_sectionContent(res.data);
          set_isLoading(false);
          set_isFetchingSection(false);
        },
        (error) => {
          firebase
            .auth()
            .signOut()
            .then(function () {
              console.log("Sign-out successful.", error);
              // setSignedIn(false);
              // set_isCheckedSignIn(true);
              // Sign-out successful.
            })
            .catch(function (error) {
              console.log("Sign-out fail, ", error);
              // setSignedIn(false);
              // set_isCheckedSignIn(true);
              // An error happened.
            });
        }
      );
    }
  }, [currentSectionNumber, sectionArray]);

  const handle_Logout = () => {
    firebase
      .auth()
      .signOut()
      .then(function () {
        setRedirect("/authentication/sign-in/illustration");
        setItemToEdit("");
      });
  };

  // Render side Section Box
  const renderContentBox = sectionArray.map((section, key) => {
    return (
      <MDBox m={1} key={key} p={1}>
        <ContentBox
          number={key + 1}
          time={course_duration[key]}
          name={
            language === "en" ? section.section_name_eng : section.section_name
          }
          currentSection={currentSectionNumber}
          Didselectnumber={() => {
            setcurrentSectionNumber(key + 1);
            setcurrentSection(section);
          }}
        ></ContentBox>
      </MDBox>
    );
  });

  
  return isLoading === true ? loadingBox : (
    <MDBox bgColor="rgb(240,242,245)" minWidth="800px">
      <MDBox
          display="flex"
          justifyContent="right"
          maxWidth="100%"
          p={1}
        >
          <MDBox
            bgColor="white"
            // bgColor="info"
            // variant="gradient"
            borderRadius="lg"
            // shadow="lg"
            opacity={1}
            width={150}
            display="flex"
            justifyContent="center"
            alignItems="center"
            mr={2}
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
          </MDBox>
          

          <MDButton size="small" color="info" variant="gradient" onClick={() => handle_Logout()}>
          {Loc.sign_out}
          </MDButton>          
        </MDBox>
        

      <MDBox display="flex" flexDirection="row">
        {/* Left side */}
        <MDBox width="25%" ml={3} mb={3} borderRadius="lg" shadow="lg" bgColor="white">
          <MDTypography
            mb="32px"
            pt="38px"
            pl="5%"
            fontFamily="Roboto"
            fontSize="30px"
            fontWeight="medium"
            textAlign="left"
            style={{ wordWrap: "break-word" }}
            color="dark"
          >
            {Loc.course_content}
          </MDTypography>
          {renderContentBox}
          <MDBox
            borderRadius="lg"
            shadow="lg" bgColor="grey-100"
            m={3}
            p={3}
            style={{ cursor: "pointer" }}
            onClick={() => {
              setRedirect("/quiz");
              let body = state;
              body.language_code = language;
              setItemToEdit(body);
            }}
            pl="12%"
            pr="10%"
            alignItems="center"
            display="flex"
            height="86px"
          >
            <MDTypography
              fontFamily="Roboto"
              fontSize="24px"
              fontWeight="medium"
              textAlign="left"
              color="dark"
              style={{ wordWrap: "break-word" }}
            >
              {Loc.quiz}
            </MDTypography>
            <Icon
              style={{ marginRight: "0%", marginLeft: "auto" }}
              fontSize="large"
            >
              arrow_forward_ios_new
            </Icon>
          </MDBox>
        </MDBox>

        {/* Right Side */}
        <MDBox
          width="75%"
          // pt="48px"
          // pl="5%"
          // style={{ border: "0.5px solid grey" }}
          // mt="48px"
        >
          <MDBox mr={3} ml={3} mb={3} borderRadius="lg" shadow="lg" bgColor="white">

          
          <MDBox display="flex" flexDirection="row" alignItems="center" pl={1} pt={1}>
            <MDBox
              display="flex"
              flexDirection="row"
              alignItems="center"
              onClick={() => {
                setRedirect("/introduction");
                let body = state;
                body.language_code = language;
                setItemToEdit(body);
              }}
              style={{ cursor: "pointer" }}
              // bgColor="blue"
            >
              <Icon size="36px">arrow_back_ios_new</Icon>
              <MDTypography
                fontFamily="Roboto"
                fontSize="36px"
                fontWeight="medium"
                textAlign="left"
                color="dark"
                style={{ wordWrap: "break-word" }}
                pl="26px"
              >
                {Loc.back}
              </MDTypography>
            </MDBox>
          </MDBox>
          <MDBox
            display="flex"
            flexDirection="row"
            pt="42px"
            alignItems="center"
            pb="36px"
            pl="5%"
          >
            <Breadcrumbs>
              <MDTypography
                underline="hover"
                fontSize="24px"
                style={{ cursor: "pointer", color: "#ADB5BD" }}
                onClick={() => {
                  setRedirect("/homepage");
                  setItemToEdit({ language_code: language });
                }}
              >
                {Loc.course}
              </MDTypography>
              <Link
                color="#ADB5BD"
                underline="hover"
                fontSize="24px"
                onClick={() => {
                  setRedirect("/introduction");
                  let body = state;
                  body.language_code = language;
                  setItemToEdit(body);
                }}
                style={{ cursor: "pointer" }}
              >
                {language === "en" ? title_eng : title}
              </Link>

              <MDTypography
                fontSize="24px"
                color="dark"
                style={{ wordWrap: "break-word" }}
              >
                {language === "en"
                  ? currentSection.section_name_eng
                  : currentSection.section_name}
              </MDTypography>
            </Breadcrumbs>

            <MDBox
              display="flex"
              ml="auto"
              mr={0}
              width="350px"
              flexDirection="row"
            >
              {currentSectionNumber !== 1 && (
                <MDBox
                  display="flex"
                  alignItems="center"
                  flexDirection="row"
                  ml={0}
                  mr="auto"
                  onClick={() =>
                    setcurrentSectionNumber(currentSectionNumber - 1)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <Icon size="7px" color="info">
                    arrow_back_ios_new
                  </Icon>
                  <MDTypography
                    pl="5px"
                    fontFamily="Roboto"
                    fontSize="24px"
                    fontWeight="regular"
                    textAlign="left"
                    color="info"
                    style={{ wordWrap: "break-word" }}
                  >
                    {Loc.previous}
                  </MDTypography>
                </MDBox>
              )}

              {currentSectionNumber !== lastSection && (
                <MDBox
                  onClick={() =>
                    setcurrentSectionNumber(currentSectionNumber + 1)
                  }
                  style={{ cursor: "pointer" }}
                  mr="71px"
                  ml="auto"
                  display="flex"
                  alignItems="center"
                  flexDirection="row"
                >
                  <MDTypography
                    pr="5px"
                    fontFamily="Roboto"
                    fontSize="24px"
                    fontWeight="regular"
                    textAlign="left"
                    color="info"
                    style={{ wordWrap: "break-word" }}
                  >
                    {Loc.next}
                  </MDTypography>
                  <Icon size="7px" color="info">
                    arrow_forward_ios_new
                  </Icon>
                </MDBox>
              )}
            </MDBox>
          </MDBox>
          {isFetchingSection ? loadingBox : (
            <MDBox p={1} >
              <MDApp
                content={
                  language === "en"
                    ? sectionContent.section_content_eng
                    : sectionContent.section_content
                }
              />
            </MDBox>
          )}
        </MDBox>


        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default Content;
