// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Bank {
    mapping (address => uint) public deposited;

    address public immutable token;

    constructor(address _token) {
        token = _token;
    }

    modifier requireBalance(uint amount) {
        amount = amount * (10 ** 18);
        require(deposited[msg.sender] >= amount, "insufficient balance");
        _;
    }

    function myBalance() public view returns(uint balance) {
        balance = deposited[msg.sender] / (10 ** 18);
        // return deposited[msg.sender];
    }

    function deposit(uint amount) public {
        amount = amount * (10 ** 18);
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "transfer error");
        deposited[msg.sender] += amount;
    }

    function withdraw(uint amount) external requireBalance(amount) {
        amount = amount * (10 ** 18);
        // require(deposited[msg.sender] >= amount, "insufficient balance");
        deposited[msg.sender] -= amount;
        SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);
    }

    function bankTransfer(address to, uint amount) public requireBalance(amount) {
        amount = amount * (10 ** 18);
        // require(deposited[msg.sender] >= amount, "insufficient balance");
        require(to != address(0), "invalid recipient");
        
        deposited[msg.sender] -= amount;
        deposited[to] += amount;
    }
}