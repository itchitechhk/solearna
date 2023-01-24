import MDBox from "components/MDBox";
import React from "react";
import { Icon } from "@mui/material";
import MDTypography from "components/MDTypography";
import { useEffect } from "react";

function ContentBox(props) {
  const name = props.name;
  const time = props.time;
  const currentSection = props.currentSection;
  // const sectionNumber = "Section" + props.number + ":";
  const { Didselectnumber } = props;
  const [backgroundColor, setBackgroundColor] = React.useState(() => {
    if (currentSection === props.number) {
      return "#DEE2E6";
    } else {
      return "white";
    }
  });

  useEffect(() => {
    if (currentSection === props.number) {
      setBackgroundColor("#DEE2E6");
    } else {
      setBackgroundColor("grey-100");
    }
  }, [currentSection]);

  function handleMouseEnter() {
    if (currentSection !== props.number) {
      setBackgroundColor("#F8F9FA");
    }
  }
  function handleMouseLeave() {
    if (currentSection !== props.number) {
      setBackgroundColor("grey-100");
    }
  }
  return (
    <MDBox
      borderRadius="lg" shadow="lg"
      pl="6%"
      pt="10%"
      pb="5%"
      display="flex"
      flexDirection="row"
      height="160px"
      bgColor={backgroundColor}
      onMouseEnter={(event) => handleMouseEnter()}
      onMouseLeave={(event) => handleMouseLeave()}
      onClick={(event) => {
        Didselectnumber(props.number);
      }}
      style={{ cursor: "pointer"}}
      
    >
      <Icon fontSize="large">text_snippet</Icon>
      <MDBox pl="14px" pr="10px">
        <MDTypography
          fontFamily="Roboto"
          fontSize="24px"
          fontWeight="regular"
          textAlign="left"
          color="dark"
          style={{ wordWrap: "break-word" }}
        >
          <strong>{name} </strong>
        </MDTypography>
        <MDTypography
          fontFamily="Roboto"
          fontSize="16px"
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

export default ContentBox;
