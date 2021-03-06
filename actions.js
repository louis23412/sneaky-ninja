const steem = require('steem')
const dsteem = require('dsteem')
const fs = require('fs');

const client = new dsteem.Client('https://api.steemit.com');
const rcapi = new dsteem.RCAPI(client);

const { USERLIST } = JSON.parse(fs.readFileSync('./globalProps.json'));

const userNamesList = USERLIST.map(user => {
    return user[0];
});

// Helpers :
//----------------------------------------------------
const yt = (txt) => {
    return `\x1b[33m${txt}\x1b[0m`;
};

const rt = (txt) => {
    return `\x1b[31m${txt}\x1b[0m`;
};

const gt = (txt) => {
    return `\x1b[32m${txt}\x1b[0m`;
};

const round = (value, decimals) => {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
};

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

const displayVotingPower = (trackerObject) => {
    const votingList = Object.entries(trackerObject).map(acc => {
        return yt(`@${acc[0]}(${acc[1].percentage / 100}%)`)
    })
    return votingList;
}

const displayTracker = (list) => {
    const newList = list.map(user => {
        return yt(`@${user}`)
    })
    return newList
}
//----------------------------------------------------

// Main actions:
//----------------------------------------------------
const logTrackers = (globalState) => {
    for (timeRange of globalState.system.timeFrames) {
        console.log(`${yt('*')} Schedule Time: ${yt(globalState.trackers[timeRange].scheduleTime)} || Base VoteWeight: ${yt(globalState.trackers[timeRange].baseWeight / 100)} || Min VP: ${yt(globalState.trackers[timeRange].minVP)}++ || Min Avg Post: ${yt(globalState.trackers[timeRange].posts.minAvg)} || Min Avg Comment: ${yt(globalState.trackers[timeRange].comments.minAvg)} => Post Votes: ${yt(globalState.trackers[timeRange].posts.votes)} || Post Vote Fails: ${yt(globalState.trackers[timeRange].posts.errors)} || Comment Votes: ${yt(globalState.trackers[timeRange].comments.votes)} || Comment Vote Fails: ${yt(globalState.trackers[timeRange].comments.errors)}`)
        console.log(`└─| Active voters: ${yt(Object.keys(globalState.trackers[timeRange].votingTracker).length)} ==> [${displayVotingPower(globalState.trackers[timeRange].votingTracker)}]`)
        console.log(`└─| Post Inspections: ${yt(globalState.trackers[timeRange].posts.inspections)} || Pending Post Inspections: ${yt(globalState.trackers[timeRange].posts.pendingInspections.length)} ==> [${displayTracker(globalState.trackers[timeRange].posts.pendingInspections)}]`)
        console.log(`└─| Comment Inspections: ${yt(globalState.trackers[timeRange].comments.inspections)} || Pending Comment Inspections: ${yt(globalState.trackers[timeRange].comments.pendingInspections.length)} ==> [${displayTracker(globalState.trackers[timeRange].comments.pendingInspections)}]`)
        console.log('- - - - - - - -')
    }
}

const setGlobalOnlineLists = (globalState) => {
    globalState.trackers.onlineVotersList = {
        ONE : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        TWO : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        THREE : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        FOUR : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        FIVE : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList, globalState.trackers.FIVE.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        SIX : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList, globalState.trackers.FIVE.onlineList, globalState.trackers.SIX.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        SEVEN : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList, globalState.trackers.FIVE.onlineList, globalState.trackers.SIX.onlineList, globalState.trackers.SEVEN.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        EIGHT : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList, globalState.trackers.FIVE.onlineList, globalState.trackers.SIX.onlineList, globalState.trackers.SEVEN.onlineList, globalState.trackers.EIGHT.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        NINE : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList, globalState.trackers.FIVE.onlineList, globalState.trackers.SIX.onlineList, globalState.trackers.SEVEN.onlineList, globalState.trackers.EIGHT.onlineList, globalState.trackers.NINE.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        TEN : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.ONE.onlineList, globalState.trackers.TWO.onlineList, globalState.trackers.THREE.onlineList, globalState.trackers.FOUR.onlineList, globalState.trackers.FIVE.onlineList, globalState.trackers.SIX.onlineList, globalState.trackers.SEVEN.onlineList, globalState.trackers.EIGHT.onlineList, globalState.trackers.NINE.onlineList, globalState.trackers.TEN.onlineList).includes(voter[0])) {
                return voter
            }
        })
    }
}

