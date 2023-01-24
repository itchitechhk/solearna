const functions = require('firebase-functions');
// const itchi_dash_api = require('itchi-dash-core-firebase');
const itchi_dash_api = require('./itchi-dash-api');
const admin = itchi_dash_api.initFirebaseAdmin();
const app = itchi_dash_api.app;

// Replace BUCKET_NAME
const bucket = 'gs://itchidash_backup_us';
// const sfe = require('itchi-dash-core-firebase-backup');
// const { printer } = require('./node-thermal-printer');
const iconv = require('iconv-lite');
const backupSchedule = "every 24 hours"
// const admin = require("firebase-admin");
const moment = require('moment');
const db = admin.firestore();
const http = require('http');
const console = require('console');


const COLLECTION_USER = "data_user";
const COLLECTION_QUIZ_QUESTION = "data_quiz_questions";
const COLLECTION_QUIZ_INFO = "data_quiz_info";
const COLLECTION_QUIZ_RESULT = "data_quiz_result";



app.post('/test_post', (req, res) => 
{
    res.json({
        status: 200,
        responString: "Test POST success",
        data: true,
      });
});


app.post('/user/register', itchi_dash_api.validateUserFirebaseIdToken, (req, res) => 
{
    const current_timestamp = admin.firestore.Timestamp.now();
    var userid = req.user.uid;
    var email = req.user.email;

    var contentToCreate = req.body.content;
    contentToCreate["uid"] = userid;
    contentToCreate["email"] = email;
    contentToCreate["createDate"] = current_timestamp;

    const item = {
        targetID: userid,
        targetCollection: COLLECTION_USER,
        content: contentToCreate
    }

    return itchi_dash_api.process_create_edit_itemList_withoutLog(null, [item], []).then((createdList) => {
        if (createdList != null)
        {
            return res.json({
                status: 200,
                responString: "User record created",
                data: {
                    success:true
                }
            });
        }
        else
        {
            return res.status(400).json({ responString: "Create user record fail" });
        }
    });
});

app.post('/course/get_quiz_data',(req, res) => 
{
    var topicID = req.body.topicID;
    if (topicID && topicID != null)
    {
        // get all section
        return itchi_dash_api.do_get_related_item_list(COLLECTION_QUIZ_QUESTION, "quiz_name.targetID", topicID).then(quizList =>
        {            
            return res.json({
                status: 200,
                responString: "Get quiz data list success",
                data: {
                    section_list: quizList
                }
            });
        });
    }
    else
    {
        return res.status(400).json({ responString: "quiz id missing" });
    }
});

app.post('/course/get_quiz_intro', itchi_dash_api.validateUserFirebaseIdToken, (req, res) => 
{
    var topicID = req.body.topicID;
    if (topicID && topicID != null)
    {
        return db.collection(COLLECTION_QUIZ_INFO).doc(topicID).get()
        .then(doc => {
            if (doc.exists) 
            {
                var data = doc.data();
                return res.json({
                    status: 200,
                    responString: "Get quiz intro list success",
                    data: data
                });
            }
            else
            {
                return res.status(400).json({ responString: "quiz intro not found" });
            }
        });
    }
    else
    {
      return res.status(400).json({ responString: "quiz id missing" });
    }
});

app.post('/course/set_quiz_result', itchi_dash_api.validateUserFirebaseIdToken, (req, res) => 
{
    var userid = req.user.uid;
    var email = req.user.email;
    var topicID = req.body.topicID;
    var quizScoreRate = req.body.quiz_score_rate;
    if (topicID && topicID != null && quizScoreRate && quizScoreRate != null)
    {
        const current_timestamp = admin.firestore.Timestamp.now();
        var contentToUpdate = {
            "user_id": userid,
            "email": email,
            "createDate": current_timestamp,
            "quiz_score": quizScoreRate,
            "topicID": topicID
        };

        const item = {
            targetID: userid,
            targetCollection: COLLECTION_QUIZ_RESULT,
            content: contentToUpdate
        }

        // do set / update content
        return itchi_dash_api.process_create_edit_itemList_withoutLog(req, [item], []).then((updatedList) => {
            if (updatedList != null && updatedList.length > 0)
            {
              return res.json({
                status: 200,
                responString: "Update quiz result success",
                data: {
                    success: true,
                }
              });
            }
            else
            {
                return res.status(400).json({ responString: "Update result fail" });
            }
        });
    }
    else
    {
        return res.status(400).json({ responString: "topicID or quizScoreRate missing" });
    }
});

app.post('/user/get_profile', itchi_dash_api.validateUserFirebaseIdToken, (req, res) => 
{
  var userid = req.user.uid;

  return itchi_dash_api.do_get_related_item_list(COLLECTION_USER, "uid", userid).then(profiles => {
    if (profiles.length == 1)
    {
      return res.json({
        status: 200,
        responString: "Get profile success",
        data: profiles[0]
      });
    }
    else
    {
      return res.status(400).json({ responString: "Get profile fail" });
    }
  });
});

app.post('/user/create_topic', itchi_dash_api.validateUserFirebaseIdToken, (req, res) => 
{

});

app.post('/user/upload_quiz', itchi_dash_api.validateUserFirebaseIdToken, (req, res) => 
{

});




// var createSchedule = sfe.createScheduledFirestoreExport(bucket,backupSchedule,[]);
// exports.schedule_backup = createSchedule;

exports.app = functions.https.onRequest(app);

