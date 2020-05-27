import * as functions from 'firebase-functions';
const loggingClient = require('@google-cloud/logging');

// ******************** Firestore
const admin = require('firebase-admin');
import SERVICE_ACCOUNT from './service_account.json';
admin.initializeApp({
  credential: admin.credential.cert(SERVICE_ACCOUNT)
});
const db = admin.firestore();
// ********************

// create the Stackdriver Logging client
const logging = new loggingClient({
  projectId: process.env.GCLOUD_PROJECT,
});

// start cloud function
exports.deviceLog =
  functions.region('asia-northeast1').pubsub.topic('device-logs').onPublish((message) => {
    const log = logging.log('device-logs');
    const metadata = {
      // Set the Cloud IoT Device you are writing a log for
      // you extract the required device info from the PubSub attributes
      resource: {
        type: 'cloudiot_device',
        labels: {
          project_id: message.attributes.projectId,
          device_num_id: message.attributes.deviceNumId,
          device_registry_id: message.attributes.deviceRegistryId,
          location: message.attributes.location,
        }
      },
      labels: {
        // note device_id is not part of the monitored resource, but you can
        // include it as another log label
        device_id: message.attributes.deviceId,
      }
    };

    let logData;
    try {
      logData = message.json;
    } catch (e) {
      return 0;
    }

    // ******************** Firestore
    db.collection("users").doc("_published").set({
      current: logData,
      createdAt: new Date()
    });
    // ********************

    // write the log entry to Stackdriver Logging
    const entry = log.entry(metadata, logData);
    return log.write(entry);
  });