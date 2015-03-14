#!/bin/bash
scp -i '/Users/kroeser/Documents/UGent/vwall/cert.ssl' bootstrap-taquery.sh taquery-test.zip rtaelman@$1:/groups/wall2-ilabt-iminds-be/ldf/exp/taquery
