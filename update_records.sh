#!/bin/bash
MYSQL_USERNAME='badge'
MYSQL_PASSWORD='password'
OUTPUT_DIRECTORY='/home/user'

mysql -u root -p${MYSQL_PASSWORD} ${MYSQL_USERNAME} -e 'select * from records' > /tmp/records
cat /tmp/records|awk '{print $2}'|sort --field-separator="," -k4 -k3|tail -n +2|grep -e "`date +%Y-%m -d "last month"`\|`date +%Y-%m`" > ${OUTPUT_DIRECTORY}/timbrature.csv
