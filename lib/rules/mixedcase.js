/**
 * @fileoverview Ensure that variable, function, parameter and declerative expression names follow mixedCase notation
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

'use strict';

module.exports = {

	verify: function (context) {

		var mixedCaseRegEx = /^_?[a-z]+[a-zA-Z]*$/;
		var similarNodes = [
			'FunctionDeclaration',
			'ModifierDeclaration',
			'ModifierName'
		];

		function report (node, name) {
			context.report ({
				node: node,
				message: '\'' + name + '\' doesn\'t follow the mixedCase notation'
			});
		}

		similarNodes.forEach (function (event) {
			context.on (event, function (emitted) {
				var node = emitted.node;

				//a constructor (function with name same as it parent contract/library) is exception to mixedCase Rule
				if (
					emitted.exit ||
					(
						node.type === 'FunctionDeclaration' &&
						(node.parent.type === 'ContractStatement' || node.parent.type === 'LibraryStatement') &&
						node.parent.name === node.name
					)
				) {
					return;
				}

				if (!mixedCaseRegEx.test (node.name)) {
					report (node, node.name);
				}
			});
		});

		context.on ('VariableDeclarator', function (emitted) {
			var node = emitted.node;

			if (emitted.exit) {
				return;
			}

			if (!mixedCaseRegEx.test (node.id.name)) {
				context.report ({
					node: node,
					message: 'Identifier name \'' + node.id.name + '\' doesn\'t follow the mixedCase notation'
				});
			}
		});

		context.on ('DeclarativeExpression', function (emitted) {
			var node = emitted.node;

			if (emitted.exit) {
				return;
			}

			if (!node.is_constant && !mixedCaseRegEx.test (node.name)) {
				report (node, node.name);
			}
		});

		context.on ('InformalParameter', function (emitted) {
			var node = emitted.node;

			if (emitted.exit) {
				return;
			}

			if (!mixedCaseRegEx.test (node.id)) {
				report (node, node.id);
			}
		});
		
	}

};