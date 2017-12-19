## What You'll Need
*   A [Slack account](https://slack.com/)
*   A MongoDB, get a free one from [mlab](https://mlab.com/).

## Step 1: Setting up your Slack App
To get started [remix this project](https://glitch.com/edit/#!/remix/SlackBot/38ccccbc-8fb1-4ae5-bf06-b8d67b7dfb6a) to get your own project with a copy of the code. THen on Slack's site, select '[Create New App](https://api.slack.com/apps)' and fill in the details about your Slack bot. You can edit them later, so put in what you can for now. Under 'Redirect URI(s)' add your project publish URL followed by '/auth/grant' - use your publish URL (click 'Show') which has the format 'https://project-name.glitch.me'. So for our example app, the URL is: 'https://slack-bot-persist.glitch.me/auth/grant'. Finish by selecting 'Create App'.

### Add a Slack Bot User
Select 'Bot Users' and add a name you'll use to interact with your bot in Slack. We used 'onboarding' for our example bot.

### Add a Slash Command
Select 'Slash Commands' and create a new command. The example uses the command `/onboarding`, and the request URL is the same project URL you used before: 'https://project-name.glitch.me'.

### Enable the Events API and Verify Your URL endpoint
Go to the 'Event Subscriptions' page. Here you need to enable event subscriptions for your app by toggling the button to 'on'. Then you want to verify your project URL to use those events. Copy and paste your project's published URL into the 'Request URL' box (again it will have the format 'https://project-name.glitch.me'). You should get a verified message, indicating it successfully reached your project.

### Add Event Subscriptions
Now you want to tell Slack which events you'll actually be using for your bot, so it only sends you those ones. In our Onboarding Bot example, we want to respond to user input, like adding stars, reactions, and pins. So back on the Slack 'Event Subscriptions' page, for both 'Bot Events' and 'Team Events', add 'pin_added', 'reaction_added' and 'star_added' events. Click 'Save Changes' to finish.

## Step 2: Copy Across the Slack Tokens
Now go to the 'App Credentials' page. You want to copy these details into your project `.env` file. This is a file that securely stores your app credentials. There are entries for `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`. Copy and paste the entries from the App Credentials page for Client ID and Client Secret against the variable names.

## Step 3: Add Your Database Credentials
The example app connects to a MongoDB instance for storing data. We use environment variables in the .env file to store the elements required to construct the database URL. The URL has the format mongodb://dbuser:dbpassword@host:port/dbname, so there are entries for `USER`, `PASS`, `HOST`, `DB_PORT`, `DB` and `COLLECTION` that you need to provide values for. If you create a database and a collection in mlab, then these details are shown at the top of the page. That's all of the setup required to get the bot working.

So now you can add the bot to your Slack instance. You need Admin rights in Slack to do this, but whilst you're testing things out, it's a good idea to create your own test Team in Slack to try things out. That way you can make sure your bot is working before you share it with your colleagues. The example project adds an ['Add to Slack' button](https://api.slack.com/docs/slack-button) to your root published project URL (click 'Show') e.g. [https://slack-bot-persist.glitch.me/](https://slack-bot-persist.glitch.me/). This sets up the Slack [OAuth scopes](https://api.slack.com/docs/oauth-scopes) you need for the Onboarding Example bot by default, but you can change them by editing the values in the `add_to_slack` variable in the `tinyspeck.js` file in your project.

## Testing Your Bot
Your bot should now be up and running and able to respond to actions you make in Slack. To try it out, try typing a direct message to the onboarding bot, and add an emoji reaction to that message. It should respond with some text explaining how to undertake key actions in Slack with the Emoji reaction action marked done. Similarly, if you type the slash command `/onboarding`, you'll get the current onboarding status back.


## Getting Help
You can see other example projects on our [Community Projects](https://glitch.com/) page. And if you get stuck, let us know on the [forum](http://support.glitch.com/) and we can help you out.