App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  dexAddress: '',
  daiAddress: '',

  init: function () {
    return App.initWeb3();
  },

  initWeb3: async function () {
    if (typeof window.ethereum !== 'undefined') {
      // Instance web3 with the provided information
      web3 = new Web3(window.ethereum);
      try {
        // Request account access
        await window.ethereum.enable();
        // return true;
      } catch (e) {
        // User denied access
        // return false;
      }
    }
    App.web3Provider = web3;
    return App.initContract();
  },

  initContract: function () {
    const web3 = new Web3("http://localhost:7545")
    $.getJSON("Dex.json", function (Dex) {
      App.dexAddress = Dex.networks[5777].address;
      App.contracts.Dex = new web3.eth.Contract(Dex.abi, App.dexAddress);

      // Instantiate a new truffle contract from the artifact
      // App.contracts.Dex = TruffleContract(Dex);
      // Connect provider to interact with contract
      App.contracts.Dex.setProvider(App.web3Provider);
    });
    $.getJSON("Dai.json", function (Dai) {
      App.daiAddress = Dai.networks[5777].address;
      App.contracts.Dai = new web3.eth.Contract(Dai.abi, App.daiAddress);

      // Instantiate a new truffle contract from the artifact
      // App.contracts.Dai = TruffleContract(Dai);
      // Connect provider to interact with contract
      App.contracts.Dai.setProvider(App.web3Provider);
    });
    return App.render();
  },

  render: async function () {
    console.log("rendering...");
    var accounts = await ethereum.request({
      method: 'eth_requestAccounts'
    });
    App.account = accounts[0];
    console.log(accounts);

    // Load balances
    var ethBalance = await web3.eth.getBalance(App.account);
    ethBalance = window.Web3.utils.fromWei(ethBalance, 'Ether');
    var ethHtml = $("#ethBalance");
    ethHtml.html("Balance: " + ethBalance);

    await App.contracts.Dai.methods.balanceOf(App.account).call().then(function (daiBalance) {
      daiBalance = window.Web3.utils.fromWei(daiBalance, 'Ether');
      var dai = $("#daiBalance");
      dai.html("Balance: " + daiBalance);
    });

    // Empty inputs
    $("#daiAmount").val("");
    $("#ethAmount").val("");
    $("#calculatedEth").val("");
    $("#calculatedDai").val("");
  },

  calculateEth: async function () {
    var daiAmount = $("#daiAmount").val();

    var contractEthBalance = 0;
    await App.contracts.Dex.methods.getContractEthBalance().call().then(function (eth) {
      contractEthBalance = eth / 1000000000000000000;
    });
    var contractDaiBalance = 0;
    await App.contracts.Dex.methods.getContractDaiBalance().call().then(function (dai) {
      contractDaiBalance = dai / 1000000000000000000;
    });

    var newDaiBalance = contractDaiBalance + (daiAmount * 1);
    var ethAfterTransaction = 10000000 / newDaiBalance;
    var calculatedEth = contractEthBalance - ethAfterTransaction;

    console.log(calculatedEth);
    var eth = $("#calculatedEth");
    eth.val(calculatedEth);
  },

  calculateDai: async function () {
    var ethAmount = $("#ethAmount").val();

    var contractEthBalance = 0;
    await App.contracts.Dex.methods.getContractEthBalance().call().then(function (eth) {
      contractEthBalance = eth / 1000000000000000000;
    });
    var contractDaiBalance = 0;
    await App.contracts.Dex.methods.getContractDaiBalance().call().then(function (dai) {
      contractDaiBalance = dai / 1000000000000000000;
    });

    var newEthBalance = contractEthBalance + (ethAmount * 1);
    var daiAfterTransaction = 10000000 / newEthBalance;
    var calculatedDai = contractDaiBalance - daiAfterTransaction;

    console.log(calculatedDai);
    var eth = $("#calculatedDai");
    eth.val(calculatedDai);
  },

  buyEth: async function () {

    var daiAmount = $("#daiAmount").val();
    daiAmount = window.Web3.utils.toWei(daiAmount, 'Ether');
    await App.contracts.Dai.methods.approve(App.dexAddress, daiAmount).send({
      from: App.account
    }).on('transactionHash', async (hash) => {
      console.log("trying to buy");
      await App.contracts.Dex.methods.buyEth(daiAmount).send({
        from: App.account,
      }).on('transactionHash', (hash) => {
        console.log(hash);
      })
    });
    console.log(result);
    await new Promise(r => setTimeout(r, 10000));
    App.render();
  },

  sellEth: async function () {

    var ethAmount = $("#ethAmount").val();
    ethAmount = window.Web3.utils.toWei(ethAmount, 'Ether');
    await new Promise(r => setTimeout(r, 1000));
    var result = await App.contracts.Dex.methods.sellEth().send({
      from: App.account,
      value: ethAmount,
    });
    console.log(result);
    App.render();
  }
};

$(function () {
  $(window).on('load', function () {
    App.init();
  });
});