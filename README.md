1. ### Requirements:
* [Node.js](https://nodejs.org/en/)

2. ### Installation:
* Clone this repo & cd into it <br>
`git clone https://github.com/louis23412/sneaky-ninja.git` <br>
`cd sneaky-ninja`

* Install dependencies <br>
`npm install`

3. ### Configuring variables & running the bot:
* Open __globalProps.json__ & add your account(s) + key(s) <br>
   ##### Single account: <br>
   ```
   "USERLIST" : [
       ["username_here", "KEY_HERE"]
   ]
   ```
   
   ##### Multiple accounts: <br>
   ```
   "USERLIST" : [
       ["username_here", "KEY_HERE"],
       ["username_here", "KEY_HERE"],
       ["username_here", "KEY_HERE"]
   ]
   ```
   
* Change the variables as needed:
   ###### MINVOTINGPOWER -- The minimum voting power to vote
   ###### VOTEWEIGHT -- The base voteweight used to determine the final voteweight
   ###### MINPOSTAGE -- Minimum post/comment age
   ###### MINAVGVALUE -- Minimum average value for the users active  posts
   ###### PROFITMIN -- Minimum profit chance to trigger an inspection (Can be negative value - Example: 0.1 = 10%) 
   ###### MAXVOTERS -- The max voters allowed to trigger a upvote
   ###### MINREP -- Minimum user reputation
   ###### MAXACTIVEPOSTS -- Maximum amount of active posts/comments for the user
   ###### MINAVGCOMMENT -- The minimum average value for the users comments
   ###### COMMENTBUFFER -- Used to determine the final voteweight on a users comment (Example: 0.6 = 60% of the final voteweight)
   ###### ALWAYSON -- true or false, when set to true ALWAYSON voting will be active when above the minimum voting power.
   ###### ALWAYSONMINAVG -- Minimum post value needed for the user to trigger a schedule for inspection
   ###### ALWAYSONVP -- Minimum voting power needed to activate ALWAYSON voting.
   ###### ALWAYSONTIME -- Minimum post age to set the schedule for inspection.
   ###### SPGAINREFRESH -- The amount of blocks to pass before updating the SPGain tracker
   
* Save the config file, then run the bot <br>
   `npm start`
