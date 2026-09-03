#!/bin/bash
URL="https://knuckls.com/status.php"
PASS="knuckls2026"
LABEL="proxmox"

# CPU: top -bn1 gives real utilization on multi-core
CPU=$(top -bn1 | grep '^%Cpu' | awk '{print int(100-$8)}')
[ -z "$CPU" ] && CPU=0

# RAM
TOTAL=$(free -m | awk '/Mem:/{print $2}')
USED=$(free -m | awk '/Mem:/{print $3}')
RAM=$(echo "scale=1; $USED * 100 / $TOTAL" | bc 2>/dev/null || echo 0)

# Disk
DISK=$(df / --output=pcent | tail -1 | tr -d ' %')

# CPU temp
TEMP=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null | awk '{print $1/1000}' || echo 0)
if [ "$TEMP" = "0" ]; then
    TEMP=$(sensors -u 2>/dev/null | awk '/temp1_input/{print $2;exit}' || echo 0)
fi

# Uptime
UPTIME=$(cat /proc/uptime | awk '{print int($1)}')

curl -s --max-time 10 -X POST \
    -F "pass=$PASS" \
    -F "label=$LABEL" \
    -F "cpu=$CPU" \
    -F "ram=$RAM" \
    -F "disk=$DISK" \
    -F "temp=$TEMP" \
    -F "uptime=$UPTIME" \
    "$URL" > /dev/null && echo "status sent" || echo "failed"