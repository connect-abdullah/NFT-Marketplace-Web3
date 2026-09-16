// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMarketNFT {
    function ownerOf(uint256 tokenId) external view returns (address);

    function getApproved(uint256 tokenId) external view returns (address);

    function isApprovedForAll(address owner, address operator)
        external
        view
        returns (bool);

    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract NFTMarketplace {
    IMarketNFT public immutable nft;

    struct Listing {
        address seller;
        uint256 price;
        bool listed;
        uint256 timestamp;
    }

    mapping(uint256 => Listing) public listings;

    event NFTListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    event NFTUnlisted(
        uint256 indexed tokenId,
        address indexed seller
    );

    event NFTBought(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price
    );

    constructor(address nft_) {
        require(nft_ != address(0), "Invalid NFT");
        nft = IMarketNFT(nft_);
    }

    function isMarketApproved(address owner, uint256 tokenId)
        public
        view
        returns (bool)
    {
        return
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(owner, address(this));
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        address owner = nft.ownerOf(tokenId);

        require(owner == msg.sender, "You are not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].listed, "Already listed");
        require(
            isMarketApproved(owner, tokenId),
            "Approve marketplace first"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            listed: true,
            timestamp: block.timestamp
        });

        emit NFTListed(tokenId, msg.sender, price);
    }

    function buyNFT(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];

        require(listing.listed, "Token is not listed");
        require(listing.seller != address(0), "Invalid seller");
        require(msg.sender != address(0), "Invalid buyer");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        require(msg.value == listing.price, "Incorrect payment");
        require(
            nft.ownerOf(tokenId) == listing.seller,
            "Seller no longer owns NFT"
        );
        require(
            isMarketApproved(listing.seller, tokenId),
            "Marketplace is not approved"
        );

        delete listings[tokenId];

        nft.safeTransferFrom(listing.seller, msg.sender, tokenId);

        (bool success, ) = payable(listing.seller).call{value: msg.value}("");
        require(success, "Payment failed");

        emit NFTBought(tokenId, msg.sender, listing.price);
    }

    function unlistNFT(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];

        require(listing.listed, "Token is not listed");
        require(listing.seller == msg.sender, "You are not the seller");

        delete listings[tokenId];

        emit NFTUnlisted(tokenId, msg.sender);
    }

    function getMarketplaceBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
