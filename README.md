# TPF Streaming Query Executor

A proof-of-concept implementation for enabling continuously updating queries using [Triple Pattern Fragments](http://linkeddatafragments.org/in-depth/#tpf).
This is an extra layer on top of the existing [Triple Pattern Fragments Client](https://github.com/LinkedDataFragments/Client.js)

The TPF endpoint must have time-annotations for all dynamic triples using some annotation method.
The client can accept a regular SPARQL query, and it will detect any dynamic triple patterns and will stream its results. 

[ESWC 2016 paper](http://rubensworks.net/raw/publications/2016/Continuous_Client-Side_Query_Evaluation_over_Dynamic_Linked_Data.pdf) with more details about this concept.

## Install

Install the latest version from GitHub:

```
$ git clone git@github.com:rubensworks/TPFStreamingQueryExecutor
$ cd TPFStreamingQueryExecutor
$ npm install
```

This will also install the custom [Client.js](https://github.com/rubensworks/Client.js), [Server.js](https://github.com/rubensworks/Server.js) and [N3](https://github.com/rubensworks/N3.js) forks.

## Docker

A docker container can be started like this:
```
docker build -t tpfqs-client . && docker run \
-e "QUERY=<SPARQL query>" \
-e "TARGET=http://<server>:3000/<datasource>" \
-e "CACHING=true" \
-e "INTERVAL=true" \
-e "DEBUG=true" \
--rm tpfqs-client graphs
```

## Execute demos

To start the train departure information demo, run:

```
cd bin && ./startLiveTrainServer.sh
```

To start the live music demo from Q-Music, run:

```
cd bin && ./startLiveMusicServer.sh
```

## Execute custom queries

To be able to run custom queries, the TPF server will require a dataset that contains time annotations for the dynamic triples using some type of RDF annotation.
It is advised to read through the `live-ldf-server` script for an example on how to annotate triples on-the-fly and storing them at some TPF endpoint.
The `querytrain [annotationtype]` script shows how to call the actual `StreamingClient`.
