// 1. This implements most of the code, watching for slash commands, sets up event handling for various scenarios:
//   a) /fqscores  =  display the table
//   b) /fqscores @user number - updates the db table adding the number to the users existing score or adding the user
//    if they don't already exist
//   c) /fqscores @user :emoji: - updates the db table adding the emoji to the users existing emoji array or adding the user
//    if they don't already exist
// 2) any other command gives the user an error
// 3) running the command in any channel other than #friday-question gives the user an error
"use strict";

require('newrelic');

const ts = require('./src/tinyspeck.js'),
  users = {},
  datastore = require("./src/datastore.js").async,
  RtmClient = require('@slack/client').RTMClient;

const {
  WebClient
} = require('@slack/web-api');
const bot_token = process.env.SLACK_API_TOKEN
const user_token = process.env.SLACK_API_USER_TOKEN
const web = new WebClient(user_token);

require('dotenv').config();

var slack = ts.instance({});
var connected = false;
var connected_videos = false;
var message;

var twss = require('./src/twss.js');

// receive the /fqscores command and process it
slack.on('/fqscores', payload => {
  console.log("Received /fqscores slash command from user " + payload.user_id);

  // get all the data items we're interested - username, points, emoji, comments
  let channel = payload.channel_name;
  let channel_id = payload.channel_id;
  let user_id = payload.user_id;
  let user_name = payload.user_name;
  let response_url = payload.response_url;

  let text = payload.text;
  let splitText = text.split(" ");
  let userAwardedPoints = splitText[0].toLowerCase();
  let pointsAwarded = splitText[1];
  let comment = '';

  for (var i = 2; i < splitText.length; i++) {
    comment = comment + ' ' + splitText[i];
  }

  if (channel === "friday-question") {
    if (userAwardedPoints === '') {
      console.log("displaying table");
      getConnected() // make sure we have a database connection
        .then(function() {
          datastore.getAll(function(result) {
            let message = getResults(result, user_name);
            slack.send(response_url, message).then(res => { // on success
              console.log("Response sent to /fqscores slash command");
            }, reason => { // on failure
              console.log("An error occurred when responding to /fqscores slash command: " + reason);
            });
          });
        });
    } else if (typeof(pointsAwarded) == "string" && pointsAwarded.charAt(0) == ':' && pointsAwarded.charAt(pointsAwarded.length - 1) == ':') {
      console.log("adding emoji");

      let message = Object.assign({
        "response_type": "in_channel",
        text: userAwardedPoints + " has been awarded a " + pointsAwarded + " by @" + payload.user_name + comment
      });

      console.log("message: " + message);

      getConnected()
        .then(function() {

          datastore.setEmoji(userAwardedPoints, pointsAwarded);

          datastore.get(userAwardedPoints)
            .catch(function(e) {
              if (e.type = "DatastoreDataParsingException") {
                datastore.setScore(userAwardedPoints, 0);
              }
            });

          slack.send(response_url, message).then(res => {
            console.log("Response sent to /fqscores slash command");
          }, reason => {
            console.log("An error occurred when responding to /fqscores slash command: " + reason);
          });
        });
    } else if (isNaN(pointsAwarded) == false) {
      console.log("updating points for user");

      getConnected()
        .then(function() {
          datastore.get(userAwardedPoints)
            .then(function(score) {
              let message = Object.assign({
                "response_type": "in_channel",
                text: userAwardedPoints + " has been awarded " + Number(pointsAwarded).toLocaleString() + " points by @" + payload.user_name + comment
              });

              console.log("message: " + message);

              let newScore = Number(score) + Number(pointsAwarded);

              datastore.setScore(userAwardedPoints, newScore);

              slack.send(response_url, message).then(res => {
                console.log("Response sent to /fqscores slash command");
              }, reason => {
                console.log("An error occurred when responding to /fqscores slash command: " + reason);
              });
            });
        });
    } else {
      console.log("invalid instruction");

      let message = Object.assign({
        text: "Sorry. That's not a valid instruction. Try a little harder next time. (That's what she said.)"
      });

      slack.send(response_url, message).then(res => {
        console.log("Response sent to /fqscores slash command");
      }, reason => {
        console.log("An error occurred when responding to /fqscores slash command: " + reason);
      });
    }

  } else {
    if (userAwardedPoints === 'fetch_videos') {
      (async () => {

        const video_hosting_array = ['https://youtu', 'https://www.youtube', 'bandcamp.com', 'https://vimeo.com']

        for (const host of video_hosting_array) {
          const res = await web.search.messages({
            query: host + ' in:#friday-question'
          });

          var results = res['messages']['matches']

          console.log(JSON.stringify(results));

          getConnectedVideos()
            .then(function() {
              for (const result of results) {
                for (const attachment of result['attachments']) {
                  var video_html;

                  if (attachment['service_name'] == 'YouTube' || attachment['service_name'] == 'Vimeo') {
                    video_html = attachment['video_html'];
                  } else {
                    video_html = attachment['audio_html']; //bandcamp
                  }

                  let video = {
                    "username": result['username'],
                    "date_time": Date(result['ts'] * 1000),
                    "title": attachment['title'],
                    "title_link": attachment['title_link'],
                    "video_html": video_html
                  }
                  console.log(video);

                  datastore.setVideo(video);
                }
              }
            });
        }
      })();
    }

    let message = Object.assign({
      text: "This command only works in the #friday-question channel. If you would like to know more, come and talk to us. We're a friendly bunch."
    });

    slack.send(response_url, message).then(res => {
      console.log("Response sent to /fqscores slash command");
    }, reason => {
      console.log("An error occurred when responding to /fqscores slash command: " + reason);
    });

    console.log("not fq");
  }
});

