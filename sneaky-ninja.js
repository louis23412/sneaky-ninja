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
    MINAVGVALUE,
    PROFITMIN,
    MAXVOTERS, 
    MINREP, 
    MAXACTIVEPOSTS,
    MINAVGCOMMENT,
    COMMENTBUFFER
} = globalProps;


// Seperation of concerns!
// -------------------------------------------
const yt = (txt) => {
    return `\x1b[33m${txt}\x1b[0m`
}

const rt = (txt) => {
    return `\x1b[31m${txt}\x1b[0m`
}

const gt = (txt) => {
    return `\x1b[32m${txt}\x1b[0m`
}


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

const calculateProfit = (arr, avgval) => {
    const q1 = Quartile(arr, 0.25);
    const q2 = Quartile(arr, 0.5);
    const q3 = Quartile(arr, 0.75);
    const diff = ((q1 + q2 + q3) / 3) - avgval
    let percentile = round((diff / avgval) * 100, 3)
    if (isNaN(percentile)) {
        percentile = 0;
    }
    return percentile
}

const wif = steem.auth.toWif(USERNAME, KEY, 'posting');
const voteNow = (author, postperm, link, age, blockid, type) => {
    let buffer = 1
    if (type === 'comment') {
        buffer = COMMENTBUFFER
    }
    steem.broadcast.vote(wif, USERNAME, author, postperm, VOTEWEIGHT * buffer, function(err, result) {
        if (err) {
            if (type === 'post') {
                errors++
            } else if (type === 'comment') {
                commentErrors++
            } else if (type === 'frontrun') {
                fr_errors++
            }
            console.log(err)
            fs.appendFileSync('./errorlog.txt', `\n${err}`)
        } else {
            if (type === 'post') {
                votes++
            } else if (type === 'comment') {
                commentVotes++
            } else if (type === 'frontrun') {
                fr_votes++
            }
            console.log(gt('Vote Success!'));
            fs.appendFileSync('./log.txt', `\nAUTHOR: ${author} -- LINK: ${link} -- DATE: ${new Date()} -- VOTED AFTER: ${age} mins -- Block-Id: ${blockid}\n---------------------------`)
        }
    });
}
// -------------------------------------------

//Runtime variables:
const startTime = new Date()
let blockCounter = 0
let tracker = []
let commentTracker = []
let votes = 0
let fr_votes = 0
let inspections = 0
let commentInspections = 0
let commentErrors = 0
let commentVotes = 0
let errors = 0
let fr_errors = 0
let frontRuns = 0

