// const { v4: uuidv4 } = require("uuid");
var admin;// = require("firebase-admin");
// admin.initializeApp();
const express = require("express");
const cookieParser = require("cookie-parser")();
// const cors = require('cors')({origin: true});
const cors = require("cors");
const moment = require("moment");
// const { firestore } = require("firebase-admin");
// const {
//   _refWithOptions,
// } = require("firebase-functions/lib/providers/database");
const app = express();

var increment;// = admin.firestore.FieldValue.increment(1)
var decrement;// = admin.firestore.FieldValue.increment(-1);
// const nodejieba = require("nodejieba");

function initFirebaseAdmin(serviceAccount = null)
{
  admin = require("firebase-admin");

  if (serviceAccount === null)
  {
    admin.initializeApp();
  }
  else
  {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  increment = admin.firestore.FieldValue.increment(1)
  decrement = admin.firestore.FieldValue.increment(-1);

  return admin;
}


const validateAdminFirebaseIdToken = async (req, res, next) => {
  console.log("Checking admin right and token");
  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    );
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;
    console.log("admin user id: ", decodedIdToken.uid);
    const ref_adminList = admin.firestore().collection("Admin");
    const ref_admin = ref_adminList.doc(decodedIdToken.uid);

    return ref_adminList.get().then((snapshot_adminlist) => {
      if (snapshot_adminlist.size > 1) {
        return ref_admin.get().then((snapshot_admins) => {
          if (snapshot_admins.exists) {
            next();
            return null;
          } else {
            console.error("Error while verifying Admin right");
            return res
              .status(403)
              .json({ responString: "Admin right Unauthorized" });
          }
        });
      } else {
        return admin.firestore()
          .collection("AdminLevel")
          .doc("-1")
          .set({
            itemName: "Super Admin",
            permissions: {
              all: true,
            },
          })
          .then((docRef_superAdmin) => {
            return ref_adminList
              .doc(req.user.uid)
              .set({
                itemName: "Admin_" + req.user.uid,
                admin_level: "-1",
              })
              .then((docRef) => {
                next();
                return null;
              });
          });
      }
    });
  } catch (error) {
    console.error("Error while verifying Firebase ID token:", error);
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }
};

const validateUserFirebaseIdToken = async (req, res, next) => {
  console.log("Checking user token");

  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    console.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>",
      'or by passing a "__session" cookie.'
    );
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;
    next();
    return null;
  } catch (error) {
    console.error("Error while verifying Firebase ID token:", error);
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }
};

app.use(cors({ origin: true }));
app.use(cookieParser);

//--------------------------------------------------------------------------------------------------------
// COMMON USE FUNTION
//--------------------------------------------------------------------------------------------------------

function process_create_edit_itemList(req, listToProcess, returnIDList) {
  return new Promise((onDone) => {
    var newList = listToProcess;
    var newReturnIDList = returnIDList;
    const current_timestamp = admin.firestore.Timestamp.now();

    const targetItem = newList[0];
    const data_targetCollection = targetItem.targetCollection;
    const targetID = targetItem.targetID;
    console.log("Create Case targetID "+JSON.stringify(targetID));

    var data_to_insert = targetItem.content;
    data_to_insert.last_update = current_timestamp;
    data_to_insert.createDate_timestamp = current_timestamp.toMillis();
    data_to_insert.createDate_string = moment(current_timestamp).format("YYYY-MM-DD");
    // console.log("targetItem: ", targetItem);
    // console.log("data_to_insert: ", data_to_insert);
    // console.log("current_timestamp.toDate(): " + moment(current_timestamp).format("YYYY-MM-DD"));

    // process data to timestamp
    if (data_to_insert.date && data_to_insert.date !== null) {
      // console.log("data_to_insert.date: " + data_to_insert.date);
      var obj_date = new Date(data_to_insert.date);
      var date_timestamp = admin.firestore.Timestamp.fromDate(obj_date);
      
      data_to_insert.createDate = date_timestamp;
    } else {
      data_to_insert.createDate = current_timestamp;
    }

    // handle geoPoint
    Object.keys(data_to_insert).forEach(key => {
      const obj = data_to_insert[key];
      if (obj !== undefined && obj !== null && obj["isGeoPt"] !== undefined && obj["isGeoPt"] !== null && obj["isGeoPt"] == true)
      {
        var lat = obj["_latitude"];
        var lng = obj["_longitude"];
        var geoPt = new admin.firestore.GeoPoint(lat, lng);
        data_to_insert[key] = geoPt;
      }
    });

    const ref_collection = admin.firestore().collection(data_targetCollection);
    const ref_collection_version = admin.firestore().collection("CollectionVersion")
    const statsRef = ref_collection.doc('--stats--');

    const batch = admin.firestore().batch();

    

    // edit item content
    if (targetID !== null && targetID !== "0") {
      console.log("Edit Case");

      return ref_collection
        .doc(targetID)
        .update(data_to_insert)
        .then((doc_ref) => {
          //add count -> increment
          batch.set(statsRef,{"createEditCount":increment,},{merge:true})
          batch.commit();
          // add processed ID, remove item from to-process-list
          newReturnIDList.push(targetID);
          newList.splice(0, 1);

          // create action log
          if (data_targetCollection !== "ActionLog") {
            do_create_action_log(req, "edit", data_targetCollection, targetID);
          }
          // check for call process or done
          if (newList.length > 0) {

            return process_create_edit_itemList(
              req,
              newList,
              newReturnIDList
            ).then((final_IDList) => {
              onDone(final_IDList);
              return null;
            });
          } else {
            // console.log("Create/Update Target data5:-")
            ref_collection_version.get().then((snapshot_list) => {
              const data_list = snapshot_list.docs.map((doc) => {
                const c = doc.data();
                c.id = doc.id;
                
                return c;
              });
              var targetItem = null;
              var docID = ""
              data_list.map((item)=>{
                if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                  targetItem = item;
                  docID = item.id;
                }
              })
              if (targetItem !== null)
              {
                
                //update the last_update param
                targetItem.last_update = current_timestamp;
                return ref_collection_version.doc(docID).update(targetItem).then(()=>{
                  console.log("finish update collection version");
                  onDone(newReturnIDList);
                return null;
                })
              }
              else
              {
                onDone(newReturnIDList);
                return null;
                console.log("targetItem NOT found");
              }
              // console.log("Create/Update Target data6:  "+JSON.stringify(data_list))
            });

            
          }
        });
    }
    // create new item
    else {
      // var itemCreateTime = {
      //     createDate: current_timestamp
      // }
      // Object.assign(data_to_insert, itemCreateTime);
      console.log("Create Case "+JSON.stringify(data_to_insert));
      
      return ref_collection.add(data_to_insert).then((doc_ref) => {
        console.log("Create Case doc_ref"+JSON.stringify(doc_ref));
        batch.set(statsRef, { "totalCount": increment, "createEditCount": increment }, { merge: true })
        batch.commit();

        return ref_collection.doc(doc_ref.id).update({ id: doc_ref.id, hashCode: (cyrb53(doc_ref.id)).toString() }).then((_doc_ref) => {
          // edit count
          return change_data_count(data_targetCollection, +1).then(
            (isUpdatedCount) => {
              if (isUpdatedCount) {
                // add processed ID, remove item from to-process-list
                newReturnIDList.push(doc_ref.id);
                newList.splice(0, 1);

                // create action log
                if (data_targetCollection !== "ActionLog") {
                  do_create_action_log(
                    req,
                    "create",
                    data_targetCollection,
                    doc_ref.id
                  );
                }

                // check for call process or done
                if (newList.length > 0) {
                  return process_create_edit_itemList(
                    req,
                    newList,
                    newReturnIDList
                  ).then((final_IDList) => {
                    onDone(final_IDList);
                    return null;
                  });
                } else {
                  // console.log("Create/Update Target data6:-")
                  ref_collection_version.get().then((snapshot_list) => {
                    const data_list = snapshot_list.docs.map((doc) => {
                      const c = doc.data();
                      c.id = doc.id;
                      return c;
                    });
                    console.log("data_list NEW: ", JSON.stringify(data_list));
                  
                    var targetItem = null;
                    var docID = "";
                    var hashCode = "";
                    data_list.map((item) => {
                      if (item.collectionName == data_targetCollection) { //if the target collection is on the list
                        targetItem = item;
                        docID = item.id;
                      }
                    })
                    if (targetItem !== null) {
                      // const docID = item.id
                      //update the last_update param
                      targetItem.last_update = current_timestamp;
                      return ref_collection_version.doc(docID).update(targetItem).then(() => {
                        console.log("finish update collection version");
                        //Update the id and hash
                        onDone(newReturnIDList);
                        return null;
                      })
                    }
                    else {
                      console.log("targetItem NOT found");
                      onDone(newReturnIDList);
                      return null;
                    }
                    // console.log("Create/Update Target data6:  "+JSON.stringify(data_list))
                  });

                
                }
              } else {
                onDone(null);
                return null;
              }
            }
          );
        });
      });
        
    }
  });
}

function process_create_edit_itemList_withoutLog(
  req,
  listToProcess,
  returnIDList
) {
  return new Promise((onDone) => {
    var newList = listToProcess;
    // console.log(`listToProcess: ${JSON.stringify(listToProcess)}`)
    var newReturnIDList = returnIDList;
    const current_timestamp = admin.firestore.Timestamp.now();
    console.log("current_timestamp.toDate(): " + current_timestamp.toDate());

    const targetItem = newList[0];
    // console.log(`targetItem: ${JSON.stringify(targetItem)}`)
    const data_targetCollection = targetItem.targetCollection;
    var targetID = targetItem.targetID;
    const _createDate = targetItem.createDate;
    const settingName = targetItem.settingName;
    // console.log(`settingName: ${JSON.stringify(settingName)}`)

    if(targetID === null && settingName && settingName !== null){
      targetID = settingName
        // console.log("It is here !!!!!!!!!!!!!!!!!!!!");
      }
    var data_to_insert = targetItem.content;
    // console.log(`data_to_insert: ${JSON.stringify(data_to_insert)}`)

    data_to_insert.last_update = current_timestamp;
    data_to_insert.createDate_timestamp = current_timestamp.toMillis();
    data_to_insert.createDate_string = moment(current_timestamp).format("YYYY-MM-DD");
    data_to_insert.targetID = targetID

    // handle geoPoint
    Object.keys(data_to_insert).forEach(key => {
      const obj = data_to_insert[key];
      if (obj !== undefined && obj !== null && obj["isGeoPt"] !== undefined && obj["isGeoPt"] !== null && obj["isGeoPt"] == true)
      {
        var lat = obj["_latitude"];
        var lng = obj["_longitude"];
        var geoPt = new admin.firestore.GeoPoint(lat, lng);
        data_to_insert[key] = geoPt;
      }
    });

    
    // console.log("data_to_insert: ", data_to_insert);

    const ref_collection = admin.firestore().collection(data_targetCollection);
    const ref_collection_version = admin.firestore().collection("CollectionVersion")

    const statsRef = ref_collection.doc('--stats--');
    const batch = admin.firestore().batch();

    // edit item content
    if (targetID !== null && targetID !== "0") {
      return ref_collection.doc(targetID).get().then(doc_ref_check => {
        if (doc_ref_check.exists)
        {
          return ref_collection
          .doc(targetID)
          .update(data_to_insert)
          .then((doc_ref) => {
            batch.set(statsRef,{"createEditCount":increment},{merge:true})
            batch.commit();
            // add processed ID, remove item from to-process-list
            // console.log("inserted: " + newReturnIDList);
            // log_created_id(newReturnIDList);
            newReturnIDList.push(targetID);
            newList.splice(0, 1);
            
            // // create action log
            // if (data_targetCollection !== "ActionLog")
            // {
            //     do_create_action_log(req, "edit", data_targetCollection, targetID);
            // }

            // check for call process or done
            if (newList.length > 0) {
              return process_create_edit_itemList_withoutLog(
                req,
                newList,
                newReturnIDList
              ).then((final_IDList) => {
                onDone(final_IDList);
                return null;
              });
            } else {
               ref_collection_version.get().then((snapshot_list) => {
                const data_list = snapshot_list.docs.map((doc) => {
                  const c = doc.data();
                  c.id = doc.id;
                  return c;
                });
  
                data_list.map((item)=>{
                  const docID = item.id
                  if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                    //update the last_update param
                    var newData = item;
                    newData.last_update = current_timestamp;

                    ref_collection_version.doc(docID).update(newData).then(()=>{
                      
                    })
                  }
                })
                // console.log("Create/Update Target data:1  "+JSON.stringify(data_list))
                onDone(newReturnIDList);
                return null;
                
              });
            }
          });
        }
        else
        {
          return ref_collection
          .doc(targetID)
          .set(data_to_insert)
            .then((doc_ref) => {
            // console.log("Create item without log "+targetID+" "+doc_ref.id);
            return ref_collection.doc(targetID).update({ id: targetID, hashCode: (cyrb53(targetID)).toString() }).then((doc_ref) => { 
            batch.set(statsRef,{"createEditCount":increment},{merge:true})
            batch.commit();

            // add processed ID, remove item from to-process-list
            // console.log("inserted: " + newReturnIDList);
            // log_created_id(newReturnIDList);
            newReturnIDList.push(targetID);
            newList.splice(0, 1);

            // // create action log
            // if (data_targetCollection !== "ActionLog")
            // {
            //     do_create_action_log(req, "edit", data_targetCollection, targetID);
            // }

            // check for call process or done
            if (newList.length > 0) {
              return process_create_edit_itemList_withoutLog(
                req,
                newList,
                newReturnIDList
              ).then((final_IDList) => {
                onDone(final_IDList);
                return null;
              });
            } else {
               ref_collection_version.get().then((snapshot_list) => {
                const data_list = snapshot_list.docs.map((doc) => {
                  const c = doc.data();
                  c.id = doc.id;
                  return c;
                });
  
                data_list.map((item)=>{
                  const docID = item.id
                  if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                    //update the last_update param
                    var newData = item;
                    newData.last_update = current_timestamp;
                    ref_collection_version.doc(docID).update(newData).then(()=>{
                      
                    })
                  }
                })
                // console.log("Create/Update Target data:2  "+JSON.stringify(data_list))
  
                onDone(newReturnIDList);
                return null;
                
              });
            }
            });
          });
        }
      });

      
    }
    // create new item
    else {
      var itemCreateTime = {
        createDate: _createDate ? _createDate:current_timestamp,
      };
      Object.assign(data_to_insert, itemCreateTime);

      return ref_collection.add(data_to_insert).then((doc_ref) => {
        batch.set(statsRef,{"totalCount":increment,"createEditCount":increment},{merge:true})
        batch.commit();
        // console.log("inserted: " + doc_ref.id);
        if (
          data_to_insert.isDeleted !== null &&
          data_to_insert.isDeleted === true
        ) {
    
          newReturnIDList.push(doc_ref.id);
          newList.splice(0, 1);

          // check for call process or done
          if (newList.length > 0) {
            return process_create_edit_itemList_withoutLog(
              req,
              newList,
              newReturnIDList
            ).then((final_IDList) => {
              onDone(final_IDList);
              return null;
            });
          } else {

            ref_collection_version.get().then((snapshot_list) => {
              const data_list = snapshot_list.docs.map((doc) => {
                const c = doc.data();
                c.id = doc.id;
                return c;
              });

              data_list.map((item)=>{
                const docID = item.id
                if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                  //update the last_update param
                  var newData = item;
                  newData.last_update = current_timestamp;
                  newData.hashCode = cyrb53(item.id);
                  ref_collection_version.doc(docID).update(newData).then(()=>{
                    
                  })
                }
              })
              // console.log("Create/Update Target data3:  "+JSON.stringify(data_list))

              onDone(newReturnIDList);
              return null;
              
            });
          }
        } else {
          // edit count
          return change_data_count(data_targetCollection, +1).then(
            (isUpdatedCount) => {
              if (isUpdatedCount) {
                // add processed ID, remove item from to-process-list
                newReturnIDList.push(doc_ref.id);
                newList.splice(0, 1);

                // check for call process or done
                if (newList.length > 0) {
                  return process_create_edit_itemList_withoutLog(
                    req,
                    newList,
                    newReturnIDList
                  ).then((final_IDList) => {
                    onDone(final_IDList);
                    return null;
                  });
                } else {
                  ref_collection_version.get().then((snapshot_list) => {
                    const data_list = snapshot_list.docs.map((doc) => {
                      const c = doc.data();
                      c.id = doc.id;
                      return c;
                    });
      
                    data_list.map((item)=>{
                      const docID = item.id
                      if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                        //update the last_update param
                        var newData = item;
                        newData.last_update = current_timestamp;
                        newData.hashCode = cyrb53(item.id);
                        ref_collection_version.doc(docID).update(newData).then(()=>{
                          
                        })
                      }
                    })
                    // console.log("Create/Update Target data4:  "+JSON.stringify(data_list))
      
                    onDone(newReturnIDList);
                    return null;
                    
                  });

                }
              } else {
                onDone(null);
                return null;
              }
            }
          );
        }
      });
    }
  });
}

function process_disable_uidList(uidList, processedUID) {
  return new Promise((onDone) => {
    if (uidList.length !== 0) {
      var _uidList = uidList;
      var _processedUID = processedUID;
      var uid = _uidList[0];
      return admin
        .auth()
        .updateUser(uid, { disabled: true })
        .then((userRecord) => {
          const newUserUID = userRecord.uid;
          _processedUID.push(newUserUID);
          _uidList.splice(0, 1);

          if (_uidList.length > 0) {
            return process_disable_uidList(_uidList, _processedUID).then(
              (list_final) => {
                onDone(list_final);
                return null;
              }
            );
          } else {
            onDone(_processedUID);
          }
          return null;
        })
        .catch((error) => {
          console.log(
            "disable firebase user faild, UID: " + uid + ", error: ",
            error
          );
          _uidList.splice(0, 1);

          if (_uidList.length > 0) {
            return process_disable_uidList(_uidList, _processedUID).then(
              (list_final) => {
                onDone(list_final);
                return null;
              }
            );
          } else {
            onDone(processedUID);
          }
        });
    } else {
      onDone(processedUID);
      return null;
    }
  });
}

function process_delete_itemList_withoutLog(listToProcess, returnIDList) {
  console.log("process_delete_itemList_withoutLog listToProcess: ", listToProcess);
  return new Promise((onDone) => {
    var newList = listToProcess;
    var newRecordIDList = returnIDList;

    if (newList.length !== 0) {
      const targetItem = newList[0];
      const data_targetCollection = targetItem.targetCollection;
      const targetID = targetItem.targetID;

      const ref_collection = admin.firestore().collection(data_targetCollection).doc(targetID);
      const current_timestamp = admin.firestore.Timestamp.now();
      const ref_collection_version = admin.firestore().collection("CollectionVersion")

      return ref_collection.get().then((targetData) => {
        if (targetData.exists) {
          // copy to _Deleted collection
          const ref_collection_deleted = admin.firestore()
            .collection(data_targetCollection + "_Deleted")
            .doc(targetID);

          const contentToMove = targetData.data();
          contentToMove.isDeleted = true;

          const statsRef = admin.firestore().collection(data_targetCollection).doc('--stats--');
          const batch = admin.firestore().batch();

          return ref_collection_deleted.set(contentToMove).then(() => {
            batch.set(statsRef,{"totalCount":decrement,"createEditCount":increment},{merge:true})
            // batch.set(statsRef,{"totalCount":decrement},{merge:true})
            batch.commit();
            console.log("ref_collection_deleted  decrement")
            // remove exist
            return ref_collection.delete().then(() => {
              // change data count
              return change_data_count(data_targetCollection, -1).then(
                (isUpdatedCount) => {
                  if (isUpdatedCount) {
                    // add doc ID
                    newRecordIDList.push(targetID);

                    // remove item from to-process List
                    newList.splice(0, 1);

                    if (newList.length > 0) {
                      return process_delete_itemList_withoutLog(
                        newList,
                        newRecordIDList
                      ).then((newIDList) => {
                        if (newIDList !== null) {
                          onDone(newIDList);
                          return null;
                        } else {
                          onDone(null);
                          return null;
                        }
                      });
                    } else {
                       ref_collection_version.get().then((snapshot_list) => {
                        const data_list = snapshot_list.docs.map((doc) => {
                          const c = doc.data();
                          c.id = doc.id;
                          return c;
                        });
          
                        data_list.map((item)=>{
                          const docID = item.id
                          if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                            //update the last_update param
                            var newData = item;
                            newData.last_update = current_timestamp;
                            ref_collection_version.doc(docID).update(newData).then(()=>{
                            })
                          }
                        })
                        // console.log("Create/Update Target data:  "+JSON.stringify(data_list))
                        
                        onDone(newRecordIDList);
                        return null;
                        
                      });
                    }
                  } else {
                    onDone(null);
                    return null;
                  }
                }
              );
            });
          });
        } else {
          console.log(
            "data not found.  collection: " +
              data_targetCollection +
              "; id: " +
              targetID
          );

          // remove item from to-process List
          newList.splice(0, 1);

          if (newList.length > 0) {
            return process_delete_itemList_withoutLog(newList, newRecordIDList).then(
              (newIDList) => {
                if (newIDList !== null) {
                  onDone(newIDList);
                  return null;
                } else {
                  onDone(null);
                  return null;
                }
              }
            );
          } else {
             ref_collection_version.get().then((snapshot_list) => {
                const data_list = snapshot_list.docs.map((doc) => {
                  const c = doc.data();
                  c.id = doc.id;
                  return c;
                });
  
                data_list.map((item)=>{
                  const docID = item.id
                  if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                    //update the last_update param
                    var newData = item;
                    newData.last_update = current_timestamp;
                    ref_collection_version.doc(docID).update(newData).then(()=>{
                    })
                  }
                })
                // console.log("Create/Update Target data:  "+JSON.stringify(data_list))
                onDone(newRecordIDList);
                return null;
              });
          }
        }
      });
    } else {
      onDone(returnIDList);
    }
  });
}

