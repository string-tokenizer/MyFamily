# config/routes.rb
Rails.application.routes.draw do
  root "people#index"
  resources :people, only: %i[index show]
  get "tree", to: "trees#show"
end
