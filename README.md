# solearna
Folder "backend" is for Firebase only
- "functions" is the API folder
- "pubic" is the sourcecode of client hosting
- "public_admin" is the sourcecode of admin console hosting

Folder "frontend" is the React Project of client web app
- "client" is the sourcecode of React client

How to start client?
1. cd to frontend/client/
2. npm install
3. npm start

How to start local server?
1. make sure you've installed firebase cli
2. Edit client's config file if you want to run in local (frontend/client/src/itchi_config.js/serverBaseUrl)
3. cd to backend
4. run `firebase emulators:start --only functions,firestore --import=data --export-on-exit=data`
