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

function handleEvent(event) {
  console.log(event);
  var message = 'Please push text message.';
  var userId;

  if (event.type === 'message' && event.message.type === 'text') {
    message = event.message.text;
  }

  // ******************** Firestore
  if (message.match(/気温/) || message.match(/湿度/) || message.match(/体感温度/)) {
    message = 'ストアから情報を取得します。\nお待ちください。';
    userId = event.source.userId;
    db.collection("users").doc(userId).set({
      isWaiting: true
    });
  }
  // ********************

  const echo = { type: 'text', text: message };
  return client.replyMessage(event.replyToken, echo);
}

exports.handler = function echoBot(req, res) {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.status(200).send(`Success: ${result}`))
    .catch(err => res.status(400).send(err.toString()));
};