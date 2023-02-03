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

import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ProfileCard from "components/ProfileCard";
import StatusCard from "components/StatusCard";
import DefaultStatisticsCard from "examples/Cards/StatisticsCards/DefaultStatisticsCard";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import { useState } from "react";

import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";
import team5 from "assets/images/team-5.jpg";
import logoSlack from "assets/images/small-logos/logo-slack.svg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import logoXD from "assets/images/small-logos/logo-xd.svg";
import logoAsana from "assets/images/small-logos/logo-asana.svg";
import logoInvision from "assets/images/small-logos/logo-invision.svg";
import logoAtlassian from "assets/images/small-logos/logo-atlassian.svg";
import TopicCard from "components/TopicCard";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";
import CategoriesList from "components/QuestList";
import categoriesListData from "layouts/homepage/demoQuestData.js";


import ICON_FIRE from "assets/images/icons/fire.png";
import ICON_WOOD from "assets/images/icons/wood.png";
import ICON_WATER from "assets/images/icons/water.png";
import ICON_GROUND from "assets/images/icons/stone.png";

import ICON_GEM_RED from "assets/images/icons/gem_red.png";
import ICON_GEM_YELLOW from "assets/images/icons/gem_yellow.png";
import ICON_GEM_PURPLE from "assets/images/icons/gem_purple.png";
import ICON_GEM_GREEN from "assets/images/icons/gem_green.png";

import img_event_1 from "assets/images/event/banner_1.jpeg";//2208_w023_n003_2817b_p1_2817.jpg";
import img_event_2 from "assets/images/event/banner_2.jpeg";//8068644.png";

import ICON_PROFILE from "assets/images/icons/viking.png"

import data_quiz_1 from "layouts/quiz/quiz_1.js"
import data_quiz_2 from "layouts/quiz/quiz_2.js"
import data_quiz_3 from "layouts/quiz/quiz_3.js"

import icon_topic_1 from "assets/images/icons/icon_topic_1.png";
import icon_topic_2 from "assets/images/icons/icon_topic_2.png";
import icon_topic_3 from "assets/images/icons/icon_topic_3.png";
import icon_topic_4 from "assets/images/icons/icon_topic_4.png";
import icon_topic_5 from "assets/images/icons/icon_topic_5.png";
import icon_topic_6 from "assets/images/icons/icon_topic_6.png";


// import { useLocation } from "react-router-dom";

