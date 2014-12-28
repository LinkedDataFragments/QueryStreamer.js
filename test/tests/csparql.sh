#!/bin/bash
cd ~
#export API_URL=127.0.0.1
export STATIC_PORT=3000
export DATA_FREQUENCY=10
export QUERY_FREQUENCY=10

XMX=2G
XMS=$XMX

java -Xmx$XMX -Xms$XMS -jar csparql.jar
