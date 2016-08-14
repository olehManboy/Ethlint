/**
 * @fileoverview Ensure that contract, library, modifier and struct names follow CamelCase notation
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

'use strict';

module.exports = {

	verify: function (context) {

		var camelCaseRegEx = /^[A-Z][a-z]+[a-zA-Z]*[a-z]$/;
		var eventsToWatch = {
			'ContractStatement': 'Contract',
			'LibraryStatement': 'Library',
			'StructDeclaration': 'Struct',
			'EventDeclaration': 'Event'
		};

		Object.keys (eventsToWatch).forEach (function (event) {
			context.on (event, function (emitted) {
				var node = emitted.node;

				if (emitted.exit) {
					return;
				}

				if (!camelCaseRegEx.test (node.name)) {
					context.report ({
						node: node,
						message: eventsToWatch [event] + ' name \'' + node.name + '\' doesn\'t follow the CamelCase notation'
					});
				}
			});
		});

	}

};