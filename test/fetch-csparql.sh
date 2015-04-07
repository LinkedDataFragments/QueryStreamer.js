#!/bin/bash
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/var/tmp/csparql-test/csparql-server/bin/output/ csparql-output
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/groups/wall2-ilabt-iminds-be/ldf/exp/taquery/csparql-test/client-output/ csparql-client-output
