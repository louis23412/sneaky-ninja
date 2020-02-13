const steem = require('steem')
const dsteem = require('dsteem')
const fs = require('fs');
const es = require('event-stream')
const util = require('util')

const client = new dsteem.Client('https://api.steemit.com')
const rcapi = new dsteem.RCAPI(client)
const stream = client.blockchain.getBlockStream('Latest')

const globalPropsFile = fs.readFileSync('./globalProps.json')
const globalProps = JSON.parse(globalPropsFile);
const {
    USERLIST,
    MINVOTINGPOWER,
    VOTEWEIGHT,
    MINPOSTAGE,
    MINAVGVALUE,
    PROFITMIN,
    MAXVOTERS, 
    MINREP, 
    MAXACTIVEPOSTS,
    MINAVGCOMMENT,
    COMMENTBUFFER,
    MINFRONTRUNAMOUNT
} = globalProps;

const userNamesList = USERLIST.map(user => {
    return user[0]
})

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

const getVP = async () => {
    for (userName of userNamesList) {
        votingTracker[userName] = await rcapi.getVPMana(userName)
    }

    for (value of Object.entries(votingTracker)) {
        if (value[1].percentage / 100 >= MINVOTINGPOWER) {
            delete offlineVoters[value[0]]
        } else {
            delete votingTracker[value[0]]
            offlineVoters[value[0]] = value[1]
        }
    }

    if (Object.values(votingTracker).length > 0) {
        const newList = Object.values(votingTracker).map(user => {
            return user.percentage / 100
        })
        return Math.max(...newList)
    } else {
        const newList = Object.values(offlineVoters).map(user => {
            return user.percentage / 100
        })
        return Math.max(...newList)
    }
}

const voteNow = (author, postperm, link, age, blockid, type, voteWeight=VOTEWEIGHT, newUserList) => {
    if (newUserList.length > 0) {
        let buffer = 1
        if (type === 'comment') {
            buffer = COMMENTBUFFER
        }

        userToVote = newUserList[0]
        if (onlineVotersList.includes(userToVote)) {
            const wif = steem.auth.toWif(userToVote[0], userToVote[1], 'posting');
            steem.broadcast.vote(wif, userToVote[0], author, postperm, voteWeight * buffer, (err, result) => {
                if (err) {
                    if (type === 'post') {
                        errors++
                    } else if (type === 'comment') {
                        commentErrors++
                    } else if (type === 'frontrun') {
                        fr_errors++
                    }
                    fs.appendFileSync('./errorlog.txt', `\n${err}`)
                } else {
                    console.log(gt(`Vote success with a voteweight of ${(voteWeight * buffer) / 100}%!`));
                }
            });
            let updatedUserListToVote = [...newUserList];
            updatedUserListToVote.splice(0, 1);
            voteNow(author, postperm, link, age, blockid, type, voteWeight, updatedUserListToVote);
        }
    } else if (newUserList.length === 0 ) {
        fs.appendFileSync('./log.txt', `\nAUTHOR: ${author} -- LINK: ${link} -- DATE: ${new Date()} -- VOTED AFTER: ${age} mins -- Block-Id: ${blockid}\n---------------------------`)
        if (type === 'post') {
            votes++
        } else if (type === 'comment') {
            commentVotes++
        } else if (type === 'frontrun') {
            fr_votes++
        }
    }
}

