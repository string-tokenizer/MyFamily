import { Controller } from "@hotwired/stimulus"

const initials = name => name.split(" ").slice(0, 2).map(w => w[0]).join("")
const isDeceased = p => Boolean(p.isDeceased || p.dateOfDeath)

const avatar = p => {
  const inner = p.photo ? `<img src="${p.photo}" alt="">` : initials(p.name)
  return `<div class="avatar ${p.gender}">${inner}</div>`
}

const years = p => {
  const born = p.dob?.slice(0, 4) || "?"
  if (p.dateOfDeath) return `${born} – ${p.dateOfDeath.slice(0, 4)}`
  return isDeceased(p) ? "Deceased" : `${born} – present`
}

export default class extends Controller {
  static targets = ["list", "search", "address", "profession", "status", "count"]
  static values = { url: String }

  async connect() {
    try {
      const res = await fetch(this.urlValue)
      if (!res.ok) throw new Error(`Could not load ${this.urlValue} (HTTP ${res.status})`)
      this.people = (await res.json()).people
      this.fill(this.addressTarget, "address")
      this.fill(this.professionTarget, "profession")
      this.render()
    } catch (error) {
      console.error(error)
      this.listTarget.innerHTML = `<p class="muted">⚠️ ${error.message}</p>`
    }
  }

  fill(select, key) {
    ;[...new Set(this.people.map(p => p[key]).filter(Boolean))]
      .sort()
      .forEach(v => select.add(new Option(v, v)))
  }

  render() {
    const q = this.searchTarget.value.toLowerCase()
    const address = this.addressTarget.value
    const profession = this.professionTarget.value
    const status = this.statusTarget.value

    const results = this.people.filter(p =>
      p.name.toLowerCase().includes(q) &&
      (!address || p.address === address) &&
      (!profession || p.profession === profession) &&
      (!status || (status === "deceased") === isDeceased(p))
    )

    this.countTarget.textContent = `${results.length} of ${this.people.length} people`
    this.listTarget.innerHTML = results.map(p => `
      <a class="card" href="/people/${p.id}">
        ${isDeceased(p) ? "" : '<span class="living" title="Living"></span>'}
        ${avatar(p)}
        <h3>${p.name}</h3>
        <p class="role">${p.profession || "—"}</p>
        <span class="badge">${years(p)}</span>
      </a>`).join("")
  }
}