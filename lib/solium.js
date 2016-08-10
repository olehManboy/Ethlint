/**
 * @fileoverview Main Solium object definition
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

'use strict';

var solidityParser = require ('solparse'),
	solExplore = require ('sol-explore'),

	EventEmitter = require ('events').EventEmitter,
	EventGenerator = require ('./utils/node-event-generator'),
	RuleContext = require ('./rule-context'),
	SourceCode = require ('./utils/source-code-utils'),

	rules = require ('./rules'),
	astUtils = require ('./utils/ast-utils'),
	jsUtils = require ('./utils/js-utils');

module.exports = (function () {

	var Solium = Object.create (new EventEmitter ()),
		messages = [], sourceCodeText = null, currentConfig = null;

	/**
	 * Initialize all global variables: ensure nothing from the previous lint() gets carried to the next lint()
	 * @returns {void}
	 */
	Solium.reset = function reset () {
		this.removeAllListeners ();
		messages = [];
		sourceCodeText = '';
		currentConfig = {};
	};

	/**
	 * Function called for linting the code by external application(s) using the Solium object
	 * @param {(String|Buffer)} sourceCode The Source Code to lint
	 * @param {Object} config An object that specifies the rules to use and path of file containing custom rule definitions
	 * @returns {Array} errorObjects Array of objects, each containing lint error messages and supporting info, empty if no errors
	 */
	Solium.lint = function lint (sourceCode, config, noReset) {
		var nodeEventGenerator = new EventGenerator (Solium),
			AST = {},
			errorObjects;

		if (typeof sourceCode === 'object' && sourceCode.constructor.name === 'Buffer') {
			sourceCode = sourceCode.toString ();
		}

		if (!(sourceCode && typeof sourceCode === 'string')) {
			throw new Error (
				'A valid source code string was not passed.'
			);
		}

		if (!(config && typeof config === 'object' && config.rules && typeof config.rules === 'object')) {
			throw new Error (
				'A valid configuration object was not passed. Please check the documentation.'
			);
		}

		!noReset && this.reset ();

		sourceCodeText = sourceCode;
		astUtils.init (sourceCodeText);
		currentConfig = JSON.parse (JSON.stringify (config));	//deep copy config object
		currentConfig.rules = rules.load (config.rules, config ['custom-rules-filename']);

		Object.keys (currentConfig.rules).forEach (function (name) {
			var rule = rules.get (name);

			try {
				rule.verify (
					new RuleContext (name, currentConfig.rules [name], Solium)
				);
			} catch (e) {
				throw new Error (
					'A valid definition for rule \'' + name + '\' not found. Description:\n' + e
				);
			}
		});

		try {
			AST = solidityParser.parse (sourceCode);	
		} catch (e) {
			throw new Error (
				'An error occured while parsing the source code:\n' + e
			);
		}

		/**
		 * Perform depth-first traversal of the AST and notify rules upon entering & leaving nodes
		 * Each node has a type property which serves as the Event's name.
		 * This allows rules to listen to the type of node they wish to test.
		 */
		solExplore.traverse (AST, {
			enter: function (node, parent) {
				node.parent = parent;	//allow the rules to access immediate parent of current node
				nodeEventGenerator.enterNode (node);
				delete node.parent;
			},

			leave: function (node) {
				nodeEventGenerator.leaveNode (node);
			}
		});

		//sort errors by line (column if line is same)
		messages.sort (function (a, b) {
			var lineDiff = a.line - b.line;
			return (
				lineDiff ? lineDiff : (a.column - b.column)
			);
		});
		
		errorObjects = messages;
		messages = [];	//reset messages array to avoid carry-forward of error objects to other files

		return errorObjects;

	};

	/**
	 * Function called by any rule that wishes to send error message upon violation in source code
	 * @param {Object} error An object that contains sufficient information to describe the lint error
	 */
	Solium.report = function report (error) {
		if (!jsUtils.isStrictlyObject (error)) {
			throw new Error ('Invalid error object');
		}

		if (!astUtils.isASTNode (error.node)) {
			throw new Error ('Rule ' + error.ruleId + ' does not provide a valid AST node');
		}

		if (!(error.message && typeof error.message === 'string')) {
			throw new Error ('Rule ' + error.ruleId + ' flags a node but doesn\'t provide an error description');
		}

		if (!jsUtils.isStrictlyObject (error.location)) {
			error.location = {};
		}

		messages.push ({

			ruleName: error.ruleName,
			type: error.type,	//either 'error' or 'warning'
			node: error.node,
			message: error.message,
			line: error.location.line || astUtils.getLine (error.node),
			column: error.location.column || astUtils.getColumn (error.node)

		});
	};

	/**
	 * Provides the user with program source code wrapped inside a utility object that also provides functions to operate on the code
	 * @returns {Object} sourceCodeObject The SourceCode Object that provides source text & functionality
	 */
	Solium.getSourceCode = function getSourceCode () {
		return new SourceCode (sourceCodeText);
	};

	return Solium;

}) ();