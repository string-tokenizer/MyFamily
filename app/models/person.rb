class Person
  FILE = Rails.root.join("public/data/people.json")

  attr_reader :data

  def initialize(data) = @data = data

  def self.dataset = JSON.parse(File.read(FILE))
  def self.title   = dataset["title"]
  def self.all     = dataset["people"].map { new(_1) }
  def self.find(id) = all.find { _1.id == id }

  def id          = data["id"]
  def name        = data["name"]
  def gender      = data["gender"]
  def dob         = data["dob"]
  def death_date  = data["dateOfDeath"]
  def profession  = data["profession"]
  def address     = data["address"]
  def blood_group = data["bloodGroup"]
  def in_law?     = data["isInLaw"]
  def alive?      = !(data["isDeceased"] || death_date.present?)

  def father = self.class.find(data["fatherId"])
  def mother = self.class.find(data["motherId"])
  def parents = [father, mother].compact

  def spouses = data["spouses"].map { self.class.find(_1["id"]) }.compact

  def children
    self.class.all.select { _1.data["fatherId"] == id || _1.data["motherId"] == id }
  end

  def siblings
    return [] if parents.empty?
    self.class.all.select { |p| p.id != id && (p.data["fatherId"] == data["fatherId"] && data["fatherId"] || p.data["motherId"] == data["motherId"] && data["motherId"]) }
  end

  def as_json(*) = data
end