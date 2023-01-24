// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");
require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyCJ2lGOcdSXqkadICjjsnyVnE9v85WuiSk",
  authDomain: "solearna.firebaseapp.com",
  projectId: "solearna",
  storageBucket: "solearna.appspot.com",
  messagingSenderId: "442541208952",
  appId: "1:442541208952:web:1ea79df60114671e34848d",
  measurementId: "G-0L1HP99MHG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase;
