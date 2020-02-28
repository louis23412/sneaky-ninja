const dsteem = require('dsteem')
const fs = require('fs');
const es = require('event-stream');
const util = require('util');
const actions = require('./actions');
let globalState = require('./globalState')

const client = new dsteem.Client('https://api.steemit.com');
const stream = client.blockchain.getBlockStream('Latest');

const { USERLIST } = JSON.parse(fs.readFileSync('./globalProps.json'));

const userNamesList = USERLIST.map(user => {
    return user[0];
});

const dir = './logs';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

fs.writeFileSync('./logs/signalLog.txt', `Sneaky ninja start time: ${globalState.system.startTime}\n--------------------------\n`)
fs.writeFileSync('./logs/votelog.txt', `Sneaky ninja start time: ${globalState.system.startTime}\n--------------------------\n`)
fs.writeFileSync('./logs/errorlog.txt', `Sneaky ninja start time: ${globalState.system.startTime}\n--------------------------\n`)

console.clear()
console.log('Starting up block stream...')

stream.pipe(es.map(async (block, callback) => {
    callback(null, util.inspect(block, {colors: true, depth: null}) + '\n')

    try {
        globalState.system.votingPower = await actions.getVP(globalState);
    } catch (err) {
        console.log(actions.rt(`GetVP error! -- ${err}`))
    }
    actions.setGlobalOnlineLists(globalState);

    let voteStatus = actions.rt(`Recharging Steem Power...`)
    for (timeFrame of [...globalState.system.timeFrames].reverse()) {
        if (globalState.system.votingPower > globalState.trackers[timeFrame].minVP) {
            voteStatus = actions.gt(`Prioritizing ${globalState.trackers[timeFrame].scheduleTime} min voters`);
        }
    }

    const data = block.transactions
    const blockId = block.block_id
    globalState.system.blockCounter ++

    if (globalState.system.blockCounter === 1) {
        globalState.system.startSP = globalState.system.votingSteemPower
    }

    const runtimeSPGain = globalState.system.votingSteemPower - globalState.system.startSP
    const blockCatchRatio = `${actions.yt(actions.round((globalState.system.blockCounter / (actions.round((new Date() - globalState.system.startTime) / 1000 / 60, 2) * 20)) * 100, 2) + '%')}`

    console.log(`${actions.yt('*')} Status: ${voteStatus} || Run-time: ${actions.yt(actions.round((new Date() - globalState.system.startTime) / 1000 / 60, 2) + ' mins')} || Highest-VP: ${actions.yt(actions.round(globalState.system.votingPower, 3) + '%')} || Block Catch Ratio: ${blockCatchRatio}`)
    console.log(`${actions.yt('*')} Block-ID: ${actions.yt(blockId)} || ${actions.yt(globalState.system.blockCounter)} blocks inspected! || ${actions.yt(globalState.system.operationInspections)} operations inspected!`)
    console.log(`${actions.yt('*')} Accounts Linked: ${actions.yt(userNamesList.length)} || Total SP voting: ${actions.yt(globalState.system.votingSteemPower)} || Run-time SP Gain: ${actions.yt(runtimeSPGain)}`)
    console.log(`${actions.yt('*')} Total Votes: ${actions.yt(globalState.system.totalVotes)} || Total Vote Fails: ${actions.yt(globalState.system.totalErrors)} || Total Inspections: ${actions.yt(globalState.system.totalInspections)} || Total Pending inspections: ${actions.yt(globalState.system.pendingAuthorList.length)}`)
    console.log()

    if (globalState.globalVars.ACTIVATELOGGING === true) {
        actions.logTrackers(globalState)
        console.log(`${actions.yt('*')} Offline voters: ${actions.yt(Object.keys(globalState.trackers.offline.offlineVoters).length)} ==> [${actions.displayVotingPower(globalState.trackers.offline.offlineVoters)}]`)
    }

    console.log(`${actions.yt('----------------------------------------------------------------------')}`)

    if (globalState.globalVars.ACTIVATEPOSTS === false && globalState.globalVars.ACTIVATECOMMENTS === false) {
        console.log(actions.rt('Posts & comments are both disabled! Please activate atleast one.'))
    }

    data.forEach(async trans => {
        const operations = trans.operations
        const typeOf = operations[0][0]
        const operationDetails = operations[0][1]

        if (typeOf === 'comment' && operationDetails.parent_author === '' && globalState.globalVars.ACTIVATEPOSTS === true) {
            try {
                const answer = await actions.ScheduleFlag(globalState, operationDetails, 'posts')
                if (answer.signal === true && !globalState.system.pendingAuthorList.includes(answer.author)) {
                    answer.timeFrame.push(answer.author)
                    globalState.system.pendingAuthorList.push(answer.author)
                    console.log('Post Detected!')
                    console.log(`In block: ${actions.yt(blockId)} | Match #: ${actions.yt(answer.timeFrame.length)}`)
                    console.log(`Author: ${actions.yt(answer.author)} | Content-age: ${actions.yt(actions.round(answer.age, 2))} | Avg Value: ${actions.yt(answer.avg)} | Profit Chance: ${actions.yt(actions.round(answer.profitChance, 3) + '%')}`)
                    console.log(`Content-link: ${actions.yt(answer.link)}`)
    
                    let scheduleTime = (answer.scheduleTime * 60) * 1000 - ((answer.age * 60) * 1000)
                    actions.setSchedule(globalState, scheduleTime, 'posts', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId, answer.timeFrame, answer.timeName);
                }
            } catch (err) {
                console.log(actions.rt(`Post ScheduleFlag Error! -- ${err}`))
            }
        } else if (typeOf === 'comment' && operationDetails.parent_author != '' && globalState.globalVars.ACTIVATECOMMENTS === true) {
            try {
                const answer = await actions.ScheduleFlag(globalState, operationDetails, 'comments')
                if (answer.signal === true && !globalState.system.pendingAuthorList.includes(answer.author)) {
                    answer.timeFrame.push(answer.author)
                    globalState.system.pendingAuthorList.push(answer.author)
                    console.log('Comment Detected!')
                    console.log(`In block: ${actions.yt(blockId)} | Match #: ${actions.yt(answer.timeFrame.length)}`)
                    console.log(`Author: ${actions.yt(answer.author)} | Content-age: ${actions.yt(actions.round(answer.age, 2))} | Avg Value: ${actions.yt(answer.avg)} | Profit Chance: ${actions.yt(actions.round(answer.profitChance, 3) + '%')}`)
                    console.log(`Content-link: ${actions.yt(answer.link)}`)
    
                    let scheduleTime = (answer.scheduleTime * 60) * 1000 - ((answer.age * 60) * 1000)
                    actions.setSchedule(globalState, scheduleTime, 'comments', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId, answer.timeFrame, answer.timeName);
                }
            } catch (err) {
                console.log(actions.rt(`Comment ScheduleFlag Error! -- ${err}`))
            }
        }
    })
}))