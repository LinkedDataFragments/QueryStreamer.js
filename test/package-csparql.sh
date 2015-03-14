#!/bin/bash
zip -r csparql-test.zip csparql-client csparql-server/bin csparql-server/build/libs/csparql-server-all-1.0.jar ../../http-barrier csparql-run.sh -x **/node_modules/**\*