function process_delete_itemList(req, listToProcess, returnIDList) {
  console.log("process_delete_itemList listToProcess: ", listToProcess);
  return new Promise((onDone) => {
    var newList = listToProcess;
    var newRecordIDList = returnIDList;

    if (newList.length !== 0) {
      const targetItem = newList[0];
      const data_targetCollection = targetItem.targetCollection;
      const targetID = targetItem.targetID;

      const ref_collection = admin.firestore().collection(data_targetCollection).doc(targetID);
      const current_timestamp = admin.firestore.Timestamp.now();
      const ref_collection_version = admin.firestore().collection("CollectionVersion")

      return ref_collection.get().then((targetData) => {
        if (targetData.exists) {
          // copy to _Deleted collection
          const ref_collection_deleted = admin.firestore()
            .collection(data_targetCollection + "_Deleted")
            .doc(targetID);

          const contentToMove = targetData.data();
          contentToMove.isDeleted = true;

          const statsRef = admin.firestore().collection(data_targetCollection).doc('--stats--');
          const batch = admin.firestore().batch();

          return ref_collection_deleted.set(contentToMove).then(() => {
            batch.set(statsRef,{"totalCount":decrement,"createEditCount":increment},{merge:true})
            // batch.set(statsRef,{"totalCount":decrement},{merge:true})
            batch.commit();
            console.log("ref_collection_deleted  decrement")
            // remove exist
            return ref_collection.delete().then(() => {
              // change data count
              return change_data_count(data_targetCollection, -1).then(
                (isUpdatedCount) => {
                  if (isUpdatedCount) {
                    // add doc ID
                    newRecordIDList.push(targetID);

                    // remove item from to-process List
                    newList.splice(0, 1);

                    // create action log
                    do_create_action_log(
                      req,
                      "delete",
                      data_targetCollection,
                      targetID
                    );

                    if (newList.length > 0) {
                      return process_delete_itemList(
                        req,
                        newList,
                        newRecordIDList
                      ).then((newIDList) => {
                        if (newIDList !== null) {
                          onDone(newIDList);
                          return null;
                        } else {
                          onDone(null);
                          return null;
                        }
                      });
                    } else {
                       ref_collection_version.get().then((snapshot_list) => {
                        const data_list = snapshot_list.docs.map((doc) => {
                          const c = doc.data();
                          c.id = doc.id;
                          return c;
                        });
          
                        data_list.map((item)=>{
                          const docID = item.id
                          if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                            //update the last_update param
                            var newData = item;
                            newData.last_update = current_timestamp;
                            ref_collection_version.doc(docID).update(newData).then(()=>{
                            })
                          }
                        })
                        // console.log("Create/Update Target data:  "+JSON.stringify(data_list))
                        
                        onDone(newRecordIDList);
                        return null;
                        
                      });
                    }
                  } else {
                    onDone(null);
                    return null;
                  }
                }
              );
            });
          });
        } else {
          console.log(
            "data not found.  collection: " +
              data_targetCollection +
              "; id: " +
              targetID
          );

          // remove item from to-process List
          newList.splice(0, 1);

          // create action log
          do_create_action_log(req, "delete", data_targetCollection, targetID);

          if (newList.length > 0) {
            return process_delete_itemList(req, newList, newRecordIDList).then(
              (newIDList) => {
                if (newIDList !== null) {
                  onDone(newIDList);
                  return null;
                } else {
                  onDone(null);
                  return null;
                }
              }
            );
          } else {
             ref_collection_version.get().then((snapshot_list) => {
                        const data_list = snapshot_list.docs.map((doc) => {
                          const c = doc.data();
                          c.id = doc.id;
                          return c;
                        });
          
                        data_list.map((item)=>{
                          const docID = item.id
                          if (item.collectionName == data_targetCollection){ //if the target collection is on the list
                            //update the last_update param
                            var newData = item;
                            newData.last_update = current_timestamp;
                            ref_collection_version.doc(docID).update(newData).then(()=>{
                            })
                          }
                        })
                        // console.log("Create/Update Target data:  "+JSON.stringify(data_list))
                        onDone(newRecordIDList);
                        return null;
                        
                        
                      });
          }
        }
      });
    } else {
      onDone(returnIDList);
    }
  });
}

function get_item_list(
  data_targetCollection,
  page,
  pageCount,
  targetOrderBy,
  targetOrder,
  showDeletedData
) {
  return new Promise((onDone) => {

    const _showDeletedData = showDeletedData !== undefined ? showDeletedData:false

    const ref_collection = _showDeletedData ? admin.firestore().collection(data_targetCollection+"_Deleted"):admin.firestore().collection(data_targetCollection);
    const query_start = page * pageCount;


    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;
    
    return ref_collection
      .orderBy(toOrderBy, order)
      .offset(query_start)
      .limit(pageCount)
      .get()
      .then((snapshot_list) => {

        // console.log("get item list snapshot_list  "+JSON.stringify(snapshot_list))

        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        // console.log("data_list: ", data_list);

        var countInfo = null
          const ref_doc = admin.firestore().collection(data_targetCollection).doc("--stats--");
          ref_doc.get().then((snapshop) => {
          if (snapshop.exists) {
            countInfo = snapshop.data();
            // console.log("get_item_list category "+JSON.stringify(countInfo));
          }
        })

        return get_data_count(data_targetCollection).then((data) => {
          const returnItem = {
            data_list: data_list,
            count: data.count,
            countInfo:countInfo,
          };

          
          // console.log("list count: ", data.count);
          onDone(returnItem);
          return null;
        });
      });
  });
}

function get_item_list_withKeyword(
  data_targetCollection,
  page,
  pageCount,
  targetOrderBy,
  targetOrder,
  searchKeywordKey,
  searchKeywordContent,
  showDeletedData,
  keywordType
) {
  return new Promise((onDone) => {
    const _showDeletedData = showDeletedData !== undefined ? showDeletedData:false
    const _keywordType = keywordType == undefined ? 'string':keywordType;
    const ref_collection = _showDeletedData ? admin.firestore().collection(data_targetCollection+"_Deleted"):admin.firestore().collection(data_targetCollection);
    const query_start = page * pageCount;
    console.log("searchKeywordKey "+searchKeywordKey + "searchKeywordContent "+searchKeywordContent)
    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;
    if (searchKeywordKey === "uid") {
      return ref_collection
        .doc(searchKeywordContent)
        .get()
        .then((snapshop) => {
          const c = snapshop.data();
          c.id = searchKeywordContent;

          const data_list = [];
          data_list.push(c);

          const returnItem = {
            data_list: data_list,
            count: 1,
          };

          // console.log("list count: ", data.count);
          onDone(returnItem);
          return null;
        });
    } else {
      if (searchKeywordKey === "u_i_d"){
        searchKeywordKey = "uid";
      }
      var _searchKeywordContent = searchKeywordContent
      if(_keywordType == 'number'){
        _searchKeywordContent = parseInt(searchKeywordContent)
      }

      return ref_collection
        .where(searchKeywordKey, "==", _searchKeywordContent)
        .orderBy(toOrderBy, order)
        // .offset(query_start)
        // .limit(pageCount)
        .get()
        .then((snapshot_list) => {
          const data_list = snapshot_list.docs.map((doc) => {
            const c = doc.data();
            c.id = doc.id;
            return c;
          });

          // console.log("data_list: ", data_list);

          var countInfo = null
          const ref_doc = admin.firestore().collection(data_targetCollection).doc("--stats--");
          ref_doc.get().then((snapshop) => {
          if (snapshop.exists) {
            countInfo = snapshop.data();
            // console.log("get_item_list category "+JSON.stringify(countInfo));
          }
        })

        return get_data_count(data_targetCollection).then((data) => {
          const returnItem = {
            data_list: data_list,
            count: data.count,
            countInfo:countInfo,
          };

            // console.log("list count: ", data.count);
            onDone(returnItem);
            return null;
          });
        });
    }
  });
}

function get_item_list_byDate(
  data_targetCollection,
  page,
  pageCount,
  targetOrderBy,
  targetOrder,
  dateFrom,
  dateTo,
  showDeletedData
) {
  return new Promise((onDone) => {
    const _showDeletedData = showDeletedData !== undefined ? showDeletedData:false

    const ref_collection = _showDeletedData ? admin.firestore().collection(data_targetCollection+"_Deleted"):admin.firestore().collection(data_targetCollection);
    const query_start = page * pageCount;

    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;

    const _dateFrom = admin.firestore.Timestamp.fromDate(new Date(dateFrom));
    const _dateTo = admin.firestore.Timestamp.fromDate(new Date(dateTo));

    console.log(`dateFrom , ${_dateFrom}  dateTo  ${_dateTo} `);

    return ref_collection
      .where("createDate", ">=", _dateFrom)
      .where("createDate", "<=", _dateTo)
      .orderBy(toOrderBy, order)
      // .offset(query_start)
      // .limit(pageCount)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        // console.log("data_list: ", JSON.stringify(data_list));

        var countInfo = null
          const ref_doc = admin.firestore().collection(data_targetCollection).doc("--stats--");
          ref_doc.get().then((snapshop) => {
          if (snapshop.exists) {
            countInfo = snapshop.data();
            // console.log("get_item_list category "+JSON.stringify(countInfo));
          }
        })

        return get_data_count(data_targetCollection).then((data) => {
          const returnItem = {
            data_list: data_list,
            count: data.count,
            countInfo:countInfo,
          };

          // console.log("list count: ", data.count);
          onDone(returnItem);
          return null;
        });
      });
  });
}

function get_item_list_byMulti(
  data_targetCollection,
  page,
  pageCount,
  searchKeywordKey,
  searchKeywordContent,
  showDeletedData,
  isProductPackageDropdown
) {
  return new Promise((onDone) => {
    // console.log("get_item_list_byMulti called");
    const _showDeletedData = showDeletedData !== undefined ? showDeletedData:false

    const ref_collection = _showDeletedData ? admin.firestore().collection(data_targetCollection+"_Deleted"):admin.firestore().collection(data_targetCollection);
    const query_start = page * pageCount;

    // var toOrderBy = "createDate";
    // toOrderBy =
    //   targetOrderBy !== null && targetOrderBy !== ""
    //     ? targetOrderBy
    //     : toOrderBy;
    // var order = "desc";
    // order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;

    // const _dateFrom = admin.firestore.Timestamp.fromDate(new Date(dateFrom));
    // const _dateTo = admin.firestore.Timestamp.fromDate(new Date(dateTo));

    console.log(
      `searchKeywordKey ${searchKeywordKey} searchKeywordContent  ${JSON.stringify(searchKeywordContent)} date ${searchKeywordContent[0]}`
    );

    if (isProductPackageDropdown){
      searchKeywordKey.pop()
      searchKeywordContent[2] = ""
      //local filter the product()
    }

    // set filter date
    const ref_collection_withDateWhere = ref_collection
    .where(
      searchKeywordKey[0],
      ">=",
      admin.firestore.Timestamp.fromDate(
        new Date(searchKeywordContent[0].fromDate)
      )
    )
    .where(
      searchKeywordKey[0],
      "<=",
      admin.firestore.Timestamp.fromDate(
        new Date(searchKeywordContent[0].toDate)
      )
    );

    // console.log("applied date");

    // apply where
    var ref_collection_withWhere = ref_collection_withDateWhere;
    for(var i=1; i<searchKeywordKey.length; i++)
    {
      if (searchKeywordKey[i] !== "" && searchKeywordContent[i] !== "")
      {
        ref_collection_withWhere = ref_collection_withWhere.where(searchKeywordKey[i], "==", searchKeywordContent[i])
      }
      else
      {
        console.log("Not apply [" + searchKeywordKey[i] + "] with [" + searchKeywordContent[i] + "]");
      }
    }

    // console.log("applied where");

    return ref_collection_withWhere
      // .orderBy(toOrderBy, order)
      // .offset(query_start)
      // .limit(pageCount)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        // console.log("data_list: ", JSON.stringify(data_list));

        var countInfo = null
          const ref_doc = admin.firestore().collection(data_targetCollection).doc("--stats--");
          ref_doc.get().then((snapshop) => {
          if (snapshop.exists) {
            countInfo = snapshop.data();
            // console.log("get_item_list category "+JSON.stringify(countInfo));
          }
        })

        return get_data_count(data_targetCollection).then((data) => {
          const returnItem = {
            data_list: data_list,
            count: data.count,
            countInfo:countInfo,
          };

          // console.log("list count: ", data.count);
          onDone(returnItem);
          return null;
        });
      });
  });
}

function get_item_list_all(data_targetCollection, targetOrderBy, targetOrder) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;

    return ref_collection
      .orderBy(toOrderBy, order)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        // console.log("data_list: ", data_list);

        var countInfo = null
          const ref_doc = admin.firestore().collection(data_targetCollection).doc("--stats--");
          ref_doc.get().then((snapshop) => {
          if (snapshop.exists) {
            countInfo = snapshop.data();
            // console.log("get_item_list category "+JSON.stringify(countInfo));
          }
        })

        return get_data_count(data_targetCollection).then((data) => {
          const returnItem = {
            data_list: data_list,
            count: data.count,
            countInfo:countInfo,
          };

          // console.log("list count: ", data.count);
          onDone(returnItem);
          return null;
        });
      });
  });
}

function check_unique_field(data_targetCollection, data_uniqueFieldList) {
  return new Promise((onDone) => {
    return get_item_list_all(data_targetCollection, null, null).then((list) => {
      const dataList = list.data_list;
      var isDuplicate = false;
      //check no same value
      if (data_uniqueFieldList.length > 0) {
        for (i = 0; i < data_uniqueFieldList.length; i++) {
          const key = Object.keys(data_uniqueFieldList[i]).toString();
          const value = Object.values(data_uniqueFieldList[i]).toString();
          for (j = 0; j < dataList.length; j++) {
            const item = dataList[j];
            if (item[key] === value) {
              isDuplicate = true;
              break;
            }
          }
        }
      }

      // console.log(`isDuplicate  : ${isDuplicate}`)
      onDone(isDuplicate);
      return null;
    });
  });
}

function get_item_list_inPeriod(
  data_targetCollection,
  startDate,
  endDate,
  targetOrderBy,
  targetOrder
) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    console.log(" get_item_list_inPeriod  "+data_targetCollection+" "+startDate+ " "+endDate)
    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;
    console.log(" get_item_list_inPeriod targetOrder  "+toOrderBy+" "+order)

    return ref_collection
      .where("createDate", ">=", startDate)
      .where("createDate", "<=", endDate)
      .orderBy(toOrderBy, order)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });
        
        // console.log("data_list in period: ", JSON.stringify(data_list));
        onDone(data_list);
        return null;
      });
  });
}

function get_report_list_inPeriod(
  data_targetCollection,
  startDate,
  endDate,
  targetOrderBy,
  targetOrder,
  _startAt
) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection(data_targetCollection);
    console.log(" get_item_list_inPeriod  "+data_targetCollection+" "+startDate+ " "+endDate)
    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;
    console.log(" get_item_list_inPeriod targetOrder  "+toOrderBy+" "+order)

      var reportData = [];

        ref_collection
        .where("createDate", ">=", startDate)
        .where("createDate", "<=", endDate)
        .orderBy(toOrderBy, order)
        .offset(_startAt)
        .limit(1000)
        .get()
        .then((snapshot_list) => {
          const data_list = snapshot_list.docs.map((doc) => {
            const c = doc.data();
            c.id = doc.id;
            return c;
        });
        // reportData.push("reportData  ")
        if(data_targetCollection == "Expenditure"){
          console.log("data_list in period:"+ data_targetCollection+  " " +JSON.stringify(data_list));

        }
          
          onDone(data_list);
          return null;
      });

        // endAt += 1000;
        // push the Data to the same array // client side handle ?
        
      // }

    // console.log("report list start: "+startAt+" end: "+endAt)

    //  ref_collection
    //   .where("createDate", ">=", startDate)
    //   .where("createDate", "<=", endDate)
    //   .orderBy(toOrderBy, order)
    //   .startAt(startAt)
    //   .limit(1000)
    //   .get()
    //   .then((snapshot_list) => {
    //     const data_list = snapshot_list.docs.map((doc) => {
    //       const c = doc.data();
    //       c.id = doc.id;
    //       return c;
    //     });

    //     console.log("data_list in period: ", data_list);
    //     onDone(data_list);
    //     return null;
    //   });


    // }
  // })

    
  });
}

function get_all_item(data_targetCollection, targetOrderBy, targetOrder) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    var toOrderBy = "createDate";
    toOrderBy =
      targetOrderBy !== null && targetOrderBy !== ""
        ? targetOrderBy
        : toOrderBy;
    var order = "desc";
    order = targetOrder !== null && targetOrder !== "" ? targetOrder : order;

    return ref_collection
      .orderBy(toOrderBy, order)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        onDone(data_list);
        return null;
      });
  });
}

function change_data_count(data_targetCollection, changeVal) {
  return new Promise((onDone) => {
    return get_data_count(data_targetCollection).then((data) => {
      const org_count = data.count;

      const updateItem = {
        count: org_count + changeVal,
      };
      // console.log("edit data count for " + data_targetCollection);
      return admin.firestore()
        .collection("DataCount")
        .doc(data_targetCollection)
        .set(updateItem)
        .then((result) => {
          onDone(true);
          return null;
        });
    });
  });
}

function get_data_count(data_targetCollection) {
  return new Promise((onDone) => {
    return admin.firestore()
      .collection("DataCount")
      .doc(data_targetCollection)
      .get()
      .then((snapshot) => {
        if (snapshot.exists) {
          const count = snapshot.data().count;
          data = {
            count: count,
          };
          onDone(data);
          return null;
        } else {
          data = {
            count: 0,
          };
          onDone(data);
          return null;
        }
      });
  });
}

//-------------------------------------------------------------------------------------------
// CollectionVersion
//-------------------------------------------------------------------------------------------

app.post("/admin/create-collectionVersion", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "CollectionVersion";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };

  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "CollectionVersion created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update CollectionVersion fail" });
      }
    }
  );
});

//-------------------------------------------------------------------------------------------
// CUSTOMER
//-------------------------------------------------------------------------------------------

app.post("/admin/create-customer", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Customer";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Customer created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update customer faild" });
      }
    }
  );
});

