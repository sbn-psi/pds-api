const router = require('./router.js')
const LID = require('../LogicalIdentifier.js')
const {httpGetFull, httpGetRelated, stitchWithWebFields} = require('./common.js')

function lookupMission(lidvid) {
    if(!lidvid) {
        return new Promise((_, reject) => reject(new Error("Expected mission parameter")))
    }
    if(lidvid.constructor === String) {
        lidvid = new LID(lidvid)
    }

    return httpGetFull([
        {
            url: router.missionsCore,
            params: {
                q: `identifier:"${lidvid.escaped}" AND data_class:"Investigation"`,
            }
        },
        {
            url: router.missionsWeb,
            params: {
                q: `logical_identifier:"${lidvid.escapedLid}"`
            }
        }
    ])
}

function getSpacecraftForMission(mission) {
    let missionLid = new LID(mission.identifier)
    let knownSpacecraft = mission.instrument_host_ref
    let params = {
        q: `investigation_ref:${missionLid.escapedLid}\\:\\:* AND data_class:"Instrument_Host"`
    }
    return httpGetRelated(params, router.spacecraftCore, knownSpacecraft).then(stitchWithWebFields(['display_name', 'image_url'], router.spacecraftWeb))
}

function getTargetsForMission(mission) {
    let missionLid = new LID(mission.identifier)
    let knownTargets = mission.target_ref
    let params = {
        q: `investigation_ref:${missionLid.escapedLid}\\:\\:* AND data_class:"Target"`
    }
    return httpGetRelated(params, router.targetsCore, knownTargets).then(stitchWithWebFields(['display_name', 'is_major'], router.targetsWeb))
}

module.exports = { lookupMission, getSpacecraftForMission, getTargetsForMission }