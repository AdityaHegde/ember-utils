Ember.TEMPLATES["application"] = Ember.Handlebars.compile('' +
  '<nav class="navbar navbar-default" role="navigation"> ' +
    '<div class="container-fluid"> ' +
      '<div class="navbar-header"> ' +
        '<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1"> ' +
          '<span class="sr-only">Toggle navigation</span> ' +
          '<span class="icon-bar"></span> ' +
          '<span class="icon-bar"></span> ' +
          '<span class="icon-bar"></span> ' +
        '</button> ' +
        '<a class="navbar-brand" href="#">Utils</a> ' +
      '</div> ' +
      '<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1"> ' +
        '<ul class="nav navbar-nav"> ' +
          '<li>{{#link-to "form"}}Form{{/link-to}}</li> ' +
          '<li>{{#link-to "tree"}}Tree{{/link-to}}</li> ' +
          '<li>{{#link-to "lazydisplay"}}Lazy Display{{/link-to}}</li> ' +
          '<li>{{#link-to "listgroup"}}List Group{{/link-to}}</li> ' +
          '<li>{{#link-to "dragdrop"}}Drag Drop{{/link-to}}</li> ' +
          '<li>{{#link-to "panels"}}Panels{{/link-to}}</li> ' +
          '<li>{{#link-to "progressbar"}}Progress Bar{{/link-to}}</li> ' +
        '</ul> ' +
      '</div><!-- /.navbar-collapse --> ' +
    '</div><!-- /.container-fluid --> ' +
  '</nav> ' +
  '<div class="container-fluid"> ' +
    '{{outlet}} ' +
  '</div> ' +
'');

Ember.TEMPLATES["dragdrop"] = Ember.Handlebars.compile('' +
  '{{view "sortDraggableA" record=model columnDataGroup=columnDataGroup}} ' +
'');

Ember.TEMPLATES["form"] = Ember.Handlebars.compile('' +
  '{{alert-message message=message collapseTimeout=collapseTimeout}} ' +
  '{{view "form/form" record=model columnDataGroup=columnDataGroup}} ' +
'');

Ember.TEMPLATES["lazydisplay"] = Ember.Handlebars.compile('' +
  '{{view "lazyDisplay/lazyDisplay" class="col-md-4" columnDataGroup=columnDataGroup rows=model}} ' +
'');

Ember.TEMPLATES["listgroup"] = Ember.Handlebars.compile('' +
  '{{view "listGroup/listGroup" list=model columnDataGroup=columnDataGroup}} ' +
'');

Ember.TEMPLATES["panels"] = Ember.Handlebars.compile('' +
  '{{view "panels/panels" panels=model columnDataGroup=columnDataGroup}} ' +
  '{{view "panels/panelCollapsible" record=standAlonePanel columnDataGroup=columnDataGroup}} ' +
'');

Ember.TEMPLATES["progressbar"] = Ember.Handlebars.compile('' +
  '{{#progress-bar minVal=minVal maxVal=maxVal val=val striped=striped style=style animated=animated}} ' +
    '{{val}} / {{maxVal}} ' +
  '{{/progress-bar}} ' +
'');

Ember.TEMPLATES["tree"] = Ember.Handlebars.compile('' +
  '{{view "tree/node" record=model columnDataGroup=columnDataGroup}} ' +
'');