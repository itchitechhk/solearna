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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import { Button, Grid } from "@mui/material";

import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import SOL from "assets/images/icons/currency/sol_icon.png";
import MDProgress from "components/MDProgress";
import AttributeChart from "components/AttributeChart";
import radarChartData from "layouts/pages/charts/data/radarChartData";


function ComplexStatisticsCard({ color, title, icon, profileData }) {

  const shortWalletAddress = (wallet_address) => {
    if (wallet_address != null && wallet_address != "")
    {
      const maxLimit = 10;
      if (wallet_address.length > maxLimit)
      {
        const start = wallet_address.substring(0,5);
        const end = wallet_address.substring(wallet_address.length - 1 - 4, wallet_address.length  -1);
        return start + "..." + end
      }
      else
      {
        return wallet_address;
      }
    }
  };

  return (
    <Card>
      <MDBox display="flex" justifyContent="space-between" pt={1} px={2}>
        <MDBox
          // variant="outline"
          bgColor={color}
          // color={color === "light" ? "dark" : "white"}
          coloredShadow={color}
          borderRadius="4rem"
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="8rem"
          height="8rem"
          mt={-3}
        >
          {/* <Icon fontSize="medium" color="inherit">
            {icon}
          </Icon> */}
          <MDBox display="flex" justifyContent="center">
            <img src={icon} style={{ width: 90, height: 90, alignSelf: 'center'}} />
          </MDBox>
        </MDBox>

        <MDBox textAlign="right" lineHeight={1.25}>
          <MDTypography variant="button" fontWeight="light" color="text">
            {title}
          </MDTypography>

          <div style={{display: "flex"}}>
            <MDBox>
              <img src={SOL} style={{ width: 30, height: 30, alignSelf: 'center'}} />
            </MDBox>
            <MDBox>
              <MDTypography variant="h4">{Number(profileData.balance_sol).toFixed(4)}</MDTypography>
            </MDBox>
          </div>
        </MDBox>
      </MDBox>
      
      <Divider />

      <MDBox px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDTypography variant="h4" display="flex" sx={{justifyContent: 'center'}}>Lv.{profileData.level}</MDTypography>
          </Grid>
        </Grid>
      </MDBox>

      <MDBox px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDBox mt={0.25}>
              <MDTypography variant="caption" display="flex" sx={{justifyContent: 'center'}}>Exp: {profileData.exp} / {profileData.exp_max}</MDTypography>
              <MDProgress variant="gradient" value={profileData.exp / profileData.exp_max * 100} color="success" />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>

      <MDBox p={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AttributeChart
              icon={{ color: "warning", component: "data_saver_on" }}
              title="Attribute Chart"
              description="Scores"
              chart={radarChartData}
            />
          </Grid>
        </Grid>
      </MDBox>


      <Divider />

      <MDBox px={2}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex">Email</MDTypography>
          </Grid>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex" sx={{justifyContent: 'flex-end'}}>{profileData.email}</MDTypography>
          </Grid>
        </Grid>
      </MDBox>
      
      <MDBox px={2}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex">Nickname</MDTypography>
          </Grid>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex" sx={{justifyContent: 'flex-end'}}>{profileData.nickname}</MDTypography>
          </Grid>
        </Grid>
      </MDBox>


      <MDBox px={2}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex">Wallet</MDTypography>
          </Grid>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex" sx={{justifyContent: 'flex-end'}}>{shortWalletAddress(profileData.wallet_address)}</MDTypography>
          </Grid>
        </Grid>
      </MDBox>

      <MDBox px={2}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex">Registrer Date</MDTypography>
          </Grid>
          <Grid item xs={6}>
            <MDTypography variant="overline" display="flex" sx={{justifyContent: 'flex-end'}}>{profileData.register_date}</MDTypography>
          </Grid>
        </Grid>
      </MDBox>

      
      {/* <MDBox pb={2} px={2}>
        <MDTypography component="p" variant="button" color="text" display="flex">
          <MDTypography
            component="span"
            variant="button"
            fontWeight="bold"
            color={percentage.color}
          >
            {percentage.amount}
          </MDTypography>
          &nbsp;{percentage.label}
        </MDTypography>
      </MDBox> */}
    </Card>
  );
}

// Setting default values for the props of ComplexStatisticsCard
ComplexStatisticsCard.defaultProps = {
  color: "info",
  percentage: {
    color: "success",
    text: "",
    label: "",
  },
};

// Typechecking props for the ComplexStatisticsCard
ComplexStatisticsCard.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "white",
    ]),
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
  }),
  icon: PropTypes.node.isRequired,
};

export default ComplexStatisticsCard;
