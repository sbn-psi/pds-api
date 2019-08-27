const router = require('./router.js')
const LID = require('../LogicalIdentifier.js')
const {httpGetFull, httpGet, stitchWithWebFields, httpGetIdentifiers} = require('./common.js')

export function lookupDataset(lidvid) {
    if(!lidvid) {
        return new Promise((_, reject) => reject(new Error("Expected dataset parameter")))
    }
    if(lidvid.constructor === String) {
        lidvid = new LID(lidvid)
    }

    return httpGetFull([
        {
            url: router.datasetCore,
            params: {
                q: `identifier:"${lidvid.escapedLid}"`,
            }
        },
        {
            url: router.datasetWeb,
            params: {
                fl: '*,[child parentFilter=attrname:dataset]',
                wt: 'ujson',
                q: `logical_identifier:"${lidvid.escaped}"`
            }
        }
    ])
}

export function getCollectionsForDataset(dataset) {
    if(!dataset.collection_ref || dataset.collection_ref.length === 0) { return new Promise((resolve, _) => resolve([]))}
    let lids = dataset.collection_ref.map(str => new LID(str).lid)

    let params = {
            fl: 'display_name,logical_identifier,document_flag,[child parentFilter=attrname:dataset]',
            wt: 'ujson',
            q: lids.reduce((query, lid) => query + `logical_identifier:"${new LID(lid).lidvid}" `, '')
        }
    return new Promise((resolve, reject) => {
        Promise.all([httpGetIdentifiers(router.datasetCore, lids), httpGet(router.datasetWeb, params)]).then(results => {
            let [coreDocs, webDocs] = results 
            if(coreDocs.length ===  webDocs.length) {
                let toReturn = []
                // combine documents by lid
                for (let coreDoc of coreDocs ) {
                    let consolidated = Object.assign({}, coreDoc)
                    let corresponding = webDocs.find(webUIdoc => new LID(webUIdoc.logical_identifier).lid === new LID(coreDoc.identifier).lid)
                    toReturn.push(Object.assign(consolidated, corresponding))
                }
                resolve(toReturn)
            } else {
                // can't find matching documents, so just return the results of original query
                resolve(coreDocs)
            }
        })
    })
}

export function getBundlesForCollection(dataset) {
    let lid = new LID(dataset.identifier, dataset.version_id)
    let params = {
            wt: 'json',
            q: `product_class:"Product_Bundle" AND collection_ref:"${lid.lidvid}"`
        }
    
    return httpGet(router.datasetCore, params).then(stitchWithWebFields(['display_name'], router.datasetWeb))
}

export function getTargetsForDataset(dataset) {
    return httpGetIdentifiers(router.targetsCore, dataset.target_ref).then(stitchWithWebFields(['display_name', 'is_major'], router.targetsWeb))
}
export function getSpacecraftForDataset(dataset) {
    return httpGetIdentifiers(router.spacecraftCore, dataset.instrument_host_ref).then(stitchWithWebFields(['display_name', 'image_url'], router.spacecraftWeb))
}
export function getInstrumentsForDataset(dataset) {
    return httpGetIdentifiers(router.instrumentsCore, dataset.instrument_ref).then(stitchWithWebFields(['display_name', 'is_prime'], router.instrumentsWeb))
}