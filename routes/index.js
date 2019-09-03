const express = require('express');
const router = express.Router();

const {
  WebClient
} = require('@slack/web-api');
const bot_token = process.env.SLACK_API_TOKEN
const user_token = process.env.SLACK_API_USER_TOKEN
const web = new WebClient(user_token);

function compareValues(key, order='asc') {
  return function(a, b) {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = (typeof a[key] === 'string') ?
      a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string') ?
      b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order == 'desc') ? (comparison * -1) : comparison
    );
  };
}

router.get('/', (req, res) => {
  (async () => {
    const video_hosting_array = ['https://youtu', 'https://www.youtube', 'bandcamp.com', 'https://vimeo.com']
    var response;
    var matches;
    var results = [];

    for (const host of video_hosting_array) {
      response = await web.search.messages({
        query: host + ' in:#friday-question'
      });

      for (const result of response['messages']['matches']) {
        for (const attachment of result['attachments']) {
          var video_html;

          if (attachment['service_name'] == 'YouTube' || attachment['service_name'] == 'Vimeo') {
            video_html = attachment['video_html'];
          } else {
            video_html = attachment['audio_html']; //bandcamp
          }

          let video = {
            "username": '@' + result['username'],
            "date": new Date(result['ts'] * 1000),
            "title": attachment['title'],
            "title_link": attachment['title_link'],
            "video_html": video_html.replace("autoplay=1", "autoplay=0&rel=0")
          }

          results = results.concat(video);
        }
      }
    }

    sorted_results = results.sort(compareValues('date'));

    res.render('index', {
      results: sorted_results
    })
  })();
});

module.exports = router;
