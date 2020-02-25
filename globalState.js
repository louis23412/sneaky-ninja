const fs = require('fs');

const { TRACKERS, GLOBALVARS } = JSON.parse(fs.readFileSync('./globalProps.json'));

module.exports = globalState = {
    globalVars : { ...GLOBALVARS },
    
    system : {
        timeFrames : ['mins5', 'mins15', 'mins30', 'mins45', 'mins60', 'mins120', 'mins240', 'mins360', 'mins480'],
        startTime : new Date(),
        blockCounter : 0,
        votingSteemPower : 0,
        startSP : 0,
        votingPower : 0,
        pendingAuthorList : [],
        fails : 0,
        operationInspections : 0
    },

    trackers : {
        onlineVotersList : {},

        offline : {
            offlineVoters : {}
        },

        mins5 : {
            minVP : TRACKERS.MINS5.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS5.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins15 : {
            minVP : TRACKERS.MINS15.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS15.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins30 : {
            minVP : TRACKERS.MINS30.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS30.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins45 : {
            minVP : TRACKERS.MINS45.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS45.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins60 : {
            minVP : TRACKERS.MINS60.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS60.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins120 : {
            minVP : TRACKERS.MINS120.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS120.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins240 : {
            minVP : TRACKERS.MINS240.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS240.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins360 : {
            minVP : TRACKERS.MINS360.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS360.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },

        mins480 : {
            minVP : TRACKERS.MINS480.MINVP,
            onlineList : [],
            votingTracker : {},
            scheduleTime : TRACKERS.MINS480.SCHEDULETIME,
            posts : {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            },
            comments: {
                errors: 0,
                votes: 0,
                inspections: 0,
                pendingInspections: []
            }
        },
    }
}