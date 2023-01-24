import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Breadcrumbs, Icon, Link, Card } from "@mui/material";
import { useLocation } from "react-router-dom";
import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Question from "./component/question";

import firebase from "../../examples/connectionHandler/firebase";
import fetchAPI from "../../examples/connectionHandler/FetchAPI";

import CircularProgress from "@mui/material/CircularProgress";
import { ConstructionOutlined } from "@mui/icons-material";

import Loc from "localization";
import loadingBox from "components/loadingBox";
import MDButton from "components/MDButton";

import YoutubeEmbed from "components/YoutubeEmbed";


function Quiz() {
  // For receiving data from navigated page
  const { state } = useLocation();
  state.section = 0;
  const { title } = state;
  const { title_eng } = state;
  const { passRate } = state;
  const { language_code } = state;
  const {topicID} = state;

  const {data_quiz_data} = state;

  // console.log("This is state:", state);
  // console.log("This is quiz:", quiz);

  // For navigation path and data to be transfer
  const [pathToRedirect, setRedirect] = React.useState("");
  const [itemToEdit, setItemToEdit] = React.useState(null);

  const [startState, setStartState] = React.useState(false); // For Start Button
  const [UserAnswerArray, setUserAnswerArray] = React.useState([]); // User Input Answer
  const [endState, setEndState] = React.useState(false); // Submitted?
  const [filledAllAnswer, setFilledAllAnswer] = React.useState(false); // filled all questions?
  const [questionsArray, set_questionsArray] = React.useState([]);
  const [shuffled_QuestionsArray, set_shuffledQuestionsArray] = React.useState(
    []
  );

  // The below useState are for checkAnswer() method
  const [pass, setPass] = React.useState(false); // score >= 60% ?
  const [didPass, setDidPass] = React.useState(false); // Recorded score >= 60% ?
  const [score, setScore] = React.useState(0); // Total Score of User
  const [result, setResult] = React.useState([]); // Boolean Array that store whether User answer is correct or not

  const [isSignedIn, setSignedIn] = React.useState(false);
  const [isCheckedSignIn, set_isCheckedSignIn] = React.useState(false);

  const [isLoading, set_isLoading] = React.useState(true);
  const [isLoadingQuizResult, set_isLoadingQuizResult] = React.useState(false);

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
    // console.log(itemToEdit);
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
    // Loc.setLanguage(language === "en" ? "en" : "zh_Hant");
  }, [language]);

  // Check Signed in or not
  function add_authListener() {
    // console.log("add_authListener called in Admin");
    return firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
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

  useEffect(() => {
    set_isCheckedSignIn(false);
    const subscription_auth = add_authListener();
    

    return function cleanup() {
      subscription_auth();
    };
  }, []);

  // Updated isFilledAll question status
  useEffect(() => {
    if (UserAnswerArray.length !== 0) {
      isfilledAll();
    }
  }, [UserAnswerArray]);

  // shuffled after loaded questionArray
  useEffect(() => {
    if (questionsArray.length > 0) {
      set_shuffledQuestionsArray(shuffle(questionsArray));
    }
    else
    {
      console.log("questionsArray.length == 0");
      // console.log(`questionsArray: ${JSON.stringify(questionsArray)}`)
    }
  }, [questionsArray]);

  // Called after checked loginin
  function get_courseData() {
    set_isLoading(true);

    const body = {
      topicID: topicID,
      language_code: language,
    };
    console.log("topicID: " + topicID);
    fetchAPI.do_fetch("post", "course/get_quiz_intro", body).then(
      (res) => {
        console.log("this is the result of quiz intro:", res.data);
        // let temp = res.data.section_list.sort((a, b) =>
        //   a.section_name > b.section_name ? 1 : -1
        // );
        // console.log("this is sorted:", temp);
        set_quizData(res.data);

        console.log("data_quiz_data: " + JSON.stringify(data_quiz_data));
        set_questionsArray(data_quiz_data.section_list);
        let tempArray = [];
        data_quiz_data.section_list.map((dummy, key) => {
          let body = { id: key, value: "" };
          tempArray.push(body);
        });
        setUserAnswerArray(tempArray);
        set_isCheckedSignIn(true);
        set_isLoading(false);
      },
      (error) => {
        // console.log(`error: ${JSON.stringify(error)}`)
        console.log("get quiz intro fail");
        setRedirect("/homepage");
        setItemToEdit({ language_code: language });
      }
    );

    // const body2 = {
    //   topicID: topicID,
    //   language_code: language,
    // };

    // console.log(`data_quiz_data: ${JSON.stringify(data_quiz_data.section_list)}`)
    // set_questionsArray(data_quiz_data.section_list);
    // let tempArray = [];
    // data_quiz_data.section_list.map((dummy, key) => {
    //   let body = { id: key, value: "" };
    //   tempArray.push(body);
    // });
    // setUserAnswerArray(tempArray);
    // set_isCheckedSignIn(true);
    // set_isLoading(false);
    // fetchAPI.do_fetch("post", "course/get_quiz_data", body2).then(
    //   (res) => {
    //     // console.log("this is the result of quiz data:", res);
    //     set_questionsArray(res.data.section_list);
    //     let tempArray = [];
    //     res.data.section_list.map((dummy, key) => {
    //       let body = { id: key, value: "" };
    //       tempArray.push(body);
    //     });
    //     setUserAnswerArray(tempArray);
    //     set_isCheckedSignIn(true);
    //     set_isLoading(false);
    //   },
    //   (error) => {
    //     setRedirect("/homepage");
    //     setItemToEdit({ language_code: language });
    //   //   firebase
    //   //     .auth()
    //   //     .signOut()
    //   //     .then(function () {
    //   //       console.log("Sign-out successful.", error);
    //   //       // setSignedIn(false);
    //   //       // set_isCheckedSignIn(true);
    //   //       // Sign-out successful.
    //   //     })
    //   //     .catch(function (error) {
    //   //       console.log("Sign-out fail, ", error);
    //   //       // setSignedIn(false);
    //   //       // set_isCheckedSignIn(true);
    //   //       // An error happened.
    //   //     });
    //   }
    // );


    // const body = {
    //   language_code: language,
    // };
    // fetchAPI.do_fetch("post", "course/get_quiz_result", body).then(
    //   (res) => {
    //     // console.log("this is the result of get quiz data:", res);
    //     let tempQuizString = "quiz_result_" + quizData.id;
    //     set_isLoading(false);
    //     if (res.data != null) {
    //       if (res.data[tempQuizString] != undefined) {
    //         setScore(res.data[tempQuizString] * 100);
    //         setPass(res.data[tempQuizString] * 100 >= passRate);
    //         set_isLoadingQuizResult(false);
    //         // console.log(res.data[tempQuizString] * 100);
    //         // console.log(res.data[tempQuizString] * 100 >= passRate);
    //         if (res.data[tempQuizString] * 100 >= passRate) {
    //           setDidPass(true);
    //           setStartState(true);
    //           setEndState(true);
    //         }
    //       }
    //     }
    //   },
    //   (error) => {
    //     firebase
    //       .auth()
    //       .signOut()
    //       .then(function () {
    //         console.log("Sign-out successful.", error);
    //         // setSignedIn(false);
    //         // set_isCheckedSignIn(true);
    //         // Sign-out successful.
    //       })
    //       .catch(function (error) {
    //         console.log("Sign-out fail, ", error);
    //         // setSignedIn(false);
    //         // set_isCheckedSignIn(true);
    //         // An error happened.
    //       });
    //   }
    // );
  }

  

  // For random Question
  function shuffle(array) {
    let temp = array;
    return temp.sort(() => Math.random() - 0.5);
  }

  //  Render Question parameter: body = {type, question, options, id}
  const renderQuestions = shuffled_QuestionsArray.map((body, key) => {
    const questionKey = `${key + 1}.`;
    body.id = key;
    body.language_code = language;
    body.index = questionsArray.findIndex((obj) => {
      return obj === body;
    });
    // body.question = `${key + 1}. ` + body.question;
    body.disable = endState;
    return (
      <div key={questionKey}>
        <Question
          body={body}
          DidSelectAnswer={(res) => {
            let newArray = UserAnswerArray.filter((data) => data.id !== res.id); // remove old selected option data
            newArray = [...newArray, res].sort((a, b) => a.id - b.id); // sort
            setUserAnswerArray([...newArray]);
          }}
        ></Question>
        {/* if Submitted and Wrong answer (Red Incorrect Box) */}
        {endState && !result[body.id] && (
          <div>
            <MDBox
              maxWidth="809px"
              minHeight="129px"
              bgColor="#F443350A"
              py="24px"
              px="24px"
            >
              <MDBox display="flex" flexDirection="row">
                <Icon fontSize="large" color="error">
                  close
                </Icon>
                <MDTypography
                  // style={{ backgroundColor: "pink" }}
                  fontFamily="Roboto"
                  fontSize="24px"
                  pl="24px"
                  fontWeight="medium"
                  textAlign="left"
                >
                  {Loc.incorrect}
                </MDTypography>
              </MDBox>
              <MDBox
                display="flex"
                flexDirection="row"
                ml="36px"
                pl="24px"
                // bgColor="cyan"
              >
                <MDTypography
                  fontFamily="Roboto"
                  fontSize="24px"
                  fontWeight="medium"
                  textAlign="left"
                  style={{ color: "#6C757D" }}
                >
                  {/* Description (if any) */}
                </MDTypography>
              </MDBox>
            </MDBox>
          </div>
        )}
      </div>
    );
  });

  

  // Check whether all Question is filled
  const isfilledAll = () => {
    let isfilled = true;
    UserAnswerArray.map((question) => {
      if (question.value.length <= 0) {
        isfilled = false;
      }
    });
    setFilledAllAnswer(isfilled);
  };

  // console.log(UserAnswerArray);

  // Run when Submit
  const checkAnswer = () => {
    setEndState(true);
    set_isLoadingQuizResult(true);

    let totalscore = 0;

    UserAnswerArray.map((ans) => {
      let correct = false;
      let checkArray = questionsArray[ans.id].correct_answer;
      let temp = [];
      // console.log(ans);
      for (let index = 0; index < checkArray.length; index++) {
        if (ans.value.includes(index)) {
          temp.push("1");
        } else temp.push("0");
      }
      // console.log("===============");
      // console.log(JSON.stringify(checkArray));
      // console.log(JSON.stringify(temp));
      // console.log("===============");
      if (JSON.stringify(checkArray) == JSON.stringify(temp)) {
        ++totalscore;
        correct = true;
      }

      // update Result (a boolean Array)
      let tempArray = result;
      tempArray.push(correct);
      setResult(tempArray);
    });
    // console.log(Math.round((totalscore / questionsArray.length) * 100) / 100);
    let temp = (totalscore == 0 ? 0 : (Math.round((totalscore / questionsArray.length) * 100) / 100));

    // if passed then upload result
    // if (Math.round((totalscore / questionsArray.length) * 100) >= passRate) {
      let body = {
        topicID: topicID,
        quiz_score_rate: temp,
      };
      fetchAPI.do_fetch("post", "course/set_quiz_result", body).then(
        (res) => {
          // console.log("this is the result of set quiz data:", res);
          setScore(temp * 100);
          setPass(temp * 100 >= passRate);
          set_isLoadingQuizResult(false);
          // const body2 = {
          //   language_code: language,
          // };
          // fetchAPI.do_fetch("post", "course/get_quiz_result", body2).then(
          //   (res) => {
          //     // console.log("this is the result of get quiz data:", res);
          //     let tempQuizString = "quiz_result_" + quizData.id;
          //     // console.log("testing", res.data[tempQuizString]);
          //     setScore(res.data[tempQuizString] * 100);
          //     setPass((totalscore / questionsArray.length) * 100 >= passRate);
          //     set_isLoadingQuizResult(false);
          //   },
          //   (error) => {
          //     firebase
          //       .auth()
          //       .signOut()
          //       .then(function () {
          //         console.log("Sign-out successful.", error);
          //         // setSignedIn(false);
          //         // set_isCheckedSignIn(true);
          //         // Sign-out successful.
          //       })
          //       .catch(function (error) {
          //         console.log("Sign-out fail, ", error);
          //         // setSignedIn(false);
          //         // set_isCheckedSignIn(true);
          //         // An error happened.
          //       });
          //   }
          // );
        },
        (error) => {
          set_isLoadingQuizResult(false);
          // firebase
          //   .auth()
          //   .signOut()
          //   .then(function () {
          //     console.log("Sign-out successful.", error);
          //     // setSignedIn(false);
          //     // set_isCheckedSignIn(true);
          //     // Sign-out successful.
          //   })
          //   .catch(function (error) {
          //     console.log("Sign-out fail, ", error);
          //     // setSignedIn(false);
          //     // set_isCheckedSignIn(true);
          //     // An error happened.
          //   });
        }
      );
    // } else {
    //   setScore(Math.round((totalscore / questionsArray.length) * 100));
    //   setPass(
    //     Math.round((totalscore / questionsArray.length) * 100) >= passRate
    //   );
    //   set_isLoadingQuizResult(false);
    // }
  };

  const handle_Logout = () => {
    firebase
      .auth()
      .signOut()
      .then(function () {
        setRedirect("/authentication/sign-in/illustration");
        setItemToEdit("");
      });
  };

  return isLoading === true ? loadingBox : (
    <MDBox bgColor="#FFFFFF" minHeight="1585px" minWidth="800px">
      <MDBox
          display="flex"
          justifyContent="right"
          maxWidth="100%"
          p={1}
        >
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
          </MDBox> */}
          

          <MDButton size="small" color="info" variant="gradient" onClick={() => handle_Logout()}>
          {Loc.sign_out}
          </MDButton>          
        </MDBox>


      <MDBox px="14%" pt="48px">
        <MDBox display="flex" flexDirection="row" alignItems="center">
          <MDButton variant="contained" color="dark" size="medium" onClick={() => {
            setRedirect("/homepage");
            setItemToEdit({ language_code: language });
          }}>
            {Loc.back}
          </MDButton>
          {/* <MDBox
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
          </MDBox> */}
        </MDBox>
        {/* <MDBox display="flex" flexDirection="row" pt="42px" alignItems="center">
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

            <MDTypography fontSize="24px" color="dark">
              {Loc.assessment}
            </MDTypography>
          </Breadcrumbs>
        </MDBox> */}
        <MDBox pt="36px">
          <MDTypography
            fontFamily="Roboto"
            fontSize="48px"
            fontWeight="regular"
            textAlign="left"
            color="dark"
            style={{ wordWrap: "break-word" }}
          >
            {language === "en" ? quizData.quiz_name_eng : quizData.quiz_name}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" flexDirection="row" pt="42px" alignItems="center">
          <MDTypography
            fontFamily="Roboto"
            fontSize="24px"
            fontWeight="regular"
            textAlign="left"
            style={{ color: "#6C757D", wordWrap: "break-word" }}
          >
            {questionsArray.length} {Loc.questions}
          </MDTypography>
          <MDTypography
            fontFamily="Roboto"
            fontSize="24px"
            fontWeight="regular"
            textAlign="left"
            style={{ color: "#6C757D", wordWrap: "break-word" }}
            pl="72px"
          >
            {language === "en" ? quizData.quiz_duration_eng : quizData.quiz_duration}
          </MDTypography>
          <MDTypography
            fontFamily="Roboto"
            fontSize="24px"
            fontWeight="regular"
            textAlign="left"
            style={{ color: "#6C757D", wordWrap: "break-word" }}
            pl="72px"
          >
            {Loc.to_pass} {" "} {passRate}% {" "} {Loc.or_higher}
          </MDTypography>
        </MDBox>

        {!endState && (
          <div>
          {/* {Youtube Video} */}
            <MDBox display="flex" flexDirection="row" pt="42px" alignItems="center">
              <YoutubeEmbed embedId="53me-ICi_f8" />
            </MDBox>

            {/* {Description} */}
            <MDBox
              display="flex"
              flexDirection="row"
              pt="71px"
              pb="32.5px"
              alignItems="center"
            >
              <MDTypography
                fontFamily="Roboto"
                fontSize="24px"
                fontWeight="regular"
                textAlign="left"
                style={{ color: "#6C757D", wordWrap: "break-word" }}
              >
                {language === "en"
                  ? quizData.quiz_description_eng
                  : quizData.quiz_description}
              </MDTypography>
            </MDBox>
          </div>
        )}
        

        {/* After Started */}
        {startState && (
          <div>
            {/* If submitted */}
            {endState && (
              <div>
                {isLoadingQuizResult === true ? (
                  <MDBox
                    mb="55px"
                    py="20px"
                    px="33px"
                    maxWidth="78%"
                    minWidth="809px"
                    minHeight="188px"
                    bgColor="#0000000A"
                    display="flex"
                    flexDirection="column"
                  >
                    <MDBox
                      // bgColor="pink"
                      display="flex"
                      alignItem="center"
                      justifyContent="center"
                    >
                      <MDTypography
                        fontFamily="PingFang"
                        fontSize="48px"
                        fontWeight="regular"
                        textAlign="left"
                      >
                        {Loc.uploading_quiz_result}
                      </MDTypography>
                    </MDBox>
                    <MDBox
                      // bgColor="cyan"
                      display="flex"
                      alignItem="center"
                      justifyContent="center"
                    >
                      <CircularProgress color="info" />
                    </MDBox>
                  </MDBox>
                ) : (
                  <div>
                    {pass ? (
                      // If passed
                      <MDBox
                        mb="55px"
                        py="20px"
                        px="33px"
                        maxWidth="78%"
                        minWidth="600px"
                        minHeight="188px"
                        bgColor="#4CAF500A"
                      >
                        <MDBox
                          m={0}
                          p={0}
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          // bgColor="pink"
                        >
                          <Icon fontSize="large" style={{ color: "#4CAF50" }}>
                            sentiment_satisfied
                          </Icon>
                          <MDTypography
                            pl="16px"
                            fontFamily="Roboto"
                            fontSize="36px"
                            fontWeight="medium"
                            textAlign="left"
                            style={{ wordWrap: "break-word" }}
                          >
                            {Loc.congratulation_you_passed}
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          m={0}
                          p={0}
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          // bgColor="pink"
                        >
                          <MDTypography
                            pl="52px"
                            fontFamily="Roboto"
                            fontSize="24px"
                            fontWeight="regular"
                            textAlign="left"
                            style={{ wordWrap: "break-word" }}
                          >
                            {Loc.grade_received}{" "}
                            <span style={{ color: "#4CAF50" }}>
                              {Math.round(score)}%
                            </span>
                          </MDTypography>
                          <MDTypography
                            pl="42px"
                            fontFamily="Roboto"
                            fontSize="24px"
                            fontWeight="regular"
                            textAlign="left"
                            style={{ wordWrap: "break-word" }}
                          >
                            {Loc.to_pass} {" "} {passRate}% {" "} {Loc.or_higher}
                          </MDTypography>
                        </MDBox>
                        {/* <MDTypography
                          pt="16px"
                          pl="52px"
                          fontFamily="Roboto"
                          fontSize="16px"
                          fontWeight="regular"
                          textAlign="left"
                          style={{ wordWrap: "break-word", color: "#6C757D" }}
                        >
                          You completed this assessment on September 27, 2021
                        </MDTypography> */}
                      </MDBox>
                    ) : (
                      // If failed
                      <MDBox
                        mb="55px"
                        py="20px"
                        px="33px"
                        maxWidth="78%"
                        minWidth="809px"
                        minHeight="188px"
                        bgColor="#FB8C000A"
                      >
                        <MDBox
                          m={0}
                          p={0}
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          // bgColor="pink"
                        >
                          <Icon fontSize="large" style={{ color: "#FB8C00" }}>
                            sentiment_dissatisfied
                          </Icon>
                          <MDTypography
                            pl="16px"
                            fontFamily="Roboto"
                            fontSize="36px"
                            fontWeight="medium"
                            textAlign="left"
                            style={{ wordWrap: "break-word" }}
                          >
                            {Loc.try_again}
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          m={0}
                          p={0}
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          // bgColor="pink"
                        >
                          <MDTypography
                            pl="52px"
                            fontFamily="Roboto"
                            fontSize="24px"
                            fontWeight="regular"
                            textAlign="left"
                            style={{ wordWrap: "break-word" }}
                          >
                            {Loc.grade_received}{" "}
                            <span style={{ color: "#F44335" }}>
                              {Math.round(score)}%
                            </span>
                          </MDTypography>
                          <MDTypography
                            pl="42px"
                            fontFamily="Roboto"
                            fontSize="24px"
                            fontWeight="regular"
                            textAlign="left"
                            style={{ wordWrap: "break-word" }}
                          >
                            {Loc.to_pass} {" "} {passRate}% {" "} {Loc.or_higher}
                          </MDTypography>
                          <MDBox
                            ml="182px"
                            display="flex"
                            minWidth="240px"
                            height="58px"
                          >
                            <Card
                              sx={{
                                minWidth: "240px",
                                height: "58px",
                                borderRadius: "15px",
                                justifyContent: "center",
                                alignItems: "center",
                                cursor: "pointer",
                                display: "flex",
                                backgroundColor: "#1A73E8",
                              }}
                              onClick={() => {
                                window.location.reload(false);
                              }}
                            >
                              <MDTypography
                                fontFamily="Roboto"
                                fontSize="24px"
                                fontWeight="regular"
                                textAlign="left"
                                style={{ wordWrap: "break-word" }}
                                color="white"
                              >
                                {Loc.try_again}
                              </MDTypography>
                            </Card>
                          </MDBox>
                        </MDBox>
                      </MDBox>
                    )}
                  </div>
                )}
              </div>
            )}
            <hr />
            {!endState && (
              <MDBox pt="32.5px">
                {didPass !== true && <form>{renderQuestions}</form>}
              </MDBox>
            )}

            {/* Submit button */}
            {!endState && (
              <div>
                <hr />
                <MDBox mt="68px" display="flex" minWidth="240px" height="58px">
                  <Card
                    sx={{
                      minWidth: "240px",
                      height: "58px",
                      borderRadius: "15px",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: filledAllAnswer && "pointer",
                      display: "flex",
                      backgroundColor: filledAllAnswer ? "#1A73E8" : "#ADB5BD",
                    }}
                    onClick={() => {
                      if (filledAllAnswer) {
                        checkAnswer();
                      }
                    }}
                  >
                    <MDTypography
                      fontFamily="Roboto"
                      fontSize="24px"
                      fontWeight="regular"
                      textAlign="left"
                      style={{ wordWrap: "break-word" }}
                      color="white"
                    >
                      {Loc.submit}
                    </MDTypography>
                  </Card>
                </MDBox>
              </div>
            )}
            <MDBox height="316px"></MDBox>
          </div>
        )}

        {/* Before Started */}
        {!startState && (
          <div>
            {/* <MDBox
              pt="10px"
              // style={{ cursor: "pointer" }}
              display="flex"
              alignItems="center"
              flexDirection="row"
              // bgColor="pink"
            >
              <MDTypography
                pr="5px"
                fontFamily="Roboto"
                fontSize="24px"
                fontWeight="medium"
                textAlign="left"
                color="info"
                onClick={() => {
                  // console.log(body);
                  setRedirect("/content");
                  let body = state;
                  body.language_code = language;
                  setItemToEdit(body);
                }}
                style={{ wordWrap: "break-word", cursor: "pointer" }}
              >
                {Loc.go_to_course}
              </MDTypography>
              <Icon
                size="7px"
                color="info"
                py="3px"
                onClick={() => {
                  // console.log(body);
                  setRedirect("/content");
                  let body = state;
                  body.language_code = language;
                  setItemToEdit(body);
                }}
                style={{ cursor: "pointer" }}
              >
                arrow_forward_ios_new
              </Icon>
            </MDBox> */}

            <MDBox mt="35px" display="flex" minWidth="240px" height="58px">
              <Card
                sx={{
                  minWidth: "240px",
                  height: "58px",
                  borderRadius: "15px",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  display: "flex",
                  backgroundColor: "#1A73E8",
                }}
                onClick={() => {
                  setStartState(true);
                }}
              >
                <MDTypography
                  fontFamily="Roboto"
                  fontSize="24px"
                  fontWeight="regular"
                  textAlign="left"
                  style={{ wordWrap: "break-word" }}
                  color="white"
                >
                  {Loc.start}
                </MDTypography>
              </Card>
            </MDBox>
          </div>
        )}
      </MDBox>
    </MDBox>
  );
}

export default Quiz;
