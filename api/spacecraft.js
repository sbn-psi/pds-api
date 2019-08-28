const router = require('./router.js')
const LID = require('../LogicalIdentifier.js')
const {httpGetFull, httpGet, httpGetRelated, stitchWithWebFields} = require('./common.js')

function lookupSpacecraft(lidvid) {
    if(!lidvid) {
        return new Promise((_, reject) => reject(new Error("Expected spacecraft parameter")))
    }
    if(lidvid.constructor === String) {
        lidvid = new LID(lidvid)
    }

    return httpGetFull([
        {
            url: router.spacecraftCore,
            params: {
                q: `identifier:"${lidvid.escaped}" AND data_class:"Instrument_Host"`,
            }
        },
        {
            url: router.spacecraftWeb,
            params: {
                q: `logical_identifier:"${lidvid.escapedLid}"`
            }
        }
    ])
}

function getMissionsForSpacecraft(spacecraft) {
    let spacecraftLid = new LID(spacecraft.identifier)
    let knownMissions = spacecraft.investigation_ref
    let params = {
        q: `instrument_host_ref:${spacecraftLid.escapedLid}\\:\\:* AND data_class:"Investigation"`
    }
    return httpGetRelated(params, router.missionsCore, knownMissions).then(stitchWithWebFields(['display_name', 'image_url', 'display_description'], router.missionsWeb))
}

function getInstrumentsForSpacecraft(spacecraft) {
    let spacecraftLid = new LID(spacecraft.identifier)
    let knownInstruments = spacecraft.instrument_ref
    let params = {
        q: `instrument_host_ref:${spacecraftLid.escapedLid}\\:\\:* AND data_class:"Instrument"`
    }
    return httpGetRelated(params, router.instrumentsCore, knownInstruments).then(stitchWithWebFields(['display_name', 'is_prime'], router.instrumentsWeb))
}

function getTargetsForSpacecraft(spacecraft) {
    let spacecraftLid = new LID(spacecraft.identifier)
    let knownTargets = spacecraft.target_ref
    let params = {
        q: `instrument_host_ref:${spacecraftLid.escapedLid}\\:\\:* AND data_class:"Target"`
    }
    return httpGetRelated(params, router.targetsCore, knownTargets).then(stitchWithWebFields(['display_name', 'is_major'], router.targetsWeb))
}

function getDatasetsForSpacecraft(spacecraft) {
    let spacecraftLid = new LID(spacecraft.identifier)

    let params = {
        q: `(instrument_host_ref:${spacecraftLid.escapedLid}\\:\\:* AND (product_class:"Product_Bundle" OR product_class:"Product_Collection"))`
    }
    return httpGet(router.datasetCore, params).then(stitchWithWebFields(['display_name', 'tags'], router.datasetWeb))
}

module.exports = { lookupSpacecraft, getMissionsForSpacecraft, getInstrumentsForSpacecraft, getTargetsForSpacecraft, getDatasetsForSpacecraft }