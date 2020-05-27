const functions = require('firebase-functions');

'use strict';

const line = require('@line/bot-sdk');
const ENV = require('./env.json');

// ******************** Firestore
const admin = require('firebase-admin');
const SERVICE_ACCOUNT = require('./service_account.json');
admin.initializeApp({
  credential: admin.credential.cert(SERVICE_ACCOUNT)
});
const db = admin.firestore();
// ********************

const config = {
  channelAccessToken: ENV.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: ENV.LINE_CHANNEL_SECRET
};
const client = new line.Client(config);

exports.sendParams = functions.region('asia-northeast1').firestore
  .document('users/{userId}')
  .onWrite((change, context) => {
    const userId = context.params.userId;

    if (userId !== '_published') {
      getDoc().then((result) => {
        let pushContent = '気温は ' + result.current.Temperature + ' 度です\n';
        pushContent += '湿度は ' + result.current.Humidity + ' %です\n';
        pushContent += '体感温度は ' + result.current.ApparentTemp + ' 度です\n';
        pushContent += '(subscribed: ' + result.createdAt.toDate() + ')';
        console.log(pushContent);
        const message = {
          type: 'text',
          text: pushContent
        };
        client.pushMessage(userId, message)
          .then(() => { console.log('push OK.'); })
          .catch((err) => { console.log(err); });
      })
    }

    return 0;
  });

function getDoc() {
  return new Promise((resolve) => {
    db.collection("users").doc("_published").get()
      .then(doc => {
        resolve(doc.data());
      })
      .catch(err => { console.log(err); });
  })
}