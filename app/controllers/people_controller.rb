# app/controllers/people_controller.rb
class PeopleController < ApplicationController
  def index
    respond_to do |format|
      format.html
      format.json { render json: { title: Person.title, people: Person.all } }
    end
  end

  def show
    @person = Person.find(params[:id]) or raise ActionController::RoutingError, "Not found"
  end
end