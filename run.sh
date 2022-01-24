#!/bin/bash
while [ 1 ]; do
	nohup node program.js >> /tmp/badge-server.log 2>> /tmp/badge-server.err
	sleep 1
done
