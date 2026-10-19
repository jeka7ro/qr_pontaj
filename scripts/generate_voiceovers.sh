#!/bin/bash
set -e

VOICE="Samantha"
DIR="assets/video_audio"

say -v "$VOICE" -r 175 "Still tracking employee attendance with manual paper sheets, lost keycards, or cumbersome hardware? It is slow, prone to errors, and costs your company thousands every month." -o "$DIR/scene1_problem.m4a"

say -v "$VOICE" -r 175 "Meet GetApp Smart QR: the modern time and attendance platform that turns any standard tablet into a smart entrance kiosk. Fast, seamless, and foolproof." -o "$DIR/scene2_solution.m4a"

say -v "$VOICE" -r 175 "Monitor your entire workforce across all branches in real time. Filter active shifts directly from interactive charts, schedule daily plans, and let intelligent automated shift closing handle end-of-day sign-outs automatically." -o "$DIR/scene3_dashboard.m4a"

say -v "$VOICE" -r 175 "At month-end, export certified timesheets ready for payroll in seconds. And because we use rotating encrypted QR codes and private PINs instead of facial or fingerprint scans, your organization remains 100% GDPR compliant with zero privacy liabilities." -o "$DIR/scene4_payroll.m4a"

say -v "$VOICE" -r 175 "No upfront hardware costs. No complicated server setups. Deploy in just 15 minutes for only 15 euros per employee per month with our Smart plan." -o "$DIR/scene5_pricing.m4a"

say -v "$VOICE" -r 175 "Upgrade your company attendance today. Visit www.getapp.ro to claim your 14-day free trial. Smart attendance starts here." -o "$DIR/scene6_cta.m4a"

echo "Voiceovers generated successfully in $DIR"
