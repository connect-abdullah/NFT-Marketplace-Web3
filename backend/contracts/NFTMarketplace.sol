// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NFTMarketplace {
    // ---------- NFT ----------

    mapping(uint256 => address) public owners;
    mapping(address => uint256) public balances;
    mapping(uint256 => address) public approved;

    uint256 private nextToken;

    // ---------- Marketplace ----------

    struct Listing {
        address seller;
        uint256 price;
        bool listed;
        uint256 timestamp;
    }

    mapping(uint256 => Listing) public listings;

    // ---------- Events ----------

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed owner
    );

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

    event NFTTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    event NFTApproved(
        uint256 indexed tokenId,
        address indexed owner,
        address indexed approved
    );


    // ---------- NFT Functions ----------

    function mint() external {
        owners[nextToken] = msg.sender;
        balances[msg.sender]++;

        emit NFTMinted(nextToken, msg.sender);

        nextToken++;
    }


    function ownerOf(uint256 tokenId)
        external
        view
        returns (address)
    {
        address owner = owners[tokenId];

        require(
            owner != address(0),
            "Token does not exist"
        );

        return owner;
    }


    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        require(
            owner != address(0),
            "Owner cannot be zero address"
        );

        return balances[owner];
    }


    function approve(
        address to,
        uint256 tokenId
    ) external {
        address owner = owners[tokenId];

        require(
            owner != address(0),
            "Token does not exist"
        );

        require(
            msg.sender == owner,
            "Only owner can approve"
        );

        require(
            to != address(0),
            "Cannot approve zero address"
        );

        approved[tokenId] = to;

        emit NFTApproved(
            tokenId,
            owner,
            to
        );
    }


    function getApproved(uint256 tokenId)
        external
        view
        returns (address)
    {
        require(
            owners[tokenId] != address(0),
            "Token does not exist"
        );

        return approved[tokenId];
    }


    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public {
        address owner = owners[tokenId];

        require(
            owner != address(0),
            "Token does not exist"
        );

        require(
            owner == from,
            "From is not owner"
        );

        require(
            to != address(0),
            "Invalid recipient"
        );

        // IMPORTANT:
        //
        // Three parties can be authorized:
        //
        // 1. NFT owner
        // 2. Approved address
        // 3. Marketplace when NFT is actively listed
        //
        require(
            msg.sender == owner ||
            msg.sender == approved[tokenId] ||
            listings[tokenId].listed &&
            listings[tokenId].seller == owner &&
            listings[tokenId].seller == msg.sender,
            "Not authorized"
        );

        owners[tokenId] = to;

        balances[from]--;
        balances[to]++;

        // Approval disappears after transfer
        approved[tokenId] = address(0);

        emit NFTTransferred(
            tokenId,
            from,
            to
        );
    }


    // ---------- Marketplace ----------

    function listNFT(
        uint256 tokenId,
        uint256 price
    ) external {
        address owner = owners[tokenId];

        require(
            owner != address(0),
            "Token does not exist"
        );

        require(
            owner == msg.sender,
            "You are not the owner"
        );

        require(
            price > 0,
            "Price must be greater than 0"
        );

        // Prevent overwriting an existing listing
        require(
            !listings[tokenId].listed,
            "Already listed"
        );

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            listed: true,
            timestamp: block.timestamp
        });

        emit NFTListed(
            tokenId,
            msg.sender,
            price
        );
    }


    function buyNFT(
        uint256 tokenId
    ) external payable {
        Listing memory listing = listings[tokenId];

        require(
            listing.listed,
            "Token is not listed"
        );

        require(
            listing.seller != address(0),
            "Invalid seller"
        );

        require(
            msg.sender != address(0),
            "Invalid buyer"
        );

        require(
            msg.sender != listing.seller,
            "Cannot buy your own NFT"
        );

        require(
            msg.value == listing.price,
            "Incorrect payment"
        );

        // Seller must still own the NFT
        require(
            owners[tokenId] == listing.seller,
            "Seller no longer owns NFT"
        );


        // Remove listing BEFORE external ETH transfer
        delete listings[tokenId];

        // Marketplace performs the NFT transfer
        //
        // Since the listing was deleted above, our current
        // transfer authorization would fail.
        //
        // Therefore we DON'T call transferFrom() here.
        // We perform the state transition directly.

        owners[tokenId] = msg.sender;

        balances[listing.seller]--;
        balances[msg.sender]++;

        // Clear NFT approval
        approved[tokenId] = address(0);

        emit NFTTransferred(
            tokenId,
            listing.seller,
            msg.sender
        );

        // Send ETH to seller
        (bool success, ) = payable(listing.seller).call{
            value: msg.value
        }("");

        require(
            success,
            "Payment failed"
        );

        emit NFTBought(
            tokenId,
            msg.sender,
            listing.price
        );
    }


    function unlistNFT(
        uint256 tokenId
    ) external {
        Listing memory listing = listings[tokenId];

        require(
            listing.listed,
            "Token is not listed"
        );

        require(
            listing.seller == msg.sender,
            "You are not the seller"
        );

        delete listings[tokenId];

        emit NFTUnlisted(
            tokenId,
            msg.sender
        );
    }


    // ---------- ETH ----------

    function getMarketplaceBalance()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }
}