/**
 * @fileoverview Tests for deprecated-suicide rule
 * @author Federico Bond <federicobond@gmail.com>
 */

'use strict';

var should = require ('should');
var Solium = require ('../../../../lib/solium'),
	fs = require ('fs'),
	path = require ('path');

var userConfig = {
	"custom-rules-filename": null,
	"rules": {
		"deprecated-suicide": true
	}
};

describe ('[RULE] deprecated-suicide', function () {

	it ('should reject contracts using suicide', function (done) {
		var code = 'function foo () { suicide(0x0); }',

		errors = Solium.lint (code, userConfig);

		errors.constructor.name.should.equal ('Array');
		errors.length.should.equal (1);

		Solium.reset ();
		done ();
	});

});