const getVP = async (globalState) => {
    if (globalState.system.blockCounter % 15 === 0) {
        const result = await client.database.getDynamicGlobalProperties();
        vestPerSteem = Number(result.total_vesting_fund_steem.replace(' STEEM', '')) / Number(result.total_vesting_shares.replace(' VESTS', ''))
    
        const usersData = await client.database.getAccounts(userNamesList)
        globalState.system.votingSteemPower = 0
    
        for (usr of usersData) {
            const vestingShares = Number(usr.vesting_shares.replace(' VESTS', ''))
            const delegatedVestingShares = Number(usr.delegated_vesting_shares.replace(' VESTS', ''))
            const receivedVestingShares = Number(usr.received_vesting_shares.replace(' VESTS', ''))
            globalState.system.votingSteemPower += ((vestingShares + receivedVestingShares) - delegatedVestingShares) * vestPerSteem
        }
    }

    if (globalState.system.blockCounter % 5 === 0) {
        for (time in globalState.trackers) {
            if (time != 'offline') {
                globalState.trackers[time].votingTracker = {}
                globalState.trackers[time].onlineList = []
            } else if (time === 'offline') {
                globalState.trackers.offline.offlineVoters = {}
            }
        }

        let tempTracker = {}
        for (userName of userNamesList) {
            tempTracker[userName] = await rcapi.getVPMana(userName)
        }

        for (value of Object.entries(tempTracker)) {
            if (value[1].percentage / 100 >= globalState.trackers.ONE.minVP) {
                globalState.trackers.ONE.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.ONE.onlineList.includes(value[0])) {
                    globalState.trackers.ONE.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.TWO.minVP) {
                globalState.trackers.TWO.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.TWO.onlineList.includes(value[0])) {
                    globalState.trackers.TWO.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.THREE.minVP) {
                globalState.trackers.THREE.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.THREE.onlineList.includes(value[0])) {
                    globalState.trackers.THREE.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.FOUR.minVP) {
                globalState.trackers.FOUR.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.FOUR.onlineList.includes(value[0])) {
                    globalState.trackers.FOUR.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.FIVE.minVP) {
                globalState.trackers.FIVE.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.FIVE.onlineList.includes(value[0])) {
                    globalState.trackers.FIVE.onlineList.push(value[0])
                }
            }else if (value[1].percentage / 100 >= globalState.trackers.SIX.minVP) {
                globalState.trackers.SIX.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.SIX.onlineList.includes(value[0])) {
                    globalState.trackers.SIX.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.SEVEN.minVP) {
                globalState.trackers.SEVEN.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.SEVEN.onlineList.includes(value[0])) {
                    globalState.trackers.SEVEN.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.EIGHT.minVP) {
                globalState.trackers.EIGHT.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.EIGHT.onlineList.includes(value[0])) {
                    globalState.trackers.EIGHT.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.NINE.minVP) {
                globalState.trackers.NINE.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.NINE.onlineList.includes(value[0])) {
                    globalState.trackers.NINE.onlineList.push(value[0])
                }
            } else if (value[1].percentage / 100 >= globalState.trackers.TEN.minVP) {
                globalState.trackers.TEN.votingTracker[value[0]] = value[1]
                if (!globalState.trackers.TEN.onlineList.includes(value[0])) {
                    globalState.trackers.TEN.onlineList.push(value[0])
                }
            } else {
                globalState.trackers.offline.offlineVoters[value[0]] = value[1]
            }
        }
    }

    let maxPower = 0
    for (time in globalState.trackers) {
        if (time != 'offline' && time != 'onlineVotersList') {
            const dataObject = globalState.trackers[time]
            const newList = Object.values(dataObject.votingTracker).map(user => {
                return user.percentage / 100
            })
            const most = Math.max(...newList)
            if (most > maxPower) {
                maxPower = most
            } 
        }
    }
    return maxPower
}

