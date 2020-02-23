module.exports =  globalState = {
    system : {
        startTime : new Date(),
        blockCounter : 0,
        votingSteemPower : 0,
        startSP : 0,
        votingPower : 0,
        pendingAuthorList : [],
        fails : 0
    },

    trackers : {
        onlineVotersList : {},

        offline : {
            offlineVoters : {}
        },

        mins5 : {
            minVP : 97,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 3.98,
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
            minVP : 96.5,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 14.88,
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
            minVP : 96,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 29.88,
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
            minVP : 95.5,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 44.88,
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
            minVP : 95,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 59.88,
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
            minVP : 94.5,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 121.88,
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
            minVP : 94,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 239.88,
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
            minVP : 93.5,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 359.88,
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
            minVP : 93,
            onlineList : [],
            votingTracker : {},
            scheduleTime : 479.88,
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