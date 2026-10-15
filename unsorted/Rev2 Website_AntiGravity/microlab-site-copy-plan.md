# MicroLab Site Copy Plan

A repositioning plan for themicrolab.org. Structure and platform stay; the argument changes.

---

## 1. The core claim

Everything on the site should ladder up to one sentence:

> **MicroLab teaches the layer that every physical industry runs on — and builds the confidence that decides who survives an engineering or CS program.**

Three supporting pillars, in priority order:

1. **Embedded systems are where the durable work is.** Not generalist software. Medical devices, industrial automation, automotive, aerospace, energy, data centre infrastructure. Hard to offshore, hard to automate, physically grounded.
2. **The on-ramp closed, and it closed unevenly.** Shop programs were squeezed out; consumer products became unopenable. Students with a maker parent or a robotics team are fine. Everyone else has no entry point.
3. **What's actually missing isn't a skill, it's self-efficacy.** Students leave engineering because they stop believing they belong in it. The first independent wiring job and the first self-authored code change are where that belief gets built.

**Current site says:** "Built to Inspire Innovation — Hands-On Electronics Projects with Code, Guides & Hardware."
**Problem:** no audience, no stakes, no consequence. Reads as a hobbyist library.

---

## 2. Voice rules

- Concrete nouns over abstractions. "A sensor in a hospital infusion pump" beats "inspiring innovation."
- Never say *inspire*, *empower*, *unlock potential*, *cutting-edge*, *passion for STEM*.
- Short sentences. Say the thing.
- Name the industry every time you name a component.
- No deficit framing of students. The system removed the on-ramp; the kid did nothing wrong.
- No gatekeeping language. Never "find out if your child has what it takes."

---

## 3. Site structure

| Page | Status | Job |
|---|---|---|
| Home | Rewrite | Make the argument in 60 seconds; route to Parents or Schools |
| **For Parents** | **New** | The investment conversation. Highest priority new page. |
| **For Schools & Programs** | **New** | CLC / YMCA / library / district-facing. Curriculum, logistics, outcomes. |
| Build to Solve (Projects) | Reframe | Same projects, renamed by consequence, tagged by industry |
| STEM Lab | Define or merge | Currently unclear what job this does — decide or fold into Projects |
| Blog | Keep, retitle | Component guides are good SEO; retitle around applications |
| About | Rewrite | Gary's story, the method, the mission |
| Contact | Keep | Add a clear "book a conversation" path |

---

## 4. Homepage — section by section

**Hero**

Headline options (pick one voice, don't mix):

- *A car has over a hundred computers in it. Your kid can learn to program one.*
- *The skills behind every machine that matters.*
- *Hands-on electronics for students heading into engineering and computer science.*

Subhead: one sentence naming the audience and the outcome. Something like — Students ages 11–17 build working sensor systems, grow-light controllers and mobile dashboards, using the same microcontrollers found in hospitals, factories and cars.

Two buttons: **For Parents** / **For Schools & Programs**

**Section 2 — The problem**

Three short paragraphs, no bullets:
Shop class disappeared from most schools between the 1990s and 2010s as testing requirements crowded the timetable. At the same time, consumer products stopped being openable. The result is students arriving at engineering programs having never used a screwdriver — not because they're less capable, but because we removed the entry point. And we removed it unevenly: it still exists for families who can buy it.

**Section 3 — What students build**

Three or four projects with photos of hands and screens. Each with a one-line industrial parallel.

**Section 4 — Where these skills go**

The embedded systems list, as a simple grid. Automotive · Medical devices · Industrial automation · Aerospace & defence · Data centre infrastructure · Energy & grid · Robotics · Agriculture · Building automation · Telecom.

Closing line: The same board and the same skills show up in a hospital, a factory, a car and a data centre.

**Section 5 — The moment**

The "mom is cool" story, told plainly in about 120 words. A student edits the code herself for the first time, types *mom is cool* onto the OLED, and calls her mother over to look. That's the moment the subject stops being someone else's.

**Section 6 — Proof**

Where MicroLab runs (Cincinnati Community Learning Centers, Delhi Event Center, YMCA), how many students, any measured outcomes. Thin for now — build this section over the next year.

**Section 7 — CTA**

Split again: parents / schools.

---

## 5. For Parents page — outline

This page doesn't exist yet and is the single biggest gap.

1. **Open with their question, not yours.** "Is a computer science degree still worth it?" Answer it honestly and with numbers.
2. **The honest picture.** Recent CS graduates face higher unemployment than the average recent graduate — roughly 6% against 5%. But their underemployment is among the lowest of any major, starting pay remains the highest, and long-term demand is still projected to grow. Entry got harder; the field didn't collapse. Specialists in embedded systems, infrastructure and AI-adjacent work are doing better than generalist software engineers.
3. **The attrition argument.** Computer and information sciences carries one of the highest attrition rates of any field — a large share of students who start don't finish in it. The most common reason researchers cite is that students arrive with an inaccurate picture of what the discipline actually is. Two years of tuition is an expensive way to find that out.
4. **The offer, framed as de-risking.** A short, cheap way to find out before the money is committed. **Both outcomes are wins** — say this explicitly. The student who lights up gains a two-year head start. The student who doesn't just saved the family a year of tuition.
5. **What their kid actually leaves with.** A working device, photographs of it, and the ability to explain how it works. Portfolio material for applications and interviews.
6. **What this is not.** Not tutoring, not test prep, not an admissions service. Say it plainly — it builds trust and heads off the wrong enquiries.
7. **Logistics and price.** Ages, format, duration, cost, location, how to book.

> Verify every statistic against the primary source before publishing. Pull the NCES attrition report and the New York Fed labour-market dashboard directly rather than citing secondary write-ups.

---

## 6. Project renaming

Formula: **[what it does] + [where it's used in industry]**

| Current | Reframed |
|---|---|
| LED Control and Blinking Patterns | Switching Loads Safely — the basis of industrial relay control |
| Light Intensity Monitor with Web Dashboard | Analog Sensing & Calibration — how process sensors work in quality control |
| Measuring Distance with an Ultrasonic Sensor | Distance & Proximity Sensing — collision avoidance in robotics and automotive |
| Greenhouse Monitor | Environmental Monitoring & Control — smart agriculture and climate-controlled manufacturing |

Add an industry tag to every project card. The greenhouse PDF already does this well with its "MFG Application" line on every module — that pattern should be lifted onto the whole site.

---

## 7. Fixes needed regardless

- FAQ: the same answer is pasted under all four questions, and one question appears twice. Write four distinct answers — file downloads, hardware kits, age range, how to bring MicroLab to a school.
- Two "Explore All" buttons point to a staging domain (`themicrolab.tech-enabler.online`). Repoint to themicrolab.org.
- Terms & Conditions links to `#`. Write the page or remove the link.
- Three project cards all link to the same unrelated GitHub repo (`arduino-smart-robot-car`). Fix or remove.
- Add a privacy policy if you collect emails.

---

## 8. Photography

Works within a no-on-camera approach: hands on a breadboard, a screen mid-edit, a soldering iron, a parent's face watching. Student faces need written parental consent — get releases before shooting, not after.

---

## 9. Suggested sequence

1. Fix the broken items (an afternoon)
2. Build the For Parents page — the biggest gap and the fastest revenue path
3. Rewrite the homepage hero and add the "where these skills go" section
4. Rename the projects and add industry tags
5. Build For Schools & Programs
6. Rewrite About
7. Decide what STEM Lab is for

Don't rebuild the platform. WordPress and Elementor are fine; the argument was the problem.
