#!/bin/bash
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/var/tmp/cqels-test/cqels-server/bin/output/ cqels-output
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/groups/wall2-ilabt-iminds-be/ldf/exp/taquery/cqels-test/client-output/ cqels-client-output
