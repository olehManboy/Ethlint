/**
 * @fileoverview Main CLI object which makes use of the Linter's API to access functionality
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

'use strict';

var cli = require ('commander'),
	fs = require ('fs'),
	path = require ('path'),
	solium = require ('./solium'),
	errorReporter = require ('./cli-utils/error-reporter'),
	traverse = require ('./cli-utils/traverse'),
	soliumRules = require ('../config/solium.json').rules,
	version = require ('../package.json').version;

var CWD = process.cwd (),
	CONFIG_FILENAME = '.soliumrc.json';

var errorCodes = {
	NO_SOLIUMRC: 1,
	SOLIUM_ERROR: 2,
	INIT_FAILED: 3
};

function createDefaultConfigJSON () {
	var config = {
		'custom-rules-filename': null,
		rules: {}
	};

	Object.keys (soliumRules).forEach (function (rulename) {
		config.rules [rulename] = true;
	});

	try {
		fs.writeFileSync (
			path.join (CWD, CONFIG_FILENAME),
			JSON.stringify (config, null, 2)
		);
	} catch (e) {
		console.log (
			'An error occured while creating ' + CONFIG_FILENAME + ':\n' + e
		);
		process.exit (errCodes.INIT_FAILED);
	}
}

function lint (userConfig, filename) {
	var filesToLint = [];

	if (filename) {
		filesToLint.push (filename);
	} else {
		traverse (CWD, filesToLint);
	}

	filesToLint.forEach (function (codeFileName) {

		var sourceCode = '', lintErrors;

		try {
			sourceCode = fs.readFileSync (
				codeFileName, 'utf8'
			);
		} catch (e) {
			console.log (
				'[ERROR] Unable to read ' + codeFileName + ': ' + e
			);
		}

		try {
			lintErrors = solium.lint (sourceCode, userConfig);
		} catch (e) {
			console.log (
				'An error occured while running the linter:\n' + e
			);
			process.exit (errorCodes.SOLIUM_ERROR);
		}

		errorReporter.report (codeFileName, lintErrors);

	});
}

module.exports = {

	execute: function (programArgs) {

		cli
			.version (version)
			.usage ('[options] <keyword>')
			.option ('-i, --init', 'Create default rule configuration')
			.option ('-f, --file [filename]', 'Specify a file whose code you wish to lint')
			.option ('-h, --hot', 'Enable Hot Loading (Hot Swapping)')
			.parse (programArgs);

		if (cli.init) {
			createDefaultConfigJSON ();
		} else {
			var userConfig;

			try {
				userConfig = require (
					path.join (CWD, CONFIG_FILENAME)
				);
			} catch (e) {
				console.log (
					'ERROR! Couldn\'t find ' + CONFIG_FILENAME + ' in the current directory.\nUse solium --init to create one.'
				);
				process.exit (errorCodes.NO_SOLIUMRC);
			}

			//if custom rules' file is set, make sure we have its absolute path
			if (
				userConfig ['custom-rules-filename'] &&
				!path.isAbsolute (userConfig ['custom-rules-filename'])
			) {
				userConfig ['custom-rules-filename'] = path.join (
					CWD, userConfig ['custom-rules-filename']
				);
			}

			lint (userConfig, cli.file);

			if (cli.hot) {

				var spy = fs.watch (CWD);

				spy.on ('change', function () {
					lint (userConfig, cli.file);	//lint on subsequent changes (hot)
					console.log (Array (50).join ('X') + '\n');
				});

			}

		}

	}

};