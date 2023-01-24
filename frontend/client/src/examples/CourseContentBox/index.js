import MDTypography from "components/MDTypography";
import { Icon } from "@mui/material";
import MDBox from "components/MDBox";
import React from "react";

function CourseContentBox(props) {
  const name = props.name;
  const time = props.time;
  const number = props.number;
  const { Didselectnumber } = props;
  const [backgroundColor, setBackgroundColor] = React.useState("white");
  return (
    <MDBox
      height="96px"
      px="4%"
      alignItems="center"
      display="flex"
      flexDirection="row"
      bgColor={backgroundColor}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setBackgroundColor("#F8F9FA")}
      onMouseLeave={() => setBackgroundColor("white")}
      onClick={() => {
        setBackgroundColor("#F0F2F5");
        Didselectnumber(number);
      }}
    >
      <MDBox
        display="flex"
        flexDirection="row"
        alignItems="center"
        width="100%"
      >
        <Icon fontSize="large">text_snippet</Icon>
        <MDTypography
          pl="48px"
          fontFamily="Roboto"
          fontSize="36px"
          fontWeight="regular"
          textAlign="left"
          color="dark"
          style={{ wordWrap: "break-word" }}
        >
          {name}
        </MDTypography>
        <MDTypography
          ml="auto"
          mr="103px"
          fontFamily="Roboto"
          fontSize="24px"
          fontWeight="regular"
          textAlign="left"
          color="dark"
          style={{ wordWrap: "break-word" }}
        >
          {time}
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}

export default CourseContentBox;
