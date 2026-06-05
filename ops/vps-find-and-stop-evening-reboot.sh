#!/bin/bash
# Find what triggers ~6:30 PM IST reboots inside the VM (Hostinger confirmed in-guest reboot).
# Usage:
#   bash vps-find-and-stop-evening-reboot.sh           # investigate only
#   APPLY=1 bash vps-find-and-stop-evening-reboot.sh # investigate + apply safe hardening

set -euo pipefail

APPLY="${APPLY:-0}"

section() { echo ""; echo "========== $1 =========="; }

section "A) Reboot history (IST)"
last reboot | head -10 || true
last -x shutdown reboot | head -15 || true

section "B) Search ALL cron for reboot/shutdown/poweroff"
grep -rniE 'reboot|shutdown|poweroff|halt|init 6|systemctl.*reboot' \
  /etc/crontab /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly \
  /var/spool/cron 2>/dev/null || echo "(no matches in cron)"

section "C) systemd timers near 18:00-20:00 IST"
systemctl list-timers --all --no-pager 2>/dev/null || true
echo "--- timer unit files with OnCalendar ---"
grep -rniE 'OnCalendar|RandomizedDelay' /etc/systemd/system/*.timer /lib/systemd/system/*.timer 2>/dev/null \
  | grep -v '\.timer:#' | head -60 || true

section "D) Who rebooted on PREVIOUS boot (journal)"
if [ "$(journalctl --list-boots 2>/dev/null | wc -l)" -gt 1 ]; then
  echo "--- shutdown/reboot lines, previous boot ---"
  journalctl -b -1 --no-pager 2>/dev/null | grep -iE 'reboot|shutdown|power off|system is rebooting|watchdog|unattended-upgrade.*reboot' | tail -40 || true
  echo "--- last 25 lines before previous boot ended ---"
  journalctl -b -1 --no-pager 2>/dev/null | tail -25 || true
fi

section "E) auth.log — sudo reboot / ssh before reboot"
if [ -f /var/log/auth.log ]; then
  grep -iE 'reboot|shutdown|poweroff|session opened for user root' /var/log/auth.log | tail -40 || true
fi

section "F) Scripts under /root and /var/www mentioning reboot"
grep -rniE 'reboot|shutdown|poweroff' /root /var/www 2>/dev/null \
  | grep -vE '\.pm2|node_modules|\.git|step[0-9]|fix-downtime|find-and-stop' | head -40 || echo "(no matches)"

section "G) needrestart / monarx / custom agents"
command -v needrestart >/dev/null && needrestart -b 2>/dev/null || true
systemctl list-units --type=service --all 2>/dev/null | grep -iE 'monarx|watchdog|reboot|needrestart' || true
ls -la /etc/cron.d/monarx* 2>/dev/null || true

section "H) reboot-required flag"
if [ -f /var/run/reboot-required ]; then
  echo "REBOOT REQUIRED:"
  cat /var/run/reboot-required
  cat /var/run/reboot-required.pkgs 2>/dev/null || true
else
  echo "No /var/run/reboot-required (kernel reboot not pending now)"
fi

section "I) Current maintenance config (should be ~01:30 IST)"
cat /etc/apt/apt.conf.d/51accounting-maintenance-window 2>/dev/null || echo "(51accounting-maintenance-window not found — run fix-downtime.sh APPLY=1)"
systemctl list-timers --all --no-pager 2>/dev/null | grep -E 'apt|certbot|update-notifier' || true

if [ "$APPLY" != "1" ]; then
  echo ""
  echo "Investigation complete. Review sections B, D, E for reboot trigger."
  echo "To apply safe hardening (block daytime reboot policy, night timers, PM2 guard):"
  echo "  APPLY=1 bash $0"
  exit 0
fi

section "APPLY 1) Only allow automatic reboot at 01:30 IST (never immediate)"
mkdir -p /etc/apt/apt.conf.d
cat > /etc/apt/apt.conf.d/51accounting-maintenance-window <<'EOF'
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "01:30";
Unattended-Upgrade::Automatic-Reboot-WithUsers "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
EOF

section "APPLY 2) Move update-notifier-download off ~18:55 IST → 02:00 IST"
mkdir -p /etc/systemd/system/update-notifier-download.timer.d
cat > /etc/systemd/system/update-notifier-download.timer.d/override.conf <<'EOF'
[Timer]
OnCalendar=
OnCalendar=*-*-* 02:00:00
RandomizedDelaySec=1800
Persistent=true
EOF

section "APPLY 3) Move systemd-tmpfiles-clean off ~19:04 → 02:30 IST"
mkdir -p /etc/systemd/system/systemd-tmpfiles-clean.timer.d
cat > /etc/systemd/system/systemd-tmpfiles-clean.timer.d/override.conf <<'EOF'
[Timer]
OnCalendar=
OnCalendar=*-*-* 02:30:00
RandomizedDelaySec=900
Persistent=true
EOF

section "APPLY 4) Re-apply apt/certbot night timers (idempotent)"
MAINTENANCE_HOUR=1
MAINTENANCE_MINUTE=30
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
if systemctl list-unit-files certbot.timer 2>/dev/null | grep -q certbot.timer; then
  mkdir -p /etc/systemd/system/certbot.timer.d
  cat > /etc/systemd/system/certbot.timer.d/override.conf <<'EOF'
[Timer]
OnCalendar=
OnCalendar=*-*-* 03:00:00
RandomizedDelaySec=1800
Persistent=true
EOF
fi

systemctl daemon-reload
for t in update-notifier-download.timer systemd-tmpfiles-clean.timer apt-daily.timer apt-daily-upgrade.timer certbot.timer; do
  systemctl restart "$t" 2>/dev/null || true
done

section "APPLY 5) PM2 health check every 5 min (restart apps only, NOT full reboot)"
cat > /etc/cron.d/accounting-pm2-guard <<'EOF'
# Restart PM2 apps if down — never reboots the VPS
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
*/5 * * * * root bash -c 'pm2 describe accounting-backend 2>/dev/null | grep -q "status.*online" && pm2 describe accounting-frontend 2>/dev/null | grep -q "status.*online" || (pm2 resurrect 2>/dev/null || pm2 restart all)'
EOF
chmod 644 /etc/cron.d/accounting-pm2-guard

section "APPLY 6) Log future reboot commands (audit trail for Hostinger follow-up)"
cat > /etc/profile.d/accounting-reboot-audit.sh <<'EOF'
# Log if someone runs reboot/shutdown interactively
reboot() { logger -t ACCOUNTING-AUDIT "reboot called by UID=$UID PWD=$PWD"; command /sbin/reboot "$@"; }
shutdown() { logger -t ACCOUNTING-AUDIT "shutdown called by UID=$UID PWD=$PWD"; command /sbin/shutdown "$@"; }
EOF
chmod 644 /etc/profile.d/accounting-reboot-audit.sh

section "APPLY 7) PM2 on boot"
if command -v pm2 >/dev/null; then
  pm2 save || true
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
  pm2 save || true
fi
systemctl enable nginx postgresql pm2-root 2>/dev/null || true

echo ""
echo "Hardening applied. Verify timers:"
systemctl list-timers --all --no-pager | grep -E 'apt|certbot|update-notifier|tmpfiles' || true
echo ""
echo "If reboot happens again ~6:30 PM, run:"
echo "  journalctl -b 0 | grep ACCOUNTING-AUDIT"
echo "  journalctl -b -1 | tail -50"
echo "Send that to Hostinger support."
