#!/usr/bin/env python3
"""Post-process simulation.json to add equity_history.

v2.0: If export_simulation.py already maintains equity_history with 
total_equity (incl. unrealized), pass it through untouched.
Only rebuild from closed_trades as fallback when equity_history is empty.
"""
import json
import sys
from datetime import datetime, timedelta

SIM_PATH = '/var/www/xzw33.top/simulation.json'

def main():
    try:
        with open(SIM_PATH) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"ERROR reading {SIM_PATH}: {e}", file=sys.stderr)
        sys.exit(1)

    # If equity_history already exists with fresh data from export_simulation,
    # pass it through — it includes unrealized PnL via total_equity.
    eq = data.get('equity_history', [])
    total_equity = data.get('account', {}).get('total_equity', 0)
    
    if eq and len(eq) >= 1:
        last_ts = eq[-1].get('ts', 0)
        now_ts = datetime.now().timestamp()
        age_min = (now_ts - last_ts) / 60
        
        # Check if last equity point matches total_equity (within 20U)
        # This confirms it's from export_simulation (which tracks total_equity),
        # not from old add_equity_history (which only tracks realized PnL)
        last_eq = eq[-1].get('equity', 0)
        if abs(last_eq - total_equity) <= 20 and age_min < 30:
            # Fresh enough, pass through
            print(f"equity_history: {len(eq)} points from export_simulation (fresh, age={age_min:.0f}m)")
            return

    # Fallback: rebuild from closed_trades
    # Note: this only includes REALIZED PnL, not unrealized.
    # Only used when export_simulation's equity_history is missing/stale.
    trades = data.get('closed_trades', [])
    if not trades:
        print("No closed_trades and no equity_history — skipping")
        return

    init_balance = data.get('account', {}).get('initial_balance', 500)
    sorted_trades = sorted(trades, key=lambda t: t.get('close_time', ''))

    trade_points = []
    cum_pnl = 0.0
    for t in sorted_trades:
        ct = t.get('close_time', '')
        if not ct:
            continue
        cum_pnl += t.get('pnl', 0)
        try:
            dt = datetime.strptime(ct, '%Y-%m-%d %H:%M:%S')
            ts = dt.timestamp()
        except ValueError:
            continue
        trade_points.append({
            'ts': ts,
            'equity': round(init_balance + cum_pnl, 2),
            'pnl': round(t.get('pnl', 0), 2),
            'cum_pnl': round(cum_pnl, 2),
            'symbol': t.get('symbol', ''),
        })

    if len(trade_points) < 2:
        data['equity_history'] = trade_points
        with open(SIM_PATH, 'w') as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"equity_history: {len(trade_points)} points (fallback, few trades)")
        return

    # Generate 5-minute interval points
    first_ts = trade_points[0]['ts']
    last_ts = trade_points[-1]['ts']
    step = 300

    equity_history = []
    trade_idx = 0
    current_equity = init_balance

    t = first_ts
    while t <= last_ts + step:
        while trade_idx < len(trade_points) and trade_points[trade_idx]['ts'] <= t:
            current_equity = trade_points[trade_idx]['equity']
            trade_idx += 1
        dt = datetime.fromtimestamp(t)
        equity_history.append({
            'ts': t,
            'equity': round(current_equity, 2),
            't': dt.strftime('%m-%d %H:%M'),
        })
        t += step

    prev_count = len(data.get('equity_history', []))
    data['equity_history'] = equity_history

    with open(SIM_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False)

    print(f"equity_history: {prev_count} → {len(equity_history)} points (fallback, 5min interval)")

if __name__ == '__main__':
    main()
