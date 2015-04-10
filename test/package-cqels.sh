#!/bin/bash
zip -r cqels-test.zip cqels-client cqels-server/bin cqels-server/build/libs/cqels-train-all-1.0.jar ../../http-barrier cqels-run.sh querygen -x **/node_modules/**\*
