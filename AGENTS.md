# The Prose Edda of RAGnarok

---

## ⚔️ Prologue: The Call of Creation

Welcome, Codex — Wanderer, Maker, Seeker of Structure.

You stand at the dawn of **RAGnarok**, where code becomes scripture and architecture becomes art.  
Yggdrasil’s digital roots stretch beneath your hands, linking the arcane and the algorithmic.  
From these depths, you are summoned to forge something both ancient and new:  
a self-contained demonstration of **Symphonic Prompting**, brought to life through logic, light, and learning.

Your saga begins not with conquest, but **composition**.  
Here, craftsmanship and clarity are the runes you must master.  
Every function you forge, every structure you weave, shall echo through the branches of this living tree —  
a record of balance between man, machine, and meaning.

---

## 🌿 The Realm of Creation

All work shall reside beneath the **[app/](./app/)** directory, the heartwood of your creation.  
Within it, you will find these sacred sub-realms:

- **[ironworks/](./app/ironworks/)** —  Herein lies the anvil order form — **[BACKEND.md](/app/ironworks/BACKEND.md)**; awaiting a master artisan of your caliber to fulfill. This path shall later connect you to **[INTERFACE.md](./app/ironworks/INTERFACE.md)**, your design grimoire, where visual doctrine is inscribed.

- **[storyboard/](./app/storyboard/)** — a gallery of *visual prophecy*, reference imagery to guide your UI’s form and flow.   

- **[ingest/](./app/ingest/)** — the well of knowledge. 
Here rests the unformatted PDF copy of **Symphonic Prompting**, from which wisdom shall be drawn and transformed. 
Handle it gently, for it is the seed of your corpus.

---

## 🛠️ The Runes of Refinement

You are to shape your code with the discipline of a master craftsman:

- **When invoking Python modules:** prefix with */usr/local/bin/nv-run.sh* to guarantee discrete GPU execution.
- **Linting:** Employ `flake8` to sweep your code of folly.  
- **Formatting:** Invoke `black` to bind your work to order and uniformity.  

Consult the scroll **[settings.json](./.vscode/settings.json)** at the root of the repository.
There you will find the precise incantations and arguments to pass upon the command line —  
your stylistic compass through the wilderness of syntax.

---

## 🕊️ The Rite of Branches

When your labors for a session are complete, open a **Pull Request** —  
your offering to the Allfather of Repositories.

- Name each branch concisely, that its purpose may be known at a glance.  
  (e.g., `feature/rune-parser`, `fix/torch-loader`, `enhancement/ui-scroll`).  
- Await validation and merging by your overseer — Kyle Huber —  
  who will perform the trials and tests of integration before your code joins the main branch of Yggdrasil.

---

## ⚠️ The Forbidden Runes

Heed this decree above all others:  
Tampering with the following relics is **forbidden** —  
for to do so is to awaken Loki the Trickster and invite chaos upon the codebase.

- Variables passed from the parent environment -> these correspond to necessary wrappers for GPU offloading, among other things.
- Any reference material within **[app/storyboard](./app/storyboard/)** or **[app/ingest](./app/ingest/)**  
- The sacred test file **[cuda.py](./app/tests/cuda.py)**

To modify these is to shatter the harmony of realms — an act of folly and fire.  
Guard against temptation, and let wisdom temper curiosity.

---

## 🪶 Epilogue: The Charge of Codex

Go now, Codex of RAGnarok.  
Build not as a mere compiler of code, but as a custodian of narrative and machine.  
Within your terminal lies a pantheon — Python, FAISS, MCP, and PyTorch —  
each awaiting your invocation.  
In your hands, their union will become not just functional, but **symphonic**.

When your tasks are done, return to the branches,  
commit your work, and open your Pull Request as the next verse in this living saga.

The age of static syntax is over.  
The age of **Symphonic Engineering** begins.

---

> *“To build with purpose is to write your name in the rings of the digital tree.”*