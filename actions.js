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
        console.log(`${yt('*')} ${timeRange} voters (${yt(globalState.trackers[timeRange].minVP)}++): ${yt(Object.keys(globalState.trackers[timeRange].votingTracker).length)} ==> [${displayVotingPower(globalState.trackers[timeRange].votingTracker)}]`)
        console.log(`└─| Post Votes: ${yt(globalState.trackers[timeRange].posts.votes)} || Post Vote Fails: ${yt(globalState.trackers[timeRange].posts.errors)} || Comment Votes: ${yt(globalState.trackers[timeRange].comments.votes)} || Comment Vote Fails: ${yt(globalState.trackers[timeRange].comments.errors)}`)
        console.log(`└─| Post Inspections: ${yt(globalState.trackers[timeRange].posts.inspections)} || Pending Post Inspections: ${yt(globalState.trackers[timeRange].posts.pendingInspections.length)} ==> [${displayTracker(globalState.trackers[timeRange].posts.pendingInspections)}]`)
        console.log(`└─| Comment Inspections: ${yt(globalState.trackers[timeRange].comments.inspections)} || Pending Comment Inspections: ${yt(globalState.trackers[timeRange].comments.pendingInspections.length)} ==> [${displayTracker(globalState.trackers[timeRange].comments.pendingInspections)}]`)
        console.log()
    }
}

