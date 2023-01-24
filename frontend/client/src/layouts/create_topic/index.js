import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import bgImage from "assets/images/Register.png";

import BookingCard from "examples/Cards/BookingCard";
import booking1 from "assets/images/products/product-1-min.jpg";

import firebase from "../../examples/connectionHandler/firebase";
import fetchAPI from "../../examples/connectionHandler/FetchAPI";

import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Grid } from "@mui/material";
import Container from '@mui/material/Container';

import CircularProgress from "@mui/material/CircularProgress";
import { useLocation } from "react-router-dom";

import Loc from "localization";
import loadingBox from "components/loadingBox";
import MDButton from "components/MDButton";

import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import { useState } from "react";

import FormField from "layouts/pages/account/components/FormField";
import MDInput from "components/MDInput";
import Switch from "@mui/material/Switch";


import SOL from "assets/images/icons/currency/sol_icon.png";
import ICON_YOUTUBE from "assets/images/icons/youtube.png"

function CreateTopic() {
    const { state } = useLocation();
    const { language_code } = state;

    const [pathToRedirect, setRedirect] = React.useState("");
    const [itemToEdit, setItemToEdit] = React.useState(null);
    const [language, set_Language] = React.useState(language_code);
    const [isLoading, set_isLoading] = React.useState(true);

    const [isSignedIn, setSignedIn] = React.useState(false);
    const [isCheckedSignIn, set_isCheckedSignIn] = React.useState(false);
    const [data_quiz, set_data_quiz] = React.useState([]);
    



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

    // Check login or not
  function add_authListener() {
    // console.log("add_authListener called in Admin");
    return firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        set_isLoading(false);
        // User is signed in.
        console.log("Checking, signed in");
        setSignedIn(true);
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

  // Check Signin or not
  useEffect(() => {
    set_isCheckedSignIn(false);
    const subscription_auth = add_authListener();

    const new_q = {
        "question":"",
        "selections":[""],
        "correctIndex":[false]
    }
    data_quiz.push(new_q)
    set_data_quiz([...data_quiz]);

    return function cleanup() {
      subscription_auth();
    };
  }, []);

  // update quiz data
  useEffect(() => {

  }, [data_quiz]);

  useEffect(() => {
    Loc.setLanguage(language === "en" ? "en" : "zh_Hant");
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

  const render_header = () => {
    return (
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
    );
  }

  function render_question_part(quizData)
  {
    console.log(`quizData: ${JSON.stringify(quizData)}`)
    console.log("quizData.length: " + quizData.length);
    const ui_question = (org_data, index) => {
        var data = org_data[index];
        return (
        <MDBox p={2}>
            <FormField label={"#" + index} placeholder="Enter question here..." type="text" value={data.question} onChange={(e) => {
                data.question = e.target.value;
                org_data[index] = data;
                set_data_quiz([...org_data]);
            }}/>
        </MDBox>
        )
    };

    const ui_selection = (org_data, index) => {
        var data = org_data[index];
        var data_selections = data.selections;
        var data_isCorrect = data.correctIndex;

        const ui_selections = data_selections.map((sel, key) => {
            return (
                <MDBox display="flex" flexDirection="row" px={2}>
                    <MDInput fullWidth label={"Option " + (key + 1)} placeholder="Enter selection here..." type="text" style={{alignSelf: 'center'}} value={sel} onChange={(e) => {
                        data_selections[key] = e.target.value;
                        data.selections = data_selections;
                        org_data[index] = data;
                        set_data_quiz([...org_data]);
                    }}/>
                    <MDBox p={2}>
                        <MDBox
                            display="flex"
                            justifyContent={{ md: "flex-end" }}
                            alignItems="center"
                            lineHeight={1}
                            >
                            <MDTypography variant="caption" fontWeight="regular">
                                Correct
                            </MDTypography>
                            <MDBox ml={1}>
                                <Switch checked={data_isCorrect[key]} onChange={() =>{
                                    data_isCorrect[key] = !data_isCorrect[key];
                                    data.correctIndex = data_isCorrect;
                                    org_data[index] = data;
                                    set_data_quiz([...org_data]);
                                }} />
                            </MDBox>
                        </MDBox>
                    </MDBox>
                    
                    <MDBox p={2}>
                        <MDButton variant="outlined" color={data_selections.length > 1 ? "error" : "dark"} size="small" disabled={data_selections.length <= 1} onClick={() => {
                            data_selections.splice(key, 1);
                            data_isCorrect.splice(key, 1);
                            data.selections = data_selections;
                            data.correctIndex = data_isCorrect;
                            org_data[index] = data;
                            set_data_quiz([...org_data]);
                        }}><Icon>{"clear"}</Icon></MDButton>
                    </MDBox>
                </MDBox>
            );
        });
        return (
            <div style={{display: "flex", flexDirection: "column"}}>
                
                {ui_selections}
                
                
                <MDBox display="flex" flexDirection="column" alignItems="flex-start" p={2}>
                    <MDButton variant="outlined" color="success" size="small" onClick={() => {
                        data_selections.push("");
                        data_isCorrect.push(false);
                        data.selections = data_selections;
                        data.correctIndex = data_isCorrect;
                        org_data[index] = data;
                        set_data_quiz([...org_data]);
                    }}><Icon>{"add"}</Icon>&nbsp; Add Option</MDButton>
                </MDBox>
            </div>
        )
    };
    const ui_tool = (org_data, index) => {
        return (
            <div style={{display: "flex", justifyContent: "flex-end"}}>
                <MDButton variant="contained" color="error" onClick={() => {
                    console.log("removing index: " + index);
                    org_data.splice(index, 1);
                    set_data_quiz([...org_data]);
                }}>Remove</MDButton>
            </div>
        )
    };

    const ui_add_question = (org_data) => {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MDBox display="flex" flexDirection="column" alignItems="center" p={2}>
                        <MDButton variant="outlined" color="info" size="large" onClick={() => {
                            console.log("Add question clicked");
                            const new_q = {
                                "question":"",
                                "selections":[""],
                                "correctIndex":[false]
                            }
                            org_data.push(new_q);
                            set_data_quiz([...org_data]);
                        }}><Icon>{"add"}</Icon>&nbsp; Add Question</MDButton>
                    </MDBox>
                </Grid>
            </Grid>
        );
    };

    const quiz_ui = (quizData.length == 0) ? (ui_add_question(quizData)) : quizData.map((data, key) => {
        console.log("quiz dataaaaa: "+JSON.stringify(data))
        const index = key;
        return (
            <div>
                <MDBox p={2}>
                    <Card id="basic-info" sx={{ overflow: "visible" }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <MDBox p={2}>
                                    <div style={{display: "flex", flexDirection: "column"}}>
                                        {ui_question(quizData, index)}
                                        {ui_selection(quizData, index)}
                                        <Divider />
                                        {ui_tool(quizData, index)}
                                    </div>
                                </MDBox>
                            </Grid>
                        </Grid>
                    </Card>

                    {key == quizData.length - 1 ? ui_add_question(quizData) : null}
                </MDBox>
            </div>
        );
    });
    
    return (
        quiz_ui
    );
  }

  return isLoading === true ? loadingBox : (
    <div>
      {/* <MDBox bgColor="#FFFFFF" minWidth="800px"> */}
        {render_header()}
      {/* </MDBox> */}

        <Grid container spacing={3}>
            <Grid item xs={2}></Grid>
            <Grid item xs={8}>
                <MDBox display="flex" flexDirection="row" alignItems="center" p={2}>
                    <MDButton variant="contained" color="dark" size="medium" onClick={() => {
                    setRedirect("/homepage");
                    setItemToEdit({ language_code: language });
                    }}>
                    {Loc.back}
                    </MDButton>
                </MDBox>


                <Card id="basic-info" sx={{ overflow: "visible" }}>
                    <MDBox p={3}>
                        <MDTypography variant="h5">Create Your Topic</MDTypography>
                    </MDBox>

                    <MDBox component="form" pb={3} px={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormField label="Topic Name" placeholder="Enter the topic name here" />
                            </Grid>
                            <Grid item xs={12}>
                                <FormField label="Description" placeholder="Tell us about your topic" />
                            </Grid>

                            <Grid item xs={4}>
                                <div style={{display: "flex"}}>
                                    {/* <MDBox> */}
                                        <img src={SOL} style={{ width: 30, height: 30, alignSelf: 'center'}}/>
                                    {/* </MDBox> */}
                                    {/* <MDBox> */}
                                        <FormField label="Course Fee ($SOL)" placeholder="Price for this course" type="number"/>
                                    {/* </MDBox> */}
                                </div>
                            </Grid>

                            <Grid item xs={4}>
                                <FormField label="Max Quota (0 = Unlimited)" placeholder="Max Quota for the course" type="number"/>
                            </Grid>

                            <Grid item xs={4}>
                                <FormField label="Pass Rate (50 = 50%)" placeholder="Pass rate of the course" type="number"/>
                            </Grid>

                            <Grid item xs={12}>
                                <div style={{display: "flex"}}>
                                    <img src={ICON_YOUTUBE} style={{ width: 30, height: 30, alignSelf: 'center'}} />
                                    <FormField label="Youtube Link" placeholder="Enter Video Link here" />
                                </div>
                            </Grid>
                        </Grid>
                    </MDBox>
                </Card>

                <MDBox p={3}>
                    <MDTypography variant="h5" color="dark">Course Quiz</MDTypography>
                </MDBox>

                {render_question_part(data_quiz)}

                <Divider />

                <MDBox display="flex" flexDirection="column" alignItems="center" p={2}>
                    <MDButton variant="contained" color="success" size="large">
                        <Icon>{"done"}</Icon>
                        &nbsp;
                        Create Topic
                    </MDButton>
                </MDBox>
            </Grid>
            <Grid item xs={2}></Grid>
        </Grid>
    </div>
  );
}

export default CreateTopic;