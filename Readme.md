
# Hyperbone Model

  Backbone Models, but with Hypermedia Extensions. Because of the hypermedia, interactions with resources are through 
  controls. This is a local module for local people - we don't want any CRUD here. This means the jQuery requirin' 
  sync stuff on the Model prototype isn't enabled by default. Backbone sync is available as a standalone module with
  which you can extend the Hyperbone model's prototype but please: Don't. 

  Hyperbone Models are for use with the Hyperbone Framework, which when it's finished will solve the problem of the 
  lack of a framework for taking hypermedia models (with controls), throwing them at views and everything just
  magically working. More on this as and when there's more.

## Installation

  Install with [component(1)](http://component.io):

    $ component install green-mesa/hyperbone-model

## API

Hypermedia extentions include understanding where 'self' points, and automatic embedding
of collections and models. This neatly gets around backbone's limitation on non-nested properties
for models. Neato!



```javascript
  var Model = require('hyperbone-model').Model;
  var Collection = require('hyperbone-model').Collection;

  // create a hyperbone model for a single page
  var Page = Model.extend({});

  // create an Author model
  var Author = Model.extend({})

  // create a hyperbone collection for pages
  var Pages = Collection.extend({
    model : Page
  });

  // create a hyperbone model for a book
  var Book = Model.extend({
    embed : {
      "pages" : Pages, // we'll turn _embedded["pages"] into teh Pages collection
      "author" : Author // we'll turn _embedded["author"] into an Author model.
    }
  });


  var book = new Book({
    _links : {
      self : {
        href : "books/book1"
      },
      alternate : {
        href : "books/book1.html"
      }
    },
    title : "Hello World: A Novel",
    isbn : "123098108398213",
    _embedded : {
      "pages" : [
        {
          pageNumber : 1,
          content : "some stuff"
        },
        {
          pageNumber : 2,
          content : "some more stuff"          
        }
      ],
      "author" : {
        name : "A. N. Other",
        _links : {
          self : {
            href : "authors/another"            
          },
          portrait : {
            href : "authors/another.jpg"
          }
        }
      }

    }

  });


  book.url() === "books/book1"; // true

  // the 'pages' data embedded in the hypermedia automically becomes an attribute on the model

  book.get("pages").each(function( page ){

    readAloud(page.get("content"));

  });

  book.get("author").get("name") === "A. N. Other"; // TRUE


```



## License

  MIT
