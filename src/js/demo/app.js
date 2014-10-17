var DemoApp = AppWrapper.AppWrapper.create();

DemoApp.Router.map(function() {
  this.resource('form', { path : 'form' });
  this.resource('tree', { path : 'tree' });
  this.resource('lazydisplay', { path : 'lazydisplay' });
  this.resource('listgroup', { path : 'listgroup' });
  this.resource('dragdrop', { path : 'dragdrop' });
  this.resource('panels', { path : 'panels' });
  this.resource('progressbar', { path : 'progressbar' });
});
