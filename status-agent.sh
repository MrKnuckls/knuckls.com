#!/bin/bash
# Knuckls Status Agent
# Run on your Proxmox host every 60s via cron
# Usage: bash status-agent.sh
# Add to crontab: * * * * * /root/status-agent.sh

URL="https://knuckls.com/status.php"
PASS="knuckls2026"
LABEL="proxmox"

# CPU: average load / cores as %
CORES=$(nproc)
LOAD=$(awk '{print $1}' /proc/loadavg)
CPU=$(echo "scale=1; $LOAD * 100 / $CORES" | bc 2>/dev/null || echo 0)
# cap at 100
CPU=$(echo "$CPU > 100 ? 100 : $CPU" | bc 2>/dev/null || echo 0)

# RAM: percentage
TOTAL=$(free -m | awk '/Mem:/{print $2}')
USED=$(free -m | awk '/Mem:/{print $3}')
RAM=$(echo "scale=1; $USED * 100 / $TOTAL" | bc 2>/dev/null || echo 0)

# Disk: percentage on /
DISK=$(df / --output=pcent | tail -1 | tr -d ' %')

# CPU temp (Proxmox / Ryzen usually via sensors or /sys)
TEMP=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null | awk '{print $1/1000}' || echo 0)
# Try lm-sensors fallback
if [ "$TEMP" = "0" ]; then
    TEMP=$(sensors -u 2>/dev/null | awk '/temp1_input/{print $2;exit}' || echo 0)
fi

# Uptime (seconds)
UPTIME=$(cat /proc/uptime | awk '{print int($1)}')

# Send
curl -s --max-time 10 -X POST \
    -F "pass=$PASS" \
    -F "label=$LABEL" \
    -F "cpu=$CPU" \
    -F "ram=$RAM" \
    -F "disk=$DISK" \
    -F "temp=$TEMP" \
    -F "uptime=$UPTIME" \
    "$URL" > /dev/null && echo "status sent" || echo "failed"