# Solium v1 is now in Beta!
**While Solium was originally written to enforce strict compliance with Solidity's Style Guide, it has now been revamped to be more than just a tool for pretty code. v1 is built keeping style, security, modularity and flexibility in mind.**

It comes packed with automatic code formatting, sharable configurations, a plugin system and a lot more!

To install v1, run `npm install -g solium@v1-beta` and access the complete documentation [here](http://solium.readthedocs.io/).
If you'd like to use the `latest` (stable) version instead, please see below.
___

![solium](https://cloud.githubusercontent.com/assets/12758282/18283522/4b206522-7483-11e6-9bcd-2a70ebc8cfdb.png)

[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.svg)](https://gitter.im/Solium-linter/Lobby)
[![Build Status](https://travis-ci.org/duaraghav8/Solium.svg?branch=master)](https://travis-ci.org/duaraghav8/Solium)
[![Latest News](https://img.shields.io/badge/Blog-Medium-yellowgreen.svg)](https://medium.com/solium)
[![Snap Status](https://build.snapcraft.io/badge/duaraghav8/Solium.svg)](https://build.snapcraft.io/user/duaraghav8/Solium)

Solium is a linter for Solidity which uses Abstract Syntax Trees and allows the user to enable/disable existing rules and add their own ones! 

It internally uses [solparse](https://github.com/duaraghav8/solparse) to parse your solidity code into a Spider Monkey compliant AST

Solium aims to comply with the official [Solidity Style Guide](http://solidity.readthedocs.io/en/latest/style-guide.html). Follow our [blog](https://medium.com/solium) in order to stay up to date with the latest news.

# Install
```bash
npm install -g solium
```

# Usage
In the root directory of your DApp, run the following:
```bash
solium --init
```

This creates ```.soliumrc.json``` and ```.soliumignore``` inside your root directory, which have the configuration for the enabled and custom rules and files and folders to ignore while running the linter respectively.

You can disable a particular rule by setting its value to ```false``` in ```.soliumrc.json```

In order to lint a specific file, use:
```bash
solium --file foobar.sol
```

To run the linter over your entire project, use the following command in your root directory:
```bash
solium --dir .
```

This lints all the files inside your project with ```.sol``` extension.

# Additional Options

1. Use ```solium --watch``` to enable Hot loading (Hot swapping).

2. Use `solium --reporter=gcc` or `solium --reporter=pretty` to configure the output

3. Use ```solium --dir <DIRECTORY_NAME>``` to run the linter over a particular directory

# Plugging in your custom rules
-> Open up the ```.soliumrc.json``` configuration file and set the value of ```custom-rules-filename``` to the path of the file that defines your rules. You can either provide an absolute path or a path relative to the directory in which .soliumrc.json resides. For example: ```"custom-rules-filename": "./my-rules.js"```

The format for writing your custom rule file (for example, ```my-rules.js```) is:

```js
module.exports = {
  'my-rule-name-1': function (context) {

    //Solium internally uses EventEmitter and emits an event every time it enters or leaves a node during the Depth First Traversal of the AST
    context.on ('IfStatement', function (emittedObject) {
    
      //exit property is set to true if we are leaving the node
      if (emittedObject.exit) {
        return;
      }
      
      //View the node representing an If Statement 
      console.log (emittedObject.node);
      
      //report an error
      context.report ({
        node: emittedObject.node,
        message: 'I JUST ENTERED AN IF STATEMENT!!',
        location: { //optional
          line: 1,  //optional
          column: 2 //optional
        }
      });
      
    });
  },
  
  'my-rule-name-2': function (context) {
    context.on ('ContractStatement', function (emittedObject) {
      //similarly define this rule to do something with Contract Declarations
    });
  }
};
```
**NOTE**: The best way to know which event you're looking for is to simply install [solparse](https://github.com/duaraghav8/solparse) or [solidity-parser](https://github.com/ConsenSys/solidity-parser), then parse your code into the AST and see the value of the ```type``` field of the node that you wish to target.

See the [existing rules](https://github.com/duaraghav8/Solium/tree/master/lib/rules) to get an idea of how the rules are making use of the context object being provided to them.

-> Then, inside the ```rules``` object in the same file, set your rule names to ```true```. For instance:

```json
"rules": {
  "my-rule-name-1": true,
  "my-rule-name-2": true
}
```

**NOTE**: If you write a rule whose name clashes with the name of a pre-defined rule, your custom rule overrides the pre-defined one.

# Integrate Solium in your app
To access Solium's API, first install it:

```bash
npm install --save solium
```
## Usage
```js
let Solium = require ('solium'),
  sourceCode = 'contract fOO_bar { function HELLO_WORLD () {} }';
  //sourceCode can alternatively be a Buffer object
    
let errorObjects = Solium.lint (sourceCode, {
  'custom-rules-filename': null,  //see above if you wish to add custom rules
  rules: {
    camelcase: true,
    mixedcase: true
  }
});

errorObjects.forEach ((err) => {
  console.log (err);
});
```

For a list of all available rules, see [solium.json](https://github.com/duaraghav8/Solium/blob/master/config/solium.json).

## Setup

Clone the repository, traverse to the root directory of the project, then install dependencies:
```
npm install
```

## Running Tests
```
npm test
```

## Contributors and Testers
[Elena Dimitrova](https://github.com/elenadimitrova)

[Federico Bond](https://github.com/federicobond)

[Christopher Gewecke](https://github.com/cgewecke)

[Ulrich Petri](https://github.com/ulope)


## External Resources
[Travis](https://github.com/travs) has released [Solium for Atom](https://atom.io/packages/linter-solium)

If you're using vim with syntastic, and prefer to use a locally installed version of Solium (rather than a global version), you can install [syntastic-local-solium](https://github.com/sohkai/syntastic-local-solium.vim) to automatically load the local version in packages that have installed their own.

# License
## MIT
