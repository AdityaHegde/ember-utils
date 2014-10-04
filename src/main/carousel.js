Carousel = Ember.Namespace.create()
Carousel.Carousel = Ember.View.extend({
  classNames : ['carousel', 'slide'],
  attributeBindings : ['dataRide:data-ride', 'dataInterval:data-interval'],
  dataRide : "carousel",
  dataInterval : "false",
  carouselId : "00",
  carouselIdStr : function() {
    return "#"+this.get("carouselId");
  }.property('carouselId'),

  objects : [],
  layout : Ember.Handlebars.compile('' +
  '<div class="carousel-inner">' +
    '{{#each view.objects}}' +
      '{{#if _view.contentIndex}}' +
        '<div class="item">' +
          '{{yield}}' +
        '</div>' +
      '{{else}}' +
        '<div class="item active">' +
          '{{yield}}' +
        '</div>' +
      '{{/if}}' +
    '{{/each}}' +
  '</div>' +
  '<a class="left carousel-control" {{bind-attr href="view.carouselIdStr"}} data-slide="prev">' +
    '<span class="carousel-navigate carousel-navigate-prev">&laquo;</span>' +
  '</a>' +
  '<a class="right carousel-control" {{bind-attr href="view.carouselIdStr"}} data-slide="next">' +
    '<span class="carousel-navigate carousel-navigate-next">&raquo;</span>' +
  '</a>'),
});
