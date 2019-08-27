const router = require('./router.js')
const LID = require('../LogicalIdentifier.js')
const {httpGetFull, httpGet, httpGetRelated, stitchWithWebFields, httpGetIdentifiers} = require('./common.js')

function lookupTarget(lidvid) {
    if(!lidvid) {
        return new Promise((_, reject) => reject(new Error("Expected target parameter")))
    }
    if(lidvid.constructor === String) {
        lidvid = new LID(lidvid)
    }

    return httpGetFull([
        {
            url: router.targetsCore,
            params: {
                q: `identifier:"${lidvid.escaped}" AND data_class:"Target"`,
            }
        },
        {
            url: router.targetsWeb,
            params: {
                q: `logical_identifier:"${lidvid.escapedLid}"`
            }
        }
    ])
}

function getSpacecraftForTarget(target) {
    let targetLid = new LID(target.identifier)
    let params = {
        q: `target_ref:${targetLid.escapedLid}\\:\\:* AND data_class:"Instrument_Host"`
    }
    return httpGetRelated(params, router.spacecraftCore, []).then(stitchWithWebFields(['display_name', 'image_url'], router.spacecraftWeb))
}

function getDatasetsForTarget(target) {
    let targetLid = new LID(target.identifier)

    let params = {
        q: `(target_ref:${targetLid.escapedLid}\\:\\:* AND (product_class:"Product_Bundle" OR product_class:"Product_Collection"))`
    }
    return httpGet(router.datasetCore, params).then(stitchWithWebFields(['display_name', 'tags'], router.datasetWeb))
}

function getRelatedTargetsForTarget(target) {
    let targetLid = new LID(target.identifier).lid
    let childrenQuery = httpGet(router.targetRelationships, {
        q: `parent_ref:"${targetLid}"`,
        fl: 'child_ref'
    })
    let parentsQuery = httpGet(router.targetRelationships, {
        q: `child_ref:"${targetLid}"`,
        fl: 'parent_ref'
    })
    let associatedQuery = httpGet(router.targetRelationships, {
        q: `associated_targets:"${targetLid}"`
    })

    return new Promise((resolve, reject) => {
        Promise.all([childrenQuery, parentsQuery, associatedQuery]).then(results => {
            let [children, parents, associated] = results
            let lidMap = {
                children: children.map(c => c.child_ref),
                parents: parents.map(p => p.parent_ref),
                associated: associated.map(a => a.associated_targets.find(ref => ref !== targetLid))
            }
            let allIdentifiers = [...lidMap.children, ...lidMap.parents, ...lidMap.associated]
            httpGetIdentifiers(router.targetsCore, allIdentifiers).then(stitchWithWebFields(['display_name'], router.targetsWeb), reject).then(allTargets => {
                let toReturn = {
                    children: lidMap.children.map(childLid => allTargets.find(target => target.identifier === childLid)),
                    parents: lidMap.parents.map(parentLid => allTargets.find(target => target.identifier === parentLid)),
                    associated: lidMap.associated.map(associatedLid => allTargets.find(target => target.identifier === associatedLid))
                }
                resolve(toReturn)
            }, reject)
        }, reject)
    })
}

module.exports = {
    lookupTarget, getSpacecraftForTarget, getDatasetsForTarget, getRelatedTargetsForTarget
}