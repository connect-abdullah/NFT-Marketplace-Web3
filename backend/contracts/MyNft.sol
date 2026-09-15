// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NFTMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool listed;
    }

    mapping(uint256 => Listing) public listings;
    
}
