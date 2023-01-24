import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import bgImage from "assets/images/bg-sign-up-cover.jpeg";
import { Breadcrumbs, Card, Icon, Link } from "@mui/material";
import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import CourseNameBox from "../../examples/CourseContentBox";
import { DescriptionOutlined } from "@mui/icons-material";

import firebase from "../../examples/connectionHandler/firebase";
import fetchAPI from "../../examples/connectionHandler/FetchAPI";

import CircularProgress from "@mui/material/CircularProgress";

import Loc from "localization";
import loadingBox from "components/loadingBox";
import MDButton from "components/MDButton";


function Introduction() {
  // For receiving data from navigated page
  const { state } = useLocation();
  const { title } = state;
  const { title_eng } = state;
  const { banner } = state;
  const { introduction } = state;
  const { introduction_eng } = state;
  const { description } = state;
  const { description_eng } = state;
  const { id } = state;
  const { course_list } = state;
  const { course_list_eng } = state;
  const { course_duration } = state;
  const { quiz_id } = state;
  const { language_code } = state;

  // For navigation path and data to be transfer
  const [pathToRedirect, setRedirect] = React.useState("");
  const [itemToEdit, setItemToEdit] = React.useState(null);

  const [isSignedIn, setSignedIn] = React.useState(false);
  const [isCheckedSignIn, set_isCheckedSignIn] = React.useState(false);
  const [data_adminInfo, setDate_adminInfo] = React.useState(null);

  const [temp_description, setTemp_description] = React.useState(description);
  const [temp_course_list, setTemp_course_list] = React.useState(course_list);

  const [isLoading, set_isLoading] = React.useState(true);

  const [backgroundColor, setBackgroundColor] = React.useState("white");
  const [language, set_Language] = React.useState(language_code);

  const [quizData, set_quizData] = React.useState([]);
  // console.log(language);

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
      console.log("language_code: " + language_code);
    }
  }, [itemToEdit]);

  // check sign in or not
  function add_authListener() {
    // console.log("add_authListener called in Admin");
    return firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // User is signed in.
        set_isLoading(true);
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

  // Called when check signed in
  function get_courseData() {
    // get admin info
    const body = {
      quiz_id: quiz_id.targetID || "",
      language_code: language,
    };
    // console.log(body);
    if (body.quiz_id !== "") {
      fetchAPI.do_fetch("post", "course/get_quiz_intro", body).then(
        (res) => {
          // console.log("this is the result of quiz intro:", res.data);
          // let temp = res.data.section_list.sort((a, b) =>
          //   a.section_name > b.section_name ? 1 : -1
          // );
          // console.log("this is sorted:", temp);
          set_quizData(res.data);
          set_isLoading(false);
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
    } else {
      set_isLoading(false);
    }
  }

  useEffect(() => {
    set_isCheckedSignIn(false);
    const subscription_auth = add_authListener();
    return function cleanup() {
      subscription_auth();
    };
  }, []);

  useEffect(() => {
    Loc.setLanguage(language === "en" ? "en" : "zh_Hant");
    if (language === "en") {
      setTemp_description(description_eng);
      setTemp_course_list(course_list_eng);
    } else {
      setTemp_description(description);
      setTemp_course_list(course_list);
    }
  }, [language]);

  const handle_Logout = () => {
    firebase
      .auth()
      .signOut()
      .then(function () {
        setRedirect("/authentication/sign-in/illustration");
        setItemToEdit("");
      });
  };

  const [showMore, setShowMore] = useState(false);

  // Redirect function for content page
  // @parameter: {Section number, Course name}
  const handleRedirect = (section) => {
    let body = state;
    body.section = section;
    body.quiz = quizData;
    body.language_code = language;
    setRedirect("/content");
    setItemToEdit(body);
  };

  // For Section box rendering
  const renderCourseContentBox = temp_course_list.map((section, key) => {
    return (
      <MDBox m={0} key={key} width="100%">
        <CourseNameBox
          number={key}
          time={course_duration[key]}
          name={section}
          Didselectnumber={() => {
            handleRedirect(key);
          }}
        ></CourseNameBox>
      </MDBox>
    );
  });

  return isLoading === true ? loadingBox : (
    <MDBox bgColor="#FFFFFF" minWidth="800px">
      <MDBox
          display="flex"
          justifyContent="right"
          maxWidth="100%"
          p={1}
        >
          <MDBox
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

      <MDBox
        sx={{
          // backgroundImage: `url(${bgImage})`,
          backgroundImage: `url(${banner})`,
          backgroundPosition: "center",
          backgroundRepeat: 0,
          backgroundSize: "cover",
          minHeight: "770px",
          maxWidth: "100%",
          backgroundColoer: "#D8D8D8",
          opacity: 1,
        }}
      >
        <MDBox
          sx={{
            // backgroundImage: `url(${bgImage})`,
            backgroundPosition: "center",
            backgroundRepeat: 0,
            backgroundSize: "cover",
            minHeight: "770px",
            maxWidth: "100%",
            bgcolor: "rgba(0, 0, 0, 0.5)",
            opacity: 1,
            pt: "56px",
            pb: "118px",
            px: "15%",
            m: 0,
          }}
        >
          <MDBox
            p={0}
            m={0}
            display="flex"
            flexDirection="row"
            alignItems="center"
          >
            <Icon
              sx={{ color: "#FFFFFF" }}
              size="36px"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setRedirect("/homepage");
                setItemToEdit({ language_code: language });
              }}
            >
              arrow_back_ios_new
            </Icon>
            <MDTypography
              pl="26px"
              color="white"
              fontFamily="Roboto"
              fontSize="36px"
              fontWeight="medium"
              textAlign="left"
              style={{ wordWrap: "break-word", cursor: "pointer" }}
              onClick={() => {
                setRedirect("/homepage");
                setItemToEdit({ language_code: language });
              }}
            >
              {Loc.back}
            </MDTypography>
          </MDBox>
          <MDBox p={0} mt="20px" mb={0}>
            <Breadcrumbs>
              <MDTypography
                underline="hover"
                fontSize="24px"
                style={{ cursor: "pointer", color: "#FFFFFF" }}
                onClick={() => {
                  setRedirect("/homepage");
                  setItemToEdit({ language_code: language });
                }}
              >
                {Loc.course}
              </MDTypography>
              <MDTypography fontSize="24px" color="white">
                {language === "en" ? title_eng : title}
              </MDTypography>
            </Breadcrumbs>
          </MDBox>
          <MDBox p={0} mt={"5px"} mb={0}>
            <MDTypography
              p={0}
              m={0}
              fontFamily="Roboto"
              fontSize="64px"
              fontWeight="bold"
              textAlign="left"
              style={{ wordWrap: "break-word" }}
              color="white"
            >
              {language === "en" ? title_eng : title}
            </MDTypography>
          </MDBox>
          <MDBox p={0} mt="20px" mb={0}>
            <MDTypography
              fontFamily="Roboto"
              fontSize="48px"
              fontWeight="regular"
              textAlign="left"
              style={{ wordWrap: "break-word" }}
              color="white"
            >
              {language === "en" ? introduction_eng : introduction}
            </MDTypography>
          </MDBox>
          <MDBox mt="135px">
            <MDBox display="flex" minWidth="346px" height="100px">
              <Card
                sx={{
                  minWidth: "346px",
                  height: "100px",
                  borderRadius: "50px",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  display: "flex",
                }}
                onClick={() => {
                  handleRedirect(0);
                }}
              >
                <MDTypography
                  fontFamily="Roboto"
                  fontSize="36px"
                  fontWeight="regular"
                  textAlign="left"
                  style={{ wordWrap: "break-word" }}
                  color="dark"
                >
                  {Loc.go_to_course}
                </MDTypography>
              </Card>
            </MDBox>
          </MDBox>
        </MDBox>
        
      </MDBox>

      <MDBox px="11%" pt="53px">
        <MDBox px="4%">
          <MDTypography
            fontFamily="Roboto"
            fontSize="48px"
            fontWeight="medium"
            textAlign="left"
            style={{ wordWrap: "break-word" }}
            color="dark"
          >
            {Loc.whats_included}
          </MDTypography>
        </MDBox>
        <MDBox px="4%" pt="45px" pb="50px">
          <MDTypography
            fontFamily="Roboto"
            fontSize="36px"
            fontWeight="regular"
            textAlign="left"
            style={{ wordWrap: "break-word" }}
            color="dark"
          >
            {showMore || temp_description.length <= 150
              ? temp_description
              : `${temp_description.substring(0, 150)}` + " ..."}
          </MDTypography>
          {temp_description.length > 150 && (
            <MDTypography
              mt="26px"
              color="info"
              fontFamily="Roboto"
              fontSize="36px"
              fontWeight="medium"
              textAlign="left"
              style={{ wordWrap: "break-word", cursor: "pointer" }}
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? Loc.show_less : Loc.show_more}
            </MDTypography>
          )}
        </MDBox>

        <hr />
        <MDBox pt="72px">
          <MDTypography
            px="4%"
            fontFamily="Roboto"
            fontSize="48px"
            fontWeight="medium"
            textAlign="left"
            style={{ wordWrap: "break-word" }}
            color="dark"
          >
            {Loc.assessment}
          </MDTypography>
          <MDBox
            px="4%"
            display="flex"
            py="32px"
            mb="38px"
            alignItems="center"
            flexDirection="row"
            bgColor={backgroundColor}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setBackgroundColor("#F8F9FA")}
            onMouseLeave={() => setBackgroundColor("white")}
            onClick={() => {
              setBackgroundColor("#F0F2F5");
              let body = state;
              body.quiz = quizData;
              body.language_code = language;
              // console.log(body);
              setRedirect("/quiz");
              setItemToEdit(body);
            }}
          >
            <Icon fontSize="large">radio_button_unchecked</Icon>
            <MDTypography
              pl="48px"
              fontFamily="Roboto"
              fontSize="36px"
              fontWeight="regular"
              textAlign="left"
              color="dark"
              style={{ wordWrap: "break-word" }}
            >
              {language === "en" ? quizData.quiz_name_eng : quizData.quiz_name}
            </MDTypography>
          </MDBox>
        </MDBox>

        <hr />
        <MDBox>
          <MDBox pb="139px" pt="72px">
            <MDTypography
              px="4%"
              pb="72px"
              fontFamily="Roboto"
              fontSize="36px"
              fontWeight="medium"
              textAlign="left"
              color="dark"
            >
              {Loc.course_content}
            </MDTypography>

            {renderCourseContentBox}
          </MDBox>
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

export default Introduction;
