#!/bin/bash
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/var/tmp/taquery-test/taquery-server/output/ taquery-output
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/groups/wall2-ilabt-iminds-be/ldf/exp/taquery/taquery-test/client-output/ taquery-client-output
