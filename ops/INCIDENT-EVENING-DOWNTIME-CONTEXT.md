# Evening downtime incident — context for future debugging

**Last updated:** 2026-06-05 (IST)  
**Production:** https://client-credit-tracker.in  
**VPS:** srv1709904.hstgr.cloud — `93.127.172.147` — Mumbai KVM 2, Ubuntu 22.04, 8GB RAM

---

## Problem (user-reported)

- Site **client-credit-tracker.in** goes down ~**6:00–7:00 PM IST** for ~30–60 min, almost daily.
- **Not an app code bug** — no evening cron in repo; PM2 apps fine when server is up.
- **Full VM reboot/shutdown** inside guest (Hostinger confirmed **no** hypervisor reboot at 18:30–19:00 IST).

## Reboot pattern (from `last reboot`)

| Date (IST) | Event |
|------------|--------|
| Jun 4 | **shutdown 18:32**, reboot **18:49** (~17 min down) |
| Jun 3 | shutdown **18:32**, reboot **19:12** |
| May 28+ | sessions often end **~18:32 IST** |
| Jun 5 ~04:10–04:12 | 3 quick reboots — **qemu-ga guest-exec** (Hostinger support diagnostics) |

**No** `reboot`/`shutdown` in `/etc/cron*` or root crontab.

## Hostinger ticket (summary)

- No provider reboot/migration at 18:30–19:00 IST.
- Weekly backup ~**13:00 IST** (Jun 3), not evening.
- Reboots are **clean in-guest** `systemd` shutdown → need initiator (hPanel reboot? qemu-ga? Monarx?).

## Fixes already applied on VPS

1. **`/etc/apt/apt.conf.d/51accounting-maintenance-window`** — auto-reboot **01:30 IST only**
2. **systemd timer overrides** — apt ~01:22–01:44, certbot ~03:26, update-notifier ~02:05, tmpfiles ~02:32 IST
3. **`pm2-root` enabled** + `pm2 save` — apps start after reboot
4. **`/etc/cron.d/accounting-pm2-guard`** — every 5 min restart PM2 apps if down (no VPS reboot)
5. **`/etc/profile.d/accounting-reboot-audit.sh`** — logs `reboot`/`shutdown` to syslog tag `ACCOUNTING-AUDIT`

## Scripts on VPS (also in repo `ops/`)

| Path on VPS | Repo file |
|-------------|-----------|
| `/root/fix-downtime.sh` | `vps-diagnose-and-fix-evening-downtime.sh` |
| `/root/find-reboot.sh` | `vps-find-and-stop-evening-reboot.sh` |

## SSH from local PC (Cursor terminal)

```powershell
ssh root@93.127.172.147
scp "...\ops\vps-find-and-stop-evening-reboot.sh" root@93.127.172.147:/root/find-reboot.sh
```

## If down again ~6:30 PM IST — run immediately

```powershell
ssh root@93.127.172.147 "date && uptime && last reboot | head -5 && pm2 status && curl -s -o /dev/null -w 'HTTP %{http_code}\n' https://client-credit-tracker.in"
```

**If PM2 down but uptime high:**

```powershell
ssh root@93.127.172.147 "pm2 restart all; systemctl restart nginx; pm2 status"
```

**If uptime reset (~0–1h) at 6:35 PM:**

```powershell
ssh root@93.127.172.147 "journalctl -b 0 | grep -E 'ACCOUNTING-AUDIT|shutdown|reboot' | tail -30; journalctl --since 'today 18:25' --until 'today 18:55' --no-pager | tail -40"
```

Attach output to Hostinger ticket; ask about **qemu-ga** / hPanel reboot at **18:32 IST**.

## Success criteria (2026-06-05 evening test)

- At **~6:35 PM IST**: Hostinger uptime **stays 2+ hours** (no reset), site **HTTP 200**, PM2 **online**.

## Open questions

- What triggers **shutdown at exactly ~18:32 IST**? (not found in cron; check auth.log, full journal before shutdown, Monarx, hPanel actions)

---

*When returning to Cursor chat, say: "evening downtime / 6:30 PM issue" and point to this file.*
