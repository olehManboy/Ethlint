/**
 * @fileoverview Tests for linebreak-style rule
 * @author Arjun Nemani <nemaniarjun@gmail.com>
 */

"use strict";

let Solium = require("../../../../lib/solium"),
    path = require("path"),
    fs = require("fs");

let userConfigUnix = {
    rules: {
        "linebreak-style": "error"
    }
};

describe("[RULE] linebreak-style: Acceptances for Unix Line breaks", function() {
    it("should accept when receiving Unix Line breaks", function(done) {
        let code = fs
            .readFileSync(path.join(__dirname, "./unix-endings"))
            .toString();
        let errors = Solium.lint(code, userConfigUnix);

        errors.should.be.Array();
        errors.length.should.equal(0);

        Solium.reset();
        done();
    });
});

describe("[RULE] linebreak-style: Rejections for Unix Line breaks", function() {
    it("should reject when receiving Windows Line breaks", function(done) {
        let code = fs
            .readFileSync(path.join(__dirname, "./windows-endings"))
            .toString();
        let errors = Solium.lint(code, userConfigUnix);

        errors.should.be.Array();
        errors.length.should.be.above(0);

        Solium.reset();
        done();
    });
});

let userConfigWindows = {
    rules: {
        "linebreak-style": ["error", "windows"]
    }
};

describe("[RULE] linebreak-style: Acceptances for Windows Line breaks", function() {
    it("should accept when receiving Windows Line breaks", function(done) {
        let code = fs
            .readFileSync(path.join(__dirname, "./windows-endings"))
            .toString();

        let errors = Solium.lint(code, userConfigWindows);

        errors.should.be.Array();
        errors.length.should.equal(0);

        Solium.reset();
        done();
    });
});

describe("[RULE] linebreak-style: Rejections for Windows Line breaks", function() {
    it("should reject when receiving Unix Line breaks", function(done) {
        let code = fs
            .readFileSync(path.join(__dirname, "./unix-endings"))
            .toString();
        let errors = Solium.lint(code, userConfigWindows);

        errors.should.be.Array();
        errors.length.should.be.above(0);

        Solium.reset();
        done();
    });
});