console.clear()
console.log('Starting up block stream...')
//Main function:
async function mainBot() {
    stream.pipe(es.map(async function(block, callback) {
        callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')

        let votingData = await rcapi.getVPMana(USERNAME)
        let votingPower = votingData.percentage / 100

        let voteStatus = rt(`Recharging Steem Power...`)
        if (votingPower >= MINVOTINGPOWER) {
            voteStatus = gt('Online!')
        }

        const displayTracker = tracker.map(user => {
            return yt(`@${user}`)
        })

        const commentDisplayTracker = commentTracker.map(user => {
            return yt(`@${user}`)
        })

        const data = block.transactions
        const blockId = block.block_id
        blockCounter ++ 

        console.log(`Status: ${voteStatus} || Run-time: ${yt(round((new Date() - startTime) / 1000 / 60, 2) + ' mins')} || ${yt(blockCounter)} blocks inspected!`)
        console.log(`Current-VP: ${yt(votingPower + '%')} || Block-ID: ${yt(blockId)}`)
        console.log(`Post Votes: ${yt(votes)} || Comment Votes: ${yt(commentVotes)} || Front-Run Votes: ${yt(fr_votes)} || Front-Runs Detected: ${yt(frontRuns)}`)
        console.log(`Post Vote fails: ${yt(errors)} || Comment Vote fails: ${yt(commentErrors)} || Front-Runs Vote Fails: ${yt(fr_errors)}`)
        console.log(`Post-Inspections: ${yt(inspections)} || Pending Post inspections: ${yt(tracker.length)} ==> [${displayTracker}]`)
        console.log(`Comment-Inspections: ${yt(commentInspections)} || Pending Comment inspections: ${yt(commentTracker.length)} ==> [${commentDisplayTracker}]`)
        console.log(yt('-----------------------------------'))
    
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

                const percentile = calculateProfit(valueData, avgValue);

                if (authorRep >= MINREP && postCount <= MAXACTIVEPOSTS
                    && avgValue >= MINAVGVALUE && percentile >= PROFITMIN && votingPower >= MINVOTINGPOWER 
                    && currentVoters <= MAXVOTERS ) {
                    tracker.push(author)
                    console.log('Post Detected!')
                    console.log(`In block: ${yt(blockId)} | Match #: ${yt(tracker.length)}`)
                    console.log(`Post age: ${yt(round(minuteDiff, 2) + ' mins')} | Current Voters: ${yt(currentVoters)}`)
                    console.log(`Author: ${yt(author)} -- Reputation: ${yt(authorRep)} -- Active-posts: ${yt(postCount)} -- Avg-post-value: ${yt(round(avgValue, 3))} -- Chance for profit: ${yt(percentile + '%')}`)
                    console.log(`Post-link: ${yt(link)}`)

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

                                console.log(`Inspection time for ${yt('@' + author)}!`)
                                console.log(`POST-AGE: ${yt(round(newMinuteDiff, 2))} -- VALUE: ${yt(postValue)} -- VOTERS: ${yt(totalVoters)}`)

                                let votesignal = true
                                newPostDetails.active_votes.forEach(voter => {
                                    if (voter.voter === USERNAME){
                                        votesignal = false
                                    }
                                })

                                if (totalVoters <= MAXVOTERS && (postValue / avgValue) <= 0.10 && votesignal === true) {
                                    const linkList = link.split('/')
                                    const postPerm = linkList[linkList.length -1]
                                    console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now...`))
                                    console.log(`---------------------`)
                                    voteNow(author, postPerm, link, newMinuteDiff, blockId, 'post');
                                } else if (votesignal === false) {
                                    console.log(rt(`Already voted here!`))
                                } else {
                                    console.log(rt(`Not profitable to vote! =(`))
                                    console.log(`---------------------`)
                                }
                            } else {
                                console.log(`Inspection time for ${yt('@' + author)}!`)
                                console.log(rt(`Voting power is currently too low to inspect this post! (${round(votingPower - MINVOTINGPOWER, 2)})`))
                                console.log(`---------------------`)
                            }
                        }, scheduleTime)
                    })
                    console.log(`Scheduled inspection for ${yt(round(scheduleTime / 1000, 2) + ' secs')} from now...`)
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

                const percentile = calculateProfit(valueData, avgValue);

                let votesignal = true
                if (FrontRunCurrentVoters > MAXVOTERS || votingPower < MINVOTINGPOWER 
                    || (FrontRunPostValue / avgValue) > 0.10 || FrontRunAuthorRep < MINREP
                    || FrontRunMinuteDiff > 2880) {
                    votesignal = false
                }

                //'Perfect' conditions
                if (FrontRunCurrentVoters === 0 && FrontRunBalance >= 1 && votingPower >= MINVOTINGPOWER) {
                    votesignal = true
                }

                FrontRunPostDetails.active_votes.forEach(voter => {
                    if (voter.voter === data.to || voter.voter === USERNAME){
                        votesignal = false
                    }
                })
            
                frontRuns += 1
                console.log(`Front Running Transfer detected in block ${yt(blockId)}! => Upvote bot: ${yt('@' + operationDetails.to)}`)
                if (votesignal === true) {
                    console.log(`Author: ${yt(FrontRunAuthor)} -- Reputation: ${yt(FrontRunAuthorRep)} -- Avg Post-value: ${yt(avgValue)}`)
                    console.log(`Post-link: ${yt(FrontRunMemo)}`)
                    console.log(`Post Value: ${yt(FrontRunPostValue)} -- Post-Voters: ${yt(FrontRunCurrentVoters)} -- Age: ${yt(round(FrontRunMinuteDiff, 2) + ' mins')} -- Amount Transfered: ${yt(FrontRunBalance)}`)
                    console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now...`))
                    voteNow(FrontRunAuthor, FrontRunPerm, FrontRunMemo, FrontRunMinuteDiff, blockId, 'frontrun');
                    console.log(`---------------------`)
                } else {
                    console.log(`Author: ${yt(FrontRunAuthor)} -- Rep: ${yt(FrontRunAuthorRep)} -- Avg Post-value: ${yt(avgValue)}`)
                    console.log(`Post-link: ${yt(FrontRunMemo)}`)
                    console.log(`Post Value: ${yt(FrontRunPostValue)} -- Post-Voters: ${yt(FrontRunCurrentVoters)} -- Age: ${yt(round(FrontRunMinuteDiff, 2) + ' mins')} -- Amount Transfered: ${yt(FrontRunBalance)}`)
                    console.log(rt('Not profitable to vote! :('))
                    console.log(`---------------------`)
                }
            } else if (typeOf === 'comment' && operationDetails.parent_author != '' && !commentTracker.includes(operationDetails.author)) {
                const commentAuthor = operationDetails.author
                const commentLink = `https://steemit.com/${operationDetails.parent_permlink}/@${commentAuthor}/${operationDetails.permlink}`

                const commentData = await client.database.getState(`/${operationDetails.parent_permlink}/@${commentAuthor}/${operationDetails.permlink}`)
                const commentDetails = Object.values(commentData.content)[0]

                const commentCurrentValue = Number(commentDetails.pending_payout_value.replace(' SBD', ''))
                const commentCurrentVoters = commentDetails.active_votes.length

                const commentCreateDate = Date.parse(new Date(commentDetails.created).toISOString())
                const nowTime = new Date();
                const minuteDiff = ((nowTime - commentCreateDate) / 1000 / 60) - 120

                const authorCommentState = await client.database.getState(`/@${commentAuthor}/comments`)
                const authorDetails = Object.values(authorCommentState.accounts)[0]
                const authorRep = steem.formatter.reputation(authorDetails.reputation)
                const authorContent = Object.values(authorCommentState.content)

                let commentCount = 0
                let totalCommentValue = 0
                let valueData = [];

                authorContent.forEach(authorComment => {
                    const commentValue = Number(authorComment.pending_payout_value.replace(' SBD', ''))
                    const didPayout = Number(authorComment.total_payout_value.replace(' SBD', ''))

                    if (authorComment.author === commentAuthor && didPayout === 0) {
                        commentCount += 1
                        totalCommentValue += commentValue
                        valueData.push(commentValue)
                    }
                })

                let avgValue = totalCommentValue / commentCount
                if (isNaN(avgValue)) {
                    avgValue = 0.000
                }

                const percentile = calculateProfit(valueData, avgValue);

                if (authorRep >= MINREP && avgValue >= MINAVGCOMMENT && votingPower >= MINVOTINGPOWER
                    && commentCurrentVoters <= MAXVOTERS && percentile >= PROFITMIN) {
                        commentTracker.push(commentAuthor)
                        console.log('Comment Detected!')
                        console.log(`In block: ${yt(blockId)} | Comment-Match #: ${yt(commentTracker.length)}`)
                        console.log(`Comment age: ${yt(round(minuteDiff, 2) + ' mins')} | Current Voters: ${yt(commentCurrentVoters)}`)
                        console.log(`Author: ${yt(commentAuthor)} -- Reputation: ${yt(authorRep)} -- Active-comments: ${yt(commentCount)} -- Avg-comment-value: ${yt(round(avgValue, 3))} -- Chance for profit: ${yt(percentile + '%')}`)
                        console.log(`Comment-link: ${yt(commentLink)}`)
                        
                        const scheduleTime = 240000 - ((minuteDiff * 60) * 1000)
                        let schedule = new Promise((resolve, reject) => {
                            setTimeout( async function() {
                                votingData = await rcapi.getVPMana(USERNAME)
                                votingPower = votingData.percentage / 100
    
                                const index = commentTracker.indexOf(commentAuthor)
                                if (index > -1) {
                                    commentTracker.splice(index, 1);
                                }
    
                                if (votingPower >= MINVOTINGPOWER) {
                                    commentInspections += 1
                                    const newCommentData = await client.database.getState(`/${operationDetails.parent_permlink}/@${commentAuthor}/${operationDetails.permlink}`)
                                    const newCommentDetails = Object.values(newCommentData.content)[0]
                                    const newCommentCreateDate = Date.parse(new Date(newCommentDetails.created).toISOString())
                                    
                                    const newNowTime = new Date();
                                    const newMinuteDiff = ((newNowTime - newCommentCreateDate) / 1000 / 60) - 120
    
                                    const commentValue = Number(newCommentDetails.pending_payout_value.replace(' SBD', ''))
                                    const commentTotalVoters = newCommentDetails.active_votes.length
    
                                    console.log(`Inspection time for ${yt('@' + commentAuthor)}!`)
                                    console.log(`Comment-Age: ${yt(round(newMinuteDiff, 2))} -- Value: ${yt(commentValue)} -- VOTERS: ${yt(commentTotalVoters)}`)
    
                                    let votesignal = true
                                    newCommentDetails.active_votes.forEach(voter => {
                                        if (voter.voter === USERNAME){
                                            votesignal = false
                                        }
                                    })
    
                                    if (commentCurrentVoters <= MAXVOTERS && (commentValue / avgValue) <= 0.10 && votesignal === true) {
                                        const linkList = commentLink.split('/')
                                        const commentPerm = linkList[linkList.length -1]
                                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now...`))
                                        console.log(`---------------------`)
                                        voteNow(commentAuthor, commentPerm, commentLink, newMinuteDiff, blockId, 'comment');
                                    } else if (votesignal === false) {
                                        console.log(rt(`Already voted here!`))
                                    } else {
                                        console.log(rt(`Not profitable to vote! =(`))
                                        console.log(`---------------------`)
                                    }
                                } else {
                                    console.log(`Inspection time for ${yt('@' + author)}!`)
                                    console.log(rt(`Voting power is currently too low to inspect this comment! (${round(votingPower - MINVOTINGPOWER, 2)})`))
                                    console.log(`---------------------`)
                                }
                            }, scheduleTime)
                        })
                        console.log(`Scheduled inspection for ${yt(round(scheduleTime / 1000, 2) + ' secs')} from now...`)
                        console.log(`---------------------`)
                }
            }
        })
    
    }))
}

mainBot()