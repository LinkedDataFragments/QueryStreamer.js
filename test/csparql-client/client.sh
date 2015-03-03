#!/bin/bash
PORT=3002
curl -d "$(cat query.csparql)" 127.0.0.1:$PORT/register
