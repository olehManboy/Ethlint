/**
 * @fileoverview Main CLI object which makes use of the Linter's API to access functionality
 * @author Raghav Dua <duaraghav8@gmail.com>
 */

'use strict';

var cli = require ('commander'),
	fs = require ('fs'),
	path = require ('path'),
	chokidar = require ('chokidar'),
	traverse = require ('sol-digger'),
	solium = require ('./solium'),
	errorReporter = require ('./cli-utils/error-reporter'),
	soliumRules = require ('../config/solium.json').rules,
	version = require ('../package.json').version;

var CWD = process.cwd (),
	SOLIUMRC_FILENAME = '.soliumrc.json',
	SOLIUMRC_FILENAME_ABSOLUTE = path.join (CWD, SOLIUMRC_FILENAME),
	SOLIUMIGNORE_FILENAME = '.soliumignore',
	SOLIUMIGNORE_FILENAME_ABSOLUTE = path.join (CWD, SOLIUMIGNORE_FILENAME),
	DEFAULT_SOLIUMIGNORE_PATH = __dirname + '/cli-utils/.default-solium-ignore';

var errorCodes = {
	NO_SOLIUMRC: 1,
	WRITE_FAILED: 2
};

/**
 * Create default configuration files in the user's directory
 * @returns {void}
 */
function setupDefaultUserConfig () {
	createDefaultConfigJSON ();
	createDefaultSoliumIgnore ();
}

/**
 * Synchronously write the passed configuration to the file whose absolute path is SOLIUMRC_FILENAME_ABSOLUTE
 * @param {Object} config User Configuration object
 * @returns {void}
 */
function writeConfigFile (config) {
	try {
		fs.writeFileSync (
			SOLIUMRC_FILENAME_ABSOLUTE,
			JSON.stringify (config, null, 2)
		);
	} catch (e) {
		console.log (
			'An error occured while writing to ' + SOLIUMRC_FILENAME_ABSOLUTE + ':\n' + e
		);
		process.exit (errCodes.WRITE_FAILED);
	}
}

/**
 * Insert any rules that are present in SoliumRules.json but not in user's .soliumrc.json's rules
 * @param {Object} userConfig User Configuration object
 * @returns {void}
 */
function synchronizeWithSoliumRules (userConfig) {
	Object.keys (soliumRules).filter (function (rulename) {
		return soliumRules [rulename].enabled;
	}).forEach (function (rulename) {
		//only insert those rules that don't already exist. If a rule exists and is disabled, leave it untouched
		if (!userConfig.rules.hasOwnProperty (rulename)) {
			userConfig.rules [rulename] = true;
		}
	});

	writeConfigFile (userConfig);
}

/**
 * Copy data from cli-utils/.default-solium-ignore to (newly created) .soliumignore in user's root directory
 * @returns {void}
 */
function createDefaultSoliumIgnore () {
	try {
		fs.writeFileSync (
			SOLIUMIGNORE_FILENAME_ABSOLUTE,
			fs.readFileSync (DEFAULT_SOLIUMIGNORE_PATH)
		);
	} catch (e) {
		console.log (
			'An error occured while writing to ' + SOLIUMIGNORE_FILENAME_ABSOLUTE + ':\n' + e
		);
		process.exit (errCodes.WRITE_FAILED);
	}
}

/**
 * Create default solium configuration JSON in user's current working directory.
 * This file enables all the built-in lint rules
 */
function createDefaultConfigJSON () {
	var config = {
		'custom-rules-filename': null,
		rules: {}
	};

	Object.keys (soliumRules).filter (function (rulename) {
		return soliumRules [rulename].enabled;
	}).forEach (function (rulename) {
		config.rules [rulename] = true;
	});

	writeConfigFile (config);
}

/**
 * Function that calls Solium object's linter based on user settings
 * @param {Object} userConfig User's configurations that contain information about which linting rules to apply
 * @param {String} filename (optional) The single file to be linted. If not given, we lint the entire directory's (and sub-directories') solidity files
 */
function lint (userConfig, fileOrDir, ignore) {
	var filesToLint, itemsToIgnore;

	//If filename is provided, lint it. Otherwise, lint over current directory & sub-directories
	if (fileOrDir.file) {
		filesToLint = [fileOrDir.file];
	} else {
		filesToLint = traverse (fileOrDir.dir || CWD, ignore);
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
				'An error occured while running the linter on ' + codeFileName + ':\n' + e.stack
			);
			return;
		}

		//if any lint errors exist, report them
		lintErrors.length && errorReporter.report (codeFileName, lintErrors);

	});
}

/**
 * Function responsible for defining all the available commandline options & version information
 * @param {Object} cliObject Commander Object handling the cli
 */
function createCliOptions (cliObject) {
	cliObject
		.version (version)
		.usage ('[options] <keyword>')

		.option ('-i, --init', 'Create default rule configuration')
		.option ('-f, --file [filename]', 'Specify a file whose code you wish to lint')
		.option ('-d, --dir [dirname]', 'Specify the directory to look for Solidity files in')
		.option ('--hot', 'Enable Hot Loading (Hot Swapping)')
		.option ('-s, --sync', 'Make sure that all Solium rules enabled by default are specified in your ' + SOLIUMRC_FILENAME);
}

/**
 * Entry point to the CLI reponsible for initiating linting process based on command-line arguments
 * @param {Array} programArgs Commandline arguments
 */
function execute (programArgs) {

	var userConfig, ignore;

	createCliOptions (cli);
	cli.parse (programArgs);

	if (cli.init) {
		return setupDefaultUserConfig ();
	}

	try {
		userConfig = require (SOLIUMRC_FILENAME_ABSOLUTE);
	} catch (e) {
		console.log (
			'ERROR! Couldn\'t find ' + SOLIUMRC_FILENAME + ' in the current directory.\nUse solium --init to create one.'
		);
		process.exit (errorCodes.NO_SOLIUMRC);
	}

	if (cli.sync) {
		synchronizeWithSoliumRules (userConfig);
		return writeConfigFile (userConfig);
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

	//get all files & folders to ignore from .soliumignore
	try {
		ignore = fs.readFileSync (SOLIUMIGNORE_FILENAME_ABSOLUTE, 'utf8').split ('\n');
	} catch (e) {
		console.log (
			'There was an error trying to read \'' + SOLIUMIGNORE_FILENAME_ABSOLUTE + '\':\n' + e
		);
	}

	lint (userConfig, { file: cli.file, dir: cli.dir}, ignore);

	if (cli.hot) {

		var spy = chokidar.watch (CWD);

		spy.on ('change', function () {
			console.log (Array (50).join ('*') + '\n');
			lint (userConfig, { file: cli.file, dir: cli.dir}, ignore);	//lint on subsequent changes (hot)
		});

	}

}

module.exports = {
	execute: execute
};