import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Loc from "localization";
import CircularProgress from "@mui/material/CircularProgress";

function loadingBox() {
    return (
        <MDBox
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItem="center"
          my="25%"
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
              {Loc.loading}
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
    )
}

export default loadingBox;