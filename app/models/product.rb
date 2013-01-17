class Product < ActiveRecord::Base
  include AuthoredModel
  include SluggedModel
  include SearchableModel
  include AuthorizedModel
  include RelatedModel
  include SanitizableAttributes
  include BusinessObjectModel

  attr_accessible :title, :slug, :description, :url, :version, :type, :start_date, :stop_date

  has_many :object_people, :as => :personable, :dependent => :destroy
  has_many :people, :through => :object_people

  has_many :object_documents, :as => :documentable, :dependent => :destroy
  has_many :documents, :through => :object_documents

  belongs_to :type, :class_name => 'Option', :conditions => { :role => 'product_type' }

  is_versioned_ext

  sanitize_attributes :description

  validates :title,
    :presence => { :message => "needs a value" }

  #
  # Various relationship-related helpers
  #

  @valid_relationships = [
    { :from => OrgGroup, :via => :org_group_has_province_over_product },
    { :both => Product,  :via => :product_is_affiliated_with_product },
    { :to   => Facility, :via => :product_is_dependent_on_facility },
    { :to   => Product,  :via => :product_is_dependent_on_product },
    { :from => Product,  :via => :product_is_dependent_on_product },
    { :to   => Market,   :via => :product_is_sold_into_market },
    { :from => Program,  :via => :program_is_relevant_to_product },
    { :to   => System,   :via => :product_has_process },
    { :to   => RiskyAttribute, :via => :product_has_risky_attribute },
  ]

  def display_name
    slug
  end

end
