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

    let voteStatus = actions.gt(`Recharging Steem Power...`)
    if (globalState.system.votingPower >= globalState.trackers.mins5.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins5.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins15.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins15.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins30.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins30.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins45.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins45.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins60.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins60.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins120.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins120.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins240.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins240.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins360.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins360.scheduleTime} min inspections`)
    } else if (globalState.system.votingPower >= globalState.trackers.mins480.minVP) {
        voteStatus = actions.gt(`Scheduling ${globalState.trackers.mins480.scheduleTime} min inspections`)
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
    console.log();
    console.log(`${actions.yt('*')} Accounts Linked: ${actions.yt(userNamesList.length)} || Total SP voting: ${actions.yt(globalState.system.votingSteemPower)} || Run-time SP Gain: ${actions.yt(runtimeSPGain)}`)
    console.log(`└─| Base VoteWeight: ${actions.yt((globalState.globalVars.VOTEWEIGHT / 100) + '%')} || Min Value Post: ${actions.yt(globalState.globalVars.MINAVGPOST)} || Min Value Comment: ${actions.yt(globalState.globalVars.MINAVGCOMMENT)}`)
    console.log()

    actions.logTrackers(globalState)
    console.log(`└─| Offline voters: ${actions.yt(Object.keys(globalState.trackers.offline.offlineVoters).length)} ==> [${actions.displayVotingPower(globalState.trackers.offline.offlineVoters)}]`)
    console.log(`${actions.yt('----------------------------------------------------------------------')}`)
    

    data.forEach(async trans => {
        const operations = trans.operations
        const typeOf = operations[0][0]
        const operationDetails = operations[0][1]

        if (typeOf === 'comment' && operationDetails.parent_author === '') {
            const answer = await actions.ScheduleFlag(globalState, operationDetails, 'post')
            if (answer.signal === true && !globalState.system.pendingAuthorList.includes(answer.author)) {
                answer.timeFrame.push(answer.author)
                globalState.system.pendingAuthorList.push(answer.author)
                console.log('Post Detected!')
                console.log(`In block: ${actions.yt(blockId)} | Match #: ${actions.yt(answer.timeFrame.length)}`)
                console.log(`Author: ${actions.yt(answer.author)} | Content-age: ${actions.yt(actions.round(answer.age, 2))}`)
                console.log(`Content-link: ${actions.yt(answer.link)}`)

                let scheduleTime = (answer.scheduleTime * 60) * 1000 - ((answer.age * 60) * 1000)
                actions.setSchedule(globalState, scheduleTime, 'post', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId, answer.timeFrame, answer.timeName);
            }
        } else if (typeOf === 'comment' && operationDetails.parent_author != '' && globalState.globalVars.ACTIVATECOMMENTS === true) {
            const answer = await actions.ScheduleFlag(globalState, operationDetails, 'comment')
            if (answer.signal === true && !globalState.system.pendingAuthorList.includes(answer.author)) {
                answer.timeFrame.push(answer.author)
                globalState.system.pendingAuthorList.push(answer.author)
                console.log('Comment Detected!')
                console.log(`In block: ${actions.yt(blockId)} | Match #: ${actions.yt(answer.timeFrame.length)}`)
                console.log(`Author: ${actions.yt(answer.author)} | Content-age: ${actions.yt(actions.round(answer.age, 2))}`)
                console.log(`Content-link: ${actions.yt(answer.link)}`)

                let scheduleTime = (answer.scheduleTime * 60) * 1000 - ((answer.age * 60) * 1000)
                actions.setSchedule(globalState, scheduleTime, 'comment', answer.author, answer.parentPerm, answer.perm, answer.avg, answer.link, blockId, answer.timeFrame, answer.timeName);
            }
        }
    })
}))