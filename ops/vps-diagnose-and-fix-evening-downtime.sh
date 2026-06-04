#!/bin/bash
# Diagnose + fix daily ~6:30 PM IST downtime on Hostinger VPS.
# Run on the VPS as root (Hostinger panel → Terminal, or: ssh root@93.127.172.147)
#
# Usage:
#   bash vps-diagnose-and-fix-evening-downtime.sh           # diagnose only
#   APPLY=1 bash vps-diagnose-and-fix-evening-downtime.sh   # diagnose + apply safe fixes

set -euo pipefail

APPLY="${APPLY:-0}"
MAINTENANCE_HOUR="${MAINTENANCE_HOUR:-1}"   # 1 = 01:00 IST (after timezone set)
MAINTENANCE_MINUTE="${MAINTENANCE_MINUTE:-30}"

section() { echo ""; echo "========== $1 =========="; }

section "1) Timezone & uptime"
timedatectl status || true
uptime
echo "--- Recent reboots ---"
last reboot | head -10 || true
who -b 2>/dev/null || true

section "2) Crontabs (look for 18:xx or 13:xx UTC = ~6:30 PM IST)"
for f in /var/spool/cron/crontabs/*; do
  [ -f "$f" ] && echo "--- $f ---" && cat "$f"
done
echo "--- /etc/cron.d ---"
grep -Hv '^#' /etc/cron.d/* 2>/dev/null | grep -v '^$' || true
echo "--- root crontab ---"
crontab -l 2>/dev/null || echo "(empty)"

section "3) systemd timers (apt, certbot, snap)"
systemctl list-timers --all --no-pager 2>/dev/null | head -50 || true

section "4) Unattended upgrades & apt history"
if [ -f /var/log/unattended-upgrades/unattended-upgrades.log ]; then
  echo "--- unattended-upgrades (reboot/update lines) ---"
  grep -iE 'reboot|upgrade|install' /var/log/unattended-upgrades/unattended-upgrades.log | tail -30
fi
if [ -f /var/log/apt/history.log ]; then
  echo "--- apt history (last 40 lines) ---"
  tail -40 /var/log/apt/history.log
fi
grep -r . /etc/apt/apt.conf.d/ 2>/dev/null | grep -iE 'Periodic|Unattended|Reboot' || true

section "5) OOM / kernel kills (can stop app without full reboot)"
dmesg -T 2>/dev/null | grep -iE 'oom|out of memory|killed process' | tail -15 || true

section "6) PM2 / nginx / postgres"
command -v pm2 >/dev/null && pm2 status || echo "pm2 not found"
systemctl is-active nginx postgresql 2>/dev/null || true
systemctl is-enabled pm2-root nginx postgresql 2>/dev/null || true

section "7) Nginx errors around peak hours (today)"
if [ -f /var/log/nginx/error.log ]; then
  tail -30 /var/log/nginx/error.log
fi

section "8) IST correlation"
echo "6:30 PM IST = 13:00 UTC (if server uses UTC)."
echo "If timers/cron show 12:00-13:00 UTC or 18:30 Asia/Kolkata, that matches your outage window."

if [ "$APPLY" != "1" ]; then
  echo ""
  echo "Diagnosis complete. No changes made."
  echo "To apply safe fixes (maintenance at ~01:30 IST, PM2 on boot, apt timers):"
  echo "  APPLY=1 bash $0"
  exit 0
fi

section "APPLY: timezone Asia/Kolkata"
timedatectl set-timezone Asia/Kolkata
timedatectl status

section "APPLY: unattended-upgrades — reboot only at night (not 6 PM)"
mkdir -p /etc/apt/apt.conf.d
cat > /etc/apt/apt.conf.d/51accounting-maintenance-window <<EOF
// Accounting app: security updates OK, reboot only during Indian night window
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "${MAINTENANCE_HOUR}:$(printf '%02d' "$MAINTENANCE_MINUTE")";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
EOF
echo "Wrote /etc/apt/apt.conf.d/51accounting-maintenance-window"

section "APPLY: apt daily timers → ~01:30 IST (not random afternoon)"
mkdir -p /etc/systemd/system/apt-daily.timer.d
cat > /etc/systemd/system/apt-daily.timer.d/override.conf <<EOF
[Timer]
OnCalendar=
OnCalendar=*-*-* ${MAINTENANCE_HOUR}:15:00
RandomizedDelaySec=900
Persistent=true
EOF

mkdir -p /etc/systemd/system/apt-daily-upgrade.timer.d
cat > /etc/systemd/system/apt-daily-upgrade.timer.d/override.conf <<EOF
[Timer]
OnCalendar=
OnCalendar=*-*-* ${MAINTENANCE_HOUR}:${MAINTENANCE_MINUTE}:00
RandomizedDelaySec=900
Persistent=true
EOF

systemctl daemon-reload
systemctl restart apt-daily.timer apt-daily-upgrade.timer 2>/dev/null || true

section "APPLY: certbot renew → ~03:00 IST (avoids certbot noon UTC ≈ 5:30 PM IST)"
if systemctl list-unit-files certbot.timer 2>/dev/null | grep -q certbot.timer; then
  mkdir -p /etc/systemd/system/certbot.timer.d
  cat > /etc/systemd/system/certbot.timer.d/override.conf <<'EOF'
[Timer]
OnCalendar=
OnCalendar=*-*-* 03:00:00
RandomizedDelaySec=1800
Persistent=true
EOF
  systemctl daemon-reload
  systemctl restart certbot.timer 2>/dev/null || true
  echo "certbot.timer rescheduled to ~03:00 IST"
fi

section "APPLY: PM2 survives reboot"
if command -v pm2 >/dev/null; then
  pm2 save || true
  env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup || true
  pm2 save || true
  echo "PM2 startup configured (verify with: systemctl status pm2-root)"
fi

section "APPLY: enable core services on boot"
systemctl enable nginx postgresql 2>/dev/null || true

echo ""
echo "Done. Next steps for you:"
echo "  1) Hostinger panel → check Snapshot/backup & Malware scanner schedule (move off 6 PM if configurable)."
echo "  2) systemctl list-timers --all | grep -E 'apt|certbot'"
echo "  3) Watch tomorrow 6:30 PM IST — site should stay up; updates/reboots prefer ~01:30 IST."
echo "  4) Optional: UptimeRobot on https://client-credit-tracker.in"
