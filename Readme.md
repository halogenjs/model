# Hyperbone Model

[![Build Status](https://travis-ci.org/green-mesa/hyperbone-model.png?branch=master)](https://travis-ci.org/green-mesa/hyperbone-model)

## tldr;

Nested [Backbone](http://backbonejs.org/) models with special support for [JSON HAL](http://stateless.co/hal_specification.html) and JSON Hypermedia Controls. 

## Intro

  Default Backbone models are [Active Record](http://en.wikipedia.org/wiki/Active_record_pattern). You have a resource and you can do CRUD operations on it and that's great. "Getting your truth out of the DOM" is true and rich, complex client-side applications can be built.

  The problem is for REST Level 3 - Hypermedia documents - Backbone's simple CRUD model isn't enough. You load a resource, and that resource can have many related uris (For example a 'book' resource may contain a link to the related 'author' resource), it can have other resources embedded within it (e.g, our 'book' resource could have 'pages' embedded) and finally it could have hypermedia commands to interact with that resource __that do not point to the same uri as the original resource__. For example, our 'book' resource may have a command to add a page, and a page may have a command to delete itself from the book and so on.

  Rich REST level 3 Hypermedia APIs become, in effect, a complete expression of your application in their own right. 

  __Hyperbone__ extends Backbone to attempt to support HAL properly, to make building client-side applications consuming Hypermedia APIs as painless as possible. It's more opinionated than standard Backbone (out of necessity), but as this is a modular framework you only use the modules you need and that fit with the way you work.

  To this end, the roadmap for Hyperbone is as follows:

  - __Hyperbone Model__ : Nested Backbone models that support Hypermedia natively, supporting uri templates, rels, controls and embedded resources
  - __Hyperbone View__ : Binding Hyperbone Models to the DOM
  - __Hyperbone View Command Extensions__ : Binding _commands to the DOM
  - __Hyperbone IO__ : HTTP and Web Socket interactions for Hyperbone Models.
  - __Hyperbone App__ : Convention based routing

  Currently the first two have been completed.

  
## WARNING!

  To remove the jQuery dependency and because Models in Hyperbone are not Active Records, the .sync() and .fetch() functionality has been stripped out. Changes to models are via commands, which are forms that are submitted to a server. HTTP interactions will be handled by the IO module (in development)

## Features

  - _links support, with 'self' mapped to `.url()`
  - Related links support with handy `.rels()` method
  - Curie support with fully qualified rel uri lookup for curied rels
  - support for uri templating to RFC6570, thanks to https://github.com/ericgj/uritemplate
  - automatic mapping of _embedded data to model attributes
  - True nesting, with support for dot notation access and ability to bind to events on nested attributes.
  - ability to assign custom Model prototypes for use with specific attributes with custom _prototypes attribute.
  - Special _commands keyword


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

## Commands

Not part of the HAL Spec, but added to Hyperbone Model is some basic support for Hypermedia Commands, using the reserved property `_commands`.

We won't go into too much detail here, but Commands represent HTTP interactions available to a resource. The simplest commands containly only what is necessary for a client to make a valid HTTP request, but these can be extended with a schema to add validation and the handy ability to generate placeholder forms. 

All this module does to assist is reserve the `_commands` keyword and offer a handy shortcut for pulling out individual commands from a HAL document via an internal rel.

In practice your command JSON can be anything you want if you're handling it yourself, but there is a specific extension for Hyperbone View that allows you to bind your View to these commands more directly which requires a certain type of input. Generally a command has an 'href', a 'method' and some properties which represent the data that will be exchanged with the server.


```js
 {
  _links : {
    "cmds:create-new" : { // the internal rel for this control is "controls:create-new"
      href : "#_commands/create" // interal uro
    }
  },
  _commands : { // special _controls property
    create : {
      method : "POST",
      href : "/thing/create",
      encoding : "application/x-form-www-urlencoding",
      properties : [
        name : "",
        description : "",
        wantsThing : true
      ]
    } 
  }
 }
```

### .command( [rel / id] )

Get the command model via rel or via dot notation.

```javascript
  model.command("cmds:create-new");
  
```

```javascript
  model.command("create");
```

The convention is that an internal rel to a command can begin `#commands` or `#_commandss` or `#command` and then the path to the specific command is separated by a slash. 


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
