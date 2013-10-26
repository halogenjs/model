# Hyperbone Model

[![Build Status](https://travis-ci.org/green-mesa/hyperbone-model.png?branch=master)](https://travis-ci.org/green-mesa/hyperbone-model)

## tldr;

Nested [Backbone](http://backbonejs.org/) models with special support for [JSON HAL](http://stateless.co/hal_specification.html) and JSON Hypermedia Controls. 

## Intro

  Default Backbone models are [Active Record](http://en.wikipedia.org/wiki/Active_record_pattern). You have a resource and you can do CRUD operations on it and that's great. "Getting your truth out of the DOM" is true and rich, complex client-side applications can be built.

  The problem is for REST Level 3 - Hypermedia documents - Backbone's simple CRUD model isn't enough. You load a resource, and that resource can have many related uris (For example a 'book' resource may contain a link to the related 'author' resource), it can have other resources embedded within it (e.g, our 'book' resource could have 'pages' embedded) and finally it could have hypermedia controls to interact with that resource __that do not point to the same uri as the original resource__. For example, our 'book' resource may have a control to add a page, and a page may have a control to delete itself from the book and so on.

  Rich REST level 3 Hypermedia APIs become, in effect, a complete expression of your application in their own right. 

  __Hyperbone__ extends the flip out of Backbone to attempt to support HAL properly, to make building client-side applications consuming Hypermedia APIs as painless as possible. It's more opinionated than standard Backbone (out of necessity), but as this is a modular framework you only use the modules you need and that fit with the way you work.

  To this end, the roadmap for Hyperbone is as follows:

  - __Hyperbone Model__ : Nested Backbone models that support Hypermedia natively, supporting uri templates, rels, controls and embedded resources
  - __Hyperbone Form__ : Generating two-way bound HTML forms from JSON Controls. 
  - __Hyperbone View__ : Binding Hyperbone Models to the DOM
  - __Hyperbone IO__ : HTTP and Web Socket interactions for Hyperbone Models.
  - __Hyperbone App__ : Convention based routing

  Currently the first two have been completed, App has been stubbed out. Work is progressing on View. 

  
## WARNING!

  To remove the jQuery dependency and because Models in Hyperbone are not Active Records, the .sync() and .fetch() functionality has been stripped out. Changes to models are via controls, which are forms that are submitted to a server. HTTP interactions will be handled by the IO module (in development)

## Features

  - _links support, with 'self' mapped to `.url()`
  - Related links support with handy `.rels()` method
  - Curie support with fully qualified rel uri lookup for curied rels
  - support for uri templating to RFC6570, thanks to https://github.com/ericgj/uritemplate
  - automatic mapping of _embedded data to model attributes
  - True nesting, with support for dot notation access and ability to bind to events on nested attributes.
  - ability to assign custom Model prototypes for use with specific attributes with custom _prototypes attribute.


## Installation

Because Hyperbone is written in components, all the dependencies this module needs are installed with it. You do not need to include Backbone.js and Underscore.JS separately. Hyperbone Model actually makes use of a version of Backbone that has been refactored into separate components so that only the necessary parts are loaded. 

  Install with [component(1)](http://component.io):

    $ component install green-mesa/hyperbone-model

## API

### Creating a model

Creating a hyperbone model. The minimum valid HAL document contains a _links object, but according to the spec is this optional, so you can create a hyperbone model instance with an empty object.

```javascript
  var Model = require('hyperbone-model').Model;

  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }

  });

```

### .toJSON()

Backbone's toJSON method has had a bit of a facelift here so that the nested models and collections can be converted back to a straight JSON object.

Note that this is not the full or original hypermedia document, rather a JSON representation of the current attributes of the model.  

### .set( attr, data, options )

Usual Backbone .set(), but supports nesting of models and collections. This is handled automatically. To prevent this behaviour (to make it behave rather like generic Backbone) use `{noTraverse : true}` in options. 

Setting can be done via chaining of these models 

```javascript
// nested models means being able to bind to changes for nested models
m.get('thing').get('nestedthing').set("property", "hello")
```

or through dot notation

```javascript
m.set("thing.nestedthing.property", "hello");

//  internally this does... 
//  {
//    thing : {
//      nestedthing : { 
//        property : "hello"
//      }
//    }  
//  }
```

Support for dot notation means that you can't have attribute names with full stops. An additional option has been provided to deal with this:

```javascript
m.set("foo.bar.lol", "hello", { ignoreDotNotation: true });
// creates an attribute called "foo.bar.lol" in model m.

```

Preventing recursive traversal (i.e, for DOM elements or anything with cyclical references)

```javascript
  m.set("body", document.getElementsByTagName('body')[0], { noTraverse: true });
```

### .get( attr )

Hyperbone extends the .get() method to allow dot notation and indexed access notation to access these nested properties.

The dot notation feature is just basic string manipulation and recursive calls to .get(), and obviously you can always fall back to basic chaining if there's an issue - although reports of issues are welcome.

### More about using get and set...

The philosophy behind Hyperbone means resources are embeddable within resources which means it's models and collections all the way down. 

Automatic models... 

```javascript

  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }

  });

  model.set("test", { name : "Test", value : "Testing"});

  // chaining...
  expect( model.get("test").get("name") ).to.equal("Test"); // TRUE

  // or use the handy dot notation. This works for deeply nested models, too.
  expect( model.get("test.name").to.equal("Test") ); // TRUE!

```

And automatic collections...

```javascript

  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }

  });

  model.set("test", [{ name : "one"}, { name : "two"}, { name : "three"}]);

  expect( model.get("test").length ).to.equal( 3 ); // TRUE

  // using chaining...
  expect( model.get("test").at(0).get("name") ).to.equal("one"); // TRUE

  // or using dot notation and indexed access notiation...
  expect( model.get("test[0].name") ).to.equal("one"); // TRUE

  // arrays of objects automatically get all the power of Backbone collections... 
  model.get("test").each(function( item ){

    console.log(item.get("name"));

  });

  > one
  > two
  > three

```


In addition, events are triggered on the parent model when nested models are manipulated

```javascript

  model.on("change:test", function(){
 
    console.log("Test has been changed!")

  })

  model.get("test").set("name", "Not Test. Something else entirely");

  > Test has been changed!
```

If you want to use a specific model, the API is as follows:

```javascript

  var ModelForThings = Model.extend({
     defaults : {
        "bar" : "ren and stimpy"
     }
  });

  var ModelForResource = Model.extend({
    _prototypes : {
      "things" : ModelForThings
    }
  });

  var model = new ModelForResource({
    _links : { self : { href : "/test"} },
    "things" : {
      "foo" : "bar"
    }
  });

  // model.things is an instance of ModelForThings rather than a default empty model...
  expect( model.get("things").get("bar") ).to.equal( "ren and stimpy" ); // TRUE
```

This applies to _embedded and generic attributes.

The main difference between an model that comes from _embedded and one that's just inside the attributes is that _embedded models have a self.href

```javascript
  
  var m = new Model({
    _links : {
      self : {
        href : "/test"
      }
    },
    _embedded : {
      "foo" : {
        _links : {
          self : {
            href : "/foo/1"
          }
        }
        "bar" : "kbo"
      }
    }

  });

  expect( m.get("foo").url() ).to.equal("/foo/1"); // TRUE

  
```

### .url()

Shortcut to .rel('self');

```javascript
  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      }
    }
  });

  expect( model.url() ).to.equal("/helloworld"); // TRUE
```

### .rel( rel [, data])

Get a link to another rel of the resource. If a particular rel is a URI template and `templated: true` is set, then rel
can be used to expand the uri template with the data. There is currently no way of discovering the requirements for a URI template - it's on the to-do list.

```javascript
  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      },
      test : {
        href : "/test"
      },
      clever : {
        href : "/clever/{ id }",
        templated : true
      }
    }
  });

  expect( model.rel( "self" ) ).to.equal("/helloworld"); // TRUE
  expect( model.rel( "test" ) ).to.equal("/test"); // TRUE
  expect( model.rel( "clever", { id : "lol"} ) ).to.equal("/clever/lol"); // TRUE


```
### .rels()

Returns all the links. Hypermedia is about self discovery, after all. 

### .fullyQualifiedRel( rel )

Hyperbone supports curie (and `curies` with an array, incidentally), and offers a neato utility to recover the fully qualitied uri of a curied rel.

```javascript
  var model = new Model({
    _links : {
      self : {
        href : "/helloworld"
      },
      curie : {
        href : "http://www.helloworld.com/rels/{rel}",
        name : "rofl",
        templated : true
      },
      "rofl:test" : {
        href : "/test"
      }
    }
  });

  expect( model.rel( "rofl:test" ) ).to.equal("/test"); // TRUE
  expect( model.fullyQualitiedRel( "rofl:test" ) ).to.equal("http://www.helloworld.com/rels/test"); // TRUE
```

## Controls

Not part of the HAL Spec, but added to Hyperbone Model is some basic support for Hypermedia Controls, using the reserved property `_controls`.

Controls are a JSON representation of forms, allowing the HAL document to define all the possible interactions with a resource (including those to a different URI than the resource itself)

All this module does to assist is reserve the `_controls` keyword and offer a handy shortcut for pulling out individual control from a HAL document via an internal rel.

In practice your control JSON can be anything you want if you're handling it yourself, however there is a specific module with a specific spec for automatically transforming JSON controls into fully two-way bound styleable html form. See [Hyperbone Form](https://github.com/green-mesa/hyperbone-form) for more details. 

```js
 {
  _links : {
    "controls:create-new" : { // the internal rel for this control is "controls:create-new"
      href : "#_controls/create" // interla uri
    }
  },
  _controls : { // special _controls property
    create : {
      method : "POST",
      action : "/thing/create",
      encoding : "application/x-form-www-urlencoding",
      _children : [
        // ... details of the form here
      ]
    }
  }
 }
```

### .control( [rel / id] )

Get the control via rel or via dot notation.

```javascript
  model.control("controls:create-new");
  
```

```javascript
  model.control("create");
```

The convention is that an internal rel to a control can begin `#controls` or `#_controls` or `#control` and the path to the specific control is separated by a slash. 


## Testing

Hyperbone is covered by tests. It does not test underlying Backbone Model functionality, but the Backbone-model component used as a dependency
has been evalated against the real Backbone test suite and passes all tests.

Install testing tools. You probably need PhantomJS on your path.

```back
  $ npm install
```

Run the tests:

```bash
  $ grunt test
```


## License

  MIT
