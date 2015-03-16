#!/bin/bash
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/var/tmp/csparql-test/csparql-server/bin/output/ csparql-output
