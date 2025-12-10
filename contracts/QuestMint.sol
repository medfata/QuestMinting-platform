// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuestMint
 * @notice ERC1155 contract for quest rewards and tiered minting
 * @dev Supports both NFT-like (limited per wallet) and token-like (fungible) mints
 */
contract QuestMint is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;

    string public name;
    string public symbol;
    string public contractURI;

    struct TokenConfig {
        uint256 price;          // Price in wei (0 for free mints)
        uint256 maxSupply;      // Max total supply (0 = unlimited)
        uint256 minted;         // Total minted so far
        uint256 maxPerWallet;   // Max per wallet (0 = unlimited)
        string tokenURI;        // Metadata URI for this token
        bool active;            // Whether minting is enabled
    }

    // tokenId => config
    mapping(uint256 => TokenConfig) public tokens;
    
    // tokenId => wallet => amount minted
    mapping(uint256 => mapping(address => uint256)) public mintedByWallet;
    
    // Track all created token IDs
    uint256[] public tokenIds;
    mapping(uint256 => bool) public tokenExists;

    // Events
    event TokenCreated(uint256 indexed tokenId, uint256 price, uint256 maxSupply, uint256 maxPerWallet);
    event TokenUpdated(uint256 indexed tokenId);
    event Minted(address indexed to, uint256 indexed tokenId, uint256 quantity, uint256 totalPaid);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        address _owner
    ) ERC1155("") Ownable(_owner) {
        name = _name;
        symbol = _symbol;
        contractURI = _contractURI;
    }

    // ============ Minting ============

    /**
     * @notice Mint tokens
     * @param tokenId The token ID to mint
     * @param quantity Amount to mint
     */
    function mint(uint256 tokenId, uint256 quantity) external payable nonReentrant {
        TokenConfig storage config = tokens[tokenId];
        
        require(tokenExists[tokenId], "Token does not exist");
        require(config.active, "Minting not active");
        require(quantity > 0, "Quantity must be > 0");
        
        // Check supply
        if (config.maxSupply > 0) {
            require(config.minted + quantity <= config.maxSupply, "Exceeds max supply");
        }
        
        // Check wallet limit
        if (config.maxPerWallet > 0) {
            require(
                mintedByWallet[tokenId][msg.sender] + quantity <= config.maxPerWallet,
                "Exceeds wallet limit"
            );
        }
        
        // Check payment
        uint256 totalPrice = config.price * quantity;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Update state
        config.minted += quantity;
        mintedByWallet[tokenId][msg.sender] += quantity;
        
        // Mint
        _mint(msg.sender, tokenId, quantity, "");
        
        // Refund excess
        if (msg.value > totalPrice) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(success, "Refund failed");
        }
        
        emit Minted(msg.sender, tokenId, quantity, totalPrice);
    }


    // ============ Admin Functions ============

    /**
     * @notice Create a new token type
     * @param tokenId Unique identifier for this token
     * @param price Price in wei (0 for free)
     * @param maxSupply Maximum supply (0 for unlimited)
     * @param maxPerWallet Max per wallet (0 for unlimited)
     * @param tokenURI Metadata URI
     * @param active Whether minting is enabled
     */
    function createToken(
        uint256 tokenId,
        uint256 price,
        uint256 maxSupply,
        uint256 maxPerWallet,
        string calldata tokenURI,
        bool active
    ) external onlyOwner {
        require(!tokenExists[tokenId], "Token already exists");
        
        tokens[tokenId] = TokenConfig({
            price: price,
            maxSupply: maxSupply,
            minted: 0,
            maxPerWallet: maxPerWallet,
            tokenURI: tokenURI,
            active: active
        });
        
        tokenIds.push(tokenId);
        tokenExists[tokenId] = true;
        
        emit TokenCreated(tokenId, price, maxSupply, maxPerWallet);
    }

    /**
     * @notice Update token configuration
     */
    function updateToken(
        uint256 tokenId,
        uint256 price,
        uint256 maxSupply,
        uint256 maxPerWallet,
        string calldata tokenURI,
        bool active
    ) external onlyOwner {
        require(tokenExists[tokenId], "Token does not exist");
        
        TokenConfig storage config = tokens[tokenId];
        config.price = price;
        config.maxSupply = maxSupply;
        config.maxPerWallet = maxPerWallet;
        config.tokenURI = tokenURI;
        config.active = active;
        
        emit TokenUpdated(tokenId);
    }

    /**
     * @notice Toggle token active status
     */
    function setTokenActive(uint256 tokenId, bool active) external onlyOwner {
        require(tokenExists[tokenId], "Token does not exist");
        tokens[tokenId].active = active;
        emit TokenUpdated(tokenId);
    }

    /**
     * @notice Admin mint (for airdrops, rewards, etc.)
     */
    function adminMint(
        address to,
        uint256 tokenId,
        uint256 quantity
    ) external onlyOwner {
        require(tokenExists[tokenId], "Token does not exist");
        
        TokenConfig storage config = tokens[tokenId];
        
        if (config.maxSupply > 0) {
            require(config.minted + quantity <= config.maxSupply, "Exceeds max supply");
        }
        
        config.minted += quantity;
        _mint(to, tokenId, quantity, "");
        
        emit Minted(to, tokenId, quantity, 0);
    }

    /**
     * @notice Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
        
        emit Withdrawn(owner(), balance);
    }

    /**
     * @notice Update contract metadata URI
     */
    function setContractURI(string calldata _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    // ============ View Functions ============

    /**
     * @notice Get token metadata URI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(tokenExists[tokenId], "Token does not exist");
        return tokens[tokenId].tokenURI;
    }

    /**
     * @notice Get token info
     */
    function getTokenInfo(uint256 tokenId) external view returns (
        uint256 price,
        uint256 maxSupply,
        uint256 minted,
        uint256 maxPerWallet,
        string memory tokenURI,
        bool active
    ) {
        require(tokenExists[tokenId], "Token does not exist");
        TokenConfig storage config = tokens[tokenId];
        return (
            config.price,
            config.maxSupply,
            config.minted,
            config.maxPerWallet,
            config.tokenURI,
            config.active
        );
    }

    /**
     * @notice Get remaining supply for a token
     */
    function remainingSupply(uint256 tokenId) external view returns (uint256) {
        if (!tokenExists[tokenId]) return 0;
        TokenConfig storage config = tokens[tokenId];
        if (config.maxSupply == 0) return type(uint256).max; // Unlimited
        return config.maxSupply - config.minted;
    }

    /**
     * @notice Get remaining mintable amount for a wallet
     */
    function remainingForWallet(uint256 tokenId, address wallet) external view returns (uint256) {
        if (!tokenExists[tokenId]) return 0;
        TokenConfig storage config = tokens[tokenId];
        if (config.maxPerWallet == 0) return type(uint256).max; // Unlimited
        return config.maxPerWallet - mintedByWallet[tokenId][wallet];
    }

    /**
     * @notice Get all token IDs
     */
    function getAllTokenIds() external view returns (uint256[] memory) {
        return tokenIds;
    }

    /**
     * @notice Get total number of token types
     */
    function totalTokenTypes() external view returns (uint256) {
        return tokenIds.length;
    }

    /**
     * @notice Check if wallet can mint
     */
    function canMint(uint256 tokenId, address wallet, uint256 quantity) external view returns (bool, string memory) {
        if (!tokenExists[tokenId]) return (false, "Token does not exist");
        
        TokenConfig storage config = tokens[tokenId];
        
        if (!config.active) return (false, "Minting not active");
        if (quantity == 0) return (false, "Quantity must be > 0");
        
        if (config.maxSupply > 0 && config.minted + quantity > config.maxSupply) {
            return (false, "Exceeds max supply");
        }
        
        if (config.maxPerWallet > 0 && mintedByWallet[tokenId][wallet] + quantity > config.maxPerWallet) {
            return (false, "Exceeds wallet limit");
        }
        
        return (true, "");
    }
}
