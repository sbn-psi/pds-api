// external modules
const assert = require('assert')
const request = require('request-promise-native')

// internal modules
const desolrize = require('./desolrize.js')

// express setup
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.listen(8001)
console.log('running on port 8001...')

const SOLR = (process.env.SOLR ? process.env.SOLR : 'http://localhost:8983')

const {lookupTarget} = require('./api/target.js')
app.get('/lookup/target', function(req, res) {
    
    try {
        assert(req.query.lid, 'Expected lid argument')
        assert(req.query.lid.startsWith('urn:nasa:pds:'), 'Expected lid to start with urn:nasa:pds')
    } catch (err) {
        res.status(400).send(err.message)
        return
    }
    let identifier = req.query.lid
    lookupTarget(identifier).then(obj => res.status(200).send(obj), err => res.status(500).send(err.message))
})