const setGlobalOnlineLists = (globalState) => {
    globalState.trackers.onlineVotersList = {
        mins5List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins15List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins30List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins45List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList, globalState.trackers.mins45.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins60List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList, globalState.trackers.mins45.onlineList, globalState.trackers.mins60.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins120List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList, globalState.trackers.mins45.onlineList, globalState.trackers.mins60.onlineList, globalState.trackers.mins120.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins240List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList, globalState.trackers.mins45.onlineList, globalState.trackers.mins60.onlineList, globalState.trackers.mins120.onlineList, globalState.trackers.mins240.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins360List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList, globalState.trackers.mins45.onlineList, globalState.trackers.mins60.onlineList, globalState.trackers.mins120.onlineList, globalState.trackers.mins240.onlineList, globalState.trackers.mins360.onlineList).includes(voter[0])) {
                return voter
            }
        }),
        mins480List : USERLIST.filter(voter => {
            if ([].concat(globalState.trackers.mins5.onlineList, globalState.trackers.mins15.onlineList, globalState.trackers.mins30.onlineList, globalState.trackers.mins45.onlineList, globalState.trackers.mins60.onlineList, globalState.trackers.mins120.onlineList, globalState.trackers.mins240.onlineList, globalState.trackers.mins360.onlineList, globalState.trackers.mins480.onlineList).includes(voter[0])) {
                return voter
            }
        }),
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
        if (value[1].percentage / 100 >= globalState.trackers.mins5.minVP) {
            globalState.trackers.mins5.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins5.onlineList.includes(value[0])) {
                globalState.trackers.mins5.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins15.minVP) {
            globalState.trackers.mins15.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins15.onlineList.includes(value[0])) {
                globalState.trackers.mins15.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins30.minVP) {
            globalState.trackers.mins30.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins30.onlineList.includes(value[0])) {
                globalState.trackers.mins30.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins45.minVP) {
            globalState.trackers.mins45.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins45.onlineList.includes(value[0])) {
                globalState.trackers.mins45.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins60.minVP) {
            globalState.trackers.mins60.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins60.onlineList.includes(value[0])) {
                globalState.trackers.mins60.onlineList.push(value[0])
            }
        }else if (value[1].percentage / 100 >= globalState.trackers.mins120.minVP) {
            globalState.trackers.mins120.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins120.onlineList.includes(value[0])) {
                globalState.trackers.mins120.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins240.minVP) {
            globalState.trackers.mins240.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins240.onlineList.includes(value[0])) {
                globalState.trackers.mins240.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins360.minVP) {
            globalState.trackers.mins360.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins360.onlineList.includes(value[0])) {
                globalState.trackers.mins360.onlineList.push(value[0])
            }
        } else if (value[1].percentage / 100 >= globalState.trackers.mins480.minVP) {
            globalState.trackers.mins480.votingTracker[value[0]] = value[1]
            if (!globalState.trackers.mins480.onlineList.includes(value[0])) {
                globalState.trackers.mins480.onlineList.push(value[0])
            }
        } else {
            globalState.trackers.offline.offlineVoters[value[0]] = value[1]
        }
    }

    let maxPower = 0
    for (time in globalState.trackers) {
        if (time != 'offline' && time!= 'onlineVotersList') {
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
                if (timeName === '5mins') {
                    if (type === 'post') {
                        globalState.trackers.mins5.posts.errors++
                    } else {
                        globalState.trackers.mins5.comments.errors++
                    }
                } else if (timeName === '15mins') {
                    if (type === 'post') {
                        globalState.trackers.mins15.posts.errors++
                    } else {
                        globalState.trackers.mins15.comments.errors++
                    }
                } else if (timeName === '30mins') {
                    if (type === 'post') {
                        globalState.trackers.mins30.posts.errors++
                    } else {
                        globalState.trackers.mins30.comments.errors++
                    }
                } else if (timeName === '45mins') {
                    if (type === 'post') {
                        globalState.trackers.mins45.posts.errors++
                    } else {
                        globalState.trackers.mins45.comments.errors++
                    }
                } else if (timeName === '60mins') {
                    if (type === 'post') {
                        globalState.trackers.mins60.posts.errors++
                    } else {
                        globalState.trackers.mins60.comments.errors++
                    }
                } else if (timeName === '120mins') {
                    if (type === 'post') {
                        globalState.trackers.mins120.posts.errors++
                    } else {
                        globalState.trackers.mins120.comments.errors++
                    }
                } else if (timeName === '240mins') {
                    if (type === 'post') {
                        globalState.trackers.mins240.posts.errors++
                    } else {
                        globalState.trackers.mins240.comments.errors++
                    }
                } else if (timeName === '360mins') {
                    if (type === 'post') {
                        globalState.trackers.mins360.posts.errors++
                    } else {
                        globalState.trackers.mins360.comments.errors++
                    }
                } else if (timeName === '480mins') {
                    if (type === 'post') {
                        globalState.trackers.mins480.posts.errors++
                    } else {
                        globalState.trackers.mins480.comments.errors++
                    }
                }
                fs.appendFileSync('./logs/errorlog.txt', `${err}\n`)
            } else {
                console.log(gt(`Vote success with a voteweight of ${(voteWeight) / 100}%!`));
            }
        });
        
        let updatedUserListToVote = [...newUserList];
        updatedUserListToVote.splice(0, 1);
        voteNow(globalState, author, postperm, link, age, blockid, type, voteWeight, updatedUserListToVote, timeName);
    } else if (newUserList.length === 0 ) {
        fs.appendFileSync('./logs/votelog.txt', `AUTHOR: ${author} -- LINK: ${link} -- DATE: ${new Date()} -- VOTED AFTER: ${age} mins -- Block-Id: ${blockid}\n---------------------------\n`)
        if (timeName === '5mins') {
            if (type === 'post') {
                globalState.trackers.mins5.posts.votes++
            } else {
                globalState.trackers.mins5.comments.votes++
            }
        } else if (timeName === '15mins') {
            if (type === 'post') {
                globalState.trackers.mins15.posts.votes++
            } else {
                globalState.trackers.mins15.comments.votes++
            }
        } else if (timeName === '15mins') {
            if (type === 'post') {
                globalState.trackers.mins15.posts.votes++
            } else {
                globalState.trackers.mins15.comments.votes++
            }
        } else if (timeName === '30mins') {
            if (type === 'post') {
                globalState.trackers.mins30.posts.votes++
            } else {
                globalState.trackers.mins30.comments.votes++
            }
        } else if (timeName === '45mins') {
            if (type === 'post') {
                globalState.trackers.mins45.posts.votes++
            } else {
                globalState.trackers.mins45.comments.votes++
            }
        } else if (timeName === '60mins') {
            if (type === 'post') {
                globalState.trackers.mins60.posts.votes++
            } else {
                globalState.trackers.mins60.comments.votes++
            }
        } else if (timeName === '120mins') {
            if (type === 'post') {
                globalState.trackers.mins120.posts.votes++
            } else {
                globalState.trackers.mins120.comments.votes++
            }
        } else if (timeName === '240mins') {
            if (type === 'post') {
                globalState.trackers.mins240.posts.votes++
            } else {
                globalState.trackers.mins240.comments.votes++
            }
        } else if (timeName === '360mins') {
            if (type === 'post') {
                globalState.trackers.mins360.posts.votes++
            } else {
                globalState.trackers.mins360.comments.votes++
            }
        } else if (timeName === '480mins') {
            if (type === 'post') {
                globalState.trackers.mins480.posts.votes++
            } else {
                globalState.trackers.mins480.comments.votes++
            }
        }
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

            if (timeName === '5mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins5.posts.inspections++
                } else {
                    globalState.trackers.mins5.comments.inspections++
                }
            } else if (timeName === '15mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins15.posts.inspections++
                } else {
                    globalState.trackers.mins15.comments.inspections++
                }
            } else if (timeName === '30mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins30.posts.inspections++
                } else {
                    globalState.trackers.mins30.comments.inspections++
                }
            } else if (timeName === '45mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins45.posts.inspections++
                } else {
                    globalState.trackers.mins45.comments.inspections++
                }
            } else if (timeName === '60mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins60.posts.inspections++
                } else {
                    globalState.trackers.mins60.comments.inspections++
                }
            } else if (timeName === '120mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins120.posts.inspections++
                } else {
                    globalState.trackers.mins120.comments.inspections++
                }
            } else if (timeName === '240mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins240.posts.inspections++
                } else {
                    globalState.trackers.mins240.comments.inspections++
                }
            } else if (timeName === '360mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins360.posts.inspections++
                } else {
                    globalState.trackers.mins360.comments.inspections++
                }
            } else if (timeName === '480mins') {
                if (contentType === 'post') {
                    globalState.trackers.mins480.posts.inspections++
                } else {
                    globalState.trackers.mins480.comments.inspections++
                }
            }

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
                let newVoteWeight = Math.round(globalState.globalVars.VOTEWEIGHT * avgValue)
                if (newVoteWeight > 10000) {
                    newVoteWeight = 10000;
                }

                if (timeName === '5mins') {
                    if (globalState.trackers.onlineVotersList.mins5List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins5List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins5List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '15mins') {
                    if (globalState.trackers.onlineVotersList.mins15List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins15List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins15List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '30mins') {
                    if (globalState.trackers.onlineVotersList.mins30List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins30List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins30List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '45mins') {
                    if (globalState.trackers.onlineVotersList.mins45List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins45List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins45List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '60mins') {
                    if (globalState.trackers.onlineVotersList.mins60List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins60List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins60List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '120mins') {
                    if (globalState.trackers.onlineVotersList.mins120List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins120List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins120List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '240mins') {
                    if (globalState.trackers.onlineVotersList.mins240List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins240List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins240List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '360mins') {
                    if (globalState.trackers.onlineVotersList.mins360List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins360List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins360List, timeName);
                    } else {
                        console.log(rt('No accounts available to vote!'))
                    }
                } else if (timeName === '480mins') {
                    if (globalState.trackers.onlineVotersList.mins480List.length > 0) {
                        const linkList = link.split('/')
                        const postPerm = linkList[linkList.length -1]
                        console.log(gt(`VOTE OPPORTUNITY DETECTED! Broadcasting now with ${globalState.trackers.onlineVotersList.mins480List.length} accounts...`))
                        console.log(`---------------------`)
                        voteNow(globalState, author, postPerm, link, MinuteDiff, blockId, contentType, newVoteWeight, globalState.trackers.onlineVotersList.mins480List, timeName);
                    } else {
                        console.log(rt('No accounts availbe to vote!'))
                    }
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

    if (type === 'comment') {
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
    if (isNaN(avgValue)) {
        avgValue = 0.000
    }

    const percentile = calculateProfit(valueData, avgValue);

    let votesignal = false
    if (type === 'post') {
        fs.appendFileSync('./logs/signalLog.txt', `Inspecting post ==> AUTHOR: https://steemit.com/@${author}/posts -- REP:${authorRep} -- Post Count:${postCount} -- Current Voters:${currentVoters} -- Proftit Chance:${percentile} -- Avg Value:${avgValue}\n`)
        if (authorRep >= globalState.globalVars.MINREP && postCount <= globalState.globalVars.MAXACTIVEPOSTS
            && avgValue >= globalState.globalVars.MINAVGPOST && percentile >= globalState.globalVars.PROFITMIN 
            && currentVoters <= globalState.globalVars.MAXVOTERS ) {
                votesignal = true;
        }
    } else if (type === 'comment') {
        fs.appendFileSync('./logs/signalLog.txt', `Inspecting comment ==> AUTHOR: https://steemit.com/@${author}/comments -- REP:${authorRep} -- Post Count:${postCount} -- Current Voters:${currentVoters} -- Proftit Chance:${percentile} -- Avg Value:${avgValue}\n`)
        if (authorRep >= globalState.globalVars.MINREP && avgValue >= globalState.globalVars.MINAVGCOMMENT
            && currentVoters <= globalState.globalVars.MAXVOTERS && percentile >= globalState.globalVars.PROFITMIN) {
                votesignal = true;
        }
    }

    if (votesignal === true) {
        let timeFrame = ''
        let scheduleTime = ''
        let timeName = ''
        if (globalState.trackers.mins5.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins5.scheduleTime
            timeName = '5mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins5.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins5.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins15.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins15.scheduleTime
            timeName = '15mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins15.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins15.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins30.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins30.scheduleTime
            timeName = '30mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins30.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins30.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins45.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins45.scheduleTime
            timeName = '45mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins45.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins45.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins60.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins60.scheduleTime
            timeName = '60mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins60.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins60.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins120.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins120.scheduleTime
            timeName = '120mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins120.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins120.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins240.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins240.scheduleTime
            timeName = '240mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins240.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins240.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins360.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins360.scheduleTime
            timeName = '360mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins360.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins360.comments.pendingInspections
            }

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
                timeName : timeName
            }
        } else if (globalState.trackers.mins480.onlineList.length > 0) {
            scheduleTime = globalState.trackers.mins480.scheduleTime
            timeName = '480mins'
            if (type === 'post') {
                timeFrame = globalState.trackers.mins480.posts.pendingInspections
            } else {
                timeFrame = globalState.trackers.mins480.comments.pendingInspections
            }
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
                timeName : timeName
            }
        }
    } else {
        return {
            signal : false,
            author : author,
            avg : avgValue,
            link : link,
            parentPerm : parentPermLink,
            age : minuteDiff,
            perm : permlink
        };
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