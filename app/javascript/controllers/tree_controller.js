import { Controller } from "@hotwired/stimulus"

const initials = name => name.split(" ").slice(0, 2).map(w => w[0]).join("")
const isDeceased = p => Boolean(p.isDeceased || p.dateOfDeath)

const avatar = p => {
  const inner = p.photo ? `<img src="${p.photo}" alt="">` : initials(p.name)
  return `<div class="avatar ${p.gender}">${inner}</div>`
}

const years = p => {
  const born = p.dob?.slice(0, 4) || ""
  const died = p.dateOfDeath?.slice(0, 4)
  if (died) return `${born || "?"} – ${died}`
  return isDeceased(p) ? (born ? `${born} – †` : "Deceased") : (born || "")
}

export default class extends Controller {
  static targets = ["root", "canvas"]
  static values = { url: String }

  async connect() {
    try {
      const res = await fetch(this.urlValue)
      if (!res.ok) throw new Error(`Could not load ${this.urlValue} (HTTP ${res.status})`)
      this.people = (await res.json()).people
      this.byId = Object.fromEntries(this.people.map(p => [p.id, p]))
      this.people
        .filter(p => !p.isInLaw)
        .forEach(p => this.rootTarget.add(new Option(p.name, p.id)))
      this.render()
    } catch (error) {
      console.error(error)
      this.canvasTarget.innerHTML = `<p class="muted">⚠️ ${error.message}</p>`
    }
  }

  render() {
    const selected = this.rootTarget.value
    this.roots = selected
      ? [this.byId[selected]]
      : this.people.filter(p => !p.fatherId && !p.motherId && !p.isInLaw)
    this.expanded = new Set(this.roots.map(p => p.id))
    this.draw()
  }

  toggle(event) {
    const id = event.params.id
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id)
    this.draw()
  }

  expandAll() {
    this.people.forEach(p => { if (this.kidsOf(p).length) this.expanded.add(p.id) })
    this.draw()
  }

  collapseAll() {
    this.expanded = new Set(this.roots.map(p => p.id))
    this.draw()
  }

  kidsOf(p) {
    return this.people.filter(c => c.fatherId === p.id || c.motherId === p.id)
  }

  draw() {
    this.canvasTarget.innerHTML = `<ul>${this.roots.map(p => this.unit(p)).join("")}</ul>`
  }

  unit(p) {
    const spouses = (p.spouses || []).map(s => this.byId[s.id]).filter(Boolean)
    const kids = this.kidsOf(p)
    const open = this.expanded.has(p.id)

    const spouseHtml = spouses
      .map(s => `<span class="link">♥</span>${this.node(s, p, kids.length > 0)}`)
      .join("")

    const toggleHtml = kids.length
      ? `<button class="toggle ${open ? "open" : ""}" type="button"
           aria-expanded="${open}"
           data-action="click->tree#toggle" data-tree-id-param="${p.id}">
           ${open ? "−" : "+" + kids.length}
         </button>`
      : ""

    const kidsHtml = open && kids.length
      ? `<ul>${kids.map(k => this.unit(k)).join("")}</ul>`
      : ""

    return `<li>
      <div class="unit">${this.node(p, p, kids.length > 0)}${spouseHtml}</div>
      ${toggleHtml}
      ${kidsHtml}
    </li>`
  }

  node(person, owner, expandable) {
    const action = expandable
      ? `data-action="click->tree#toggle" data-tree-id-param="${owner.id}"`
      : ""
    return `<div class="node-wrap">
      <div class="node ${person.gender} ${isDeceased(person) ? "deceased" : ""} ${expandable ? "expandable" : ""}" ${action}>
        ${avatar(person)}
        <span class="node-name">${person.name}</span>
        <small>${years(person)}</small>
      </div>
      <a class="profile-link" href="/people/${person.id}">Profile ↗</a>
    </div>`
  }
}