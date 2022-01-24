#!/bin/bash
MYSQL_USERNAME='badge'
MYSQL_PASSWORD='password'
OUTPUT_DIRECTORY='/home/user/recordsdata_history'

YEAR=`date +%Y -d "last month"`
mysql -u root -p${MYSQL_PASSWORD} ${MYSQL_USERNAME} -e 'select * from records' > /tmp/records
cat /tmp/records|awk '{print $2}'|sort --field-separator="," -k4 -k3|tail -n +2|grep ",$YEAR" > ${OUTPUT_DIRECTORY}/timbrature_$YEAR.csv

