const fs = require('fs');
var dsteem = require('dsteem')
const steem = require('steem')

const client = new dsteem.Client('https://api.steemit.com')

const globalPropsFile = fs.readFileSync('./globalProps.json')
const globalProps = JSON.parse(globalPropsFile);
const {USERLIST} = globalProps

const userNamesList = USERLIST.map(user => {
    return user[0]
})

const data = fs.readFileSync('./log.txt', 'utf-8')
const dataList = data.split('---------------------------')

const main = async () => {
    let totalCuration = 0
    const totalVotes = dataList.length - 1
    let counter = 0
    let Biggest = 0
    let BiggestLink

    await steem.api.getOrderBook(10, function(err, result) {
        const sbdToSteemPrice = result.bids[0].real_price

        dataList.forEach(async vote => {
            if (vote.indexOf('https') > -1) {
                const startingIndex = vote.indexOf('https')
                const fromLink = vote.slice(startingIndex)
        
                fromLinkList = fromLink.split(' ')
                const linkOnly = fromLinkList[0]
                const postData = await client.database.getState(linkOnly.replace('https://steemit.com/', ''))
                const postDetails = Object.values(postData.content)[0]
                const totalRShares = Number(postDetails.net_rshares)
    
                const pendingPayout = Number(postDetails.pending_payout_value.replace(' SBD', ''))
                const didPayout = Number(postDetails.total_payout_value.replace(' SBD', ''))
    
                if (didPayout === 0) {
                    counter += 1
                    const curatorPayout = pendingPayout / 2
                    let rshares = 0
                    let accountsVoted = 0
                    postDetails.active_votes.forEach(voter => {
                        if (userNamesList.includes(voter.voter)) {
                            accountsVoted += 1
                            rshares = rshares + Number(voter.rshares)
                        }
                    })
    
                    const pctOwned = rshares / totalRShares
                    const sbdCuration = curatorPayout * pctOwned
                    
                    if (sbdCuration > Biggest) {
                        Biggest = sbdCuration
                        BiggestLink = linkOnly
                    }
                    totalCuration += sbdCuration
        
                    console.log(`(\x1b[33m${counter}\x1b[0m / \x1b[33m${totalVotes}\x1b[0m) ==> LINK: \x1b[33m${linkOnly}\x1b[0m`)
                    console.log(`Accounts Voted: \x1b[33m${accountsVoted}\x1b[0m -- Post total Rshares: \x1b[33m${totalRShares}\x1b[0m -- Total Rshares owned: \x1b[33m${rshares}\x1b[0m`)
                    console.log(`Pct-Owned: \x1b[33m${pctOwned * 100}%\x1b[0m -- SBD-Payout: \x1b[33m${sbdCuration}\x1b[0m -- STEEM-Payout: \x1b[33m${sbdCuration / sbdToSteemPrice}\x1b[0m`)
                    console.log('---------')
                }

                if (counter === totalVotes) {
                    console.log(`Total Sbd-Curation: \x1b[33m${totalCuration}\x1b[0m -- Total STEEM-Curation: \x1b[33m${totalCuration / sbdToSteemPrice}\x1b[0m -- AVG: \x1b[33m${(totalCuration / sbdToSteemPrice) / counter}\x1b[0m -- Biggest payout in SBD: \x1b[33m${Biggest}\x1b[0m => STEEM: \x1b[33m${Biggest / sbdToSteemPrice}\x1b[0m => LINK: \x1b[33m${BiggestLink}\x1b[0m`)
                }
            }
        })
    });
}

main()