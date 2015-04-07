#!/bin/bash
zip -r taquery-test.zip \
../../test-ldf/client-fork \
../../test-ldf/server-fork \
../../test-ldf/n3 \
../../time-annotated-query/bin \
../../time-annotated-query/lib \
../../time-annotated-query/package.json \
../../http-barrier \
../../data-replay \
tests/data/raw \
tests/data/train-replay-vwall.json \
taquery-run.sh \
taquery-server \
taquery-client \
querygen \
-x **/node_modules/**\* 
