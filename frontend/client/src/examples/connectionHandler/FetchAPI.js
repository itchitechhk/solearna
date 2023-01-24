import React from "react";
import axios from "axios";
import Config from "../../itchi_config";
// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");

const serverBaseUrl = Config.serverBaseUrl;

export default class APIFetch extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {}

  static do_fetch = (fetchType, apiPath, fetchBody) => {
    return new Promise((onSuccess, onFailed) => {
      firebase
        .auth()
        .currentUser.getIdToken(true)
        .then(function (idToken) {
          // console.log("Get firebase idToken: " + idToken)

          const full_API_path = serverBaseUrl + apiPath;
          const bearerAuthToken = "Bearer " + idToken;
          // console.log("bearerAuthToken: ", bearerAuthToken);
          const dataBody = JSON.stringify(fetchBody);
          var config = {
            method: fetchType,
            url: full_API_path,
            headers: {
              Authorization: bearerAuthToken,
              "Content-Type": "application/json",
              "Access-Control-Allow-Headers": "*",
            },
            data: dataBody,
          };

          axios(config)
            .then(function (response) {
              // console.log("response.data.responString: ", response.data.responString);
              onSuccess(response.data);
            })
            .catch(function (error) {
              onFailed(error);
              // console.log("fetch failed: ", error.response.data.responString);
            });
        });
    });
  };

  static do_fetch_withoutTokenID = (fetchType, apiPath, fetchBody) => {
    return new Promise((onSuccess, onFailed) => {
      const full_API_path = serverBaseUrl + apiPath;
      // console.log("bearerAuthToken: ", bearerAuthToken);
      const dataBody = JSON.stringify(fetchBody);
      var config = {
        method: fetchType,
        url: full_API_path,
        headers: {
          // 'Authorization': bearerAuthToken,
          "Content-Type": "application/json",
        },
        data: dataBody,
      };

      axios(config)
        .then(function (response) {
          // console.log("response.data.responString: ", response.data.responString);
          onSuccess(response.data);
        })
        .catch(function (error) {
          onFailed(error);
          // console.log("fetch failed: ", error.response.data.responString);
        });
    });
  };

  static do_uploadToCloud = (file, pathOfUpload, fileName, fileType) => {
    return new Promise((onSuccess, onFailed) => {
      var storage = firebase.storage();
      var storageRef = storage.ref().child(pathOfUpload).child(fileName);
      var metadata = {
        contentType: fileType,
      };

      var uploadTask = storageRef.put(file, metadata);

      uploadTask.on(
        "state_changed",
        function (snapshot) {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          var progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
              // console.log('Upload is paused');
              break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
              // console.log('Upload is running');
              break;
          }
        },
        function (error) {
          // Handle unsuccessful uploads
          onFailed(error);
        },
        function () {
          // console.log("file storage fullPath: ", uploadTask.snapshot.ref.fullPath);
          // Handle successful uploads on complete
          uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
            // console.log('File available at', downloadURL);
            onSuccess(downloadURL);
          });
        }
      );
    });
  };
}
