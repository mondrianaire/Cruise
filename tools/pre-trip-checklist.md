# Pre-trip checklist — global-events crosscheck

Required step before any trip-hub is considered ready. Catches the
class of failure documented in [`../LESSONS.md`](../LESSONS.md#major-miss-2026-fifa-world-cup-overlap):
a major scheduled event sitting inside the trip window that the hub
never surfaced, where the traveller — *if they had known* — would
have changed the plan.

## The rule

The threshold is **decision-grade**, not "is something happening."
Ask: *would knowing this have changed where I stayed, when I drove,
which port-day I picked, which restaurant I booked, which flight I
took?* If yes, it has to be flagged on the affected day with a
recommendation — **avoid**, **embrace**, or **shift the plan**.

Pretty-trivia callouts ("the city has a Pride parade this weekend!")
go in the day notes. Decision-grade overlaps get a banner.

## What to crosscheck against the trip window

For **every city, port, and travel day** on the itinerary, scan each of
these against the date range:

1. **Mega sport tournaments.** FIFA World Cup, Olympics (summer +
   winter), UEFA Euros, Copa América, Rugby World Cup, Super Bowl,
   NBA Finals, Stanley Cup Final, World Series, Champions League
   final, MLB All-Star. *And the host-team match calendar inside
   it.* It's not enough to note "the World Cup is on" — the
   decision lever is whether the **host nation** or a **major-
   diaspora nation** is playing on a day you're in the city.
2. **High-profile politics.** G7 / G20 / NATO summits, royal
   weddings / coronations / state funerals, papal visits, major
   election days, inauguration days, large state visits.
3. **Cultural mega-events.** Eurovision, Cannes, Venice Biennale,
   Edinburgh Fringe, Glastonbury / Coachella, big arena tours
   (e.g. a Taylor Swift / Beyoncé stadium night in your city),
   Comic-Con, Art Basel, fashion weeks.
4. **City-specific big days.** Boston Marathon, NYC Marathon,
   Mardi Gras, Carnival, La Mercè, Oktoberfest, Bastille Day, big
   Pride weekends, large local festivals.
5. **Conference weeks.** CES, SXSW, COP, Davos, ASCO, RSA — these
   distort hotel pricing and dining capacity even when they don't
   create street-level chaos.
6. **Religious calendar peaks** in the destination culture. Holy
   Week / Easter, Ramadan & Eid, Hajj, Yom Kippur, Lunar New Year,
   Diwali, Songkran, Carnival.
7. **National holidays** in the destination country, including
   sub-national ones (Saint-Jean-Baptiste in Quebec, Canada Day,
   Bastille Day, Australia Day, Juneteenth, US Independence Day,
   Mexican Independence Day). Closures, parades, sold-out dining.
8. **Travel & infrastructure** scheduled events in the window:
   announced transit strikes, planned airport / station closures,
   bridge / tunnel work, port closures (cruise terminal changes!),
   major construction periods.

## How to surface a hit

For each match / event day that lands inside the trip:

- **Add a single-line banner to that day's plan** with: what,
  where, time, the predicted impact (traffic / pricing / dining
  / transit / safety / sold-out concern), and a recommendation.
- **Tag the recommendation** as one of:
  - `AVOID` — re-route, reschedule, swap the night.
  - `EMBRACE` — book the ticket, pick a sports bar, secure the
    restaurant reservation a month early.
  - `SHIFT` — reorder the itinerary so the impact lands on a
    flex day instead of a hard-locked one.
- **Surface it on the overview page**, not buried inside a
  port-detail card. The traveller decides at planning time
  whether the conflict is acceptable; the hub doesn't get to
  hide it.

## When to run the check

- **Once at trip-hub creation**, before the user reviews v.1.
- **Again two weeks before departure**, in case anything new
  was announced (concert tours and political summits often
  drop late).
- **Re-run if the trip dates change**, even by a single day.

## Quick template for a hit

```
Day X — <date>, <city>
🏟️  <Event>, <venue>, <start time>
Impact: <traffic / pricing / sold-out / curfew / closures>
Recommendation: <AVOID | EMBRACE | SHIFT> — <one sentence>
```

## Worked example (what should have happened on the 2026 trip)

> Sat Jun 13 — Quebec City + embark
> 🏟️ World Cup Day 3 (tournament opens Jun 11). Canada plays
>    its opener at <stadium> at <time>. Quebec City won't be a
>    fan-fest centre but transit out of Montreal and through
>    Toronto will be affected. Embark crowd at Quebec may run
>    closer to lower-end of the 2-hour window.
> Recommendation: **EMBRACE** if interested — pick a sports bar
>    for lunch in Upper Town and watch the match before walking
>    to the cruise terminal.
>
> Sat Jun 20 — Boston Harbor Hotel (Laura's birthday)
> 🏟️ World Cup match at Gillette Stadium tonight, kickoff <time>.
> Impact: Logan delays, North End and Seaport traffic peak,
>    harbor area hotel pricing surge already locked in, dining
>    reservations within 1 mi of the hotel will be sold out.
> Recommendation: **AVOID or EMBRACE** — either book a dinner
>    reservation *now* outside the impact radius, or commit to
>    the match and shift the celebration dinner to the late
>    side after the venue clears. Either way, don't arrive at
>    Boston Harbor Hotel assuming a normal Saturday night.