function Homepage() {
  const { state } = useLocation();
  const { language_code } = state;
  // console.log(language_code);

  // For navigation path and data to be transfer
  const [pathToRedirect, setRedirect] = React.useState("");
  const [itemToEdit, setItemToEdit] = React.useState(null);

  const [course, set_course] = React.useState("");
  const [courseName, set_courseName] = React.useState("");
  const [course_Description, set_course_Description] = React.useState("");
  const [language, set_Language] = React.useState(language_code);
  const [passRate, set_PassRate] = React.useState(0);

  const [isSignedIn, setSignedIn] = React.useState(false);
  const [isCheckedSignIn, set_isCheckedSignIn] = React.useState(false);
  const [data_adminInfo, setDate_adminInfo] = React.useState(null);

  const [isLoading, set_isLoading] = React.useState(true);
  const [courseArray, setCourseArray] = React.useState([]);
  const [profileData, set_profileData] = React.useState(null);
  const [topicData, set_topicData] = React.useState(null);

  

  const [tabsOrientation, setTabsOrientation] = React.useState("horizontal");
  const [tabValue, setTabValue] = React.useState(0);


    // TeamProfileCard dropdown menu handlers
    const openSlackBotMenu = (event) => setSlackBotMenu(event.currentTarget);
    const closeSlackBotMenu = () => setSlackBotMenu(null);
    const openPremiumSupportMenu = (event) => setPremiumSupportMenu(event.currentTarget);
    const closePremiumSupportMenu = () => setPremiumSupportMenu(null);
    const openDesignToolsMenu = (event) => setDesignToolsMenu(event.currentTarget);
    const closeDesignToolsMenu = () => setDesignToolsMenu(null);
    const openLookingGreatMenu = (event) => setLookingGreatMenu(event.currentTarget);
    const closeLookingGreatMenu = () => setLookingGreatMenu(null);
    const openDeveloperFirstMenu = (event) => setDeveloperFirstMenu(event.currentTarget);
    const closeDeveloperFirstMenu = () => setDeveloperFirstMenu(null);

    const [slackBotMenu, setSlackBotMenu] = useState(null);
    const [premiumSupportMenu, setPremiumSupportMenu] = useState(null);
    const [designToolsMenu, setDesignToolsMenu] = useState(null);
    const [lookingGreatMenu, setLookingGreatMenu] = useState(null);
    const [developerFirstMenu, setDeveloperFirstMenu] = useState(null);

    const [isLoadingProfile, set_isLoadingProfile] = useState(true);
    const [isLoadingTopicList, set_isLoadingTopicList] = useState(true);

    

    // const renderMenu = (state, close) => (
    //   <Menu
    //     anchorEl={state}
    //     anchorOrigin={{ vertical: "top", horizontal: "left" }}
    //     transformOrigin={{ vertical: "top", horizontal: "right" }}
    //     open={Boolean(state)}
    //     onClose={close}
    //     keepMounted
    //   >
    //     <MenuItem onClick={close}>Action</MenuItem>
    //     <MenuItem onClick={close}>Another action</MenuItem>
    //     <MenuItem onClick={close}>Something else here</MenuItem>
    //   </Menu>
    // );

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

  // Check login or not
  function add_authListener() {
    // console.log("add_authListener called in Admin");
    return firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        set_isLoading(true);
        // User is signed in.
        console.log("Checking, signed in");
        setSignedIn(true);
        get_courseData();
        get_profile();
        get_topic_list();
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

  function get_profile()
  {
    const body = {}

    fetchAPI.do_fetch("post", "user/get_profile", body).then(
      (res) => {
        const profile = res.data;
        profile.register_date = profile.createDate_string;
        set_profileData(profile);
        set_isLoadingProfile(false);
      },
      (error) => {
        console.log("Get profile fail");
      }
    );
  }

  function get_topic_list()
  {
    const body = {}

    fetchAPI.do_fetch("post", "user/list_topic", body).then(
      (res) => {
        const returnData = res.data;
        const list_topic = returnData.data_list;
        // console.log(`list_topic: ${JSON.stringify(list_topic)}`);

        set_topicData(list_topic);
        set_isLoadingTopicList(false);

      },
      (error) => {
        console.log("Get topic list fail");
      }
    );
  }

  // Called when checked login
  function get_courseData() {
    set_PassRate(0);
    set_course(null);
    set_isLoading(false);
    setCourseArray([]);


    // get course info
    const body = {
      language_code: language,
    };
    // console.log(body);
  }

  // Check Signin or not
  useEffect(() => {
    set_isCheckedSignIn(false);
    const subscription_auth = add_authListener();
    return function cleanup() {
      subscription_auth();
    };
  }, []);

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

  const handleSetTabValue = (event, newValue) => setTabValue(newValue);

  function join_topic_clicked(topicID, data)
  {
    console.log("Clicked topic: " + topicID);
    setRedirect("/quiz");
    let body = state;
    body.language_code = language;
    body.topicID = topicID;
    // body.passRate = 50;
    body.data_quiz_data = data;
    setItemToEdit(body);
  }

  function render_topic_cards(data_topics)
  {
    return data_topics == null ? null : data_topics.map(data => {
      return (
        <Grid item xs={12} md={6} lg={4}>
          <MDBox mb={1.5} mt={1.5}>
            <TopicCard
              image={data.topic_icon_url}
              title={data.topic_name}
              description={data.topic_description}
              max_quota={parseInt(data.max_quota)}
              members={[team1, team2, team3, team4, team5]}
              isEnabled={true}
              callback_onclick={() => {join_topic_clicked("B4qfsQ9EsKj49nUD0JTw", data)}}
              price={data.price}
              totalJoin={data.participants}
              
              // dropdown={{
              //   action: openSlackBotMenu,
              //   menu: renderMenu(slackBotMenu, closeSlackBotMenu),
              // }}
            />
          </MDBox>
        </Grid>
      )
    });
    // <Grid item xs={12} md={6} lg={4}>
    //   <MDBox mb={1.5} mt={1.5}>
    //     <TopicCard
    //       image={icon_topic_1}
    //       title="Learn Maths with Jennifer"
    //       description="Learn Maths with Jennifer is an online course designed for students who want to improve their mathematical skills."
    //       dateTime="02.03.23"
    //       members={[team1, team2, team3, team4, team5]}
    //       isEnabled={true}
    //       callback_onclick={() => {join_topic_clicked("B4qfsQ9EsKj49nUD0JTw", data_quiz_1)}}
    //       price={10.0}
    //       totalJoin={241}
          
    //       // dropdown={{
    //       //   action: openSlackBotMenu,
    //       //   menu: renderMenu(slackBotMenu, closeSlackBotMenu),
    //       // }}
    //     />
    //   </MDBox>
    // </Grid>
    // <Grid item xs={12} md={6} lg={4}>
    //   <MDBox mb={1.5} mt={1.5}>
    //     <TopicCard
    //       image={icon_topic_2}
    //       title="Learn History with Professor Ming"
    //       description="Learn History with Professor Ming is an online course led by a renowned historian, covering a wide range of historical topics from a global perspective."
    //       dateTime="22.11.23"
    //       members={[team1, team2, team3]}
    //       isEnabled={true}
    //       callback_onclick={() => {join_topic_clicked("whza4kQGhWjalYnsGZXz", data_quiz_2)}}
    //       price={12.0}
    //       totalJoin={412}

    //       // dropdown={{
    //       //   action: openPremiumSupportMenu,
    //       //   menu: renderMenu(premiumSupportMenu, closePremiumSupportMenu),
    //       // }}
    //     />
    //   </MDBox>
    // </Grid>
    // <Grid item xs={12} md={6} lg={4}>
    //   <MDBox mb={1.5} mt={1.5}>
    //     <TopicCard
    //       image={icon_topic_3}
    //       title="DNA is our friend"
    //       description="DNA is Our Friend is an online course that covers the basics of DNA and its role in life, including the latest advances in DNA research and its applications."
    //       dateTime="06.03.23"
    //       members={[team1, team2, team3, team4]}
    //       isEnabled={true}
    //       callback_onclick={() => {join_topic_clicked("6GXF9S0Ah0R461PSKmLk", data_quiz_3)}}
    //       price={8.5}
    //       totalJoin={78}

    //       // dropdown={{
    //       //   action: openDesignToolsMenu,
    //       //   menu: renderMenu(designToolsMenu, closeDesignToolsMenu),
    //       // }}
    //     />
    //   </MDBox>
    // </Grid>
    // <Grid item xs={12} md={6} lg={4}>
    //   <MDBox mb={1.5} mt={1.5}>
    //     <TopicCard
    //       image={icon_topic_4}
    //       title="Introduction to Newton's Laws of Motion"
    //       description="This is an online course that covers Newton's three laws of motion and their applications in various fields such as mechanics, engineering, and astronautics."
    //       dateTime="14.03.24"
    //       members={[team1, team2, team3, team4, team5, team3]}
    //       isEnabled={false}
    //       callback_onclick={() => {join_topic_clicked("4cl1UioqVKZPDvXzCNcA")}}
    //       totalJoin={621}
    //       price={11.0}
    //       // dropdown={{
    //       //   action: openLookingGreatMenu,
    //       //   menu: renderMenu(lookingGreatMenu, closeLookingGreatMenu),
    //       // }}
    //     />
    //   </MDBox>
    // </Grid>
    // <Grid item xs={12} md={6} lg={4}>
    //   <MDBox mb={1.5} mt={1.5}>
    //     <TopicCard
    //       image={icon_topic_5}
    //       title="HKCEE English"
    //       description="HKCEE English is an online course designed to prepare students for the HKCEE English Language paper by covering essential grammar, vocabulary, and comprehension skills. Led by experienced and highly qualified teachers."
    //       dateTime="16.01.23"
    //       members={[team1, team2, team3, team4]}
    //       isEnabled={false}
    //       callback_onclick={() => {join_topic_clicked("4cl1UioqVKZPDvXzCNcA")}}
    //       price={99.0}
    //       totalJoin={315}

    //       // dropdown={{
    //       //   action: openDeveloperFirstMenu,
    //       //   menu: renderMenu(developerFirstMenu, closeDeveloperFirstMenu),
    //       // }}
    //     />
    //   </MDBox>
    // </Grid>
    // <Grid item xs={12} md={6} lg={4}>
    //   <MDBox mb={1.5} mt={1.5}>
    //     <TopicCard
    //       image={icon_topic_6}
    //       title="Astro Math"
    //       description="Astro Maths is an online course that covers mathematical concepts and methods used in astronomy, including Astrophotography."
    //       dateTime="16.01.23"
    //       members={[team1, team2, team3, team4]}
    //       isEnabled={false}
    //       callback_onclick={() => {join_topic_clicked("4cl1UioqVKZPDvXzCNcA")}}
    //       price={"0"}
    //       totalJoin={1425}
    //       // dropdown={{
    //       //   action: openDeveloperFirstMenu,
    //       //   menu: renderMenu(developerFirstMenu, closeDeveloperFirstMenu),
    //       // }}
    //     />
    //   </MDBox>
    // </Grid>
  }

  return isLoading === true ? loadingBox : (
    <div>
      {/* <MDBox bgColor="#FFFFFF" minWidth="800px"> */}
        {render_header()}
      {/* </MDBox> */}

      <Grid container spacing={3}>
        <Grid item xs={2}></Grid>
        <Grid item xs={8}>
          <MDBox pb={3}>
            <Grid container alignItems="center">
              {/* <Grid item xs={12}> */}
                
                <Grid item xs={3}>
                  <MDBox mb={1}>
                    <MDTypography variant="h5">Profile Dashboard</MDTypography>
                  </MDBox>
                  <MDBox mb={2}>
                    <MDTypography variant="body2" color="text">
                      See what you have got here!
                    </MDTypography>
                  </MDBox>
                </Grid>

                <Grid item xs={6}>
                  <AppBar position="static">
                    <Tabs orientation={tabsOrientation} value={tabValue} onChange={handleSetTabValue}>
                      <Tab
                        label="Dashboard"
                        icon={
                          <Icon fontSize="small" sx={{ mt: -0.25 }}>
                            home
                          </Icon>
                        }
                      />
                      <Tab
                        label="Profile"
                        icon={
                          <Icon fontSize="small" sx={{ mt: -0.25 }}>
                            account_box
                          </Icon>
                        }
                      />
                      <Tab
                        label="Message"
                        icon={
                          <Icon fontSize="small" sx={{ mt: -0.25 }}>
                            email
                          </Icon>
                        }
                      />
                      <Tab
                        label="Settings"
                        icon={
                          <Icon fontSize="small" sx={{ mt: -0.25 }}>
                            settings
                          </Icon>
                        }
                      />
                    </Tabs>
                  </AppBar>
                  
                </Grid>

                <Grid item xs={3} sx={{ textAlign: "right" }}>
                  <MDButton variant="gradient" color="info" onClick={() => {
                      setRedirect("/create-topic");
                      let body = state;
                      body.language_code = language;
                      setItemToEdit(body);
                    }}>
                      <Icon>add</Icon>&nbsp; Create Your Own Topic
                  </MDButton>
                </Grid>
              {/* </Grid> */}
            </Grid>
          </MDBox>


          <MDBox mt={1.5}>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <MDBox mb={1.5}>
                  {isLoadingProfile ? loadingBox : (
                    <ProfileCard
                      color="light"
                      icon={ICON_PROFILE}
                      
                      profileData={profileData}
                    />
                  )}
                  
                </MDBox>
              </Grid>

              <Grid item xs={8}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <MDBox 
                      color="white"
                      variant="gradient"
                      borderRadius="lg"
                      shadow="lg"
                      display="flex"
                      justifyContent="center"
                      p={1}
                    >
                      <img src={img_event_1} style={{width: "100%"}}/>
                    </MDBox>
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="primary"
                      icon={ICON_FIRE}
                      title="Fire"
                      count="54"
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="success"
                      icon={ICON_WOOD}
                      title="Wood"
                      count="79"
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="info"
                      icon={ICON_WATER}
                      title="Water"
                      count="65"
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="dark"
                      icon={ICON_GROUND}
                      title="Stone"
                      count="54"
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="light"
                      icon={ICON_GEM_RED}
                      title="Red Gem"
                      count="15"
                      isIconNoBG={true}
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="light"
                      icon={ICON_GEM_YELLOW}
                      title="Yellow Gem"
                      count="25"
                      isIconNoBG={true}
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="light"
                      icon={ICON_GEM_PURPLE}
                      title="Purple Gem"
                      isIconNoBG={true}
                      count="18"
                    />
                  </Grid>

                  <Grid item xs={3}>
                    <StatusCard
                      color="light"
                      icon={ICON_GEM_GREEN}
                      title="Green Gem"
                      count="2"
                      isIconNoBG={true}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <DefaultStatisticsCard
                      color="secondary"
                      icon="store"
                      title="Total Answered"
                      count="72"
                      percentage={{
                        color: "success",
                        value: "+5%",
                        label: "than last week",
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <DefaultStatisticsCard
                      color="dark"
                      icon="store"
                      title="Total Created"
                      count="10"
                      percentage={{
                        color: "success",
                        value: "+0%",
                        label: "than last week",
                      }}
                    />
                  </Grid>

                  {/* <Grid item xs={6}>
                    <DefaultInfoCard
                      icon="shopping_cart"
                      title="Paid"
                      description="Total paid"
                      value="$SOL 24.14"
                      color="error"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <DefaultInfoCard
                      icon="attach_money"
                      title="Earned"
                      description="Total earned"
                      value="$SOL 64.2"
                      color="success"
                    />
                  </Grid> */}

                  <Grid item xs={12}>
                    <MDBox mb={3}>
                      <CategoriesList title="Daily Quests" categories={categoriesListData} />
                    </MDBox>
                  </Grid>

                </Grid>
              </Grid>
            </Grid>
          </MDBox>
        </Grid>
        <Grid item xs={2}></Grid>
      </Grid>

      <Divider />
      <Grid container spacing={3}>
        <Grid item xs={2}></Grid>
        <Grid item xs={8}>
          <MDBox pb={3}>
            <Grid container alignItems="center">
              <Grid item xs={12} md={7}>
                <MDBox mb={1}>
                  <MDTypography variant="h5">Learning Area</MDTypography>
                </MDBox>
                <MDBox mb={2}>
                  <MDTypography variant="body2" color="text">
                    Try to find some interesting topics and start Learn-To-Earn!
                  </MDTypography>
                </MDBox>
              </Grid>
              <Grid item xs={12}>
                <MDBox 
                  color="white"
                  variant="gradient"
                  borderRadius="lg"
                  shadow="lg"
                  display="flex"
                  justifyContent="center"
                  p={1}
                >
                  <img src={img_event_2} style={{width: "100%"}}/>
                </MDBox>
              </Grid>
              {/* <Grid item xs={12} md={5} sx={{ textAlign: "right" }}>
                
              </Grid> */}
            </Grid>

            <MDBox mt={5}>
              <Grid container spacing={3}>
                {render_topic_cards(topicData)}
              </Grid>
            </MDBox>


            
          </MDBox>
        </Grid>
        <Grid item xs={2}></Grid>
      </Grid>

      
    </div>
  );
}

export default Homepage;