const voteNow = (globalState, author, postperm, link, age, blockid, type, voteWeight, newUserList, timeName) => {
    if (newUserList.length > 0) {
        userToVote = newUserList[0]
        const wif = steem.auth.toWif(userToVote[0], userToVote[1], 'posting');
        steem.broadcast.vote(wif, userToVote[0], author, postperm, voteWeight, (err, result) => {
            if (err) {
                globalState.trackers[timeName][type].errors++
                globalState.system.totalErrors++
                fs.appendFileSync('./logs/errorlog.txt', `${err}\n`)
            } else {
                console.log(gt(`Vote success with a voteweight of ${(voteWeight) / 100}%!`));
            }
        });
        
        let updatedUserListToVote = [...newUserList];
        updatedUserListToVote.splice(0, 1);
        voteNow(globalState, author, postperm, link, age, blockid, type, voteWeight, updatedUserListToVote, timeName);
    } else if (newUserList.length === 0 ) {
        globalState.trackers[timeName][type].votes++
        globalState.system.totalVotes++
        fs.appendFileSync('./logs/votelog.txt', `AUTHOR: ${author} -- LINK: ${link} -- DATE: ${new Date()} -- VOTED AFTER: ${age} mins -- Block-Id: ${blockid}\n---------------------------\n`)
    }
}

