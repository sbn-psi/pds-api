const request = require('request-promise-native')
const desolrize = require('../desolrize.js')
const LID = require('../LogicalIdentifier.js')

const defaultParameters = () => { return {
    wt: 'json'
}}
let fail = msg => new Promise((_, reject) => { reject(new Error(msg)) })

function httpGet(endpoint, params) {
    const paramsWithDefaultsApplied = Object.assign(defaultParameters(), params)
    return new Promise(async (resolve, reject) => {
        try {
            let response = await request({ uri: endpoint, json: true, qs: paramsWithDefaultsApplied })
            resolve(desolrize(response))
        } catch (error) {
            reject(error)
        }
    })
}

function httpGetIdentifiers(route, identifiers) {
    if(!identifiers) return new Promise((resolve, _) => { resolve([])})
    let lids = identifiers.constructor === String ? [identifiers] : identifiers
    let params = {
        q: lids.reduce((query, lid) => query + 'identifier:"' + new LID(lid).lid + '" ', '')
    }
    return httpGet(route, params)
}

function httpGetFull(endpoints) {

    if(!endpoints || endpoints.constructor !== Array) fail("Expected array of API calls")
    if(endpoints.length !== 2) fail("Expected only two endpoints to call")

    return new Promise((resolve, reject) => {
        let calls = endpoints.map(endpoint => httpGet(endpoint.url, endpoint.params))
        Promise.all(calls).then(values => {
            let [core, webUI] = values
            if(!core) {
                reject(new Error(`None found`))
            }
            else if(webUI.length === 1 && core.length === 1) {
                let consolidated = Object.assign({}, core[0])
                resolve(Object.assign(consolidated, webUI[0]))
            } else if (core.length === 1) {
                resolve(core[0])
            } else {
                reject(new Error(`Received unexpected number of results
                
                ${webUI.map(w => w.logical_identifier).join('\n')}
                ${core.map(c => c.lid).join('\n')}
                `))
            }
        }, error => {
            reject(error)
        })
    })
}

function httpGetRelated(initialQuery, route, knownLids) {
    return new Promise(async (resolve, reject) => {
        try {
            let results = await httpGet(route, initialQuery)
            let foundLids = results.map(items => items.identifier)
            if(!knownLids || knownLids.length === 0 || arraysEquivalent(foundLids, knownLids)) {
                // if we have all the referenced items, just return them
                resolve(results)
            } else {
                // otherwise, perform another query to get the other 
                let otherResults = await httpGetIdentifiers(route, knownLids)
                // and combine them with the original list
                let combined = [...results, ...otherResults]
                resolve(combined.filter((item, index) => combined.findIndex(otherItem => item.identifier === otherItem.identifier) === index))
            }
        } catch (error) {
            reject(error)
        }
    })
}
function arraysEquivalent(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((el) => arr2.includes(el))
}


function stitchWithWebFields(fields, route) {
    if(!fields.includes('logical_identifier')) { fields.push('logical_identifier')}
    return (previousResult) => {
        return new Promise(async (resolve, _) => {
            let identifiers = previousResult.map(doc => doc.identifier)
            let params = {
                q: identifiers.reduce((query, lid) => query + 'logical_identifier:"' + lid + '" ', ''),
                fl: fields.join()
            }
            try {
                let webDocs = await httpGet(route, params)
                let toReturn = []
                // combine documents by lid
                for (let coreDoc of previousResult ) {
                    let consolidated = Object.assign({}, coreDoc)
                    let corresponding = webDocs.find(webUIdoc => new LID(webUIdoc.logical_identifier).lid === new LID(coreDoc.identifier).lid)
                    if(!!corresponding) {
                        toReturn.push(Object.assign(consolidated, corresponding))
                    } else {
                        toReturn.push(consolidated)
                    }
                }
                resolve(toReturn)
            } catch (error) {
                //ignore error, just pass original
                resolve(previousResult)
            }
        })
    }
}

module.exports = {
    httpGet, httpGetIdentifiers, httpGetFull, httpGetRelated, stitchWithWebFields
}