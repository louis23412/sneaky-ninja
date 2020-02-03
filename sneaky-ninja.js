const steem = require('steem')
var dsteem = require('dsteem')
const fs = require('fs');
const es = require('event-stream')
const util = require('util')

const client = new dsteem.Client('https://api.steemit.com')
const rcapi = new dsteem.RCAPI(client)
const stream = client.blockchain.getBlockStream('Latest')

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
// ----------------------------------
const startTime = new Date()

//Main function:
async function mainBot() {
    let tracker = []
    let votes = 0
    let fr_votes = 0
    let inspections = 0
    let errors = 0
    let fr_errors = 0
    let frontRuns = 0

    stream.pipe(es.map(async function(block, callback) {
        let votingData = await rcapi.getVPMana(USERNAME)
        let votingPower = votingData.percentage / 100

        let voteStatus = `\x1b[31mRecharging Steem Power...\x1b[0m`
        if (votingPower >= MINVOTINGPOWER) {
            voteStatus = '\x1b[32mOnline!\x1b[0m'
        }

        const displayTracker = tracker.map(user => {
            return `\x1b[33m@${user}\x1b[0m`
        })

        callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')
        const data = block.transactions
        const blockId = block.block_id

        console.log(`Run-time: \x1b[33m${round((new Date() - startTime) / 1000 / 60, 2)}mins\x1b[0m | Block-ID: \x1b[33m${blockId}\x1b[0m`)
        console.log(`Status: ${voteStatus} | Votes logged: \x1b[33m${votes}\x1b[0m | Vote fails logged: \x1b[33m${errors}\x1b[0m`)
        console.log(`Completed-Inspections: \x1b[33m${inspections}\x1b[0m | Pending inspections: \x1b[33m${tracker.length}\x1b[0m ==> [ ${  displayTracker} ]`)
        console.log(`Front-Runs Detected: \x1b[33m${frontRuns}\x1b[0m | Front-Runs Voted: \x1b[33m${fr_votes}\x1b[0m | Front-Runs Vote Fails: \x1b[33m${fr_errors}\x1b[0m`)
        console.log(`Current-VP: \x1b[33m${votingPower}%\x1b[0m | Min-VP: \x1b[33m${MINVOTINGPOWER}%\x1b[0m | Vote Weight: \x1b[33m${VOTEWEIGHT / 100}%\x1b[0m`)
        console.log('\x1b[33m-----------------------------------\x1b[0m')
    
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
                const currentVoters = postDetails.active_votes.length

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

                //&& minuteDiff < MINPOSTAGE
                if (authorRep >= MINREP && postCount <= MAXACTIVEPOSTS
                    && avgValue >= MINAVGVALUE && percentile >= PROFITMIN && votingPower >= MINVOTINGPOWER 
                    && currentVoters <= MAXVOTERS ) {
                    tracker.push(author)
                    console.log(`In block: \x1b[33m${blockId}\x1b[0m | Match #: \x1b[33m${tracker.length}\x1b[0m`)
                    console.log(`Post age: \x1b[33m${round(minuteDiff, 2)}\x1b[0m mins | Current Voters: \x1b[33m${currentVoters}\x1b[0m`)
                    console.log(`Author: \x1b[33m${author}\x1b[0m -- Reputation: \x1b[33m${authorRep}\x1b[0m -- Active-posts: \x1b[33m${postCount}\x1b[0m -- Avg-post-value: \x1b[33m${round(avgValue, 3)}\x1b[0m -- Chance for profit: \x1b[33m${percentile}%\x1b[0m`)
                    console.log(`Post-link: \x1b[33m${link}\x1b[0m`)

                    const scheduleTime = 240000 - ((minuteDiff * 60) * 1000)

                    let schedule = new Promise((resolve, reject) => {
                        setTimeout( async function() {
                            votingData = await rcapi.getVPMana(USERNAME)
                            votingPower = votingData.percentage / 100

                            const index = tracker.indexOf(author)
                            if (index > -1) {
                                tracker.splice(index, 1);
                            }

                            if (votingPower >= MINVOTINGPOWER) {
                                inspections += 1
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
                                            errors += 1
                                            console.log(err)
                                            fs.appendFileSync('./errorlog.txt', `\n${err}`)
                                        } else {
                                            votes += 1
                                            console.log('\x1b[32mVote Success!\x1b[0m');
                                            fs.appendFileSync('./log.txt', `\nAUTHOR: ${author} -- LINK: ${link} -- DATE: ${new Date()} -- VOTED AFTER: ${newMinuteDiff} mins -- Block-Id: ${blockId}\n---------------------------`)
                                        }
                                    });
                                } else {
                                    console.log(`\x1b[31mNot profitable to vote! =(\x1b[0m`)
                                    console.log(`---------------------`)
                                }
                            } else {
                                console.log(`Inspection time for \x1b[33m@${author}!\x1b[0m`)
                                console.log(`\x1b[31mVoting power is currently too low to inspect this post! (${round(votingPower - MINVOTINGPOWER, 2)})\x1b[0m`)
                                console.log(`---------------------`)
                            }
                        }, scheduleTime)
                    })
                    console.log(`Scheduled inspection for \x1b[33m${round(scheduleTime / 1000, 2)}secs\x1b[0m from now...`)
                    console.log(`---------------------`)
                }
            } else if (typeOf === 'transfer' && operationDetails.memo.startsWith('https://steemit.com/') && Number(operationDetails.amount.replace(' STEEM', '')) >= 1) {
                const FrontRunBalance = Number(operationDetails.amount.replace(' STEEM', ''))
                const FrontRunMemo = operationDetails.memo
                const FrontRunList = FrontRunMemo.split('/')
                const FrontRunPerm = FrontRunList[FrontRunList.length - 1]
                const FrontRunAuthor = FrontRunList[FrontRunList.length - 2].replace('@', '')
                const FrontRunParentPermLink = FrontRunList[FrontRunList.length - 3]

                const FrontRunPostData = await client.database.getState(`/${FrontRunParentPermLink}/@${FrontRunAuthor}/${FrontRunPerm}`)
                const FrontRunPostDetails = Object.values(FrontRunPostData.content)[0]
                const FrontRunPostValue = Number(FrontRunPostDetails.pending_payout_value.replace(' SBD', ''))
                const FrontRunPostCreateDate = Date.parse(new Date(FrontRunPostDetails.created).toISOString())
                const FrontRunCurrentVoters = FrontRunPostDetails.active_votes.length

                const FrontRunNowTime = new Date();
                const FrontRunMinuteDiff = ((FrontRunNowTime - FrontRunPostCreateDate) / 1000 / 60) - 120

                const FrontRunAuthorState = await client.database.getState(`/@${FrontRunAuthor}`)
                const FrontRunAuthorDetails = Object.values(FrontRunAuthorState.accounts)[0]
                const FrontRunAuthorRep = steem.formatter.reputation(FrontRunAuthorDetails.reputation)
                const FrontRunAuthorContent = Object.values(FrontRunAuthorState.content)

                let postCount = 0
                let totalPostValue = 0
                let valueData = [];

                FrontRunAuthorContent.forEach(authorPost => {
                    let postValue = Number(authorPost.pending_payout_value.replace(' SBD', ''))
                    let didPayout = Number(authorPost.total_payout_value.replace(' SBD', ''))

                    if (authorPost.author === FrontRunAuthor && didPayout === 0) {
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

                let votesignal = true
                FrontRunPostDetails.active_votes.forEach(voter => {
                    if (voter.voter === data.to){
                        votesignal = false
                    }
                })

                if (FrontRunCurrentVoters > MAXVOTERS || votingPower < MINVOTINGPOWER 
                    || (FrontRunPostValue / avgValue) > 0.10 || FrontRunAuthorRep < MINREP
                    || FrontRunMinuteDiff > 2880) {
                    votesignal = false
                }

                //'Perfect' conditions
                if (FrontRunCurrentVoters === 0 && FrontRunBalance >= 1 && votingPower >= MINVOTINGPOWER) {
                    votesignal = true
                }
            
                frontRuns += 1
                console.log(`Front Running Transfer detected in block \x1b[33m${blockId}\x1b[0m! => Upvote bot: \x1b[33m@${operationDetails.to}\x1b[0m`)
                if (votesignal === true) {
                    console.log(`AUTHOR: \x1b[33m${FrontRunAuthor}\x1b[0m -- REP: \x1b[33m${FrontRunAuthorRep}\x1b[0m -- Avg Post-value: \x1b[33m${avgValue}\x1b[0m`)
                    console.log(`POST-LINK: \x1b[33m${FrontRunMemo}\x1b[0m`)
                    console.log(`Post Value: \x1b[33m${FrontRunPostValue}\x1b[0m -- Post-Voters: \x1b[33m${FrontRunCurrentVoters}\x1b[0m -- AGE: \x1b[33m${round(FrontRunMinuteDiff, 2)} mins\x1b[0m -- Amount Transfered: \x1b[33m${FrontRunBalance}\x1b[0m`)
                    console.log(`\x1b[32mVOTE OPPORTUNITY DETECTED! Broadcasting now...\x1b[0m`)

                    const wif = steem.auth.toWif(USERNAME, KEY, 'posting');
                    steem.broadcast.vote(wif, USERNAME, FrontRunAuthor, FrontRunPerm, VOTEWEIGHT, function(err, result) {
                        if (err) {
                            fr_errors += 1
                            console.log(err)
                            fs.appendFileSync('./errorlog.txt', `\n${err}`)
                        } else {
                            fr_votes += 1
                            console.log('\x1b[32mVote Success!\x1b[0m');
                            fs.appendFileSync('./log.txt', `\nAUTHOR: ${FrontRunAuthor} -- LINK: ${FrontRunMemo} -- DATE: ${new Date()} -- VOTED AFTER: ${FrontRunMinuteDiff} mins -- Block-Id: ${blockId}\n---------------------------`)
                        }
                    });
                    console.log(`---------------------`)
                } else {
                    console.log(`AUTHOR: \x1b[33m${FrontRunAuthor}\x1b[0m -- REP: \x1b[33m${FrontRunAuthorRep}\x1b[0m -- Avg Post-value: \x1b[33m${avgValue}\x1b[0m`)
                    console.log(`POST-LINK: \x1b[33m${FrontRunMemo}\x1b[0m`)
                    console.log(`Post Value: \x1b[33m${FrontRunPostValue}\x1b[0m -- Post-Voters: \x1b[33m${FrontRunCurrentVoters}\x1b[0m -- AGE: \x1b[33m${round(FrontRunMinuteDiff, 2)} mins\x1b[0m -- Amount Transfered: \x1b[33m${FrontRunBalance}\x1b[0m`)
                    console.log('\x1b[31mNot profitable to vote! :(\x1b[0m')
                    console.log(`---------------------`)
                }
            }
        })
    
    }))
}

mainBot()