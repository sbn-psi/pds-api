// external modules
const assert = require('assert')

// express setup
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.listen(8001)
console.log('running on port 8001...')


const {lookupTarget} = require('./api/target.js')
app.get('/lookup/target', function(req, res) {
    performLookup(lookupTarget, req, res)
})
const {lookupMission} = require('./api/mission.js')
app.get('/lookup/mission', function(req, res) {
    performLookup(lookupMission, req, res)
})
const {lookupSpacecraft} = require('./api/spacecraft.js')
app.get('/lookup/spacecraft', function(req, res) {
    performLookup(lookupSpacecraft, req, res)
})
const {lookupInstrument} = require('./api/instrument.js')
app.get('/lookup/instrument', function(req, res) {
    performLookup(lookupInstrument, req, res)
})

const performLookup = async function(lookup, req, res) {
    try {
        assert(req.query.lid, 'Expected lid argument')
        assert(req.query.lid.startsWith('urn:nasa:pds:'), 'Expected lid to start with urn:nasa:pds')
        
        let identifier = req.query.lid
        let result = await lookup(identifier)
        res.status(200).send(result)
    } catch (err) {
        res.status(400).send(err.message)
        return
    }

}