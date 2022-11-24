// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract KekToken is ERC20 {
    uint constant initial_supply = 100 * (10**18);

    constructor() ERC20("KekToken", "KT") {
        _mint(msg.sender, initial_supply);
    }
}
