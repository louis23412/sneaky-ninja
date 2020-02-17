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
    ALWAYSON,
    ALWAYSONMINAVG,
    ALWAYSONVP,
    ALWAYSONTIME,
    SPGAINREFRESH
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
    if (blockCounter % SPGAINREFRESH === 0) {
        const result = await client.database.getDynamicGlobalProperties();
        vestPerSteem = Number(result.total_vesting_fund_steem.replace(' STEEM', '')) / Number(result.total_vesting_shares.replace(' VESTS', ''))
    
        const usersData = await client.database.getAccounts(userNamesList)
        votingSteemPower = 0
    
        for (usr of usersData) {
            const vestingShares = Number(usr.vesting_shares.replace(' VESTS', ''))
            const delegatedVestingShares = Number(usr.delegated_vesting_shares.replace(' VESTS', ''))
            const receivedVestingShares = Number(usr.received_vesting_shares.replace(' VESTS', ''))
            votingSteemPower += ((vestingShares + receivedVestingShares) - delegatedVestingShares) * vestPerSteem
        }
    }

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
                    } else if (type === 'alwayson') {
                        alwaysOnErrors++
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
        } else if (type === 'alwayson') {
            alwaysOnVotes++
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
            } else if (contentType === 'alwayson') {
                index = alwaysOnTracker.indexOf(author)
                if (index > -1) {
                    alwaysOnTracker.splice(index, 1)
                }
            }

            if (votingPower >= MINVOTINGPOWER || (contentType === 'alwayson' && votingPower >= ALWAYSONVP)) {
                if (contentType === 'post') {
                    inspections++
                } else if (contentType === 'comment') {
                    commentInspections++
                } else if (contentType === 'alwayson') {
                    alwaysOnInspections++
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
                    if (userNamesList.includes(voter.voter) || voter === author){
                        votesignal = false
                    }
                })

                if (totalVoters <= MAXVOTERS && (postValue / avgValue) <= 0.025 && votesignal === true && acceptingPayment > 0) {
                    let newVoteWeight = Math.round(VOTEWEIGHT * avgValue)
                    if (contentType === 'alwayson') {
                        newVoteWeight = Math.round(newVoteWeight * 2)
                        onlineVotersList = [...USERLIST]
                    }

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

const ScheduleFlag = async (operationDetails, type) => {
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
    let authorContent = Object.values(authorState.content)

    if (type === 'comment') {
        dataToGet = await client.database.getState(`/@${author}/comments`)
        authorContent = Object.values(dataToGet.content)
    }

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

    let votesignal = false
    if (type === 'post') {
        if (authorRep >= MINREP && postCount <= MAXACTIVEPOSTS
            && avgValue >= MINAVGVALUE && percentile >= PROFITMIN && votingPower >= MINVOTINGPOWER 
            && currentVoters <= MAXVOTERS ) {
                votesignal = true;
        } 
    } else if (type === 'comment') {
        if (authorRep >= MINREP && avgValue >= MINAVGCOMMENT && votingPower >= MINVOTINGPOWER
            && currentVoters <= MAXVOTERS && percentile >= PROFITMIN) {
                votesignal = true;
        }
    } else if (type === 'alwayson') {
        if (authorRep >= MINREP && postCount <= MAXACTIVEPOSTS
            && avgValue >= ALWAYSONMINAVG && percentile >= PROFITMIN && votingPower >= ALWAYSONVP 
            && currentVoters <= MAXVOTERS ) {
                votesignal = true;
        }
    }

    if (votesignal === true) {
        return {
            signal : true,
            author : author,
            avg : avgValue,
            link : link,
            parentPerm : parentPermLink,
            age : minuteDiff,
            perm : permlink
        }
    } else {
        return {
            signal : false
        };
    }
}
// -------------------------------------------

//Runtime variables:
const startTime = new Date()
let blockCounter = 0
let tracker = []
let alwaysOnTracker = []
let commentTracker = []
let votes = 0
let inspections = 0
let commentInspections = 0
let commentErrors = 0
let commentVotes = 0
let errors = 0
let votingTracker = {}
let offlineVoters = {}
let onlineVotersList = []
let votingSteemPower = 0
let startSP = 0
let alwaysOnInspections = 0
let alwaysOnErrors = 0
let alwaysOnVotes = 0
let votingPower = 0

console.clear()
console.log('Starting up block stream...')

stream.pipe(es.map(async (block, callback) => {
    callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')

    votingPower = await getVP();
    let voteStatus = rt(`Recharging Steem Power...`)
    if (votingPower >= MINVOTINGPOWER) {
        voteStatus = gt('Online!')
    } else if (votingPower >= ALWAYSONVP && votingPower < MINVOTINGPOWER) {
        voteStatus = yt(`Looking for ${ALWAYSONTIME} min posts...`)
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

    const alwaysOnDisplayTracker = alwaysOnTracker.map(user => {
        return yt(`@${user}`)
    })

    const data = block.transactions
    const blockId = block.block_id
    blockCounter ++

    if (blockCounter === 1) {
        startSP = votingSteemPower
    }

    const runtimeSPGain = votingSteemPower - startSP

    const displayVotingPower = Object.entries(votingTracker).map(acc => {
        return yt(`@${acc[0]}(${acc[1].percentage / 100}%)`)
    })

    const displayOfflinePower = Object.entries(offlineVoters).map(acc => {
        return yt(`@${acc[0]}(${acc[1].percentage / 100}%)`)
    })

    console.log(`${yt('*')} Status: ${voteStatus} || Run-time: ${yt(round((new Date() - startTime) / 1000 / 60, 2) + ' mins')} || Highest-VP: ${yt(round(votingPower, 3) + '%')}`)
    console.log(`${yt('*')} Block-ID: ${yt(blockId)} || ${yt(blockCounter)} blocks inspected! `)
    console.log(`└─| Total SP voting: ${yt(votingSteemPower)} || Run-time SP Gain: ${yt(runtimeSPGain)}`)
    console.log(`└─| Accounts online: ${yt(Object.keys(votingTracker).length)}/${yt(userNamesList.length)} ==> [${displayVotingPower}]`)
    console.log(`└─| Accounts recharging: ${yt(Object.keys(offlineVoters).length)}/${yt(userNamesList.length)} ==> [${displayOfflinePower}]`)
    console.log(`${yt('*')} Post Votes: ${yt(votes)} || Post Vote fails: ${yt(errors)}`)
    console.log(`└─| Post-Inspections: ${yt(inspections)} || Pending Post inspections: ${yt(tracker.length)} ==> [${displayTracker}]`)
    console.log(`${yt(`*`)} Comment Votes: ${yt(commentVotes)} || Comment Vote fails: ${yt(commentErrors)}`)
    console.log(`└─| Comment-Inspections: ${yt(commentInspections)} || Pending Comment inspections: ${yt(commentTracker.length)} ==> [${commentDisplayTracker}]`)
    console.log(`${yt('*')} Always on Votes: ${yt(alwaysOnVotes)} || Always on Vote fails: ${yt(alwaysOnErrors)}`)
    console.log(`└─| Always on-Inspections: ${yt(alwaysOnInspections)} || Pending inspections: ${yt(alwaysOnTracker.length)} ==> [${alwaysOnDisplayTracker}]`)
    console.log(`${yt('-----------------------------------')}`)

    data.forEach(async trans => {
        const operations = trans.operations
        const typeOf = operations[0][0]
        const operationDetails = operations[0][1]

        //Normal Post & comment voting
        if (typeOf === 'comment' && operationDetails.parent_author === '' 
            && !tracker.includes(operationDetails.author) && votingPower >= MINVOTINGPOWER) {
                const answer = await ScheduleFlag(operationDetails, 'post')
                if (answer.signal === true) {
                    tracker.push(answer.author)
                    console.log('Post Detected!')
                    console.log(`In block: ${yt(blockId)} | Match #: ${yt(tracker.length)}`)

                    let scheduleTime = (MINPOSTAGE * 60) * 1000 - ((answer.age * 60) * 1000)
                    setSchedule(scheduleTime, 'post', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId);
                }
        } else if (typeOf === 'comment' && operationDetails.parent_author != '' 
            && !commentTracker.includes(operationDetails.author) && votingPower >= MINVOTINGPOWER) {
                const answer = await ScheduleFlag(operationDetails, 'comment')
                if (answer.signal === true) {
                    commentTracker.push(answer.author)
                    console.log('Comment Detected!')
                    console.log(`In block: ${yt(blockId)} | Match #: ${yt(commentTracker.length)}`)

                    let scheduleTime = (MINPOSTAGE * 60) * 1000 - ((answer.age * 60) * 1000)
                    setSchedule(scheduleTime, 'comment', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId);
                }
        }

        //Always on
        if (typeOf === 'comment' && operationDetails.parent_author === '' 
            && !alwaysOnTracker.includes(operationDetails.author) && votingPower >= ALWAYSONVP 
            && !tracker.includes(operationDetails.author) && ALWAYSON === true) {
                const answer = await ScheduleFlag(operationDetails, 'alwayson')
                if (answer.signal === true) {
                    alwaysOnTracker.push(answer.author)
                    console.log('Always-on Post Detected!')
                    console.log(`In block: ${yt(blockId)} | Match #: ${yt(alwaysOnTracker.length)}`)

                    let scheduleTime = (ALWAYSONTIME * 60) * 1000 - ((answer.age * 60) * 1000)
                    setSchedule(scheduleTime, 'alwayson', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId);
                }
        }
    })
}))