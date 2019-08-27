const localSolr = (process.env.SUPPLEMENTAL_SOLR ? process.env.SUPPLEMENTAL_SOLR : 'http://localhost:8983/solr')
const remoteSolr = (process.env.PDS_SOLR ? process.env.PDS_SOLR : 'https://pds.nasa.gov/services/search')

const datasetsCollection = 'web-datasets'
const targetsCollection = 'web-targets-20190812'
const instrumentsCollection = 'web-instruments-20190812'
const instrumenthostsCollection = 'web-instrumenthosts-20190812'
const investigationsCollection = 'web-investigations-20190812'
const targetrelationshipsCollection = 'web-targetrelationships'
const coreCollection = 'pds'

module.exports = {
    datasetWeb: `${localSolr}/${datasetsCollection}/select`,
    // datasetCore: `${localSolr}/${coreCollection}/select`,
    datasetCore: `${remoteSolr}/search`,
    targetsWeb: `${localSolr}/${targetsCollection}/select`,
    targetRelationships: `${localSolr}/${targetrelationshipsCollection}/select`,
    targetsCore: `${remoteSolr}/search`,
    instrumentsWeb: `${localSolr}/${instrumentsCollection}/select`,
    instrumentsCore: `${remoteSolr}/search`,
    spacecraftWeb: `${localSolr}/${instrumenthostsCollection}/select`,
    spacecraftCore: `${remoteSolr}/search`,
    missionsWeb: `${localSolr}/${investigationsCollection}/select`,
    missionsCore: `${remoteSolr}/search`,
}