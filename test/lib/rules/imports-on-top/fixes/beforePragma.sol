pragma solidity ^0.4.0;


contract Halo {
    function foo () returns (uint) {
        return 0;
    }
}

import "nano.sol";

library Foo {
    function bar () returns (uint) {
        return 1;
    }
}

import * as symbolName from "filename";