app.post("/admin/list-customer", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Customer";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;

  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;

  const showDeletedData = req.body.showDeletedData
 
  if (data_page !== null && data_pageCount !== null) {
    // console.log(`Customer list  =====> ${JSON.stringify(req.body)}`);
    if (searchType) {
      console.log('array search  case')
      if (searchType === "date") {
        console.log(`Customer list  =====>  req.body.searchKey == 'date'`);
        return get_item_list_byDate(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          data_keyword[0].fromDate,
          data_keyword[0].toDate,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else {
        const keyword = req.body.searchKeyword;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey[0],
          keyword[0],
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    } else {
      if (req.body.searchKeyword && req.body.searchKey) {
        console.log('normal search key case')
        const { searchKeyword, searchKey } = req.body;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey,
          searchKeyword,
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
      console.log('normal  case')
      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        showDeletedData
      ).then((list) => {
        // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
        return res.json({
          status: 200,
          responString:
            "Get customer list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    }
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-customer", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Customer";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Customers deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete customer failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// STAFF
//-------------------------------------------------------------------------------------------

app.post("/admin/create-staff", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Staff";
  var data_id = req.body.id;
  var data_content = req.body.content;
  var isPhoneNumExist = false;

  // check user exist with phone number
  // return admin
  // .auth()
  // .getUserByPhoneNumber("+852" + data_content.phone).then(check_userRecord => {
  //   isPhoneNumExist = (check_userRecord !== null);

    if (data_id === null && !isPhoneNumExist) {
      // register from firebase
      var userContent = {
        phoneNumber: "+852" + data_content.phone,
        displayName: data_content.itemName,
      };
      if (data_content.email !== null && data_content.email !== "") {
        userContent.email = data_content.email;
      }
  
      return admin
        .auth()
        .createUser(userContent)
        .then((userRecord) => {
          data_content.password = null;
          const newUserUID = userRecord.uid;
          const current_timestamp = admin.firestore.Timestamp.now();
          data_content.last_update = current_timestamp;
  
          var itemCreateTime = {
            createDate: current_timestamp,
            last_update: current_timestamp,
          };
          Object.assign(data_content, itemCreateTime);
  
          const ref_collection = admin.firestore()
            .collection(data_targetCollection)
            .doc(newUserUID);
  
          // add admin info in DB
          return ref_collection.set(data_content).then((doc_ref) => {
            // edit count
            return change_data_count(data_targetCollection, +1).then(
              (isUpdatedCount) => {
                if (isUpdatedCount) {
                  // create action log
                  do_create_action_log(
                    req,
                    "create",
                    data_targetCollection,
                    newUserUID
                  );
  
                  return res.json({
                    status: 200,
                    responString: "Staff created",
                    data: { item_id: newUserUID },
                  });
                } else {
                  return res
                    .status(400)
                    .json({ responString: "Create staff faild" });
                }
              }
            );
          });
        })
        .catch((error) => {
          console.log("firebase register user faild, ", error);
          return res.status(400).json({ responString: "Create staff faild" });
        });
    }
    else if (data_id == null && isPhoneNumExist)
    {
      const newUserUID = check_userRecord.uid;
      const ref_collection = admin.firestore()
        .collection(data_targetCollection)
        .doc(newUserUID);

      const current_timestamp = admin.firestore.Timestamp.now();
      data_content.last_update = current_timestamp;

      var itemCreateTime = {
        createDate: current_timestamp,
        last_update: current_timestamp,
      };
      Object.assign(data_content, itemCreateTime);

      // add admin info in DB
      return ref_collection.set(data_content).then((doc_ref) => {
        // edit count
        return change_data_count(data_targetCollection, +1).then(
          (isUpdatedCount) => {
            if (isUpdatedCount) {
              // create action log
              do_create_action_log(
                req,
                "create",
                data_targetCollection,
                newUserUID
              );

              return res.json({
                status: 200,
                responString: "Staff created",
                data: { item_id: newUserUID },
              });
            } else {
              return res
                .status(400)
                .json({ responString: "Create staff faild" });
            }
          }
        );
      });
    }
    else {
      // update user from firebase auth
      var updateContent = {
        phoneNumber: "+852" + data_content.phone,
        displayName: data_content.itemName,
      };
      if (data_content.email !== null && data_content.email !== "") {
        updateContent.email = data_content.email;
      }
  
      return admin
        .auth()
        .updateUser(data_id, updateContent)
        .then((userRecord) => {
          data_content.password = null;
          const newUserUID = userRecord.uid;
          const current_timestamp = admin.firestore.Timestamp.now();
  
          var itemCreateTime = {
            last_update: current_timestamp,
          };
          Object.assign(data_content, itemCreateTime);
  
          const ref_collection = admin.firestore()
            .collection(data_targetCollection)
            .doc(newUserUID);
  
          // update admin info in DB
          return ref_collection.update(data_content).then((doc_ref) => {
            // create action log
            do_create_action_log(req, "edit", data_targetCollection, newUserUID);
  
            return res.json({
              status: 200,
              responString: "Staff updated",
              data: { item_id: newUserUID },
            });
          });
        })
        .catch((error) => {
          console.log("firebase update user faild, ", error);
          return res.status(400).json({ responString: "Update staff faild" });
        });
    }
  // });
});

app.post("/admin/list-staff", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Staff";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const showDeletedData = req.body.showDeletedData

  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;

  if (data_page !== null && data_pageCount !== null) {
      if (searchType) {
        console.log('array search  case')
        if (searchType === "date") {
          return get_item_list_byDate(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            data_keyword[0].fromDate,
            data_keyword[0].toDate,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get staff list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        } else {
          const keyword = req.body.searchKeyword;
          return get_item_list_withKeyword(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            searchKey[0],
            keyword[0],
            showDeletedData
          ).then((list) => {
            // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
            return res.json({
              status: 200,
              responString:
                "Get staff list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
      } else {
        if (req.body.searchKeyword && req.body.searchKey) {
          // console.log('normal search key case')
          const { searchKeyword, searchKey } = req.body;
          return get_item_list_withKeyword(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            searchKey,
            searchKeyword,
            showDeletedData
          ).then((list) => {
            // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
            return res.json({
              status: 200,
              responString:
                "Get customer list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
      }


    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get staff list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.get(
  "/admin/list-staff-onDuty",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Staff";
    return get_item_list_all(data_targetCollection, null, null).then(
      (returnItem) => {
        const staffListOnDuty = returnItem.data_list
          .filter((v) => v.state && v.state !== "off")
          .map((i, k) => {
            var newItem = i;
            if (newItem.lastDutyChangeTime) {
              newItem.lastDutyChangeTime = newItem.lastDutyChangeTime.toDate();
            } else {
              newItem.lastDutyChangeTime = null;
            }

            return newItem;
          });

        return res.json({
          status: 200,
          responString: "Get staff list success",
          data: staffListOnDuty,
        });
      }
    );
  }
);
app.post("/admin/del-staff", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Staff";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          // firebase disable user
          deletedIDList.map((deletedID, k) => {
            return admin
              .auth()
              .updateUser(deletedID, { disabled: true })
              .then((userRecord) => {
                return null;
              })
              .catch((error) => {
                console.log("disable user faild, ", error);
              });
          });

          return res.json({
            status: 200,
            responString: "Staff deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res.status(400).json({ responString: "delete staff failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// ADMIN
//-------------------------------------------------------------------------------------------

app.post("/admin/create-admin", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Admin";
  const data_id = req.body.id;
  var data_content = req.body.content;

  if (data_id === null) {
    // register from firebase
    return admin
      .auth()
      .createUser({
        email: data_content.email,
        emailVerified: true,
        password: data_content.password,
        displayName: data_content.itemName,
      })
      .then((userRecord) => {
        data_content.password = null;
        const newUserUID = userRecord.uid;
        const current_timestamp = admin.firestore.Timestamp.now();
        data_content.last_update = current_timestamp;

        var itemCreateTime = {
          createDate: current_timestamp,
          last_update: current_timestamp,
        };
        Object.assign(data_content, itemCreateTime);

        const ref_collection = admin.firestore()
          .collection(data_targetCollection)
          .doc(newUserUID);

        // add admin info in DB
        return ref_collection.set(data_content).then((doc_ref) => {
          // edit count
          return change_data_count(data_targetCollection, +1).then(
            (isUpdatedCount) => {
              if (isUpdatedCount) {
                // create action log
                do_create_action_log(
                  req,
                  "create",
                  data_targetCollection,
                  newUserUID
                );

                return res.json({
                  status: 200,
                  responString: "Admin created",
                  data: { item_id: newUserUID },
                });
              } else {
                return res
                  .status(400)
                  .json({ responString: "Create admin faild" });
              }
            }
          );
        });
      })
      .catch((error) => {
        console.log("firebase register user faild, ", error);
        return res.status(400).json({ responString: "Create admin faild" });
      });
  } else {
    // update user from firebase auth
    var updateContent = {
      email: data_content.email,
      emailVerified: true,
      displayName: data_content.itemName,
    };
    if (data_content.password !== null && data_content.password !== "") {
      updateContent.password = data_content.password;
    }

    return admin
      .auth()
      .updateUser(data_id, updateContent)
      .then((userRecord) => {
        data_content.password = null;
        const newUserUID = userRecord.uid;
        const current_timestamp = admin.firestore.Timestamp.now();

        var itemCreateTime = {
          last_update: current_timestamp,
        };
        Object.assign(data_content, itemCreateTime);

        const ref_collection = admin.firestore()
          .collection(data_targetCollection)
          .doc(newUserUID);

        // update admin info in DB
        return ref_collection.update(data_content).then((doc_ref) => {
          // create action log
          do_create_action_log(req, "edit", data_targetCollection, newUserUID);

          return res.json({
            status: 200,
            responString: "Admin updated",
            data: { item_id: newUserUID },
          });
        });
      })
      .catch((error) => {
        console.log("firebase update user faild, ", error);
        return res.status(400).json({ responString: "Update admin faild" });
      });
  }
});
app.post("/admin/list-admin", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Admin";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;
  const showDeletedData = req.body.showDeletedData
  if (data_page !== null && data_pageCount !== null) {
      if (searchType) {
        console.log('array search  case')
        if (searchType === "date") {
          return get_item_list_byDate(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            data_keyword[0].fromDate,
            data_keyword[0].toDate,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get staff list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        } else {
          const keyword = req.body.searchKeyword;
          return get_item_list_withKeyword(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            searchKey[0],
            keyword[0],
            showDeletedData
          ).then((list) => {
            // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
            return res.json({
              status: 200,
              responString:
                "Get staff list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
      } else {
        if (req.body.searchKeyword && req.body.searchKey) {
          // console.log('normal search key case')
          const { searchKeyword, searchKey } = req.body;
          return get_item_list_withKeyword(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            searchKey,
            searchKeyword,
            showDeletedData
          ).then((list) => {
            // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
            return res.json({
              status: 200,
              responString:
                "Get customer list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
      }

    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get staff list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/get-adminInfo", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Admin";
  const ref_collection = admin.firestore().collection(data_targetCollection);

  const adminUID = req.body.id;
  if (adminUID !== null && adminUID !== "") {
    return ref_collection
      .doc(adminUID)
      .get()
      .then((snapshot_admins) => {
        if (snapshot_admins.exists) {
          const adminLevelID = snapshot_admins.data().admin_level;
          console.log("admin level id: ", adminLevelID);

          return admin.firestore()
            .collection("AdminLevel")
            .doc(adminLevelID)
            .get()
            .then((snapshot_adminLevel) => {
              if (snapshot_adminLevel.exists) {
                var adminInfo = snapshot_adminLevel.data();
                if(snapshot_admins.data().storeID){
                  adminInfo.storeID = snapshot_admins.data().storeID;
                  adminInfo.storeName = snapshot_admins.data().storeName;

                }
                  // console.log("adminInfo  ==> "+JSON.stringify(adminInfo))
                return res.json({
                  status: 200,
                  responString: "Get admin info success",
                  data: adminInfo,
                });
              } else {
                return res
                  .status(400)
                  .json({ responString: "Invalid admin permission level id" });
              }
            });
        } else {
          return res
            .status(400)
            .json({ responString: "Invalid admin account" });
        }
      });
  } else {
    return res.status(400).json({ responString: "Invalid id" });
  }
});
app.post("/admin/del-admin", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Admin";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          // firebase disable user
          deletedIDList.map((deletedID, k) => {
            return admin
              .auth()
              .updateUser(deletedID, { disabled: true })
              .then((userRecord) => {
                return null;
              })
              .catch((error) => {
                console.log("disable user faild, ", error);
              });
          });
          return res.json({
            status: 200,
            responString: "Admin deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res.status(400).json({ responString: "delete admin failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post(
  "/admin/create-admin-level",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "AdminLevel";
    const data_id = req.body.id;
    const data_content = req.body.content;

    const processItem = {
      targetCollection: data_targetCollection,
      targetID: data_id,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          return res.json({
            status: 200,
            responString: "Admin level created/updated",
            data: { item_id: createdIDList[0] },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update admin level faild" });
        }
      }
    );
  }
);
app.post(
  "/admin/list-admin-level",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "AdminLevel";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }
      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get staff list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
app.post("/admin/del-admin-level", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "AdminLevel";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Admin level deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete admin level failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// System config
//-------------------------------------------------------------------------------------------
//set config
app.post(
  "/admin/set-system-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SystemConfig";
    const data_id = req.body.id;
    const data_content = req.body.content;

    const processItem = {
      targetCollection: data_targetCollection,
      targetID: data_id,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          return res.json({
            status: 200,
            responString: "System config created/updated",
            data: { item_id: createdIDList[0] },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "System config admin level faild" });
        }
      }
    );
  }
);
//get config list
app.post(
  "/admin/list-system-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SystemConfig";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData

    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get system config list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list.data_list[0],
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

//-------------------------------------------------------------------------------------------
// CATEGORY
//-------------------------------------------------------------------------------------------

app.post("/admin/create-category", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Category";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Category created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update category faild" });
      }
    }
  );
});

app.post("/admin/list-category", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Category";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      
      return res.json({
        status: 200,
        responString:
          "Get category list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-category", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Category";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Category deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete category failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// STORE
//-------------------------------------------------------------------------------------------

app.post("/admin/create-store", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Store";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Store created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update store faild" });
      }
    }
  );
});

app.post("/admin/list-store", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Store";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get store list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-store", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Store";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Store deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res.status(400).json({ responString: "delete store failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// PAYMENT
//-------------------------------------------------------------------------------------------

app.post("/admin/create-payment", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Payment";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Payment created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update payment faild" });
      }
    }
  );
});

app.post("/admin/list-payment", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Payment";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get payment list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-payment", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Payment";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Payment deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete payment failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// PRODUCT
//-------------------------------------------------------------------------------------------

app.post("/admin/create-product", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Product created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update product faild" });
      }
    }
  );
});

app.post("/admin/list-product", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get product list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-product", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Product deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete product failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// COUPON
//-------------------------------------------------------------------------------------------

app.post("/admin/create-coupon", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product-Coupon";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Coupon created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update coupon faild" });
      }
    }
  );
});

app.post("/admin/list-coupon", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product-Coupon";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData

    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get coupon list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-coupon", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product-Coupon";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Coupon deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res.status(400).json({ responString: "delete coupon failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// PACKAGE
//-------------------------------------------------------------------------------------------

app.post("/admin/create-package", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product-Package";
  const data_id = req.body.id;
  const data_content = req.body.content;

  const processItem = {
    targetCollection: data_targetCollection,
    targetID: data_id,
    content: data_content,
  };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Package created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update package faild" });
      }
    }
  );
});



app.post("/admin/recover-deleted", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.targetCollection;
  const data_targetID = req.body.targetID;
  console.log("/admin/recover-deleted " +data_targetCollection +data_targetID)
  if (data_targetCollection !== null && data_targetID !== null)
  {
    const ref_collection_org = admin.firestore().collection(data_targetCollection).doc(data_targetID);
    const ref_collection_deleted = admin.firestore().collection(data_targetCollection+"_Deleted").doc(data_targetID);
    return ref_collection_deleted.get().then((targetData) => {
      if (targetData.exists) 
      {
        const contentToMove = targetData.data();
        contentToMove.isDeleted = false;
        ref_collection_org.set(contentToMove).then(() => {
          ref_collection_deleted.delete().then(() => {
            return res.json({
              status: 200,
              responString: "Data recovered",
              data: data_targetID,
            });
          });
        });
      }
      else
      {
        return res.status(400).json({ responString: "Data with ID: " + data_targetID + " not exist" });
      }
    });
  }
  else
  {
    return res.status(400).json({ responString: "[data_targetCollection] or [data_targetID] missing" });
  }
});

app.post("/admin/list-package", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product-Package";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData

    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get package list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-package", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Product-Package";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Package deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete package failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// EXPENDITURE
//-------------------------------------------------------------------------------------------

app.post(
  "/admin/create-expenditure",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_id = req.body.id;
    const data_content = req.body.content;

    if (data_content.amount <= 0)
    {
      return res
            .status(400)
            .json({ responString: "Amount can not be 0" });
    }

    return do_create_update_expenditure(req, data_id, data_content).then(
      (res_expenditure) => {
        const isSuccess = res_expenditure.isSuccess;
        const expenditureID = res_expenditure.id;
        if (isSuccess) {
          return res.json({
            status: 200,
            responString: "Expenditure created/updated",
            data: { item_id: expenditureID },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update Expenditure faild" });
        }
      }
    );
  }
);

function do_create_update_expenditure(req, data_id, data_content) {
  return new Promise((onDone) => {
    console.log("data_id: ", data_id, " data_content: ", data_content);

    if (data_id === null && data_content.amount === 0)
    {
      onDone({isSuccess: true, id: null});
      return null;
    }
    else
    {
      if (data_content) 
      {
        const processItem = {
          targetCollection: "Expenditure",
          targetID: data_id,
          content: data_content,
        };

        console.log("do_create_update_expenditure processItem: ", processItem);

        return process_create_edit_itemList(req, [processItem], []).then(
          (createdIDList) => {
            if (createdIDList !== null && createdIDList.length === 1) {
              onDone({isSuccess: true, id: createdIDList[0]});
              return null;
            } else {
              onDone({isSuccess: false, id: null});
              return null;
            }
          }
        );
      } else {
        onDone({isSuccess: false, id: null});
      }
    }
  });
}

app.post(
  "/admin/list-expenditure",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Expenditure";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;

    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
  
    const showDeletedData = req.body.showDeletedData

    if (data_page !== null && data_pageCount !== null) {
      if (searchType) {
        if (searchType === "date") {
          console.log(`Customer list  =====>  req.body.searchKey == 'date'`);
          return get_item_list_byDate(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            data_keyword[0].fromDate,
            data_keyword[0].toDate,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get Expenditure list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }else if (searchType === "multi") {
          console.log(
            `expenditure list  =====>  req.body.searchKey == 'multi'  ${JSON.stringify(
              data_keyword[1]
            )}`
          );
          return get_item_list_byMulti(
            data_targetCollection,
            data_page,
            data_pageCount,
            searchKey,
            data_keyword,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get expenditure list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }

  
        const keyword = req.body.searchKeyword;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey[0],
          keyword[0],
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get Expenditure list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else {
        return get_item_list(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get Expenditure list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    }else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } 
      else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
app.post("/admin/del-expenditure", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Expenditure";
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null) {
    // cteate to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Expenditure deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "delete Expenditure failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
//-------------------------------------------------------------------------------------------
// SALES
//-------------------------------------------------------------------------------------------

app.post("/admin/create-sales", validateAdminFirebaseIdToken, (req, res) => {
  const data_id = req.body.id;
  var data_content = req.body.content;
  const data_customerID = req.body.customerID;

  // handle commission
  var data_commissionContent = req.body.commission_content;
  data_commissionContent.isAutoCreate = true;
  const data_commissionID = req.body.commissionID;
  console.log("data_commissionContent: ", JSON.stringify(data_commissionContent));
  return do_create_update_commission(
    req,
    data_commissionID,
    data_commissionContent
  ).then((res_commission) => {
    const isSuccess_commission = res_commission.isSuccess;
    const commissionID = res_commission.id;
    if (isSuccess_commission) {
      // handle receivable to delete
      const data_receivableToDelete = req.body.receivableIDToDelet;
      return do_delete_receivableRecordAndUpdateBalance(
        req,
        data_receivableToDelete,
        []
      ).then((deletedReceivableRecordID) => {
        if (deletedReceivableRecordID !== null) {
          // handle receivable to add
          var data_receivableContent = req.body.receivable_content;
          if (data_receivableContent != null){
            data_receivableContent.isAutoCreate = true;
          }
          // console.log("do_delete_receivableRecordAndUpdateBalance  data_receivableContent"+ JSON.stringify(data_receivableContent))
          const data_receivableID = req.body.receivableID;
          return do_create_update_receivable(
            req,
            data_receivableID,
            data_receivableContent
          ).then((receivableID) => {
            if (receivableID !== null) {
              // handle inventory balance
              const data_inventoryBalanceChangeList =
                req.body.inventoryBalanceChangeList;
              return process_changeBalanceList(
                "Inventory-Balance",
                data_inventoryBalanceChangeList
              ).then((isDone_changeInventoryBalance) => {
                if (isDone_changeInventoryBalance) {
                  // handle delete coupon balance(edit)
                  const data_couponBalanceRecordToDelete =
                    req.body.couponBalanceRecordToDelete;
                  var data_couponBalanceRecordToDeleteItemList = [];
                  data_couponBalanceRecordToDelete.map(
                    (toDeleteItemID, key_toDeleteID) => {
                      const item = {
                        targetCollection: "Coupon-Balance",
                        targetID: toDeleteItemID,
                      };
                      data_couponBalanceRecordToDeleteItemList.push(item);
                    }
                  );
                  // handle coupon discount allowed
                  const coupon_expenditureID = req.body.coupon_expenditureID
                  var coupon_expenditureContent = req.body.coupon_expenditure_content
                  if(coupon_expenditureContent != null){
                    coupon_expenditureContent.isAutoCreate = true;
                  }
                    console.log(`coupon_expenditureID  ${coupon_expenditureID}  ${coupon_expenditureContent}`)
                  return do_create_update_expenditure(
                    req,
                    coupon_expenditureID,
                    coupon_expenditureContent
                  ).then((res_c_expenditure) => {
                    const isSuccess_c = res_c_expenditure.isSuccess;
                    const c_expenditureID = res_c_expenditure.id;
                    if(isSuccess_c){

                      // handle product discount allowed
                      const product_expenditureID = req.body.product_expenditureID
                      var product_expenditureContent = req.body.product_expenditure_content
                      if(product_expenditureContent != null){

                        product_expenditureContent.isAutoCreate = true;
                      }

                      console.log(`product_expenditureID  ${product_expenditureID}  ${product_expenditureContent}`)
                      return do_create_update_expenditure(
                        req,
                        product_expenditureID,
                        product_expenditureContent
                      ).then((res_p_expenditure) => {
                        const isSuccess_p = res_p_expenditure.isSuccess;
                        const p_expenditureID = res_p_expenditure.id;
                        if(isSuccess_p){
                          return process_delete_itemList(
                            req,
                            data_couponBalanceRecordToDeleteItemList,
                            []
                          ).then((deletedRecordIDList) => {
                            if (deletedRecordIDList !== null) {
                              // handle coupon balance on-hold
                              var data_couponBalanceChangeList_onHold =
                                req.body.couponBalanceChangeList;

                                if(data_couponBalanceChangeList_onHold != null){
                                  data_couponBalanceChangeList_onHold.map(item=>{
                                    item.content.isAutoCreate = true;
                                  })
                                }
                                console.log("couponBalanceIDList_onHold  "+JSON.stringify(data_couponBalanceChangeList_onHold));

                              return process_changeCouponBalanceList(
                                req,
                                data_couponBalanceChangeList_onHold,
                                [],
                                data_customerID
                              ).then((couponBalanceIDList_onHold) => {
                                if (couponBalanceIDList_onHold !== null) {
                                  // handle coupon to use
                                  const data_couponBalanceChangeList_toUse =
                                    req.body.couponBalanceChangeList_toUse;
                                  return process_changeCouponBalanceList(
                                    req,
                                    data_couponBalanceChangeList_toUse,
                                    [],
                                    data_customerID
                                  ).then((couponBalanceIDList_toUse) => {
                                    if (couponBalanceIDList_toUse !== null) {
                                      // create sales record
                                      data_content.commissionID = commissionID;
                                      data_content.receivableID = receivableID;
                                      data_content.couponIDSet =
                                        couponBalanceIDList_onHold;
                                        data_content.product_expenditureID = p_expenditureID
                                        data_content.coupon_expenditureID = c_expenditureID

                                      return do_create_update_salesRecordOnly(
                                        req,
                                        data_id,
                                        data_content
                                      ).then((salesID) => {
                                        if (salesID !== null) {
                                          return res.json({
                                            status: 200,
                                            responString: "Sales created/updated",
                                            data: { item_id: salesID },
                                          });
                                        } else {
                                          return res
                                            .status(400)
                                            .json({
                                              responString: "Create/update Sales faild",
                                            });
                                        }
                                      });
                                    } else {
                                      return res
                                        .status(400)
                                        .json({
                                          responString: "Create/update Sales faild",
                                        });
                                    }
                                  });
                                } else {
                                  return res
                                    .status(400)
                                    .json({
                                      responString: "Create/update Sales faild",
                                    });
                                }
                              });
                            } else {
                              return res
                                .status(400)
                                .json({ responString: "Create/update Sales faild" });
                            }
                          });
                        }
                       });
                    }
                   });

                } else {
                  return res
                    .status(400)
                    .json({ responString: "Create/update Sales faild" });
                }
              });
            } else {
              return res
                .status(400)
                .json({ responString: "Create/update Sales faild" });
            }
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update Sales faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "Create/update Sales faild" });
    }
  });
});

function do_create_update_salesRecordOnly(req, data_id, data_content) {
  return new Promise((onDone) => {
    // create sales record
    const processItem = {
      targetCollection: "Sales",
      targetID: data_id,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          onDone(createdIDList[0]);
          return null;
        } else {
          onDone(null);
          return null;
        }
      }
    );
  });
}

app.post("/admin/list-sales", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Sales";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;

  const showDeletedData = req.body.showDeletedData
  const isProductPackageDropdown = req.body.isProductPackageDropdown ? req.body.isProductPackageDropdown:false;

  if (data_page !== null && data_pageCount !== null) {
    if (searchType) {
      if (searchType === "date") {
        console.log(`Customer list  =====>  req.body.searchKey == 'date'`);
        return get_item_list_byDate(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          data_keyword[0].fromDate,
          data_keyword[0].toDate,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }else if (searchType === "multi") {
        console.log(
          `Customer list  =====>  req.body.searchKey == 'multi'  ${JSON.stringify(
            data_keyword[1]
          )}`
        );
        return get_item_list_byMulti(
          data_targetCollection,
          data_page,
          data_pageCount,
          searchKey,
          data_keyword,
          showDeletedData,
          isProductPackageDropdown
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }

      const keyword = req.body.searchKeyword;
      return get_item_list_withKeyword(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        searchKey[0],
        keyword[0],
        showDeletedData
      ).then((list) => {
        // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
        return res.json({
          status: 200,
          responString:
            "Get customer list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get Sales list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    }
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});
app.post("/admin/del-sales", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetIDList = req.body.idList;

  // delete sales record list
  if (data_targetIDList !== null) {
    // cteate to-delete-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: "Sales",
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_salesList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Sales deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res.status(400).json({ responString: "delete Sales failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});

function handle_delete_sales_commission(req, commissionID)
{
  return new Promise((onDone) => {
    return do_get_item(commissionID, "Commission").then(
      (snapshot_commissionRecordData) => {
        if (snapshot_commissionRecordData !== null) {
          const commissionRecordData =
            snapshot_commissionRecordData.data();
          // delete commission record and update balance
          var toProcessDeleteList_commission = [];
          var toProcessChangeBalanceList_commission = [];

          const item_del_commission = {
            targetCollection: "Commission",
            targetID: commissionID,
          };
          toProcessDeleteList_commission.push(item_del_commission);

          const changeItem_commission = {
            id: commissionRecordData.staffID,
            type: "commission",
            change_val: -commissionRecordData.amount,
            itemName: commissionRecordData.staffName,
          };
          toProcessChangeBalanceList_commission.push(
            changeItem_commission
          );

          return do_deleteCommissionAndBalance(
            req,
            toProcessChangeBalanceList_commission,
            toProcessDeleteList_commission
          ).then((deletedCommissionID) => {
            onDone(deletedCommissionID);
            return null;
          });
        }
    });
  });
}

function handle_delete_sales_core_part(req, salesRecordData, salesRecordID)
{
  return new Promise((onDone) => {
    // add back inventory balance
    return do_addBackInventoryBalanceWithItemsInPacakge(
      salesRecordData.itemsInPackage,
      salesRecordData.couponUsageList
    ).then((isDone_addBackInventoryBalance) => {
      if (isDone_addBackInventoryBalance) {
        // get customer on-hold coupon
        const customerID = salesRecordData.customerID;
        return do_get_related_item_list(
          "Coupon-Balance",
          "customerID",
          customerID
        ).then((couponBalanceRecordList_onHold) => {
          if (couponBalanceRecordList_onHold !== null) {
            // get id of coupon balance record to delete
            var listToDelete_couponBalance = [];
            salesRecordData.itemsInPackage.map(
              (item, key) => {
                if (
                  item.type === "coupon" ||
                  item.type === "package_coupon"
                ) {
                  couponBalanceRecordList_onHold.map(
                    (rec, key) => {
                      if (
                        rec.cart_uuid === item.cart_uuid
                      ) {
                        const itemToDel = {
                          targetCollection:
                            "Coupon-Balance",
                          targetID: rec.id,
                        };
                        listToDelete_couponBalance.push(
                          itemToDel
                        );
                      }
                    }
                  );
                }
              }
            );

            // remove bought coupon balance
            return process_delete_itemList(
              req,
              listToDelete_couponBalance,
              []
            ).then((deletedIDList_couponBalance) => {
              if (deletedIDList_couponBalance !== null) {
                // create list to update for used coupon
                var listToUpdate_usedCoupon = [];
                salesRecordData.couponUsageList.map(
                  (usedItem, k_used) => {
                    couponBalanceRecordList_onHold.map(
                      (rec, k_rec) => {
                        if (usedItem.id === rec.id) {
                          const changeItem = {
                            id: rec.id,
                            content: {
                              qty: rec.qty + usedItem.use,
                            },
                          };

                          listToUpdate_usedCoupon.push(
                            changeItem
                          );
                        }
                      }
                    );
                  }
                );

                // add back used coupon
                return process_changeCouponBalanceList(
                  req,
                  listToUpdate_usedCoupon,
                  [],
                  customerID
                ).then(
                  (couponBalanceIDList_updatedUsed) => {
                    if (
                      couponBalanceIDList_updatedUsed !==
                      null
                    ) {
                      // delete sales record
                      // return do_delete_salesRecordAndUpdateCount(
                      return process_delete_itemList(req, 
                        [
                          {
                            targetCollection: "Sales",
                            targetID: salesRecordID
                          }
                        ],
                        []
                      ).then((deletedSalesIDList) => {
                        onDone(deletedSalesIDList);
                      });
                    } else {
                      onDone(null);
                      return null;
                    }
                  }
                );
              } else {
                onDone(null);
                return null;
              }
            });
          } else {
            onDone(null);
            return null;
          }
        });
      } else {
        onDone(null);
        return null;
      }
    });
  });
}

function process_delete_salesList(req, listToProcess, returnIDList) {
  console.log("process_delete_salesList listToProcess: ", listToProcess);

  return new Promise((onDone) => {
    var newList = listToProcess;
    var newRecordIDList = returnIDList;

    if (newList.length !== 0) {
      const targetItem = newList[0];
      const salesRecordID = targetItem.targetID;

      // get detail of sales record
      return do_get_item(salesRecordID, "Sales").then(
        (snapshot_salesRecordData) => {
          if (snapshot_salesRecordData !== null) {
            const salesRecordData = snapshot_salesRecordData.data();

            // delete receivable record and balance
            const receivableID = salesRecordData.receivableID;
            return do_delete_receivableRecordAndUpdateBalance(
              req,
              [receivableID],
              []
            ).then((deletedReceivableRecordID) => {
              if (deletedReceivableRecordID !== null) {
                
                // delete related commission and correct balance
                if (salesRecordData.commissionID !== null)
                {
                  const commissionID = salesRecordData.commissionID;
                  console.log("commissionID: ", commissionID);
                  handle_delete_sales_commission(req, commissionID);
                }

                // delete related expenditures
                if (salesRecordData.product_expenditureID !== null || salesRecordData.coupon_expenditureID !== null)
                {
                  const product_expenditureID = salesRecordData.product_expenditureID;
                  console.log("product_expenditureID: ", product_expenditureID);
                  const coupon_expenditureID = salesRecordData.coupon_expenditureID;
                  console.log("coupon_expenditureID: ", coupon_expenditureID);

                  var toProcessList = [];

                  if (product_expenditureID !== null)
                  {
                    const item = {
                      targetCollection: "Expenditure",
                      targetID: product_expenditureID,
                    };
                    toProcessList.push(item);
                  }

                  if (coupon_expenditureID !== null)
                  {
                    const item = {
                      targetCollection: "Expenditure",
                      targetID: coupon_expenditureID,
                    };
                    toProcessList.push(item);
                  }
                  process_delete_itemList(req, toProcessList, []);
                }




                return handle_delete_sales_core_part(req, salesRecordData, salesRecordID).then((deletedSalesIDList) => {
                  if (deletedSalesIDList !== null) {
                    // add doc ID
                    newRecordIDList.push(
                      deletedSalesIDList[0]
                    );

                    // remove item from to-process List
                    newList.splice(0, 1);

                    if (newList.length > 0) {
                      return process_delete_salesList(
                        req,
                        newList,
                        newRecordIDList
                      ).then((newIDList) => {
                        if (newIDList !== null) {
                          onDone(newIDList);
                          return null;
                        } else {
                          onDone(null);
                          return null;
                        }
                      });
                    } else {
                      // create action log
                      do_create_action_log(
                        req,
                        "delete",
                        "Sales",
                        deletedSalesIDList[0]
                      );

                      onDone(newRecordIDList);
                      return null;
                    }
                  } else {
                    onDone(null);
                    return null;
                  }
                });



                
              } else {
                onDone(null);
                return null;
              }
            });
          } else {
            onDone(null);
            return null;
          }
        }
      );
    } else {
      onDone(returnIDList);
    }
  });
}

function do_addBackInventoryBalanceWithItemsInPacakge(
  itemsInPackage,
  couponUsageList
) {
  return new Promise((onDone) => {
    // create change list
    var newChangeList = [];
    itemsInPackage.map((item, key) => {
      if (item.type === "item") {
        const newChange = {
          id: item.id,
          type: item.type,
          change_val: item.qty,
          itemName: item.itemName,
        };
        newChangeList.push(newChange);
      } else if (item.type === "package_product") {
        //(item.type === "package" || item.type === "package_coupon" || item.type === "package_product")
        item.itemsInPackage.map((i, k) => {
          // check add item type only
          if (i.type === "item") {
            const newChange = {
              id: i.id,
              type: i.type,
              change_val: i.qty * item.qty,
              itemName: i.itemName,
            };
            newChangeList.push(newChange);
          }
        });
      }
    });

    // create change list with used coupon
    couponUsageList.map((c_use, k_use) => {
      const exchange_itemID = c_use.exchange_itemID;
      const exchange_itemName = c_use.exchange_itemName;
      const useQty = c_use.use;

      const newChange = {
        id: exchange_itemID,
        type: "item",
        change_val: useQty,
        itemName: exchange_itemName,
      };
      newChangeList.push(newChange);
    });

    // process change list
    return process_changeBalanceList("Inventory-Balance", newChangeList).then(
      (isDone_changeInventoryBalance) => {
        if (isDone_changeInventoryBalance) {
          onDone(true);
          return null;
        } else {
          onDone(false);
          return null;
        }
      }
    );
  });
}

function do_delete_salesRecordAndUpdateCount(targetID) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection("Sales").doc(targetID);
    const current_timestamp = admin.firestore.Timestamp.now();

    return ref_collection
      .update({
        isDeleted: true,
        last_update: current_timestamp,
      })
      .then(() => {
        // change data count
        return change_data_count("Sales", -1).then((isUpdatedCount) => {
          if (isUpdatedCount) {
            onDone(targetID);
            return null;
          } else {
            onDone(null);
            return null;
          }
        });
      });
  });
}
//-------------------------------------------------------------------------------------------
// INVENTORY
//-------------------------------------------------------------------------------------------

app.post(
  "/admin/create-inventory-in",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_id = req.body.id;
    var data_content = req.body.content;

    // handle expenditure
    const data_expenditureID = req.body.expenditureID;
    const data_expenditureContent = req.body.expenditureContent;
    console.log(
      "create-inventory-in data_expenditureContent: ",
      data_expenditureContent
    );
    return do_create_update_expenditure(
      req,
      data_expenditureID,
      data_expenditureContent
    ).then((res_expenditure) => {
      const isSuccess = res_expenditure.isSuccess;
      const expenditureID = res_expenditure.id;
      if (isSuccess) {
        // handle inventory balance
        const data_balanceChangeList = req.body.balanceChangeList;
        return process_changeBalanceList(
          "Inventory-Balance",
          data_balanceChangeList
        ).then((isDone_editBalance) => {
          if (isDone_editBalance) {
            // create inventory-in record
            data_content.expenditureID = expenditureID; // insert expenditureID
            return do_create_update_inventoryInRecord(
              req,
              data_id,
              data_content
            ).then((inventoryInRecordID) => {
              if (inventoryInRecordID !== null) {
                return res.json({
                  status: 200,
                  responString: "Inventory-In created/updated",
                  data: { item_id: inventoryInRecordID },
                });
              } else {
                return res
                  .status(400)
                  .json({ responString: "Create/update Inventory-In faild" });
              }
            });
          } else {
            return res
              .status(400)
              .json({ responString: "Balance update failed" });
          }
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update Inventory-In faild" });
      }
    });
  }
);

function do_create_update_inventoryInRecord(req, data_id, data_content) {
  return new Promise((onDone) => {
    const processItem = {
      targetCollection: "Inventory-In",
      targetID: data_id,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          onDone(createdIDList[0]);
          return null;
        } else {
          onDone(null);
          return null;
        }
      }
    );
  });
}

app.post(
  "/admin/list-inventory-in",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Inventory-In";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        "",
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get Inventory-In list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
app.post(
  "/admin/list-inventory-balance",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Inventory-Balance";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData

    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        "last_update",
              "desc",
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get Inventory-Balance list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
app.post(
  "/admin/del-inventory-in",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Inventory-In";
    const data_targetIDList = req.body.idList;

    if (data_targetIDList !== null) {
      // cteate to-process-list
      var toProcessList = [];
      data_targetIDList.map((itemID, key) => {
        const item = {
          targetCollection: data_targetCollection,
          targetID: itemID,
        };
        toProcessList.push(item);
      });

      return process_delete_itemList(req, toProcessList, []).then(
        (deletedIDList) => {
          if (deletedIDList !== null) {
            return res.json({
              status: 200,
              responString: "Inventory-In deleted",
              data: { idList: deletedIDList },
            });
          } else {
            return res
              .status(400)
              .json({ responString: "delete Inventory-In failed" });
          }
        }
      );
    } else {
      if (data_targetIDList === null) {
        return res.status(400).json({ responString: "[idList] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
//-------------------------------------------------------------------------------------------
// RECEIVABLE
//-------------------------------------------------------------------------------------------

app.post(
  "/admin/create-receivable",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_id = req.body.id;
    const data_content = req.body.content;

    return do_create_update_receivable(req, data_id, data_content).then(
      (receivableID) => {
        if (receivableID !== null) {
          return res.json({
            status: 200,
            responString: "Receivable created/updated",
            data: receivableID,
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update Receivable faild" });
        }
      }
    );
  }
);

function do_create_update_receivable(req, data_id, data_content) {
  console.log("do_create_update_receivable  "+JSON.stringify(data_content))
  return new Promise((onDone) => {
    if (data_content !== null) {
      // handle receivable balance
      const changeItem = {
        id: data_content.debtorID,
        code: data_content.debtorCode,
        type: "receivable",
        change_val: data_content.diffValue,
        itemName: data_content.debtorName,
        phone:data_content.debtorPhone,
      };
      return process_changeReceivableBalanceList("Receivable-Balance", [
        changeItem,
      ]).then((isFinished) => {
        // create receivable record
        const processItem = {
          targetCollection: "Receivable",
          targetID: data_id,
          content: data_content,
        };
        return process_create_edit_itemList(req, [processItem], []).then(
          (createdIDList) => {
            if (createdIDList !== null && createdIDList.length === 1) {
              onDone(createdIDList[0]);
              return null;
            } else {
              onDone(null);
              return null;
            }
          }
        );
      });
    } else {
      onDone("");
    }
  });
}

app.post("/admin/list-receivable", validateAdminFirebaseIdToken, (req, res) => {
    const data_targetCollection = "Receivable";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    if (data_page !== null && data_pageCount !== null) {
      if (searchType) {
        if (searchType === "date") {
          console.log(`Customer list  =====>  req.body.searchKey == 'date'`);
          return get_item_list_byDate(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            data_keyword[0].fromDate,
            data_keyword[0].toDate,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get Receivable list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }else if (searchType === "multi") {
          console.log(
            `Receivable list  =====>  req.body.searchKey == 'multi'  ${JSON.stringify(
              data_keyword[1]
            )}`
          );
          return get_item_list_byMulti(
            data_targetCollection,
            data_page,
            data_pageCount,
            searchKey,
            data_keyword,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get Receivable list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
  
        const keyword = req.body.searchKeyword;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey[0],
          keyword[0],
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get Receivable list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else {
        return get_item_list(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get Receivable list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    }
  
    // if (data_page !== null && data_pageCount !== null)
    // {
    //     return get_item_list(data_targetCollection,data_page, data_pageCount, null, null).then(list => {
    //         return res.json({
    //             status: 200,
    //             responString: ("Get Receivable list success, count: " + data_pageCount + " page: " + data_page),
    //             data: list
    //         });
    //     });
    // }
    else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res.status(400).json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  });

function process_changeReceivableBalanceList(
  data_targetCollection,
  changeList
) {
  return new Promise((onDone) => {
    var newList = changeList;
    if (newList.length !== 0) {
      const changeItem = newList[0];
      // console.log("process_changeReceivableBalanceList changeItem: ", changeItem);

      const ref_collection = admin.firestore().collection(data_targetCollection);
      const current_timestamp = admin.firestore.Timestamp.now();

      const itemID = changeItem.id;
      const changeVal = changeItem.change_val;
      var itemName = changeItem.itemName;
      // console.log("receivable balance changeVal: ", changeVal);
      const itemType = changeItem.type;

      const phone = changeItem.phone;
      const code = changeItem.code;

      return ref_collection
        .doc(itemID)
        .get()
        .then((balanceItem) => {
          // console.log("balanceItem: ", balanceItem);
          var data_to_insert = null;
          var qty = 0;

          if (!balanceItem.exists) {
            qty = parseFloat(changeVal);
            change_data_count(data_targetCollection, +1);
          } else {
            var newQty = balanceItem.data().qty;
            newQty += parseFloat(changeVal);
            qty = newQty;
          }

          data_to_insert = {
            last_update: current_timestamp,
            qty: qty,
            type: itemType,
            itemName: itemName,
            phone:phone,
            code:code,
          };

          console.log("data_to_insert1: ", data_to_insert);

          return ref_collection
            .doc(itemID)
            .set(data_to_insert)
            .then((res) => {
              newList.splice(0, 1);
              if (newList.length > 0) {
                return process_changeReceivableBalanceList(
                  data_targetCollection,
                  newList
                ).then((finish) => {
                  onDone(finish);
                  return null;
                });
              } else {
                onDone(true);
                return null;
              }
            });
        });
    } else {
      onDone(true);
    }
  });
}

app.post(
  "/admin/list-receivable-balance",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Receivable-Balance";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        "last_update",
              "desc",
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get Receivable balance list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

app.post("/admin/del-receivable", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Receivable";
  const data_targetItemList = req.body.itemList;

  if (data_targetItemList !== null) {
    return do_delete_receivableRecordAndUpdateBalance(
      req,
      data_targetItemList,
      []
    ).then((deletedIDList) => {
      if (deletedIDList !== null) {
        return res.json({
          status: 200,
          responString: "Receivable deleted",
          data: { idList: deletedIDList },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "delete Receivable failed" });
      }
    });
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});

function do_delete_receivableRecordAndUpdateBalance(
  req,
  data_targetIDList,
  returnIDList
) {
  return new Promise((onDone) => {
    var newList = data_targetIDList;
    var newReturnIDList = returnIDList;
    if (newList.length !== 0) {
      const itemID = newList[0];
      if (itemID !== "") {
        return do_get_item(itemID, "Receivable").then(
          (snapshoot_receivableData) => {
            if (snapshoot_receivableData.exists)
            {
              const receivableData = snapshoot_receivableData.data();
              // cteate to-process-list
              var toProcessDeleteList = [];
              var toProcessChangeBalanceList = [];
              const item_del = {
                targetCollection: "Receivable",
                targetID: itemID,
              };
              toProcessDeleteList.push(item_del);

              const changeItem = {
                id: receivableData.debtorID,
                type: "receivable",
                change_val:
                  receivableData.type === "-"
                    ? receivableData.amount
                    : -receivableData.amount,
                itemName: receivableData.debtorName,
                phone:receivableData.debtorPhone,
                code:receivableData.debtorCode
              };
              toProcessChangeBalanceList.push(changeItem);

              // handle balance change
              return process_changeReceivableBalanceList(
                "Receivable-Balance",
                toProcessChangeBalanceList
              ).then((isFinished_changeBalance) => {
                if (isFinished_changeBalance) {
                  // handle delete item list
                  return process_delete_itemList(
                    req,
                    toProcessDeleteList,
                    []
                  ).then((deletedIDList) => {
                    if (deletedIDList !== null) {
                      newReturnIDList.push(deletedIDList);
                      newList.splice(0, 1);
                      if (newList.length > 0) {
                        return do_delete_receivableRecordAndUpdateBalance(
                          req,
                          newList,
                          newReturnIDList
                        ).then((idList) => {
                          onDone(idList);
                          return null;
                        });
                      } else {
                        onDone(newReturnIDList);
                        return null;
                      }
                    } else {
                      onDone(null);
                      return null;
                    }
                  });
                } else {
                  onDone(null);
                  return null;
                }
              });
            } else {
              onDone(newReturnIDList);
              return null;
            }
          }
        );
      } else {
        onDone(newReturnIDList);
      }
    } else {
      onDone(returnIDList);
      return null;
    }
  });
}
//-------------------------------------------------------------------------------------------
// COMMISSION
//-------------------------------------------------------------------------------------------

app.post(
  "/admin/create-commission",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_id = req.body.id;
    var data_content = req.body.content;
    // console.log("data_content: ", data_content);
    if (data_content.amount <= 0)
    {
      return res
          .status(400)
          .json({ responString: "Amount can not be 0" });
    }

    // handle expenditure
    const data_expenditureID = req.body.expenditureID;
    const data_expenditureContent = req.body.expenditureContent;
    console.log(
      "data_expenditureID: ",
      data_expenditureID,
      " data_expenditureContent: ",
      data_expenditureContent
    );
    return do_create_update_expenditure(
      req,
      data_expenditureID,
      data_expenditureContent
    ).then((res_expenditure) => {
      const isSuccess = res_expenditure.isSuccess;
      const expenditureID = res_expenditure.id;
      if (isSuccess) {
        // create commission record and balance
        data_content.expenditureID = expenditureID;
        return do_create_update_commission(req, data_id, data_content).then(
          (res_commission) => {
            var isSuccess = res_commission.isSuccess;
            var commissionID = res_commission.id;
            if (isSuccess) {
              return res.json({
                status: 200,
                responString: "Commission created/updated",
                data: { item_id: commissionID },
              });
            } else {
              return res
                .status(400)
                .json({ responString: "Create/update Commission faild" });
            }
          }
        );
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update Commission faild" });
      }
    });
  }
);

function do_create_update_commission(req, data_id, data_content) {
  return new Promise((onDone) => {
    if (data_id === null && data_content.diffValue === 0)
    {
      onDone({isSuccess: true, id: null});
      return null;
    }
    else
    {
      // handle commission balance
      const changeItem = {
        id: data_content.staffID,
        type: "commission",
        change_val: data_content.diffValue,
        itemName: data_content.staffName,
      };

      return process_changeCommissionBalanceList("Commission-Balance", [
        changeItem,
      ]).then((isFinished) => {
        if (isFinished) {
          // create / update commission record
          const processItem = {
            targetCollection: "Commission",
            targetID: data_id,
            content: data_content,
          };
          console.log("do_create_update_commission processItem: ", processItem);
          return process_create_edit_itemList(req, [processItem], []).then(
            (createdIDList) => {
              if (createdIDList !== null && createdIDList.length === 1) {
                onDone({isSuccess: true, id: createdIDList[0]});
                return null;
              } else {
                onDone({isSuccess: false, id: null});
                return null;
              }
            }
          );
        } else {
          onDone({isSuccess: false, id: null});
          return null;
        }
      });
    }
  });
}

function process_changeCommissionBalanceList(
  data_targetCollection,
  changeList
) {
  return new Promise((onDone) => {
    var newList = changeList;
    if (newList.length !== 0) {
      const changeItem = newList[0];
      console.log(
        "process_changeCommissionBalanceList changeItem: ",
        changeItem
      );

      const ref_collection = admin.firestore().collection(data_targetCollection);
      const current_timestamp = admin.firestore.Timestamp.now();

      const itemID = changeItem.id;
      const changeVal = changeItem.change_val;
      var itemName = changeItem.itemName;
      console.log("commission balance changeVal: ", changeVal);
      const itemType = changeItem.type;

      if (itemID !== "") {
        return ref_collection
          .doc(itemID)
          .get()
          .then((balanceItem) => {
            // console.log("balanceItem: ", balanceItem);
            var data_to_insert = null;
            var qty = 0;

            if (!balanceItem.exists) {
              qty = parseFloat(changeVal);
              change_data_count(data_targetCollection, +1);
            } else {
              var newQty = balanceItem.data().qty;
              newQty += parseFloat(changeVal);
              qty = newQty;
            }

            data_to_insert = {
              last_update: current_timestamp,
              qty: qty,
              type: itemType,
              itemName: itemName,
            };

            console.log("data_to_insert1: ", data_to_insert);

            return ref_collection
              .doc(itemID)
              .set(data_to_insert)
              .then((res) => {
                newList.splice(0, 1);
                if (newList.length > 0) {
                  return process_changeCommissionBalanceList(
                    data_targetCollection,
                    newList
                  ).then((finish) => {
                    onDone(finish);
                    return null;
                  });
                } else {
                  onDone(true);
                  return null;
                }
              });
          });
      } else {
        onDone(true);
        return null;
      }
    } else {
      onDone(true);
      return null;
    }
  });
}

app.post("/admin/list-commission", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Commission";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchType = req.body.searchType;
  const searchKey = req.body.searchKey;
  const data_keyword = req.body.searchKeyword;
  const showDeletedData = req.body.showDeletedData
  
  if (data_page !== null && data_pageCount !== null) {
    if (searchType) {
      if (searchType === "date") {
        console.log(
          `Customer list  =====>  req.body.searchKey == 'date' ${data_keyword[0].fromDate}  ${data_keyword[0].toDate}`
        );

        return get_item_list_byDate(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          data_keyword[0].fromDate,
          data_keyword[0].toDate,
          showDeletedData
          
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else if (searchType === "multi") {
        console.log(
          `Customer list  =====>  req.body.searchKey == 'multi'  ${JSON.stringify(
            data_keyword[1]
          )}`
        );
        return get_item_list_byMulti(
          data_targetCollection,
          data_page,
          data_pageCount,
          searchKey,
          data_keyword,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get customer list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }

      // const keyword = req.body.searchKeyword
      return get_item_list_withKeyword(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        searchKey[0],
        data_keyword[0],
        showDeletedData
      ).then((list) => {
        // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
        return res.json({
          status: 200,
          responString:
            "Get customer list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get Commission list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    }
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});

app.post(
  "/admin/list-commission-balance",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Commission-Balance";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              "last_update",
              "desc",
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        "last_update",
              "desc",
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get Commission balance list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

app.post("/admin/del-commission", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Commission";
  const data_targetItemList = req.body.itemList;

  if (data_targetItemList !== null) {
    // cteate to-process-list
    var toProcessDeleteList = [];
    var toProcessChangeBalanceList = [];

    data_targetItemList.map((item, key) => {
      const item_del = {
        targetCollection: data_targetCollection,
        targetID: item.id,
      };
      toProcessDeleteList.push(item_del);

      const changeItem = {
        id: item.staffID,
        type: "commission",
        change_val: item.type === "pay_commission" ? item.amount : -item.amount,
        itemName: item.staffName,
      };
      toProcessChangeBalanceList.push(changeItem);
    });

    return do_deleteCommissionAndBalance(
      req,
      toProcessChangeBalanceList,
      toProcessDeleteList
    ).then((deletedIDList) => {
      if (deletedIDList !== null) {
        return res.json({
          status: 200,
          responString: "Commission deleted",
          data: { idList: deletedIDList },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "delete Commission failed" });
      }
    });
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});

function do_deleteCommissionAndBalance(
  req,
  toProcessChangeBalanceList,
  toProcessDeleteList
) {
  return new Promise((onDone) => {
    // process recover commission balance
    return process_changeCommissionBalanceList(
      "Commission-Balance",
      toProcessChangeBalanceList
    ).then((isFinished) => {
      if (isFinished) {
        // process delete item
        return process_delete_itemList(req, toProcessDeleteList, []).then(
          (deletedIDList) => {
            if (deletedIDList !== null) {
              onDone(deletedIDList);
              return null;
            } else {
              onDone(null);
              return null;
            }
          }
        );
      } else {
        onDone(null);
        return null;
      }
    });
  });
}
//-------------------------------------------------------------------------------------------
// REPORT
//-------------------------------------------------------------------------------------------
app.post(
  "/admin/report-totalSalesAmount",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_date_start = req.body.date_start;
    const data_date_end = req.body.date_end;

    // if (data_page && data_pageCount)
    if (data_date_start !== null && data_date_end !== null) {
      return do_get_list_in_period(
        "Sales",
        "date",
        data_date_start,
        data_date_end,
        "date",
        "asc"
      ).then((dataList) => {
        if (dataList !== null) {
          var totalAmount = 0;
          dataList
            .filter((v) => v.isDeleted !== true)
            .map((i, k) => {
              const amount = i.totalReceive;
              totalAmount += amount;
            });
          return res.json({
            status: 200,
            responString: "Get total sales amount success",
            data: { total: totalAmount },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Get total sales list faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "[data_date_start] or [data_date_end] missing" });
    }
  }
);

app.post(
  "/admin/report-activeCustomerCount",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_date_start = req.body.date_start;
    const data_date_end = req.body.date_end;

    // if (data_page && data_pageCount)
    if (data_date_start !== null && data_date_end !== null) {
      return do_get_list_in_period(
        "Sales",
        "date",
        data_date_start,
        data_date_end,
        "date",
        "asc"
      ).then((dataList) => {
        if (dataList !== null) {
          var customerIDList = [];
          dataList
            .filter((v) => v.isDeleted !== true)
            .map((i, k) => {
              const customerID = i.customerID;
              var isExist = false;
              customerIDList.map((i_c, k_c) => {
                if (i_c === customerID) {
                  isExist = true;
                }
              });

              if (!isExist) {
                customerIDList.push(customerID);
              }
            });

          const totalCustomerCount = customerIDList.length;
          console.log("active customerIDList: ", customerIDList);

          return res.json({
            status: 200,
            responString: "Get total active customer count success",
            data: { total: totalCustomerCount },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Get total sales list faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "[data_date_start] or [data_date_end] missing" });
    }
  }
);

app.post(
  "/admin/report-sales-each-store",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_date_start = req.body.date_start;
    const data_date_end = req.body.date_end;

    // if (data_page && data_pageCount)
    if (data_date_start !== null && data_date_end !== null) {
      return do_get_list_in_period(
        "Sales",
        "date",
        data_date_start,
        data_date_end,
        "date",
        "asc"
      ).then((dataList) => {
        if (dataList !== null) {
          var storeSalesList = [];
          dataList
            .filter((v) => v.isDeleted !== true)
            .map((i, k) => {
              const storeID = i.storeID;
              const storeName = i.storeName;
              const salesAmount = i.totalReceive;
              var isExist = false;

              storeSalesList.map((i_s, k_s) => {
                if (i_s.storeID === storeID) {
                  i_s.total += salesAmount;
                  isExist = true;
                }
              });

              if (!isExist) {
                const item = {
                  storeID: storeID,
                  total: salesAmount,
                  storeName: storeName,
                };
                storeSalesList.push(item);
              }
            });

          return res.json({
            status: 200,
            responString: "Get store total sales success",
            data: { itemList: storeSalesList },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Get store total sales list faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "[data_date_start] or [data_date_end] missing" });
    }
  }
);

function do_get_list_in_period(
  targetCollection,
  targetDateField,
  date_from,
  date_to,
  orderByField,
  orderByVal
) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection(targetCollection);

    return ref_collection
      .where(targetDateField, ">=", date_from)
      .where(targetDateField, "<=", date_to)
      .orderBy(orderByField, orderByVal)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        // return res.json({
        //     status: 200,
        //     responString: "Get item list success",
        //     data: {"data_list":data_list}
        // });
        onDone(data_list);
        return null;
      });
  });
}
app.post(
  "/admin/report-operating",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_date_start = req.body.startDate;
    const data_date_end = req.body.endDate;

    // if (data_page && data_pageCount)
    if (data_date_start !== null && data_date_end !== null) {
      var salesListWithoutDeleted = [];
      var expenditureListWithoutDeleted = [];

      // get sales list
      return get_item_list_inPeriod(
        "Sales",
        data_date_start,
        data_date_end,
        "date",
        "asc"
      ).then((salesList_org) => {
        if (salesList_org !== null) {
          // console.log(
          //   `salesList_org======================.>  ${JSON.stringify(
          //     salesList_org
          //   )}`
          // );
          // remove deleted record
          salesList_org.map((i, k) => {
            if (i.isDeleted !== true) {
              salesListWithoutDeleted.push(i);
            }
          });
          // get expenditure list
          return get_item_list_inPeriod(
            "Expenditure",
            data_date_start,
            data_date_end,
            "date",
            "asc"
          ).then((expenditureList_org) => {
            if (expenditureList_org !== null) {
              // remove deleted record
              expenditureList_org.map((i, k) => {
                if (i.isDeleted !== true) {
                  expenditureListWithoutDeleted.push(i);
                }
              });

              const returnData = {
                sales: salesListWithoutDeleted,
                expenditure: expenditureListWithoutDeleted,
              };

              return res.json({
                status: 200,
                responString: "Get operating data in period success",
                data: returnData,
              });
            } else {
              return res
                .status(400)
                .json({ responString: "Get expenditure list faild" });
            }
          });
        } else {
          return res.status(400).json({ responString: "Get sales list faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "[data_date_start] or [data_date_end] missing" });
    }
  }
);

app.post(
  "/admin/report-operating-by-store",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_date_start = admin.firestore.Timestamp.fromDate(new Date(req.body.startDate));
    const data_date_end =admin.firestore.Timestamp.fromDate(new Date(req.body.endDate));
    const data_storeList = req.body.storeList;
    const startRow = req.body.startRow;
    // if (data_page && data_pageCount)
    if (data_date_start !== null && data_date_end !== null) {
      var salesListWithoutDeleted = [];
      var expenditureListWithoutDeleted = [];
      var storeList = [];
      // const store = ['牛一','觀一','觀二','觀三']
      // console.log("data_storeList  "+JSON.stringify(data_storeList))
      
      
      // get sales list
      return get_report_list_inPeriod(
        "Sales",
        data_date_start,
        data_date_end,
        "createDate",
        "asc",
        startRow,
      ).then((salesList_org) => {
        if (salesList_org !== null) {
          // console.log(`salesList_org =====    ${salesList_org}`)

          // remove deleted record
          salesList_org.map((i, k) => {
            if (i.isDeleted !== true) {
              salesListWithoutDeleted.push(i);
            }
          });
          //sort by store
          salesListWithoutDeleted.map((item) => {
            const store = {
              storeName: item.storeName,
              storeID: item.storeID,
              sales: item,
              expenditureList: [],
            };
            storeList.push(store);
          });
          
          var newObj = {}
          // get expenditure list
          return get_report_list_inPeriod(
            "Expenditure",
            data_date_start,
            data_date_end,
            "createDate",
            "asc",
            startRow
          ).then((expenditureList_org) => {
            // console.log("expenditureList_org  : "+JSON.stringify(expenditureList_org))
            if (expenditureList_org !== null) {
              var expenditureListByStore = [];

              // remove deleted record
              expenditureList_org.map((i, k) => {
                if (i.isDeleted !== true) {
                  expenditureListWithoutDeleted.push(i);
                }
              });

              expenditureListWithoutDeleted.map((item) => {
                storeList.map((store, index) => {
                  // console.log(`store.storeName ${store.storeName}  item.storeName ${item.storeName}`)
                  if (store.storeName === item.storeName) {
                    storeList[index].expenditureList.push(item);
                  }
                });
              });
                          
              // const newList = []
              data_storeList.map(item=>{
              newObj[item.itemName] = null
              var newList = {expenditureList:[],sales:[],storeName:"",storeID:""}
              var newExpenditureList = []
              var newSalesList = []
              storeList.map((i,index) =>{
              
                if (item.itemName == i.storeName){
                  newSalesList.push(i.sales)
                  
                  newExpenditureList = i.expenditureList
                }

              // console.log(`newList =====    ${JSON.stringify(newExpenditureList)}`)
              newList.expenditureList = newExpenditureList
              newList.sales = newSalesList
              newList.storeName = item.itemName
              newList.storeID = item.id
              newObj[item.itemName] = newList
              
            })
            
          })
          
          // console.log(`newObj =====    ${JSON.stringify(newObj)}`)

              const returnData = {
                storeList: [newObj],
              };

              return res.json({
                status: 200,
                responString: "Get operating data in period success",
                data: returnData,
              });
            } else {
              return res
                .status(400)
                .json({ responString: "Get expenditure list faild" });
            }
          });
        } else {
          //No sale but have expenditure case?
          //Should get expenditure? Will the responses become expenditureList response?
          return res.status(400).json({ responString: "Get sales list faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "[data_date_start] or [data_date_end] missing" });
    }
  }
);

app.post(
  "/admin/get-data-by-startRow",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = req.body.targetCollection;
    const data_date_start = admin.firestore.Timestamp.fromDate(new Date(req.body.startDate));
    const data_date_end =admin.firestore.Timestamp.fromDate(new Date(req.body.endDate));
    // const data_storeList = req.body.storeList;
    const startRow = req.body.startRow;
    // if (data_page && data_pageCount)
    if (data_date_start !== null && data_date_end !== null) {
      var salesListWithoutDeleted = [];
      var expenditureListWithoutDeleted = [];
      var storeList = [];
      // const store = ['牛一','觀一','觀二','觀三']
      // console.log("data_storeList  "+JSON.stringify(data_storeList))
      
      
      // get sales list
      return get_report_list_inPeriod(
        data_targetCollection,
        data_date_start,
        data_date_end,
        "createDate",
        "asc",
        startRow,
      ).then((_data) => {
        if (_data !== null) {
          // console.log(`salesList_org =====    ${salesList_org}`)

          // remove deleted record
          // salesList_org.map((i, k) => {
          //   if (i.isDeleted !== true) {
          //     salesListWithoutDeleted.push(i);
          //   }
          // });
          // //sort by store
          // salesListWithoutDeleted.map((item) => {
          //   const store = {
          //     storeName: item.storeName,
          //     storeID: item.storeID,
          //     sales: item,
          //     expenditureList: [],
          //   };
          //   storeList.push(store);
          // });
          
      //     var newObj = {}
      //     // get expenditure list
      //     return get_report_list_inPeriod(
      //       "Expenditure",
      //       data_date_start,
      //       data_date_end,
      //       "createDate",
      //       "asc",
      //       startRow
      //     ).then((expenditureList_org) => {
      //       // console.log("expenditureList_org  : "+JSON.stringify(expenditureList_org))
      //       if (expenditureList_org !== null) {
      //         var expenditureListByStore = [];

      //         // remove deleted record
      //         expenditureList_org.map((i, k) => {
      //           if (i.isDeleted !== true) {
      //             expenditureListWithoutDeleted.push(i);
      //           }
      //         });

      //         expenditureListWithoutDeleted.map((item) => {
      //           storeList.map((store, index) => {
      //             // console.log(`store.storeName ${store.storeName}  item.storeName ${item.storeName}`)
      //             if (store.storeName === item.storeName) {
      //               storeList[index].expenditureList.push(item);
      //             }
      //           });
      //         });
                          
      //         // const newList = []
      //         data_storeList.map(item=>{
      //         newObj[item.itemName] = null
      //         var newList = {expenditureList:[],sales:[],storeName:"",storeID:""}
      //         var newExpenditureList = []
      //         var newSalesList = []
      //         storeList.map((i,index) =>{
              
      //           if (item.itemName == i.storeName){
      //             newSalesList.push(i.sales)
                  
      //             newExpenditureList = i.expenditureList
      //           }

      //         // console.log(`newList =====    ${JSON.stringify(newExpenditureList)}`)
      //         newList.expenditureList = newExpenditureList
      //         newList.sales = newSalesList
      //         newList.storeName = item.itemName
      //         newList.storeID = item.id
      //         newObj[item.itemName] = newList
              
      //       })
            
      //     })
          
      //     // console.log(`newObj =====    ${JSON.stringify(newObj)}`)

      //         const returnData = {
      //           storeList: [newObj],
      //         };

              return res.json({
                status: 200,
                responString: "Get data by row success",
                data: _data,
              });
      //       } else {
      //         return res
      //           .status(400)
      //           .json({ responString: "Get expenditure list faild" });
      //       }
          // });
        } else {
          //No sale but have expenditure case?
          //Should get expenditure? Will the responses become expenditureList response?
          return res.status(400).json({ responString: "Get sales list faild" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ responString: "[data_date_start] or [data_date_end] missing" });
    }
  }
);
//-------------------------------------------------------------------------------------------
// ACTION LOG
//-------------------------------------------------------------------------------------------
function do_create_action_log(req, actionType, actionArea, targetID, extraLog = null) {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).json({ responString: "Unauthorized" });
    return null;
  }

  
  console.log(`extraLog:  ${JSON.stringify(extraLog)}`)
  console.log(`target Id: :+  ${JSON.stringify(targetID)}`)

  return admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedIdToken) => {
      req.user = decodedIdToken;
      const adminID = decodedIdToken.uid;
      console.log("adminID: ", adminID);
      const ref_admin = admin.firestore().collection("Admin").doc(adminID);

      return ref_admin.get().then((snapshot_admins) => {
        if (snapshot_admins.exists) {
          console.log("admin name: " + snapshot_admins.data().itemName);
          const data_content = {
            adminID: adminID,
            adminName: snapshot_admins.data().itemName,
            actionType: actionType,
            actionArea: actionArea,
            targetID: targetID,
            extraLog: extraLog,
          };

          const processItem = {
            targetCollection: "ActionLog",
            targetID: null,
            content: data_content,
          };
          return process_create_edit_itemList(req, [processItem], []).then(
            (createdIDList) => {
              if (createdIDList !== null && createdIDList.length === 1) {
                console.log("[Action Log ID: ", createdIDList, "]");
                // onDone(createdIDList);
                return null;
              } else {
                // onDone(null);
                return null;
              }
            }
          );
        } else {
          console.error("Error while verifying Admin right");
          // onDone(null);
          return null;
        }
      });
    });
}



app.post("/admin/list-log", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "ActionLog";
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  if (data_page !== null && data_pageCount !== null) {
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null
    ).then((list) => {
      const newList = list.data_list.map((i, k) => {
        var newItem = i;
        newItem.createDate = newItem.createDate.toDate();
        return newItem;
      });

      var itemToReturn = list;
      itemToReturn.data_list = newList;

      return res.json({
        status: 200,
        responString:
          "Get action log list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: itemToReturn,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});

//-------------------------------------------------------------------------------------------
// Staff ATTENDANCE
//-------------------------------------------------------------------------------------------
app.post("/staff/phone-check", (req, res) => {
  const data_targetCollection = "Staff";
  const data_staffPhone = req.body.data_phone;

  if (data_staffPhone) {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    return ref_collection
      .where("phone", "==", data_staffPhone)
      .get()
      .then((snapshot_staff) => {
        if (snapshot_staff.size !== 0) {
          return res.json({
            status: 200,
            responString: "phone exist",
            data: { isExist: true },
          });
        } else {
          return res.status(403).json({ responString: "phone not exist" });
        }
      });
  } else {
    return res.status(403).json({ responString: "[data_staffPhone] missing" });
  }
});

app.post("/staff/list-store-all", validateUserFirebaseIdToken, (req, res) => {
  const data_targetCollection = "Store";

  return get_item_list_all(data_targetCollection, null, null).then((list) => {
    return res.json({
      status: 200,
      responString: "Get store list success",
      data: list,
    });
  });
});

app.get(
  "/staff/attendance-get-state",
  validateUserFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Staff";

    let idToken;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // Read the ID Token from the Authorization header.
      idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.cookies) {
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      res.status(403).json({ responString: "Unauthorized" });
      return null;
    }

    return admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedIdToken) => {
        req.user = decodedIdToken;
        const staffID = decodedIdToken.uid;
        const ref_doc = admin.firestore().collection(data_targetCollection).doc(staffID);

        return ref_doc.get().then((snapshop) => {
          if (snapshop.exists) {
            var staffData = snapshop.data();
            if (!staffData.state || staffData.state === "") {
              staffData.state = "off";
            }

            if (staffData.lastDutyChangeTime) {
              staffData.lastDutyChangeTime =
                staffData.lastDutyChangeTime.toDate();
            } else {
              staffData.lastDutyChangeTime = null;
            }

            return res.json({
              status: 200,
              responString: "Get staff state success",
              data: staffData,
            });
          } else {
            return res
              .status(401)
              .json({ responString: "Staff data not found" });
          }
        });
      });
  }
);
app.post(
  "/staff/attendance-change-state",
  validateUserFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "Staff";
    const data_state = req.body.data_state;
    const data_storeID = req.body.data_storeID;
    const data_storeName = req.body.data_storeName;

    // console.log("-------------------------------------");
    // console.log("data_state: ", data_state);
    // console.log("data_storeID: ", data_storeID);
    // console.log("data_storeName: ", data_storeName);
    // console.log("-------------------------------------");

    if (data_state && data_storeID !== null && data_storeName !== null) {
      let idToken;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split("Bearer ")[1];
      } else if (req.cookies) {
        // Read the ID Token from cookie.
        idToken = req.cookies.__session;
      } else {
        // No cookie
        res.status(403).json({ responString: "Unauthorized" });
        return null;
      }

      return admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedIdToken) => {
          req.user = decodedIdToken;
          const staffID = decodedIdToken.uid;

          const ref_collection = admin.firestore().collection(data_targetCollection);
          const current_timestamp = admin.firestore.Timestamp.now();

          return ref_collection
            .doc(staffID)
            .update({
              state: data_state,
              dutyStoreID: data_storeID,
              dutyStoreName: data_storeName,
              lastDutyChangeTime: current_timestamp,
            })
            .then((result) => {
              return res.json({
                status: 200,
                responString: "staff attendance state change success",
                data: { state: data_state },
              });
            });
        });
    } else {
      if (!data_state) {
        return res.status(403).json({ responString: "[data_state] missing" });
      } else if (data_storeID === null) {
        return res.status(403).json({ responString: "[data_storeID] missing" });
      } else if (!data_storeName === null) {
        return res
          .status(403)
          .json({ responString: "[data_storeName] missing" });
      } else {
        return res.status(403).json({ responString: "Invalid data" });
      }
    }
  }
);
//-------------------------------------------------------------------------------------------
app.post("/admin/list-all", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.data_targetCollection;

  // if (data_page && data_pageCount)
  if (data_targetCollection !== null) {
    const ref_collection = admin.firestore().collection(data_targetCollection);
    const ref_collection_deleted = admin.firestore().collection(
      data_targetCollection + "_Deleted"
    );

    console.log("list-all  "+ JSON.stringify(data_targetCollection))
    
    // get current data
    return ref_collection
      .orderBy("createDate", "desc")
      .get()
      .then((snapshot_list) => {

        // const collectionSize = snapshot_list.size;
        // const statsRef = ref_collection.doc('--stats--');
        // const batch = admin.firestore().batch();

        // batch.set(statsRef,{"Count":collectionSize},{merge:true})
        // batch.commit();

        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        // get deleted data
        return ref_collection_deleted
          .orderBy("createDate", "desc")
          .get()
          .then((snapshot_list_deleted) => {
            const data_list_deleted = snapshot_list_deleted.docs.map((doc) => {
              const c = doc.data();
              c.id = doc.id;
              return c;
            });

            // merge

            // return
            return res.json({
              status: 200,
              responString: "Get item list success",
              data: { data_list: [...data_list, ...data_list_deleted] },
            });
          });
      });
  } else {
    return res
      .status(400)
      .json({ responString: "[data_targetCollection] missing" });
  }
});

app.post("/admin/create-item", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.data_targetCollection;
  const data_name = req.body.data_name;
  const data_id = req.body.id;

  if (data_name !== null && data_targetCollection !== null) {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    const current_timestamp = admin.firestore.Timestamp.now();

    const data_extraData = req.body.extra_data;
    var data_to_insert = {
      itemName: data_name,
      last_update: current_timestamp,
    };
    // console.log("data_extraData: ", data_extraData);
    if (data_extraData) {
      // data_extraData.forEach(function (item)
      // {
      //     Object.assign(data_to_insert, item);
      // })
      data_extraData.forEach((item) => {
        Object.assign(data_to_insert, item);
      });
    }

    if (data_id !== null) {
      return ref_collection
        .doc(data_id)
        .set(data_to_insert)
        .then((doc_ref) => {
          // console.log(data_targetCollection, " update success, id: ", res);
          return res.json({
            status: 200,
            responString: "Item updated",
            data: { item_id: data_id },
          });
        });
    } else {
      var itemCreateTime = {
        createDate: current_timestamp,
      };
      Object.assign(data_to_insert, itemCreateTime);

      return ref_collection.add(data_to_insert).then((doc_ref) => {
        // console.log(data_targetCollection, " created success, id: ", doc_ref.id);
        return res.json({
          status: 200,
          responString: "Item created",
          data: { item_id: doc_ref.id },
        });
      });
    }
  } else {
    if (data_name === null) {
      return res.status(400).json({ responString: "[data_name] missing" });
    } else if (data_targetCollection === null) {
      return res
        .status(400)
        .json({ responString: "[data_targetCollection] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid data" });
    }
  }
});

app.post("/admin/del-item", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.data_targetCollection;
  const data_targetIDList = req.body.idList;

  if (data_targetIDList !== null && data_targetCollection !== null) {
    return process_delete_itemList(req, data_targetIDList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          return res.json({
            status: 200,
            responString: "Items deleted",
            data: { idList: deletedIDList },
          });
        } else {
          return res.status(400).json({ responString: "delete items failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res
        .status(400)
        .json({ responString: "[data_targetIDList] missing" });
    } else if (data_targetCollection === null) {
      return res
        .status(400)
        .json({ responString: "[data_targetCollection] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid data" });
    }
  }
});

app.post("/admin/get-item", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.data_targetCollection;
  const data_targetID = req.body.targetID;

  if (data_targetCollection !== null && data_targetID !== null) {
    return do_get_item(data_targetID, data_targetCollection).then(
      (snapshot_record) => {
        if (snapshot_record !== null) {
          return res.json({
            status: 200,
            responString: "Get item data success",
            data: snapshot_record.data(),
          });
        } else {
          return res.status(400).json({ responString: "Get item data faild" });
        }
      }
    );
  } else {
    if (data_targetID === null) {
      return res.status(400).json({ responString: "[data_targetID] missing" });
    } else if (data_targetCollection === null) {
      return res
        .status(400)
        .json({ responString: "[data_targetCollection] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid data" });
    }
  }
});

function do_get_item(data_itemID, data_targetCollection) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore()
      .collection(data_targetCollection)
      .doc(data_itemID);
    return ref_collection.get().then((snapshot_item) => {
      onDone(snapshot_item);
      return null;
    });
  });
}

app.post("/admin/list-item", validateAdminFirebaseIdToken, (req, res) => {
  console.log("req.body: ", req.body);
  const data_targetCollection = req.body.data_targetCollection;
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;

  // if (data_page && data_pageCount)
  if (data_targetCollection !== null) {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    return ref_collection.get().then((snapshot_list) => {
      const data_list = snapshot_list.docs.map((doc) => {
        const c = doc.data();
        c.id = doc.id;
        return c;
      });

      return res.json({
        status: 200,
        responString: "Get item list success",
        data: data_list,
      });
    });
  } else {
    return res
      .status(400)
      .json({ responString: "[data_targetCollection] missing" });
  }
});

//-------------------------------------------------------------------------------------------

app.post("/admin/edit-balance", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.data_targetCollection;
  const changeList = req.body.changeList;

  if (changeList !== null && data_targetCollection !== null) {
    return process_changeBalanceList(data_targetCollection, changeList).then(
      (isDone) => {
        if (isDone) {
          return res.json({
            status: 200,
            responString: "Balance updated",
            data: null,
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Balance update failed" });
        }
      }
    );
  } else {
    if (changeList === null) {
      return res.status(400).json({ responString: "[changeList] missing" });
    } else if (data_targetCollection === null) {
      return res
        .status(400)
        .json({ responString: "[data_targetCollection] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid data" });
    }
  }
});

function process_changeBalanceList(data_targetCollection, changeList) {
  return new Promise((onDone) => {
    var newList = changeList;
    if (newList.length !== 0) {
      const changeItem = newList[0];
      console.log("process_changeBalanceList changeItem: ", changeItem);

      const ref_collection = admin.firestore().collection(data_targetCollection);
      const current_timestamp = admin.firestore.Timestamp.now();

      const itemID = changeItem.id;
      const changeVal = changeItem.change_val;
      var itemName = changeItem.itemName === null ? "" : changeItem.itemName;
      console.log("changeVal: ", changeVal);
      const itemType = changeItem.type;

      return ref_collection
        .doc(itemID)
        .get()
        .then((balanceItem) => {
          // console.log("balanceItem: ", balanceItem);
          var data_to_insert = null;
          var qty = 0;

          if (!balanceItem.exists) {
            qty = parseFloat(changeVal);
          } else {
            var newQty = balanceItem.data().qty;
            newQty += parseFloat(changeVal);
            qty = newQty;
          }

          data_to_insert = {
            last_update: current_timestamp,
            qty: qty,
            type: itemType,
            itemName: itemName,
          };

          console.log("data_to_insert1: ", data_to_insert);

          return ref_collection
            .doc(itemID)
            .set(data_to_insert)
            .then((res) => {
              newList.splice(0, 1);
              if (newList.length > 0) {
                return process_changeBalanceList(
                  data_targetCollection,
                  newList
                ).then((finish) => {
                  onDone(finish);
                  return null;
                });
              } else {
                onDone(true);
                return null;
              }
            });
        });
    } else {
      onDone(true);
    }
  });
}

app.post(
  "/admin/create-coupon-balance",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const changeList = req.body.changeList;
    const customerID = req.body.customerID;

    // console.log("changeList: ", changeList);
    if (changeList !== null && customerID !== null) {
      // handle deleted coupon balance record
      const data_couponBalanceRecordToDelete =
        req.body.couponBalanceRecordToDelete;
      return process_delete_itemList(
        req,
        data_couponBalanceRecordToDelete,
        []
      ).then((deletedRecordIDList) => {
        if (deletedRecordIDList !== null) {
          // create / update coupon balance on-hand
          return process_changeCouponBalanceList(
            req,
            changeList,
            [],
            customerID
          ).then((couponBalanceIDList) => {
            if (couponBalanceIDList !== null) {
              return res.json({
                status: 200,
                responString: "Coupon Balance updated",
                data: { idList: couponBalanceIDList },
              });
            } else {
              return res
                .status(400)
                .json({ responString: "Coupon balance update failed" });
            }
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Coupon balance update failed" });
        }
      });
    } else {
      if (changeList === null) {
        return res.status(400).json({ responString: "[changeList] missing" });
      } else if (customerID === null) {
        return res.status(400).json({ responString: "[customerID] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid data" });
      }
    }
  }
);

function process_changeCouponBalanceList(
  req,
  changeList,
  returnRecordIDList,
  customerID
) {
  const data_targetCollection = "Coupon-Balance";

  return new Promise((onDone) => {
    var newList = changeList;
    var newRecordIDList = returnRecordIDList;

    if (newList.length !== 0) {
      const changeItem = newList[0];

      const contentToUpdate = changeItem.content;
      const balanceRecordID = changeItem.id;

      // console.log("contentToUpdate:", contentToUpdate);

      const ref_collection = admin.firestore().collection(data_targetCollection);
      const current_timestamp = admin.firestore.Timestamp.now();

      if (balanceRecordID === null && contentToUpdate !== null) {
        contentToUpdate.last_update = current_timestamp;
        // contentToUpdate.itemName = (contentToUpdate.itemName === null) ? "" : contentToUpdate.itemName;
        contentToUpdate.purchase_date = current_timestamp;
        return ref_collection.add(contentToUpdate).then((res) => {
          // add doc ID
          newRecordIDList.push(res.id);

          // create action log
          if (data_targetCollection !== "ActionLog" && req !== null) {
            do_create_action_log(req, "create", data_targetCollection, res.id);
          }

          // remove item from to-process List
          newList.splice(0, 1);
          if (newList.length > 0) {
            return process_changeCouponBalanceList(
              req,
              newList,
              newRecordIDList,
              customerID
            ).then((newIDList) => {
              if (newIDList !== null) {
                onDone(newIDList);
                return null;
              } else {
                onDone(null);
                return null;
              }
            });
          } else {
            onDone(newRecordIDList);
            return null;
          }
        });
      } else if (contentToUpdate !== null) {
        contentToUpdate.last_update = current_timestamp;
        // data_to_insert = contentToUpdate;
        return ref_collection
          .doc(balanceRecordID)
          .update(contentToUpdate)
          .then((res) => {
            // add doc ID
            newRecordIDList.push(balanceRecordID);

            // create action log
          if (data_targetCollection !== "ActionLog" && req !== null) {
            do_create_action_log(req, "edit", data_targetCollection, balanceRecordID, changeItem);
          }

            // remove item from to-process List
            newList.splice(0, 1);
            if (newList.length > 0) {
              return process_changeCouponBalanceList(
                req,
                newList,
                newRecordIDList,
                customerID
              ).then((newIDList) => {
                if (newIDList) {
                  onDone(newIDList);
                  return null;
                } else {
                  onDone(false);
                  return null;
                }
              });
            } else {
              onDone(newRecordIDList);
              return null;
            }
          });
      } else {
        onDone(null);
        return null;
      }
    } else {
      onDone(newRecordIDList);
    }
  });
}

app.post(
  "/admin/get-related-records",
  validateAdminFirebaseIdToken,
  (req, res) => {
    console.log("req.body: ", req.body);
    const data_targetCollection = req.body.data_targetCollection;
    const data_docID = req.body.data_docID;

    // if (data_page && data_pageCount)
    if (
      data_targetCollection !== null &&
      data_docID !== null
    ) {
      const ref_collection = admin.firestore().collection(data_targetCollection).doc(data_docID);

      return ref_collection
        .get()
        .then((snapshot_doc) => {
          var c = null;
          if (snapshot_doc.exists)
          {
            c = snapshot_doc.data();
          }
          
          return res.json({
            status: 200,
            responString: "Get related data success",
            data: c,
          });
        });
    } else {
      if (data_targetCollection === null) {
        return res
          .status(400)
          .json({ responString: "[data_targetCollection] missing" });
      } else if (data_docID === null) {
        return res
          .status(400)
          .json({ responString: "[data_docID] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid data" });
      }
    }
  }
);

app.post(
  "/admin/list-related-records",
  validateAdminFirebaseIdToken,
  (req, res) => {
    console.log("req.body: ", req.body);
    const data_targetCollection = req.body.data_targetCollection;
    const data_relatedIDName = req.body.data_relatedIDName;
    const data_relatedID = req.body.data_relatedID;

    // if (data_page && data_pageCount)
    if (
      data_targetCollection !== null &&
      data_relatedID !== null &&
      data_relatedIDName !== null
    ) {
      return do_get_related_item_list(
        data_targetCollection,
        data_relatedIDName,
        data_relatedID
      ).then((data_list) => {
        if (data_list !== null) {
          return res.json({
            status: 200,
            responString: "Get related list success",
            data: { data_list: data_list },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "List related item list faild" });
        }
      });
    } else {
      if (data_targetCollection === null) {
        return res
          .status(400)
          .json({ responString: "[data_targetCollection] missing" });
      } else if (data_relatedID === null) {
        return res
          .status(400)
          .json({ responString: "[data_relatedID] missing" });
      } else if (data_relatedIDName === null) {
        return res
          .status(400)
          .json({ responString: "[data_relatedIDName] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid data" });
      }
    }
  }
);

function do_get_related_item_list(
  data_targetCollection,
  data_relatedIDName,
  data_relatedID
) {
  return new Promise((onDone) => {
    const ref_collection = admin.firestore().collection(data_targetCollection);

    return ref_collection
      .where(data_relatedIDName, "==", data_relatedID)
      .get()
      .then((snapshot_list) => {
        const data_list = snapshot_list.docs.map((doc) => {
          const c = doc.data();
          c.id = doc.id;
          return c;
        });

        onDone(data_list);
        return null;
      });
  });
}

// app.post('/admin/old_server_migration_couponBalance', validateAdminFirebaseIdToken, (req, res) =>
// {
//     // connect sql admin.firestore()
//     var mysql = require('mysql');
//     var con = mysql.createConnection({
//     host: "localhost",
//     user: "itchi_admin",
//     password: "Itchi2019",
//     database: "satification_migration_test"
//     });
//     con.connect(function(err) {
//         if (err) throw err;
//         console.log("MySQL Connected!");

//         // handle_migration_customer(req, con);
//         handle_migration_couponBalnace(req, con);

//     });

//     return res.json({
//         status: 200,
//         responString: "Migration in API success",
//         data: {}
//     });

// });

//-------------------------------------------------------------------------------------------
// Set Data Management Config
//-------------------------------------------------------------------------------------------

app.post(
  "/admin/create-set-data-management-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SetDataManagementConfig";
    const data_id = req.body.id;
    const data_content = req.body.content;

    const processItem = {
      targetCollection: data_targetCollection,
      targetID: data_id,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          return res.json({
            status: 200,
            responString: "Collection created/updated",
            data: { item_id: createdIDList[0] },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update collection faild" });
        }
      }
    );
  }
);

app.post(
  "/admin/list-set-data-management-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SetDataManagementConfig";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData

    var data_getFullList = false;
    if (req.body.getFullList) {
      data_getFullList = req.body.getFullList;
    }
    if (data_getFullList) {
      return get_item_list_all(data_targetCollection, null, null).then(
        (list) => {
          return res.json({
            status: 200,
            responString: "Get collection list all success",
            data: list,
          });
        }
      );
    } else 
    if (data_page !== null && data_pageCount !== null) {
      if (searchType) {
        console.log('array search  case')
        if (searchType === "date") {
          return get_item_list_byDate(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            data_keyword[0].fromDate,
            data_keyword[0].toDate,
            showDeletedData
          ).then((list) => {
            return res.json({
              status: 200,
              responString:
                "Get staff list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        } else {
          const keyword = req.body.searchKeyword;
          return get_item_list_withKeyword(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            searchKey[0],
            keyword[0],
            showDeletedData
          ).then((list) => {
            // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
            return res.json({
              status: 200,
              responString:
                "Get staff list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
      } else {
        if (req.body.searchKeyword && req.body.searchKey) {
          // console.log('normal search key case')
          const { searchKeyword, searchKey } = req.body;
          return get_item_list_withKeyword(
            data_targetCollection,
            data_page,
            data_pageCount,
            null,
            null,
            searchKey,
            searchKeyword,
            showDeletedData
          ).then((list) => {
            // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
            return res.json({
              status: 200,
              responString:
                "Get customer list success, count: " +
                data_pageCount +
                " page: " +
                data_page,
              data: list,
            });
          });
        }
      }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get collection list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
app.post(
  "/admin/del-set-data-management-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SetDataManagementConfig";
    const data_targetIDList = req.body.idList;

    if (data_targetIDList !== null) {
      // cteate to-process-list
      var toProcessList = [];
      data_targetIDList.map((itemID, key) => {
        const item = {
          targetCollection: data_targetCollection,
          targetID: itemID,
        };
        toProcessList.push(item);
      });

      return process_delete_itemList(req, toProcessList, []).then(
        (deletedIDList) => {
          if (deletedIDList !== null) {
            return res.json({
              status: 200,
              responString: "Collection deleted",
              data: { idList: deletedIDList },
            });
          } else {
            return res
              .status(400)
              .json({ responString: "delete collection failed" });
          }
        }
      );
    } else {
      if (data_targetIDList === null) {
        return res.status(400).json({ responString: "[idList] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

//-------------------------------------------------------------------------------------------
// Set Data Management Type Config
//-------------------------------------------------------------------------------------------

app.post(
  "/admin/create-set-data-management-type-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SetDataManagementTypeConfig";
    const data_id = req.body.id;
    const data_content = req.body.content;

    const processItem = {
      targetCollection: data_targetCollection,
      targetID: data_id,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          return res.json({
            status: 200,
            responString: "Collection created/updated",
            data: { item_id: createdIDList[0] },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update collection faild" });
        }
      }
    );
  }
);

app.post(
  "/admin/list-set-data-management-type-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SetDataManagementTypeConfig";
    const data_page = req.body.page;
    const data_pageCount = req.body.pageCount;
    const searchKey = req.body.searchKey;
    const searchType = req.body.searchType;
    const data_keyword = req.body.searchKeyword;
    const showDeletedData = req.body.showDeletedData
    var data_getFullList = false;

    if (req.body.getFullList) {
      data_getFullList = req.body.getFullList;
    }
    if (data_getFullList) {
      return get_item_list_all(data_targetCollection, null, null).then(
        (list) => {
          return res.json({
            status: 200,
            responString: "Get collection list all success",
            data: list,
          });
        }
      );
    } else 
    
    if (data_page !== null && data_pageCount !== null) {
        if (searchType) {
          console.log('array search  case')
          if (searchType === "date") {
            return get_item_list_byDate(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              data_keyword[0].fromDate,
              data_keyword[0].toDate,
              showDeletedData
            ).then((list) => {
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          } else {
            const keyword = req.body.searchKeyword;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey[0],
              keyword[0],
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get staff list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        } else {
          if (req.body.searchKeyword && req.body.searchKey) {
            // console.log('normal search key case')
            const { searchKeyword, searchKey } = req.body;
            return get_item_list_withKeyword(
              data_targetCollection,
              data_page,
              data_pageCount,
              null,
              null,
              searchKey,
              searchKeyword,
              showDeletedData
            ).then((list) => {
              // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
              return res.json({
                status: 200,
                responString:
                  "Get customer list success, count: " +
                  data_pageCount +
                  " page: " +
                  data_page,
                data: list,
              });
            });
          }
        }

      return get_item_list(
        data_targetCollection,
        data_page,
        data_pageCount,
        null,
        null,
        showDeletedData
      ).then((list) => {
        return res.json({
          status: 200,
          responString:
            "Get collection list success, count: " +
            data_pageCount +
            " page: " +
            data_page,
          data: list,
        });
      });
    } else {
      if (data_page === null) {
        return res.status(400).json({ responString: "[data_page] missing" });
      } else if (data_pageCount === null) {
        return res
          .status(400)
          .json({ responString: "[data_pageCount] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);
app.post(
  "/admin/del-set-data-management-type-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "SetDataManagementTypeConfig";
    const data_targetIDList = req.body.idList;

    if (data_targetIDList !== null) {
      // cteate to-process-list
      var toProcessList = [];
      data_targetIDList.map((itemID, key) => {
        const item = {
          targetCollection: data_targetCollection,
          targetID: itemID,
        };
        toProcessList.push(item);
      });

      return process_delete_itemList(req, toProcessList, []).then(
        (deletedIDList) => {
          if (deletedIDList !== null) {
            return res.json({
              status: 200,
              responString: "Collection deleted",
              data: { idList: deletedIDList },
            });
          } else {
            return res
              .status(400)
              .json({ responString: "delete collection failed" });
          }
        }
      );
    } else {
      if (data_targetIDList === null) {
        return res.status(400).json({ responString: "[idList] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

//-------------------------------------------------------------------------------------------
// CUSTOM API
//-------------------------------------------------------------------------------------------

function do_create_update_firebaseUser(data_id, data_account_email, data_account_password, data_account_phone)
{
  return new Promise((onDone) => {
    // check valid
    var isValidContent = true;
    if (
      (data_account_email !== null && data_account_email === "") ||
      (data_account_password !== null && data_account_password === "")
    )
    {
      isValidContent = false;
    }
    else if (data_account_phone !== null && data_account_phone === "")
    {
      isValidContent = false;
    }

    if (isValidContent)
    {
      // create content
      var userContent = {};
      // fill email if have
      if (
        data_account_email !== null && data_account_email !== "" &&
        data_account_password !== null && data_account_password !== ""
      )
      {
        userContent["email"] = data_account_email;
        userContent["emailVerified"] = true;
        userContent["password"] = data_account_password;
      }
      // fill phone if have
      if (data_account_phone !== null && data_account_phone !== "")
      {
        userContent["phoneNumber"] = "+852" + data_account_phone;
      }


      // handle create new
      if (data_id === null) 
      {
        return admin
          .auth()
          .createUser(userContent)
          .then((userRecord) => {
            const newUserUID = userRecord.uid;
            onDone({
              id: newUserUID, 
              isNew: true
            });
          })
          .catch((error) => {
            console.log("firebase register user faild, ", error);
            // return res.status(400).json({ responString: "Create user faild" });
            onDone(
              {
                id: null, 
                isNew: false
              }
            );
          });
      }
      // handle update info
      else
      {
        return admin
          .auth()
          .updateUser(data_id, userContent)
          .then((userRecord) => {
            const newUserUID = userRecord.uid;
            onDone({
              id: newUserUID, 
              isNew: false
            });
          })
          .catch((error) => {
            console.log("firebase update user faild, ", error);
            onDone({
              id: null, 
              isNew: false
            });
          });
      }
    }
    else
    {
      onDone({
        id: null, 
        isNew: false
      });
    }
  });
}

function do_delete_firebaseUser(data_id)
{
  return new Promise((onDone) => {
    if (data_id !== null) 
    {
      // revoke token

      // delete auth
      return admin
        .auth()
        .deleteUser(data_id)
        .then(() => {
          console.log('Successfully deleted user: ' + data_id);
            onDone(true);

          // revoke token
          // return admin.auth().revokeRefreshTokens(data_id).then(() => {
          //   console.log('Successfully revoke token: ' + data_id);
          //   onDone(true);
          // });
        })
        .catch((error) => {
          console.log('Error deleting user:', error);
          onDone(false);
        });
    }
    else
    {
      console.log("data_id is null");
      onDone(false);
    }
  });
}

app.post("/user/delete-accout", validateUserFirebaseIdToken, (req, res) => {
  const data_uid = req.user.uid;
  if (data_uid && data_uid !== null)
  {
    return do_delete_firebaseUser(data_uid).then((isDeleted) => {
      if (isDeleted)
      {
        return res.json({
          status: 200,
          responString: "User account deleted",
          data: { isDeleted: isDeleted },
        });
      }
      else
      {
        return res.status(400).json({ responString: "delete account faild" });
      }
    });
  }
  else
  {
    return res.status(400).json({ responString: "delete account faild, data_uid missing or null" });
  }
});


app.post("/admin/register-user", validateAdminFirebaseIdToken, (req, res) => {
  const data_id = req.body.id;
  var data_content = req.body.content;
  const data_account_email = data_content.email;
  const data_account_password = data_content.password;
  const data_account_phone = data_content.phone;  

  return do_create_update_firebaseUser(data_id, data_account_email, data_account_password, data_account_phone).then((resObj) => {
    if (resObj != null)
    {
      const newUserUID = resObj.id;
      const isNewCreate = resObj.isNew;
      if (isNewCreate)
      {
        return res.json({
          status: 200,
          responString: "User created",
          data: { uid: newUserUID },
        });
      }
      else
      {
        return res.json({
          status: 200,
          responString: "User updated",
          data: { uid: newUserUID },
        });
      }
    }
    else
    {
      return res.status(400).json({ responString: "Create or update firebase user faild" });
    }
  });

  // // check valid
  // var isValidContent = true;
  // if (
  //   (data_account_email !== null && data_account_email === "") ||
  //   (data_account_password !== null && data_account_password === "")
  // )
  // {
  //   isValidContent = false;
  // }
  // else if (data_account_phone !== null && data_account_phone === "")
  // {
  //   isValidContent = false;
  // }

  // if (isValidContent)
  // {
  //   // create content
  //   var userContent = {};
  //   // fill email if have
  //   if (
  //     data_account_email !== null && data_account_email !== "" &&
  //     data_account_password !== null && data_account_password !== ""
  //   )
  //   {
  //     userContent["email"] = data_account_email;
  //     userContent["emailVerified"] = true;
  //     userContent["password"] = data_account_password;
  //   }
  //   // fill phone if have
  //   if (data_account_phone !== null && data_account_phone !== "")
  //   {
  //     userContent["phoneNumber"] = "+852" + data_account_phone;
  //   }

  //   // handle create new
  //   if (data_id === null) 
  //   {
  //     return admin
  //       .auth()
  //       .createUser(userContent)
  //       .then((userRecord) => {
  //         const newUserUID = userRecord.uid;
  //         return res.json({
  //           status: 200,
  //           responString: "User created",
  //           data: { uid: newUserUID },
  //         });
  //       })
  //       .catch((error) => {
  //         console.log("firebase register user faild, ", error);
  //         return res.status(400).json({ responString: "Create user faild" });
  //       });
  //   }
  //   // handle update info
  //   else
  //   {
  //     return admin
  //       .auth()
  //       .updateUser(data_id, userContent)
  //       .then((userRecord) => {
  //         const newUserUID = userRecord.uid;
  //         return res.json({
  //           status: 200,
  //           responString: "User updated",
  //           data: { uid: newUserUID },
  //         });
  //       })
  //       .catch((error) => {
  //         console.log("firebase update user faild, ", error);
  //         return res.status(400).json({ responString: "Update user faild" });
  //       });
  //   }
  // }
  // else
  // {
  //   return res.status(400).json({ responString: "Content invalid" });
  // }
});

app.post("/admin/create-custom-process", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.collectionName;
  // const data_id = req.body.id;
  // const data_content = req.body.content;
  const data_contentList = req.body.contentList;
  var processItemList = []
  data_contentList.map(item=>{
    const processItem = {
      targetCollection: data_targetCollection,
      targetID: null,
      content: item,
    };
    //push
    processItemList.push(processItem)
  })

  

  return process_create_edit_itemList(req, processItemList, []).then(
    (createdIDList) => {
      console.log("create-custom-process  "+createdIDList.length)
      if (createdIDList !== null) {

        return res.json({
          status: 200,
          responString: "Collection item created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update collection item faild" });
      }
    }
  );
});

app.post("/admin/create-custom", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.collectionName;
  const data_id = req.body.id;
  const data_content = req.body.content;
  // const data_contentList = req.body.contentList;
  // var processItemList = []
  // data_contentList.map(item=>{
  //   
  //   //push
  //   processItemList.push(processItem)
  // })
  const processItem = {
        targetCollection: data_targetCollection,
        targetID: data_id,
        content: data_content,
      };
  return process_create_edit_itemList(req, [processItem], []).then(
    (createdIDList) => {
      if (createdIDList !== null && createdIDList.length === 1) {
        return res.json({
          status: 200,
          responString: "Collection item created/updated",
          data: { item_id: createdIDList[0] },
        });
      } else {
        return res
          .status(400)
          .json({ responString: "Create/update collection item faild" });
      }
    }
  );
});

app.post("/admin/create-custom-multi", validateAdminFirebaseIdToken, (req, res) => {
  // const data_id = req.body.id;
  if (req.body && req.body !== null && req.body.content && req.body.content !== null)
  {
    const data_content = req.body.content;
    const data_targetCollection = req.body.collectionName;
    const data_item_list = data_content.item_list;

    if (data_targetCollection && data_targetCollection !== null && data_item_list && data_item_list !== null)
    {
      var data_itemsToProcess = [];

      data_item_list.forEach(data_item => {
        const data_id = data_item.id;
        const data_itemContent = data_item;

        // create processItem
        const processItem = {
          targetCollection: data_targetCollection,
          targetID: data_id,
          content: data_itemContent,
        };
        // add to array
        data_itemsToProcess.push(processItem);
      });

      return process_create_edit_itemList(req, data_itemsToProcess, []).then(
        (createdIDList) => {
          if (createdIDList !== null && createdIDList.length > 0) {
            return res.json({
              status: 200,
              responString: "Collection item list created/updated",
              data: { item_id: createdIDList },
            });
          } else {
            return res
              .status(400)
              .json({ responString: "Create/update collection item list faild" });
          }
        }
      );
    }
    else
    {
      return res
      .status(400)
      .json({ responString: "collectionName or item_list in content is missing" });
    }
  }
  else
  {
    return res
    .status(400)
    .json({ responString: "body or content in body is missing" });
  }
});

app.post("/admin/list-custom", validateAdminFirebaseIdToken, (req, res) => 
{
  const data_targetCollection = req.body.collectionName;
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;
  const showDeletedData = req.body.showDeletedData;

  const data_orderBy = req.body.orderBy;
  const data_orders = req.body.orders;

  if (data_page !== null && data_pageCount !== null) {
    if (searchType) {
      if (searchType === "date") {
        return get_item_list_byDate(
          data_targetCollection,
          data_page,
          data_pageCount,
          (data_orderBy == undefined) ? null : data_orderBy,
          (data_orders == undefined) ? null : data_orders,
          data_keyword[0].fromDate,
          data_keyword[0].toDate,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else {
        const keyword = req.body.searchKeyword;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          (data_orderBy == undefined) ? null : data_orderBy,
          (data_orders == undefined) ? null : data_orders,
          searchKey[0],
          keyword[0],
          showDeletedData,
          searchType
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    } else {
      if (req.body.searchKeyword && req.body.searchKey) {
        // console.log('normal search key case')
        const { searchKeyword, searchKey } = req.body;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          (data_orderBy == undefined) ? null : data_orderBy,
          (data_orders == undefined) ? null : data_orders,
          searchKey,
          searchKeyword,
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    }
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      (data_orderBy == undefined) ? null : data_orderBy,
      (data_orders == undefined) ? null : data_orders,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get collection item list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }

});

app.post("/admin/del-custom", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = req.body.collectionName;
  const data_targetIDList = req.body.idList;
  const data_toDisableAccountUID = req.body.uidList;

  if (data_targetIDList !== null) {
    // create to-process-list
    var toProcessList = [];
    data_targetIDList.map((itemID, key) => {
      const item = {
        targetCollection: data_targetCollection,
        targetID: itemID,
      };
      toProcessList.push(item);
    });

    return process_delete_itemList(req, toProcessList, []).then(
      (deletedIDList) => {
        if (deletedIDList !== null) {
          if (data_toDisableAccountUID !== null) {
            // process disable account
            return process_disable_uidList(data_toDisableAccountUID, []).then(
              (processedUIDList) => {
                console.log("processedUIDList: " + processedUIDList);
                return res.json({
                  status: 200,
                  responString: "Collection item deleted",
                  data: { idList: deletedIDList },
                });
              }
            );
          } else {
            return res.json({
              status: 200,
              responString: "Collection item deleted",
              data: { idList: deletedIDList },
            });
          }
        } else {
          return res
            .status(400)
            .json({ responString: "delete collection item failed" });
        }
      }
    );
  } else {
    if (data_targetIDList === null) {
      return res.status(400).json({ responString: "[idList] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
});

app.post(
  "/admin/custom-unique-checking",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = req.body.collectionName;
    const data_uniqueFieldList = req.body.content.uniqueFieldList;
    if (data_targetCollection !== null && data_uniqueFieldList !== null) {
      return check_unique_field(
        data_targetCollection,
        data_uniqueFieldList
      ).then((isDuplicate) => {
        console.log("isDuplicate: " + isDuplicate);
        return res.json({
          status: 200,
          responString: "isDuplicate: " + isDuplicate,
          data: !isDuplicate,
        });
      });
    } else {
      if (data_targetCollection === null) {
        return res
          .status(400)
          .json({ responString: "[data_targetCollection] missing" });
      } else if (data_uniqueFieldList === null) {
        return res
          .status(400)
          .json({ responString: "[data_uniqueFieldList] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

app.post('/user/list_data', validateUserFirebaseIdToken, (req, res) => 
{
    const data_targetCollection = req.body.targetCollection;
    const data_targetLangauge = req.body.targetlanguage;

    return get_item_list_all(data_targetCollection, null, null).then(returnItem => {
        var total_list = returnItem.data_list;
        var list_processItems = [];

        // check if contain other colleciton's data
        total_list.map((single_data, single_data_key) => {
            Object.keys(single_data).forEach((fieldKey) => {
                var data_field = single_data[fieldKey];
                if (Array.isArray(data_field))
                {
                    data_field.map((array_item, array_key) => {
                        if (array_item.isRelatedField)
                        {
                            const targetCollection = array_item.targetCollection;
                            const targetID = array_item.targetID;

                            const processItem = {
                                single_data_key: single_data_key,
                                fieldKey: fieldKey,
                                array_key: array_key,
                                targetCollection: targetCollection,
                                targetID: targetID
                            }
                            list_processItems.push(processItem);
                        }
                    });
                }
            });
        });

        // console.log(`list_processItems:  ${JSON.stringify(list_processItems)}`)
        // console.log("list_processItems: " + list_processItems);
        return get_relatedDate(list_processItems, []).then((finishedList) => {
            
            finishedList.forEach(processedItem => {
                // console.log(`processedItem:  ${JSON.stringify(processedItem)}`)
                var single_data = total_list[processedItem.single_data_key];
                var data_field = single_data[processedItem.fieldKey];
                var array_item = data_field[processedItem.array_key];
                total_list[processedItem.single_data_key][processedItem.fieldKey][processedItem.array_key] = processedItem.data;
            });

            return res.json({
                status: 200,
                responString: "Get data list success",
                data: {list: total_list}
            });
        });
        
        
    });
});

function get_relatedDate(list_processItems, list_finished)
{
    return new Promise((onDone) => {
        var newList = list_processItems;
        var newList_finsihed = list_finished;
        if (newList.length > 0)
        {
            const processItem = newList[0];
            // console.log(`processItem:  ${JSON.stringify(processItem)}`)

            var targetData = {};
            const ref = admin.firestore().collection(processItem.targetCollection).doc(processItem.targetID);
            return ref.get().then(doc => {
                if (doc.exists) 
                {
                    targetData = doc.data();
                    targetData.id = processItem.targetID;
                }
                const data = {
                    data: targetData
                }
                targetData = {...data, ...processItem}
                newList_finsihed.push(targetData);

                newList.splice(0, 1);

                if (newList.length > 0){
                    return get_relatedDate(newList, newList_finsihed).then(finalList => {
                        onDone(finalList);
                    });
                }
                else
                {
                    onDone(list_finished);
                    return null;
                }
            });
        }
        else
        {
            onDone(list_finished);
            return null;
        }
    });
}

app.post(
  "/admin/create-collection-version",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "CollectionVersion";
    const data_id = req.body.id;
    const data_content = req.body.content;

    const processItem = {
      targetCollection: data_targetCollection,
      targetID: null,
      content: data_content,
    };
    return process_create_edit_itemList(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          return res.json({
            status: 200,
            responString: "Admin level created/updated",
            data: { item_id: createdIDList[0] },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update admin level faild" });
        }
      }
    );
  }
);

app.post(
  "/admin/sync-collection-count",
  validateAdminFirebaseIdToken,
  (req, res) => {
    // const data_targetCollection = req.body.targetCollection;
    // var collectionNameList = []
    // get_collection_name_list_all().then(data=>{


    // })

    sync_collection_by_name("Commission").then(data=>{
      console.log("sync_collection_by_name Commission Finished")
    })

    // sync_collection_by_name("Sales").then(data=>{

    // })

    // sync_collection_by_name("ActionLog").then(data=>{

    // })

    // Promise.all(markPromises)


    return res.json({
      status: 200,
      responString: "upload-collection-version Finish",
      data: {},
    });
      // });
    
  }
);

 function get_collection_name_list_all() {
  return new Promise((onDone) => {
    // const ref_collection = admin.firestore().collection(data_targetCollection);
    admin.firestore().listCollections().then(snapshot=>{
      
      snapshot.forEach(snaps => {
        // collectionNameList.push(snaps["_queryOptions"].collectionId)
        var collectionName = snaps["_queryOptions"].collectionId;
        const ref_collection = admin.firestore().collection(collectionName);

        ref_collection
        .get()
        .then((snapshot_list) => {
        // snapshot_list.size

        // console.log("data_list: ", data_list);
          // console.log("list count: ", data.count);
          // onDone(snapshot_list.size);
          // return null;
        const statsRef = ref_collection.doc('--stats--');

        statsRef.get().then(snapshot=>{
          if(!snapshot.exists){
            const collectionSize = snapshot_list.size;
            const batch = admin.firestore().batch();
        
            batch.set(statsRef,{"totalCount":collectionSize,"createEditCount":collectionSize},{merge:true})
            batch.commit();
            console.log("BATCHNOTEXIST: "+snaps["_queryOptions"].collectionId+ " "+snapshot_list.size);
          }
        })
        
        // console.log("BATCH WRITE: "+snaps["_queryOptions"].collectionId+ " "+snapshot_list.size); // LIST OF ALL COLLECTIONS
        
      });
        // get_item_list_all(collectionName, null, null).then(
        //   (returnItem) => {
        //     console.log("get-all-collection-name  "+collectionName)
            

        //   }
        // );
      })

      // onDone("");
      // return null;
    })
   

    onDone("");
      return null;
  });
}

function sync_collection_by_name(collectionName) {
  return new Promise((onDone) => {
        const ref_collection = admin.firestore().collection(collectionName);

        ref_collection
        .get()
        .then((snapshot_list) => {
        
        const statsRef = ref_collection.doc('--stats--');

        statsRef.get().then(snapshot=>{
          if(!snapshot.exists){
            const collectionSize = snapshot_list.size;
            const batch = admin.firestore().batch();
        
            batch.set(statsRef,{"totalCount":collectionSize,"createEditCount":collectionSize},{merge:true})
            batch.commit();
            console.log("BATCHNOTEXIST: "+collectionName+ " "+snapshot_list.size);
          }
        })
    })
   

    onDone("");
      return null;
  });
}

app.post(
  "/admin/get_collection_all_count",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = req.body.targetCollection;
    // var collectionNameList = []
    const ref_doc = admin.firestore().collection(data_targetCollection).doc("--stats--");
   
    ref_doc.get().then((snapshop) => {
      if (snapshop.exists) {
        var totalCount = snapshop.data().totalCount; 
        return res.json({
          status: 200,
          responString: "get collection totalCount finish",
          data: totalCount,
        });
      }
    })

    
      // });
    
  }
);

app.post(
  "/admin/get_collection_count",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = req.body.targetCollection;
    // var collectionNameList = []
    const ref_doc = admin.firestore().collection(data_targetCollection);//.doc();
    const data_date_start = admin.firestore.Timestamp.fromDate(new Date(req.body.startDate));
    const data_date_end =admin.firestore.Timestamp.fromDate(new Date(req.body.endDate));
  
    ref_doc
    .where("createDate", ">=", data_date_start)
    .where("createDate", "<=", data_date_end)
    .orderBy("createDate", "asc")
    .get().then((snapshop) => {
      // if (snapshop.exists) {

        var totalCount = snapshop.size; 
        console.log("get_collection_count: "+totalCount)
        return res.json({
          status: 200,
          responString: "get collection totalCount finish",
          data: totalCount,
        });
      // }
    })

    
      // });
    
  }
);

app.post("/admin/create-custom-setting", validateAdminFirebaseIdToken, (req, res) => {
  const data_targetCollection = "CustomSetting";
  const data_id = req.body.id;
  const settingName = req.body.settingName;
  const data_content = req.body.content;
  // const data_contentList = req.body.contentList;
  // var processItemList = []
  // data_contentList.map(item=>{
  //   
  //   //push
  //   processItemList.push(processItem)
  // })
  const targetID = data_id == null ? null:settingName
  const processItem = {
        targetCollection: data_targetCollection,
        targetID: targetID,
        settingName:settingName,
        content: {...data_content,createDate: admin.firestore.Timestamp.now()},
      };

    return process_create_edit_itemList_withoutLog(req, [processItem], []).then(
      (createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {
          return res.json({
            status: 200,
            responString: "Setting item created/updated",
            data: { item_id: createdIDList[0] },
          });
        } else {
          return res
            .status(400)
            .json({ responString: "Create/update Setting item fail" });
        }
      }
    );
  

  
});

app.post(
  "/admin/list-custom-setting",
  validateUserFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "CustomSetting";
    const settingName = req.body.settingName;

    const ref_collection = admin.firestore().collection(data_targetCollection);

    return ref_collection
      .doc(settingName)
      .get()
      .then((snapshot) => {
        const data = snapshot.data();
          // console.log("list-game-pass-rate=======>: ", JSON.stringify(data));
        if (data === null) {
          return res.status(400).json({ responString: "data not found" });
        } else {
          return res.json({
            status: 200,
            responString: "Get data success",
            data: data,
          });

        }

        // SOCKET
        // console.log("list count: ", data.count);
      });
  }
);

app.post(
  "/admin/list-custom-setting-config",
  validateUserFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "CustomSettingConfig";


    // const ref_collection = admin.firestore().collection(data_targetCollection);

    // const data_targetCollection = req.body.collectionName;
  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;
  const showDeletedData = req.body.showDeletedData

  if (data_page !== null && data_pageCount !== null) {
    if (searchType) {
      console.log('array search  case')
      if (searchType === "date") {
        return get_item_list_byDate(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          data_keyword[0].fromDate,
          data_keyword[0].toDate,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else {
        const keyword = req.body.searchKeyword;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey[0],
          keyword[0],
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    } else {
      if (req.body.searchKeyword && req.body.searchKey) {
        // console.log('normal search key case')
        const { searchKeyword, searchKey } = req.body;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey,
          searchKeyword,
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    }
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get collection item list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }

  }
);

app.post(
  "/admin/del-custom-setting-config",
  validateAdminFirebaseIdToken,
  (req, res) => {
    const data_targetCollection = "CustomSettingConfig";
    const data_targetIDList = req.body.idList;

    if (data_targetIDList !== null) {
      // cteate to-process-list
      var toProcessList = [];
      data_targetIDList.map((itemID, key) => {
        const item = {
          targetCollection: data_targetCollection,
          targetID: itemID,
        };
        toProcessList.push(item);
      });

      return process_delete_itemList(req, toProcessList, []).then(
        (deletedIDList) => {
          if (deletedIDList !== null) {
            return res.json({
              status: 200,
              responString: "Collection deleted",
              data: { idList: deletedIDList },
            });
          } else {
            return res
              .status(400)
              .json({ responString: "delete collection failed" });
          }
        }
      );
    } else {
      if (data_targetIDList === null) {
        return res.status(400).json({ responString: "[idList] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  }
);

app.post('/admin/list-segment-chinese', (req, res) => 
  {
    const data_targetCollection = "SegmentRecord";

  const data_page = req.body.page;
  const data_pageCount = req.body.pageCount;
  const searchKey = req.body.searchKey;
  const searchType = req.body.searchType;
  const data_keyword = req.body.searchKeyword;
  const showDeletedData = req.body.showDeletedData

  if (data_page !== null && data_pageCount !== null) {
    if (searchType) {
      console.log('array search  case')
      if (searchType === "date") {
        return get_item_list_byDate(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          data_keyword[0].fromDate,
          data_keyword[0].toDate,
          showDeletedData
        ).then((list) => {
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      } else {
        const keyword = req.body.searchKeyword;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey[0],
          keyword[0],
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    } else {
      if (req.body.searchKeyword && req.body.searchKey) {
        // console.log('normal search key case')
        const { searchKeyword, searchKey } = req.body;
        return get_item_list_withKeyword(
          data_targetCollection,
          data_page,
          data_pageCount,
          null,
          null,
          searchKey,
          searchKeyword,
          showDeletedData
        ).then((list) => {
          // console.log(`Customer list  =====>  ${JSON.stringify(list)}`)
          return res.json({
            status: 200,
            responString:
              "Get custom list success, count: " +
              data_pageCount +
              " page: " +
              data_page,
            data: list,
          });
        });
      }
    }
    return get_item_list(
      data_targetCollection,
      data_page,
      data_pageCount,
      null,
      null,
      showDeletedData
    ).then((list) => {
      return res.json({
        status: 200,
        responString:
          "Get collection item list success, count: " +
          data_pageCount +
          " page: " +
          data_page,
        data: list,
      });
    });
  } else {
    if (data_page === null) {
      return res.status(400).json({ responString: "[data_page] missing" });
    } else if (data_pageCount === null) {
      return res.status(400).json({ responString: "[data_pageCount] missing" });
    } else {
      return res.status(400).json({ responString: "Invalid input data" });
    }
  }
  
    
      
  });


  app.post('/admin/create-segment-chinese', (req, res) => 
{
    const data_id = req.body.id;
    const data_content = req.body.content;


    const processItem = {
      targetCollection: 'SegmentRecord',
      targetID: data_id,
      content: data_content,
    };

    return process_create_edit_itemList_withoutLog(req, [processItem], [])
      .then((createdIDList) => {
        if (createdIDList !== null && createdIDList.length === 1) {

            return res.json({
              status: 200,
              responString: "Collection item created/updated",
              data: {},
            });

        } else {
          return res
            .status(400)
            .json({ responString: "Create/update collection item faild" });
        }
      });
  
    
});

app.post("/admin/del-segment-chinese", (req, res) => {
    const data_targetCollection = "SegmentRecord";
    const data_targetIDList = req.body.idList;
  
    if (data_targetIDList !== null) {
      // cteate to-process-list
      var toProcessList = [];
      data_targetIDList.map((itemID, key) => {
        const item = {
          targetCollection: data_targetCollection,
          targetID: itemID,
        };
        toProcessList.push(item);
      });
  
      return process_delete_itemList(req, toProcessList, []).then(
        (deletedIDList) => {
          if (deletedIDList !== null) {
            return res.json({
              status: 200,
              responString: "Record deleted",
              data: { idList: deletedIDList },
            });
          } else {
            return res
              .status(400)
              .json({ responString: "delete Record failed" });
          }
        }
      );
    } else {
      if (data_targetIDList === null) {
        return res.status(400).json({ responString: "[idList] missing" });
      } else {
        return res.status(400).json({ responString: "Invalid input data" });
      }
    }
  });

  app.post("/admin/export_collection", (req, res) => {
    const target_collection = req.body.target_collection;

    if (target_collection !== null && target_collection !== "")
    {
      return get_item_list_all(target_collection, null, null).then(returnItem => {
        if (returnItem != null)
        {
          const data = returnItem.data_list;
          return res.json({
            status: 200,
            responString: "Get collection success",
            data: data,
          }); 
        }
      });
    }
    else
    {
      return res.status(400).json({ responString: "target_collection missing or empty" });
    }
  });

  app.post("/admin/import_collection", (req, res) => {
    const target_collection = req.body.target_collection;
    const data_collection = req.body.data_collection;

    if (target_collection !== undefined && target_collection !== null && target_collection !== "")
    {
      if (data_collection !== undefined && data_collection !== null && data_collection !== "")
      {
        var array_toProcess = [];
        data_collection.forEach(data => {
          const targetID = data.id;
          const targetCollection = target_collection;
          const content = data;
          const dataItem = {
            targetID: targetID,
            targetCollection: targetCollection,
            content: content
          }
          array_toProcess.push(dataItem);
        });

        console.log("array_toProcess: " + array_toProcess);

        return process_create_edit_itemList_withoutLog(null, array_toProcess, []).then(processedList => {
          if (processedList != null)
          {
            return res.json({
              status: 200,
              responString: "Import collection done",
              data: processedList,
            }); 
          }
          else
          {
            return res.status(400).json({ responString: "Upload collection fail" });
          }
        });
      }
      else
      {
        return res.status(400).json({ responString: "data_collection missing or empty" });
      }
    }
    else
    {
      return res.status(400).json({ responString: "target_collection missing or empty" });
    }
  });

  // app.post('/admin/segment-chinese', (req, res) => 
  // {
      
  //   const targetText = req.body.targetText;
  //   nodejieba.load({dict: './jieba_dict/dict.txt'});

	// 	console.log("segment-chinese  "+JSON.stringify(req.body));
  //       var result = nodejieba.tag(targetText);
  //       console.log(result);
  //             return res.json({
  //                 status: 200,
  //                 responString: "Get product list success",
  //                 data: {result},
  //               });
          
      
  // });
  
  const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };


module.exports = {
  app,
  validateUserFirebaseIdToken,
  validateAdminFirebaseIdToken,
  process_create_edit_itemList_withoutLog,
  process_delete_itemList_withoutLog,
  do_get_related_item_list,
  process_changeCouponBalanceList,
  get_item_list_all,
  get_item_list,
  process_delete_itemList,
  do_create_update_firebaseUser,
  do_delete_firebaseUser,
  initFirebaseAdmin
};
