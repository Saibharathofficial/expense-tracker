# College Money Tracker

A simple mobile-first money tracker.

## What it does
- Add pocket money / money received.
- Enter an expense in seconds.
- Automatically updates money left.
- Daily expense graph for 7/14/30 days.
- Undo the most recent expense.
- Recent transaction history.
- Save people and track amounts you owe them / they owe you.
- Settle or delete a person's balance.
- Data is stored locally on the device using localStorage.
- Can be installed as a PWA from a supported mobile browser.

## Run
The app needs to be served over HTTP/HTTPS for the service worker/install feature.

For example:
1. Put these files on any static web host.
2. Open the site on your phone.
3. Use the browser's "Add to Home Screen"/install option.

## Android widget note

The current project is a mobile-first PWA. A true Android home-screen widget requires a native Android wrapper/app; the tracker data model is kept simple so a future Android widget can write expenses directly.

## About a phone widget
A real Android/iOS home-screen widget cannot be provided by a normal web/PWA app. It requires a native mobile app and platform widget code. The core tracker is deliberately kept simple so a native widget can later write directly to the same transaction database.
