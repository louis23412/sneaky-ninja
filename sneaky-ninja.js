const steem = require('steem')
var dsteem = require('dsteem')
const fs = require('fs');
const es = require('event-stream')
const util = require('util')

const client = new dsteem.Client('https://api.steemit.com')
const rcapi = new dsteem.RCAPI(client)
const stream = client.blockchain.getBlockStream()

const globalPropsFile = fs.readFileSync('./globalProps.json')
const globalProps = JSON.parse(globalPropsFile);
const {
    USERNAME,
    MINVOTINGPOWER,
    VOTEWEIGHT,
    KEY,
    MINPOSTAGE,
    MINAVGVALUE,
    PROFITMIN,
    MAXVOTERS, 
    MINREP, 
    MAXACTIVEPOSTS
} = globalProps;

//Helper functions:
// ---------------------------------
const round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

const asc = arr => arr.sort((a, b) => a - b);
const Quartile = (arr, q) => {
    const sorted = asc(arr);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
// ----------------------------------
const startTime = new Date()

//Main function:
async function mainBot() {
    let tracker = []
    let counter = 0
    let votes = 0

    stream.pipe(es.map(async function(block, callback) {
        const votingData = await rcapi.getVPMana(USERNAME)
        const votingPower = votingData.percentage / 100

        callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')
        const data = block.transactions

        counter += 1
        console.log(`Run-time (\x1b[33m${round((new Date() - startTime) / 1000 / 60, 2)}mins\x1b[0m) ==> Data block #: \x1b[33m${counter}\x1b[0m | Pending inspections: \x1b[33m${tracker.length}\x1b[0m`)
        console.log(`Current-VP: \x1b[33m${votingPower}%\x1b[0m | Min-VP: \x1b[33m${MINVOTINGPOWER}%\x1b[0m | Vote Weight: \x1b[33m${VOTEWEIGHT / 100}%\x1b[0m | Votes logged: \x1b[33m${votes}\x1b[0m`)
        console.log(`---------------------`)
    
        data.forEach(async trans => {
            const operations = trans.operations
            const typeOf = operations[0][0]
            const operationDetails = operations[0][1]
    
            if (typeOf === 'comment' && operationDetails.parent_author === '' && !tracker.includes(operationDetails.author)) {
                const author = operationDetails.author
                const parentPermLink = operationDetails.parent_permlink
                const permlink = operationDetails.permlink
                const link = `https://steemit.com/${parentPermLink}/@${author}/${permlink}`

                const postData = await client.database.getState(`/${parentPermLink}/@${author}/${permlink}`)
                const postDetails = Object.values(postData.content)[0]
                const postCreateDate = Date.parse(new Date(postDetails.created).toISOString())

                const nowTime = new Date();
                const minuteDiff = ((nowTime - postCreateDate) / 1000 / 60) - 120

                const authorState = await client.database.getState(`/@${author}`)
                const authorDetails = Object.values(authorState.accounts)[0]
                const authorRep = steem.formatter.reputation(authorDetails.reputation)
                const authorContent = Object.values(authorState.content)

                let postCount = 0
                let totalPostValue = 0
                let valueData = [];

                authorContent.forEach(authorPost => {
                    const postValue = Number(authorPost.pending_payout_value.replace(' SBD', ''))
                    const didPayout = Number(authorPost.total_payout_value.replace(' SBD', ''))

                    if (authorPost.author === author && didPayout === 0) {
                        postCount += 1
                        totalPostValue += postValue
                        valueData.push(postValue)
                    }
                })

                let avgValue = totalPostValue / postCount
                if (isNaN(avgValue)) {
                    avgValue = 0.000
                }

                const q1 = Quartile(valueData, 0.25);
                const q2 = Quartile(valueData, 0.5);
                const q3 = Quartile(valueData, 0.75);
                const diff = ((q1 + q2 + q3) / 3) - avgValue
                let percentile = round((diff / avgValue) * 100, 3)
                if (isNaN(percentile)) {
                    percentile = 0;
                }

                if (authorRep >= MINREP && postCount <= MAXACTIVEPOSTS && avgValue >= MINAVGVALUE && minuteDiff < MINPOSTAGE && percentile >= PROFITMIN && votingPower >= MINVOTINGPOWER) {
                    tracker.push(author)
                    console.log(`In block: \x1b[33m${counter}\x1b[0m | Match #: \x1b[33m${tracker.length}\x1b[0m`)
                    console.log(`POST AGE: \x1b[33m${round(minuteDiff, 2)}\x1b[0m mins`)
                    console.log(`AUTHOR: \x1b[33m${author}\x1b[0m -- REP: \x1b[33m${authorRep}\x1b[0m -- POST-COUNT: \x1b[33m${postCount}\x1b[0m -- AVG-VALUE: \x1b[33m${round(avgValue, 3)}\x1b[0m -- PROFIT-CHANCE: \x1b[33m${percentile}%\x1b[0m`)
                    console.log(`LINK: \x1b[33m${link}\x1b[0m`)

                    const scheduleTime = (240000 - ((minuteDiff * 60) * 1000)) + getRandomArbitrary(10000, 40000) 

                    let schedule = new Promise((resolve, reject) => {
                        setTimeout( async function() {
                            const index = tracker.indexOf(author)
                            if (index > -1) {
                                tracker.splice(index, 1);
                            }
                            const newPostData = await client.database.getState(`/${parentPermLink}/@${author}/${permlink}`)
                            const newPostDetails = Object.values(newPostData.content)[0]
                            const newPostCreateDate = Date.parse(new Date(newPostDetails.created).toISOString())
                            
                            const newNowTime = new Date();
                            const newMinuteDiff = ((newNowTime - newPostCreateDate) / 1000 / 60) - 120

                            const postValue = Number(newPostDetails.pending_payout_value.replace(' SBD', ''))
                            const totalVoters = newPostDetails.active_votes.length

                            console.log(`Inspection time for \x1b[33m@${author}!\x1b[0m`)
                            console.log(`POST-AGE: \x1b[33m${round(newMinuteDiff, 2)}\x1b[0m -- VALUE: \x1b[33m${postValue}\x1b[0m -- VOTERS: \x1b[33m${totalVoters}\x1b[0m`)

                            if (totalVoters <= MAXVOTERS && (postValue / avgValue) <= 0.10) {
                                const linkList = link.split('/')
                                const postPerm = linkList[linkList.length -1]
                                console.log(`\x1b[32mVOTE OPPORTUNITY DETECTED! Broadcasting now...\x1b[0m`)
                                console.log(`---------------------`)

            
                                const wif = steem.auth.toWif(USERNAME, KEY, 'posting');
                                steem.broadcast.vote(wif, USERNAME, author, postPerm, VOTEWEIGHT, function(err, result) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        votes += 1
                                        console.log('\x1b[32mVote Success!\x1b[0m');
                                        fs.appendFileSync('./log.txt', `\nAUTHOR: ${author} -- LINK: ${link} -- DATE: ${new Date()} -- VOTED AFTER: ${newMinuteDiff} mins\n---------------------------`)
                                    }
                                });
                            } else {
                                console.log(`\x1b[31mNot profitable to vote!\x1b[0m`)
                                console.log(`---------------------`)
                            }

                        }, scheduleTime)
                    })
                    console.log(`Scheduled inspection for \x1b[33m${round(scheduleTime / 1000, 2)}secs\x1b[0m from now...`)
                    console.log(`---------------------`)
                }
            }
        })
    
    }))
    // .pipe(process.stdout)
}

mainBot()