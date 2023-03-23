pragma solidity <=0.8.4;

import "./Dai.sol";


contract Dex {
    string public name = "Ethereum Decentralized Exchange";
    Dai public dai;
    // x * y = k
    // x (eth) = 50
    // y (dai) = 200 000
    // k (constant product) = 10 000 000
    // price per ETH = 4000
    uint256 public k = 10000000000000000000000000;
    mapping (address => uint256) balances;

    function getContractDaiBalance() public view returns (uint256) {
        return dai.balanceOf(address(this));
    }

    function getContractEthBalance() public view returns (uint256) {
        return balances[address(this)];
    }

    function getBalance(address _address) public returns (uint256) {
        return balances[_address];
    }

    event TokensPurchased(
        address account,
        address token,
        uint256 daiToTransfer,
        uint256 k,
        uint256 requested,
        uint256 newEthBalance,
        uint256 daiBalance
    );

    event TokensSold(
        address account,
        address token,
        uint256 amount,
        uint256 k,
        uint256 contractDaiBalance,
        uint256 newDaiBalance,
        uint256 newPrice,
        uint256 previousBalance,
        uint256 ethToTransfer
    );

    constructor(Dai _dai) public {
        dai = _dai;
        balances[address(this)] = 50 ether;
    }

    function sellEth() public payable {
        uint256 requested = msg.value;
        uint256 newEthBalance = balances[address(this)] + requested;

        uint256 newPrice = (k / newEthBalance) * 1 ether;
        uint256 daiBalance = dai.balanceOf(address(this));
        uint256 daiToTransfer = daiBalance - newPrice;

        require(daiBalance >= daiToTransfer);

        dai.transfer(msg.sender, daiToTransfer);
        balances[address(this)] = newEthBalance;

        emit TokensPurchased(msg.sender, address(dai), daiToTransfer, k, requested, newEthBalance, dai.balanceOf(address(this)));
    }

    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }
    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }
    uint constant WAD = 10 ** 18;
    function div(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, WAD), y / 2) / y;
    }

    function buyEth(uint256 _amount_dai) public payable {
        require(dai.balanceOf(msg.sender) >= _amount_dai);

        uint256 newDaiBalance = dai.balanceOf(address(this)) + _amount_dai;
        uint256 newPrice = div(k, newDaiBalance);
        uint256 ethToTransfer = balances[address(this)] - newPrice;
        balances[address(this)] = newPrice;

        require(balances[address(this)] >= ethToTransfer);

        dai.transferFrom(msg.sender, address(this), _amount_dai);
        msg.sender.transfer(ethToTransfer);

        // emit TokensSold(msg.sender, address(dai), _amount_dai, k, contractDaiBalance, newDaiBalance, newPrice, previousBalance, ethToTransfer);
        emit TokensSold(msg.sender, address(dai), _amount_dai, k, 0, 0, 0, 0, ethToTransfer);
    }
}
