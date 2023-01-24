// import react, react-markdown-editor-lite, and a markdown parser you like
import React, { useEffect } from "react";
import * as ReactDOM from "react-dom";
import MarkdownIt from "markdown-it";
import MdEditor from "react-markdown-editor-lite";
// import style manually
import "react-markdown-editor-lite/lib/index.css";

// Register plugins if required
// MdEditor.use(YOUR_PLUGINS_HERE);
function MDApp(props) {
  const { content } = props;
  const [data, set_data] = React.useState(content);
  // const { data, setContent } = React.useState(content);

  // Initialize a markdown parser
  const mdParser = new MarkdownIt({
    html: true,
    canView: { fullScreen: false },
  });

  useEffect(() => {
    set_data(content);
  }, [content]);

  // Finish!
  // function handleEditorChange({ html, text }) {
  //   console.log("handleEditorChange", html, text);
  //   DidAcceptedInput(html);
  // }

  return (
    <div>
      <MdEditor
        style={{ height: "100%", paddingLeft: "5%" }}
        renderHTML={(content) => mdParser.render(content)}
        value={content}
        // onChangeTrigger={"afterRender"}
        // readOnly={true}
        // canView={{
        //   menu: false,
        //   md: false,
        //   html: true,
        //   fullScreen: true,
        //   hideMenu: false,
        // }}
        view={{
          menu: false,
          md: false,
          html: true,
        }}
      />
    </div>
  );
}

export default MDApp;
