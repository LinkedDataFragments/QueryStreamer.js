#!/bin/bash
scp -ri '/Users/kroeser/Documents/UGent/vwall/cert.ssl' rtaelman@$1:/var/tmp/taquery-test/taquery-server/output/ taquery-output
