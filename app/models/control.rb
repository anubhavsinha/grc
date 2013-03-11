require 'slugged_model'

# A company / regulation control
#
class Control < ActiveRecord::Base
  include CommonModel
  include SluggedModel
  include SearchableModel
  include AuthorizedModel
  include RelatedModel
  include SanitizableAttributes

  CATEGORY_TYPE_ID = 100
  CATEGORY_ASSERTION_TYPE_ID = 102

  attr_accessible :title, :slug, :description, :directive, :section_ids, :type, :kind, :means, :categories, :verify_frequency, :url, :start_date, :stop_date, :version, :documentation_description, :notes, :assertions, :fraud_related, :key_control

  def general_categories
    categories.ctype(CATEGORY_TYPE_ID)
  end

  def assertion_categories
    categories.ctype(CATEGORY_ASSERTION_TYPE_ID)
  end

  define_index do
    indexes :slug, :sortable => true
    indexes :title
    indexes :description
    has :created_at, :updated_at, :directive_id
  end

  belongs_to :directive

  belongs_to :parent, :class_name => 'Control'

  # Many to many with System
  has_many :system_controls, :dependent => :destroy
  has_many :systems, :through => :system_controls

  # Which sections are implemented by this one.  A company
  # control may implement several sections.
  has_many :sections, :through => :control_sections
  has_many :control_sections, :dependent => :destroy

  has_many :implemented_controls, :through => :control_controls
  has_many :control_controls, :dependent => :destroy

  has_many :implementing_controls, :through => :implementing_control_controls, :source => :control
  has_many :implementing_control_controls, :class_name => "ControlControl", :foreign_key => "implemented_control_id", :dependent => :destroy

  # Many to many with Risk
  has_many :control_risks, :dependent => :destroy
  has_many :risks, :through => :control_risks

  belongs_to :type, :class_name => 'Option', :conditions => { :role => 'control_type' }
  belongs_to :kind, :class_name => 'Option', :conditions => { :role => 'control_kind' }
  belongs_to :means, :class_name => 'Option', :conditions => { :role => 'control_means' }
  belongs_to :verify_frequency, :class_name => 'Option', :conditions => { :role => 'verify_frequency' }

  has_many :categorizations, :as => :categorizable, :dependent => :destroy
  has_many :categories, :through => :categorizations, :conditions => { :scope_id => Control::CATEGORY_TYPE_ID }

  has_many :assertations, :class_name => 'Categorization', :as => :categorizable, :dependent => :destroy
  has_many :assertions, :through => :assertations, :source => :category, :conditions => { :scope_id => Control::CATEGORY_ASSERTION_TYPE_ID }

  has_many :control_assessments, :dependent => :destroy

  is_versioned_ext

  sanitize_attributes :description, :documentation_description, :notes

  validates :directive, :directive_id,
    :presence => { :message => "needs a value" }

  validate :require_title_or_description

  def require_title_or_description
    if title.blank? && description.blank?
      errors.add(:title, "either title or description is required")
      errors.add(:description, "either title or description is required")
    end
  end

  def display_name
    "#{slug} - #{title}"
  end

  def linked_programs
    directive_ids = implemented_controls.map(&:directive_id)
    Program.
      joins(:program_directives).
      where(:program_directives => { :directive_id => directive_ids })
  end

  def custom_edges
    # Returns a list of additional edges that aren't returned by the default method.

    edges = Set.new
    if parent
      edges.add(Edge.new(parent, self, :control_includes_control))
    end

    if directive
      edges.add(Edge.new(directive, self, :directive_includes_control))
    end

    systems.each do |system|
      edges.add(Edge.new(self, system, :control_implemented_by_system))
    end

    sections.each do |section|
      edges.add(Edge.new(section, self, :section_implemented_by_control))
    end

    implemented_controls.each do |control|
      edges.add(Edge.new(control, self, :control_implemented_by_control))
    end

    implementing_controls.each do |control|
      edges.add(Edge.new(self, control, :control_implemented_by_control))
    end

    edges
  end

  def self.custom_all_edges
    # Returns a list of additional edges that aren't returned by the default method.
    edges = Set.new
    includes(:parent, :directive, :systems, :sections, :implemented_controls, :implementing_controls).each do |c|
      if c.parent
        edges.add(Edge.new(c.parent, c, :control_includes_control))
      end

      if c.directive
        edges.add(Edge.new(c.directive, c, :directive_includes_control))
      end

      c.systems.each do |system|
        edges.add(Edge.new(c, system, :control_implemented_by_system))
      end

      c.sections.each do |section|
        edges.add(Edge.new(section, c, :section_implemented_by_control))
      end

      c.implemented_controls.each do |control|
        edges.add(Edge.new(control, c, :control_implemented_by_control))
      end

      c.implementing_controls.each do |control|
        edges.add(Edge.new(c, control, :control_implemented_by_control))
      end
    end

    edges
  end

  def systems_display
    systems.map {|x| x.slug}.join(',')
  end

  def categories_display
    categories.ctype(CATEGORY_TYPE_ID).map {|x| x.name}.join(',')
  end

  def assertions_display
    categories.ctype(CATEGORY_ASSERTION_TYPE_ID).map {|x| x.slug}.join(',')
  end

  def references_display
    documents.map do |d|
      "#{d.description} [#{d.link} #{d.title}]"
    end.join("\n")
  end

  def operator_display
    p = object_people.detect {|x| x.role == 'operator'}
    p ? p.person.email : ''
  end

  # alias used in import
  def operator
    operator_display
  end
end
