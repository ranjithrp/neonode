var neo4j = require('neo4j');

var db = new neo4j.GraphDatabase("http://hub:2RsxsfmIlRKcP5McHqiS@hub.sb10.stations.graphenedb.com:24789");

module.exports = function (app) {
    /*app.get('/', function (req, res) {
    var event1 = {
        id: '1',
        name: 'CouchBase eVent',
        location: 'KTPO',
        date: '19 Jul 2016'
    };
    console.log(db);
    db.cypher({
        query: 'CREATE (event:Event {props})',
        params: {
            "props": {
                id: '1',
                name: 'CouchBase eVent',
                location: 'KTPO',
                date: '19 Jul 2016'
            }

        },
    }, function (err, result) {
        if (err)
            throw err;
        else
            var result = result[0];
        console.log(result.id);
    });
    console.log("it works");
}) */

    // GET Routes
    // --------------------------------------------------------
    app.get('/events', function(req, res) {
        var query = [
            'MATCH (e:Event)',
            'OPTIONAL MATCH (e)-[HAS]->(n)',
            //'WITH e, collect(DISTINCT ',               
            // '{ relationship:type(rout), ',
            //    ' node: endNode(rout)',
            //' }) AS outgoing',
            'RETURN { _id: id(e), event : e, sessions: CASE WHEN n IS NOT NULL THEN collect({ session:\'/sessions/\'+id(n)}) ELSE NULL END } AS result'
        ].join('\n');

        dbCypher(req, res, query);
    });

    app.get('/events/:id', function(req, res) {
        var query = [
            'MATCH (event:Event)',
            'WHERE ID(event) = '+ req.params.id,
            'OPTIONAL MATCH (event)-[HAS]->(n)',
            'RETURN { _id: id(event), event : event, sessions: CASE WHEN n IS NOT NULL THEN collect({ session:\'/sessions/\'+id(n)}) ELSE NULL END } AS result'
        ].join('\n');

        dbCypher(req, res, query);
    });

    app.get('/tracks', function(req, res) {
        var query = [
            'MATCH (track:Track)',
            'RETURN track'
        ].join('\n');

        dbCypher(req, res, query);
    });

    app.get('/tracks/:id', function(req, res) {
        var query = [
            'MATCH (track:Track)',
            'WHERE ID(track) = '+ req.params.id,
            'RETURN track'
        ].join('\n');

        dbCypher(req, res, query);
    });

     app.get('/sessions', function(req, res) {
        var query = [
            'MATCH (s:Session)',
            'OPTIONAL MATCH (s)-[:IS]->(t)',
            'WITH collect(DISTINCT {track:\'/tracks/\'+id(t)}) as tracks, s',
            'OPTIONAL MATCH (s)-[:PRESENTED_BY]->(u)',
            'WITH collect(DISTINCT {presenter:\'/users/\'+id(u)}) as presenters, tracks, s',
            'RETURN {_id :id(s), session:s, tracks : tracks, presenters : presenters} as result'
        ].join('\n');

        dbCypher(req, res, query);
    });

    app.get('/sessions/:id', function(req, res) {
        var query = [
            'MATCH (s:Session)',
            'WHERE ID(s) = '+ req.params.id,
            'OPTIONAL MATCH (s)-[:IS]->(t)',
            'OPTIONAL MATCH (s)-[:PRESENTED_BY]->(u)',
            'RETURN {_id :id(s), session:s, tracks : CASE WHEN t IS NOT NULL THEN collect(DISTINCT {track:\'/tracks/\'+id(t)}) ELSE NULL END, presenters : CASE WHEN u IS NOT NULL THEN collect(DISTINCT {presenter:\'/users/\'+id(u)}) ELSE NULL END} as result'
        ].join('\n');

        dbCypher(req, res, query);
    });

    app.get('/users', function(req, res) {
        var query = [
            'MATCH (user:User)',
            'RETURN user'
        ].join('\n');

        dbCypher(req, res, query);
    });

    app.get('/users/:id', function(req, res) {
        var query = [
            'MATCH (user:User)',
            'WHERE ID(user) = '+ req.params.id,
            'RETURN user'
        ].join('\n');

        dbCypher(req, res, query);
    });


    // POST Routes
    // --------------------------------------------------------
    // Provides method for saving new events in the db
    app.post('/events', function (req, res) {

        console.log(req.body);
        var query = [
            'CREATE (event:Event {props})',
            'RETURN event',
        ].join('\n');

        var params = {
            props: req.body
        }

        console.log(params);
        dbCypher(req, res, query, params);
    });

    app.post('/tracks', function (req, res) {

        console.log(req.body);
        var query = [
            'CREATE (track:Track {props})',
            'RETURN track',
        ].join('\n');

        var params = {
            props: req.body
        }

        console.log(params);
        dbCypher(req, res, query, params);
    });

    app.post('/users', function (req, res) {

        console.log(req.body);
        var query = [
            'CREATE (user:User {props})',
            'RETURN user',
        ].join('\n');

        var params = {
            props: req.body
        }

        console.log(params);
        dbCypher(req, res, query, params);
    });

    app.post('/sessions', function (req, res) {

        console.log(req.body);
        var session = req.body;
        var trackId = session.trackId;
        var eventId = session.eventId;
        var userId = session.userId;
        
        var query = [
            'MATCH (event:Event)',
            'WHERE ID(event) = '+ eventId,
            'MATCH (track:Track)',
            'WHERE ID(track) = '+ trackId,
            'MATCH (user:User)',
            'WHERE ID(user) = '+ userId,
            'CREATE (session:Session {props}), (event)-[r1:HAS]->(session), (session)-[r2:IS]->(track), (session)-[r3:PRESENTED_BY]->(user)',
            'RETURN session',
        ].join('\n');

        var params = {
            props: req.body
        }

        console.log(params);
        dbCypher(req, res, query, params);
    });

    // Delete Routes
    // --------------------------------------------------------
    app.delete('/', function(req,res) {
        var query = [
            'MATCH (n) DETACH',
            'DELETE n'
        ].join('\n');

        dbCypher(req, res, query);
    });

    var dbCypher = function (req, res, query, params) {
        var cypherQuery = null;
        if (params !== undefined || params !== null) {
            cypherQuery = {
                query :query,
                params, params
            }
        } else {
            cypherQuery = {
                query :query
            }
        }
        db.cypher(cypherQuery, function (err, result) {
            if (err)
                res.send(err);
            else
                res.json(result);
        });
    }

}
