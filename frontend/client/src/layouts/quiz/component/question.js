import * as React from "react";
import { useEffect } from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { Checkbox, FormGroup } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import MDTypography from "components/MDTypography";
import Loc from "localization";

function Question(props) {
  let body = props.body;
  let language = body.language_code;
  let question = language === "en" ? body.question_eng : body.question; // Question string
  let options = language === "en" ? body.selection_eng : body.selection; // options Array
  let type = body.question_type; // 3 Types: radio, longRadio, multiple
  let questionid = body.id; // Question id (start from 0)
  let questionIndex = body.index; // Real index in question array
  let disable = body.disable; // Boolean for disable button
  let { DidSelectAnswer } = props;

  //  Testing
  const [value, setValue] = React.useState(""); // index of selected answer in optionsArray
  const [error, setError] = React.useState(false);

  const handleRadioChange = (event) => {
    setValue([parseInt(event.target.value)]);
    // console.log("this is name", event.target.name);

    setError(false);
  };

  // For multiple choice question Sorting selected options array
  const handleChange = (event) => {
    if (event.target.checked) {
      setValue([...value, parseInt(event.target.value)].sort((a, b) => a - b));
    }
    if (!event.target.checked) {
      let newArray = value.filter((data) => data != event.target.value);
      setValue(newArray);
    }
  };

  // Pass selected option data to quiz index.js
  useEffect(() => {
    if (value !== "") {
      let res = { id: questionIndex, value: value };
      DidSelectAnswer(res);
    }
  }, [value]);

  // ======================== Radio type ==============================
  if (type === "mc_short") {
    const renderOption = options.map((option, key) => {
      return (
        <FormControlLabel
          style={{
            marginRight: "60px",
          }}
          key={key}
          value={key}
          name={option}
          disabled={disable}
          control={<Radio required />}
          label={
            <MDTypography
              fontFamily="Roboto"
              fontSize="24px"
              fontWeight="regular"
              textAlign="left"
            >
              {option}
            </MDTypography>
          }
        />
      );
    });
    return (
      <div>
        {/* <form> */}
        <FormControl sx={{ m: 3, pb: "20px" }} error={false} variant="standard">
          <FormLabel
            id={questionid}
            style={{
              marginBottom: "40px",
              fontFamily: "Roboto",
              fontSize: "24px",
              fontWeight: "medium",
              textAlign: "left",
              color: "#495057",
            }}
          >
            {`${questionid + 1}. `}
            {question}
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby={questionid}
            name="quiz"
            value={value}
            onChange={handleRadioChange}
          >
            {renderOption}
          </RadioGroup>
        </FormControl>
        {/* </form> */}
      </div>
    );

    // ======================== Long Radio type ==============================
  } else if (type === "mc_long") {
    const renderOption = options.map((option, key) => {
      return (
        <FormControlLabel
          style={{
            marginTop: "32px",
            color: "#495057",
          }}
          key={key}
          value={key}
          name={option}
          disabled={disable}
          control={<Radio />}
          label={
            <MDTypography
              fontFamily="Roboto"
              fontSize="24px"
              fontWeight="regular"
              textAlign="left"
            >
              {option}
            </MDTypography>
          }
        />
      );
    });
    return (
      <div>
        {/* <form onSubmit={handleSubmit}> */}
        <FormControl sx={{ m: 3, pb: "20px" }} error={false} variant="standard">
          <FormLabel
            id={questionid}
            style={{
              marginBottom: "7px",
              fontFamily: "Roboto",
              fontSize: "24px",
              fontWeight: "medium",
              textAlign: "left",
              color: "#495057",
            }}
          >
            {`${questionid + 1}. `}
            {question}
          </FormLabel>
          <RadioGroup
            aria-labelledby={questionid}
            name="quiz"
            value={value}
            onChange={handleRadioChange}
          >
            {renderOption}
          </RadioGroup>
        </FormControl>
        {/* </form> */}
      </div>
    );

    // ======================== Mutiple Choice type ==============================
  } else if (type === "multi_select") {
    const renderOption = options.map((option, key) => {
      return (
        <FormControlLabel
          style={{
            minWidth: "150px",
            marginRight: "60px",
            color: "#495057",
            width: "100%"
          }}
          key={key}
          value={key}
          name={option}
          disabled={disable}
          control={<Checkbox />}
          label={
            <MDTypography
              fontFamily="Roboto"
              fontSize="24px"
              fontWeight="regular"
              textAlign="left"
            >
              {option}
            </MDTypography>
          }
        />
      );
    });
    return (
      <div>
        {/* <form onSubmit={handleSubmit}> */}
        <FormControl sx={{ m: 3, pb: "20px" }} error={false} variant="standard">
          <FormLabel
            id={questionid}
            style={{
              marginBottom: "6px",
              fontFamily: "Roboto",
              fontSize: "24px",
              fontWeight: "medium",
              textAlign: "left",
              color: "#495057",
            }}
          >
            {`${questionid + 1}. `}
            {question}
          </FormLabel>
          <FormHelperText
            style={{
              marginBottom: "11px",
            }}
          >
            * {Loc.question_multiple_choice}
          </FormHelperText>
          <FormGroup
            // sx={{
            //   maxWidth: "1090px",
            // }}
            row
            aria-labelledby={questionid}
            name="quiz"
            value={value}
            onChange={handleChange}
          >
            {renderOption}
          </FormGroup>
        </FormControl>
        {/* </form> */}
      </div>
    );
  } else {
    return <div></div>;
  }
}

export default Question;