function getResults(result, user_name) {
  var resultText = "*The Friday Question Scores, as requested by @" + user_name + ":*\n";

  for (var i = 0; i < result.length; i++) {
    var obj = result[i];
    resultText = resultText + (i + 1) + ". " + obj.name + ": " + Number(obj.score).toLocaleString();

    if (typeof(obj.emojis) != "undefined") {
      resultText = resultText + " and";
      for (var j = 0; j < obj.emojis.length; j++) {
        resultText = resultText + " " + obj.emojis[j];
      }
    }

    resultText = resultText + "\n";
  }

  return Object.assign({
    "response_type": "in_channel",
    text: resultText
  });
}

function getConnected() {
  return new Promise(function(resolving) {
    if (!connected) {
      connected = datastore.connect().then(function() {
        resolving();
      });
    } else {
      resolving();
    }
  });
}

function getConnectedVideos() {
  return new Promise(function(resolving) {
    if (!connected_videos) {
      connected_videos = datastore.connectVideos().then(function() {
        resolving();
      });
    } else {
      resolving();
    }
  });
}

let rtm = new RtmClient(bot_token, {
  logLevel: 'error',
  useRtmConnect: true,
  dataStore: false,
  autoReconnect: true,
  autoMark: true
});

rtm.start();

rtm.on('connected', () => {
  console.log('Connected!');
});

rtm.on('connected_videos', () => {
  console.log('Connected to videos!');
});

rtm.on('message', (message) => {
  let channel = message.channel;
  let text = message.text;
  let user = message.user;
  let type = message.type;
  let subtype = message.subtype;
  let thread_ts = message.thread_ts;
  let ts = message.ts;

  if (typeof(user) != "undefined") { // ignore bot messages

    console.log(">>>> channel: " + channel);

    twss.threshold = 0.8;
    let isTwss = twss.is(text);
    let prob = twss.prob(text);

    console.log("twss: " + prob);

    if (isTwss) {
      rtm.addOutgoingEvent(true,
          "message", {
            text: ":twss:",
            channel: channel,
            thread_ts: ts
          })
        .then(res => console.log(`Message sent: ${res}`))
        .catch(console.error);
    }

    // is it a video?
    if (text.includes('https://youtu') || text.includes('https://www.youtube') || text.includes('bandcamp.com') || text.includes('https://vimeo.com')) {
      setTimeout(function() {
        (async () => {
          ;
          let result = await web.conversations.history({
            channel: channel,
            latest: ts,
            oldest: ts,
            inclusive: true
          });

          var attachments = result['messages'][0]['attachments']

          for (const attachment of attachments) {

            var video_html;

            if (attachment['service_name'] == 'YouTube' || attachment['service_name'] == 'Vimeo') {
              video_html = attachment['video_html'];
            } else {
              video_html = attachment['audio_html']; //bandcamp
            }

            let video = {
              "username": user,
              "date_time": Date(ts * 1000),
              "title": attachment['title'],
              "title_link": attachment['title_link'],
              "video_html": video_html
            }
            console.log(video);

            getConnectedVideos()
              .then(function() {
                datastore.setVideo(video);
                console.log('video added to datbase')
              });
          }
        })();
      }, 2000);
    }
  }
});

// incoming http requests
slack.listen(process.env.PORT || '3000');