const setSchedule = (time, contentType, author, parentPerm, permLink, avgValue, link, blockId) => {
    new Promise((resolve, reject) => {
        setTimeout( async () => {
            votingPower = await getVP();

            let index = -1
            if (contentType === 'post') {
                index = tracker.indexOf(author)
                if (index > -1) {
                    tracker.splice(index, 1);
                }
            } else if (contentType === 'comment') {
                index = commentTracker.indexOf(author)
                if (index > -1) {
                    commentTracker.splice(index, 1)
                }
            }

            if (votingPower >= MINVOTINGPOWER) {
                if (contentType === 'post') {
                    inspections++
                } else if (contentType === 'comment') {
                    commentInspections++
                }

                const PostData = await client.database.getState(`/${parentPerm}/@${author}/${permLink}`)
                const PostDetails = Object.values(PostData.content)[0]
                const PostCreateDate = Date.parse(new Date(PostDetails.created).toISOString())
                const nowTime = new Date();
                const MinuteDiff = ((nowTime - PostCreateDate) / 1000 / 60) - 120
                const postValue = Number(PostDetails.pending_payout_value.replace(' SBD', ''))
                const acceptingPayment = Number(PostDetails.max_accepted_payout.replace(' SBD', ''))
                const totalVoters = PostDetails.active_votes.length

                console.log(`Inspection time for ${yt('@' + author)}!`)
                console.log(`Content-Age: ${yt(round(MinuteDiff, 2))} -- Value: ${yt(postValue)} -- voters: ${yt(totalVoters)}`)

                let votesignal = true
                PostDetails.active_votes.forEach(voter => {
                    if (userNamesList.includes(voter.voter)){
                        votesignal = false
                    }
                })

                if (totalVoters <= MAXVOTERS && (postValue / avgValue) <= 0.05 && votesignal === true && acceptingPayment > 0) {
                    let newVoteWeight = Math.round(VOTEWEIGHT * avgValue)
                    if (newVoteWeight > 10000) {
                        newVoteWeight = 10000;
                    }
                    const linkList = link.split('/')
                    const postPerm = linkList[linkList.length -1]
                    console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now...`))
                    console.log(`---------------------`)
                    voteNow(author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, onlineVotersList);
                } else if (votesignal === false) {
                    console.log(rt(`Already voted here!`))
                } else {
                    console.log(rt(`Not profitable to vote! =(`))
                    console.log(`---------------------`)
                }
            } else {
                console.log(`Inspection time for ${yt('@' + author)}!`)
                console.log(rt(`Voting power is currently too low to inspect this content! (${round(votingPower - MINVOTINGPOWER, 2)})`))
                console.log(`---------------------`)
            }
        }, time)
    })
    console.log(`Scheduled inspection for ${yt(round(time / 1000, 2) + ' secs')} from now...`)
    console.log(`---------------------`)
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
let votingTracker = {}
let offlineVoters = {}
let onlineVotersList = []

console.clear()
console.log('Starting up block stream...')

stream.pipe(es.map(async (block, callback) => {
    callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')

    const votingPower = await getVP();
    let voteStatus = rt(`Recharging Steem Power...`)
    if (votingPower >= MINVOTINGPOWER) {
        voteStatus = gt('Online!')
    }

    for (listedVoter of USERLIST) {
        if (Object.keys(votingTracker).includes(listedVoter[0]) && !onlineVotersList.includes(listedVoter) && 
        !Object.keys(offlineVoters).includes(listedVoter[0])) {
            onlineVotersList.push(listedVoter)
        }
    }

    for (activeVoter of onlineVotersList) {
        if (Object.keys(offlineVoters).includes(activeVoter[0])) {
            onlineVotersList.splice( onlineVotersList.indexOf(activeVoter), 1 );
        }
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

    const displayVotingPower = Object.entries(votingTracker).map(acc => {
        return yt(`@${acc[0]}(${acc[1].percentage / 100}%)`)
    })

    const displayOfflinePower = Object.entries(offlineVoters).map(acc => {
        return yt(`@${acc[0]}(${acc[1].percentage / 100}%)`)
    })

    console.log(`Block-ID: ${yt(blockId)} || ${yt(blockCounter)} blocks inspected!`)
    console.log(`Status: ${voteStatus} || Run-time: ${yt(round((new Date() - startTime) / 1000 / 60, 2) + ' mins')} || Highest-VP: ${yt(round(votingPower, 3) + '%')}`)
    console.log(`Accounts online: ${yt(Object.keys(votingTracker).length)}/${yt(userNamesList.length)} ==> [${displayVotingPower}]`)
    console.log(`Accounts recharging: ${yt(Object.keys(offlineVoters).length)}/${yt(userNamesList.length)} ==> [${displayOfflinePower}]`)
    console.log(`Post Votes: ${yt(votes)} || Comment Votes: ${yt(commentVotes / userNamesList.length)} || Front-Run Votes: ${yt(fr_votes / userNamesList.length)} || Front-Runs Detected: ${yt(frontRuns)}`)
    console.log(`Post Vote fails: ${yt(errors)} || Comment Vote fails: ${yt(commentErrors)} || Front-Runs Vote Fails: ${yt(fr_errors)}`)
    console.log(`Post-Inspections: ${yt(inspections)} || Pending Post inspections: ${yt(tracker.length)} ==> [${displayTracker}]`)
    console.log(`Comment-Inspections: ${yt(commentInspections)} || Pending Comment inspections: ${yt(commentTracker.length)} ==> [${commentDisplayTracker}]`)
    console.log(yt('-----------------------------------'))

    data.forEach(async trans => {
        const operations = trans.operations
        const typeOf = operations[0][0]
        const operationDetails = operations[0][1]

        if (typeOf === 'comment' && operationDetails.parent_author === '' 
            && !tracker.includes(operationDetails.author) && votingPower >= MINVOTINGPOWER) {
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

                let scheduleTime = (MINPOSTAGE * 60) * 1000 - ((minuteDiff * 60) * 1000)
                setSchedule(scheduleTime, 'post', author, parentPermLink, permlink, avgValue, link, blockId);
            }
        } else if (typeOf === 'transfer' && operationDetails.memo.startsWith('https://steemit.com/') 
            && Number(operationDetails.amount.replace(' STEEM', '')) >= MINFRONTRUNAMOUNT && votingPower >= MINVOTINGPOWER) {
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

            let votesignal = true
            if (FrontRunCurrentVoters > MAXVOTERS || votingPower < MINVOTINGPOWER 
                || (FrontRunPostValue / avgValue) > 0.05 || FrontRunAuthorRep < MINREP
                || FrontRunMinuteDiff > 2880 || FrontRunMinuteDiff < MINPOSTAGE ) {
                votesignal = false
            }

            //'Perfect' conditions
            if (FrontRunCurrentVoters === 0 && FrontRunMinuteDiff >= MINPOSTAGE) {
                votesignal = true
            }

            FrontRunPostDetails.active_votes.forEach(voter => {
                if (voter.voter === data.to || userNamesList.includes(voter.voter)){
                    votesignal = false
                }
            })
        
            frontRuns += 1
            console.log(`Front Running Transfer detected in block ${yt(blockId)}! => Upvote bot: ${yt('@' + operationDetails.to)}`)
            console.log(`Author: ${yt(FrontRunAuthor)} -- Reputation: ${yt(FrontRunAuthorRep)} -- Avg Post-value: ${yt(avgValue)}`)
            console.log(`Post-link: ${yt(FrontRunMemo)}`)
            console.log(`Post Value: ${yt(FrontRunPostValue)} -- Post-Voters: ${yt(FrontRunCurrentVoters)} -- Age: ${yt(round(FrontRunMinuteDiff, 2) + ' mins')} -- Amount Transfered: ${yt(FrontRunBalance)}`)

            if (votesignal === true) {
                console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now...`))
                voteNow(FrontRunAuthor, FrontRunPerm, FrontRunMemo, FrontRunMinuteDiff, blockId, 'frontrun', newUserList=onlineVotersList);
                console.log(`---------------------`)
            } else {
                console.log(rt('Not profitable to vote! :('))
                console.log(`---------------------`)
            }
        } else if (typeOf === 'comment' && operationDetails.parent_author != '' 
            && !commentTracker.includes(operationDetails.author) && votingPower >= MINVOTINGPOWER) {
            const commentAuthor = operationDetails.author
            const commentLink = `https://steemit.com/${operationDetails.parent_permlink}/@${commentAuthor}/${operationDetails.permlink}`
            const commentData = await client.database.getState(`/${operationDetails.parent_permlink}/@${commentAuthor}/${operationDetails.permlink}`)
            const commentDetails = Object.values(commentData.content)[0]
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
                
                let scheduleTime = (MINPOSTAGE * 60) * 1000 - ((minuteDiff * 60) * 1000)
                setSchedule(scheduleTime, 'comment', commentAuthor, operationDetails.parent_permlink, operationDetails.permlink, avgValue, commentLink, blockId)
            }
        }
    })
}))