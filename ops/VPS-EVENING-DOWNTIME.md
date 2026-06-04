# Daily ~6:30 PM IST downtime — cause & fix

## Is it your application code?

**No.** There is nothing in this repo that schedules restarts, backups, or maintenance at 6–7 PM IST.

- `BACKUP_SCHEDULE` in `.env.example` is documentation only (not used by the running API).
- No `node-cron` or server-side evening jobs in `backend/src`.

The pattern (site stops, VPS uptime resets, then works again) points to the **VPS / OS / Hostinger**, not React or Express.

---

## Why ~6:30 PM IST (not “US night”)

| Time | Notes |
|------|--------|
| **6:30 PM IST** | **1:00 PM UTC** |
| US East 8:00 AM | Not US midnight maintenance |
| US West 5:00 AM | Same |

So this is **not** “US day cycle” in the sense of midnight US updates. It is usually one of:

1. **Something on the server scheduled in UTC** (e.g. 12:00–13:00 UTC → 5:30–6:30 PM IST)
2. **Certbot** default timer (often **twice daily**, including **~noon UTC** ≈ **5:30 PM IST**) + nginx reload
3. **Ubuntu unattended-upgrades** + **automatic reboot** at a bad time
4. **Hostinger**: snapshot backup, malware scan, or host maintenance (check panel)
5. **Evening traffic spike** (accounting users) → brief overload (less common with 8 GB RAM unless processes crash)

Your observation (**uptime drops from days → hours without you clicking Reboot**) strongly indicates **VM reboot or long service outage**, not a frontend bug.

---

## Fix (safe, on the VPS)

Use **Hostinger → VPS → Terminal** (logged in as root), then run:

```bash
# 1) Diagnose only — copy output and keep for records
curl -sL https://raw.githubusercontent.com/YOUR_ORG/accounting-app/main/ops/vps-diagnose-and-fix-evening-downtime.sh -o /root/fix-downtime.sh
# OR upload ops/vps-diagnose-and-fix-evening-downtime.sh via scp and run:

bash /root/fix-downtime.sh

# 2) Apply fixes (timezone IST, maintenance ~01:30 AM, PM2 on boot, certbot ~03:00 AM)
APPLY=1 bash /root/fix-downtime.sh
```

If the script is not on GitHub yet, copy `ops/vps-diagnose-and-fix-evening-downtime.sh` from this repo to the server:

```bash
nano /root/fix-downtime.sh
# paste script, save
chmod +x /root/fix-downtime.sh
APPLY=1 bash /root/fix-downtime.sh
```

### What `APPLY=1` does (does not change app code)

| Change | Purpose |
|--------|---------|
| `Asia/Kolkata` timezone | Cron/timers match Indian time |
| Reboot only ~**01:30 IST** | Security updates don’t reboot at 6 PM |
| `apt-daily` / `apt-daily-upgrade` ~**01:15–01:30 IST** | Updates off peak hours |
| `certbot.timer` ~**03:00 IST** | Avoids default noon UTC ≈ evening IST |
| `pm2 startup` + `pm2 save` | After any reboot, apps come back automatically |

---

## Hostinger panel (manual checks)

1. **Snapshot & backups** — if daily snapshot runs ~6 PM, reschedule or disable auto snapshot during business hours.
2. **Malware scanner (Active)** — ask support or check docs if scan runs at a fixed UTC time; request off-peak IST.
3. Open ticket: *“srv1709904 — daily downtime ~18:30 IST, was there host maintenance or auto reboot?”*

---

## Verify tomorrow

At **6:30 PM IST**, site should stay up.

At **~1:30 AM IST**, brief maintenance (updates, possible reboot) is acceptable for Indian users.

```bash
systemctl list-timers --all | grep -E 'apt|certbot'
last reboot | head -3
pm2 status
```

---

## Optional: external monitoring

Free tier [UptimeRobot](https://uptimerobot.com) on `https://client-credit-tracker.in` — email/SMS if down during 6 PM so you know immediately.