const setSchedule = (globalState, time, contentType, author, parentPerm, permLink, avgValue, link, blockId, trackingList, timeName) => {
    new Promise((resolve, reject) => {
        setTimeout( async () => {
            const index = trackingList.indexOf(author)
            if (index > -1) {
                trackingList.splice(index, 1);
            }

            const index2 = globalState.system.pendingAuthorList.indexOf(author)
            if (index2 > -1) {
                globalState.system.pendingAuthorList.splice(index2, 1)
            }

            globalState.trackers[timeName][contentType].inspections++
            globalState.system.totalInspections++

            const PostData = await client.database.getState(`/${parentPerm}/@${author}/${permLink}`)
            const PostDetails = Object.values(PostData.content)[0]
            const PostCreateDate = Date.parse(new Date(PostDetails.created).toISOString())
            const MinuteDiff = (((new Date().getTime() - PostCreateDate) / 1000) / 60) - Math.abs(new Date().getTimezoneOffset())
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

            if (totalVoters <= globalState.globalVars.MAXVOTERS && (postValue / avgValue) <= 0.025 && votesignal === true && acceptingPayment > 0) {
                let newVoteWeight = Math.round(globalState.trackers[timeName].baseWeight * avgValue)
                if (newVoteWeight > 10000) {
                    newVoteWeight = 10000;
                }

                if (globalState.trackers.onlineVotersList[timeName].length > 0) {
                    const linkList = link.split('/')
                    const postPerm = linkList[linkList.length -1]
                    console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList[timeName].length} accounts...`))
                    console.log(`---------------------`)
                    voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList[timeName], timeName);
                } else {
                    console.log(rt('No accounts available to vote!'))
                }
            } else if (votesignal === false) {
                console.log(rt(`Already voted here! / Author has voted here!`))
            } else {
                console.log(rt(`Not profitable to vote! =(`))
                console.log(`---------------------`)
            }
        }, time)
    })
    console.log(`Scheduled inspection for ${yt(round(time / 1000, 2) + ' secs')} from now...`)
    console.log(`---------------------`)
}

const ScheduleFlag = async (globalState, operationDetails, type) => {
    const author = operationDetails.author
    const parentPermLink = operationDetails.parent_permlink
    const permlink = operationDetails.permlink
    const link = `https://steemit.com/${parentPermLink}/@${author}/${permlink}`
    const postData = await client.database.getState(`/${parentPermLink}/@${author}/${permlink}`)
    const postDetails = Object.values(postData.content)[0]
    const postCreateDate = Date.parse(new Date(postDetails.created).toISOString())
    const currentVoters = postDetails.active_votes.length
    const minuteDiff = (((new Date().getTime() - postCreateDate) / 1000) / 60) - Math.abs(new Date().getTimezoneOffset())
    const authorState = await client.database.getState(`/@${author}`)
    const authorDetails = Object.values(authorState.accounts)[0]
    const authorRep = steem.formatter.reputation(authorDetails.reputation)
    let authorContent = Object.values(authorState.content)

    globalState.system.operationInspections++

    if (type === 'comments') {
        dataToGet = await client.database.getState(`/@${author}/comments`)
        authorContent = Object.values(dataToGet.content)
    }

    let postCount = 0
    let totalPostValue = 0
    let valueData = [];

    authorContent.forEach(authorPost => {
        const postValue = Number(authorPost.pending_payout_value.replace(' SBD', ''))
        const createDate = Date.parse(new Date(authorPost.created).toISOString())
        const timeDiff = (((new Date().getTime() - createDate) / 1000) / 60) - Math.abs(new Date().getTimezoneOffset())

        if (authorPost.author === author && timeDiff <= 10080) {
            postCount += 1
            totalPostValue += postValue
            valueData.push(postValue)
        }
    })

    let avgValue = totalPostValue / postCount
    if (isNaN(avgValue) || avgValue == null || avgValue === undefined) {
        avgValue = 0.000
    }

    const percentile = calculateProfit(valueData, avgValue);

    let timeFrame = ''
    let scheduleTime = ''
    let timeName = ''

    if (type === 'posts') {
        fs.appendFileSync('./logs/signalLog.txt', `Inspecting post ==> AUTHOR: https://steemit.com/@${author}/posts -- REP:${authorRep} -- Post Count:${postCount} -- Current Voters:${currentVoters} -- Proftit Chance:${percentile} -- Avg Value:${avgValue}\n`)
        for (timeFrame of globalState.system.timeFrames) {
            if (authorRep >= globalState.globalVars.MINREP && postCount <= globalState.globalVars.MAXACTIVEPOSTS 
                && avgValue >= globalState.trackers[timeFrame].posts.minAvg && percentile >= globalState.globalVars.PROFITMIN
                && currentVoters <= globalState.globalVars.MAXVOTERS) {
                    scheduleTime = globalState.trackers[timeFrame].scheduleTime
                    timeName = timeFrame
                    timeFrame = globalState.trackers[timeFrame].posts.pendingInspections

                    return {
                        signal : true,
                        author : author,
                        avg : avgValue,
                        link : link,
                        parentPerm : parentPermLink,
                        age : minuteDiff,
                        perm : permlink,
                        timeFrame : timeFrame,
                        scheduleTime : scheduleTime,
                        timeName : timeName,
                        profitChance : percentile
                    }
                }
        }
        return {signal : false}
    } else if (type === 'comments') {
        fs.appendFileSync('./logs/signalLog.txt', `Inspecting comment ==> AUTHOR: https://steemit.com/@${author}/comments -- REP:${authorRep} -- Post Count:${postCount} -- Current Voters:${currentVoters} -- Proftit Chance:${percentile} -- Avg Value:${avgValue}\n`)
        for (timeFrame of globalState.system.timeFrames) {
            if (authorRep >= globalState.globalVars.MINREP && postCount <= globalState.globalVars.MAXACTIVEPOSTS 
                && avgValue >= globalState.trackers[timeFrame].comments.minAvg && percentile >= globalState.globalVars.PROFITMIN
                && currentVoters <= globalState.globalVars.MAXVOTERS) {
                    scheduleTime = globalState.trackers[timeFrame].scheduleTime
                    timeName = timeFrame
                    timeFrame = globalState.trackers[timeFrame].comments.pendingInspections

                    return {
                        signal : true,
                        author : author,
                        avg : avgValue,
                        link : link,
                        parentPerm : parentPermLink,
                        age : minuteDiff,
                        perm : permlink,
                        timeFrame : timeFrame,
                        scheduleTime : scheduleTime,
                        timeName : timeName,
                        profitChance : percentile
                    }
                }
        }
        return {signal : false}
    }
}
//----------------------------------------------------


module.exports = {
    yt : yt,
    gt : gt,
    rt : rt,
    round : round,
    displayVotingPower : displayVotingPower,
    logTrackers : logTrackers,
    setGlobalOnlineLists : setGlobalOnlineLists,
    getVP : getVP,
    voteNow : voteNow,
    setSchedule : setSchedule,
    ScheduleFlag : ScheduleFlag
}